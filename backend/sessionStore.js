import { createHash, randomBytes } from 'node:crypto';

export const sessionDuration = 8 * 60 * 60 * 1000;
const digest = token => createHash('sha256').update(token).digest('hex');
export function createSessionStore(store, collection, profileFields) {
  async function revoke(token) {
    if (/^[a-f0-9]{64}$/.test(token || '')) await store.remove(collection, { id: digest(token) });
  }
  return {
    async create(profile, previousToken) {
      const now = new Date();
      await store.remove(collection, { expiresAt: { $lte: now.toISOString() } });
      await revoke(previousToken);
      const token = randomBytes(32).toString('hex');
      await store.insert(collection, {
        id: digest(token), ...profileFields(profile),
        expiresAt: new Date(now.getTime() + sessionDuration).toISOString(),
      });
      return token;
    },
    async find(token) {
      if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
      const session = await store.find(collection, { id: digest(token) });
      if (!session) return null;
      if (Date.parse(session.expiresAt) <= Date.now()) { await revoke(token); return null; }
      return session;
    },
    revoke,
  };
}
