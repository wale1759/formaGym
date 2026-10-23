import { schemas, installSchemas, prepareDocument } from './schemas/index.js';
import { MongoClient } from 'mongodb';

export const collections = Object.keys(schemas);
export function createStore({ uri = process.env.MONGODB_URI, database = process.env.MONGODB_DB || 'forma_fitness' } = {}) {
  let client, connection;
  async function db() {
    if (!uri) throw Object.assign(new Error('MongoDB is not configured. Set MONGODB_URI in backend/.env.'), { status: 503 });
    if (!connection) {
      connection = (async () => {
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        const databaseHandle = client.db(database);
        await installSchemas(databaseHandle);
        for (const name of collections) {
          await databaseHandle.collection(name).createIndex({ id: 1 }, { unique: true });
          await databaseHandle.collection(name).createIndex({ createdAt: -1 });
        }
        await databaseHandle.collection('users').createIndex({ email: 1 }, { unique: true });
        await databaseHandle.collection('administrators').createIndex({ email: 1 }, { unique: true });
        await databaseHandle.collection('administrators').createIndex({ username: 1 }, { unique: true });
        await databaseHandle.collection('activity').createIndex({ actorId: 1, createdAt: -1 });
        await databaseHandle.collection('memberships').createIndex({ email: 1, createdAt: -1 });
        await databaseHandle.collection('memberships').createIndex({ userId: 1, createdAt: -1 });
        await databaseHandle.collection('memberships').createIndex({ status: 1, expiresAt: 1 });
        await databaseHandle.collection('bookings').createIndex({ email: 1, date: 1 });
        return databaseHandle;
      })().catch(async error => {
        await client?.close().catch(() => {});
        connection = undefined;
        // Do not include driver errors: connection strings may contain credentials.
        const message = error.name === 'MongoServerSelectionError'
          ? 'The database is unreachable. Check the MongoDB Atlas network access list, cluster status and your internet connection, then try again.'
          : error.code === 18 ? 'Database authentication failed. Check the MongoDB credentials in backend/.env.'
          : error.code === 13 ? 'Database setup permission denied. Check the MongoDB user permissions.'
          : 'Database initialization failed. Check the server database configuration.';
        console.error('Database initialization failed:', error.name, 'code:', error.code || 'unavailable');
        throw Object.assign(new Error(message), { status: 503 });
      });
    }
    return connection;
  }
  async function collection(type) {
    if (!collections.includes(type)) throw new Error('Unknown data collection.');
    return (await db()).collection(type);
  }
  return {
    async ready() { await (await db()).command({ ping: 1 }); },
    async close() { await client?.close(); connection = undefined; },
    async list(type, filter = {}, limit = 500) { return (await collection(type)).find(filter, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray(); },
    async count(type) { return (await collection(type)).countDocuments(); },
    async find(type, filter) { return (await collection(type)).findOne(filter, { projection: { _id: 0 } }); },
    async insert(type, data) {
      const record = prepareDocument(type, data);
      await (await collection(type)).insertOne({ ...record });
      return record;
    },
    async incrementSignIn(id, type = 'users') { return (await collection(type)).updateOne({ id }, { $inc: { signInCount: 1 }, $set: { lastSignInAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }); },
    async update(type, filter, changes) {
      const target = await collection(type);
      const previous = await target.findOne(filter, { projection: { _id: 0 } });
      if (!previous) return null;
      const value = prepareDocument(type, { ...previous, ...changes, id: previous.id, createdAt: previous.createdAt }, { touch: true });
      return target.findOneAndUpdate(filter, { $set: value }, { returnDocument: 'after', projection: { _id: 0 } });
    },
    async put(type, id, changes) {
      const target = await collection(type);
      const previous = await target.findOne({ id }, { projection: { _id: 0 } });
      const value = prepareDocument(type, { ...previous, ...changes, id, createdAt: previous?.createdAt }, { touch: true });
      return target.updateOne({ id }, { $set: value }, { upsert: true });
    },
    async import(type, data) { return (await collection(type)).updateOne({ id: data.id }, { $setOnInsert: prepareDocument(type, data) }, { upsert: true }); },
  };
}

export function recordActivity(store, { actor = 'guest', actorId = '', email = '', action, target = '', details = '' }) {
  return store.insert('activity', { actor, actorId, email, action, target, details });
}
