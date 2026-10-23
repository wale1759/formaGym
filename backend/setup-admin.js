import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';
import { createStore } from './database.js';
import { prepareDocument } from './schemas/index.js';
import { validateAdministrator } from './validation/administrator.js';

export async function adminDocument(env) {
  const { errors, value } = validateAdministrator({
    username: env.ADMIN_USERNAME || 'gym-owner', email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD, confirmPassword: env.ADMIN_PASSWORD,
  });
  if (Object.keys(errors).length) throw new Error(`Invalid admin configuration: ${Object.keys(errors).join(', ')}.`);
  const salt = randomBytes(16).toString('hex');
  const hash = (await promisify(scrypt)(value.password, salt, 64)).toString('hex');
  return prepareDocument('administrators', {
    id: 'environment-owner', username: value.username, email: value.email,
    salt, hash, createdBy: value.email,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const store = createStore();
  let client;
  try {
    const record = await adminDocument(process.env);
    const objectId = new ObjectId(process.env.ADMIN_MONGODB_ID || '6adb8d9b2b13dc5bab33abd0');
    await store.ready();
    client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const collection = client.db(process.env.MONGODB_DB || 'forma_fitness').collection('administrators');
    const existing = await collection.findOne({ $or: [{ _id: objectId }, { email: record.email }, { username: record.username }, { id: record.id }] });
    if (existing) throw new Error('An administrator already matches this ID, email or username. No credentials were changed.');
    await collection.insertOne({ ...record, _id: objectId });
    console.log('Administrator created using credentials from the local environment.');
  } catch (error) {
    console.error(error.message.startsWith('Invalid admin configuration:') || error.message.startsWith('An administrator already') ? error.message : 'Admin setup failed. Check MongoDB connectivity, permissions and configuration.');
    process.exitCode = 1;
  } finally {
    await client?.close();
    await store.close();
  }
}
