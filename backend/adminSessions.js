import { createHash, randomBytes } from 'node:crypto';

export const adminSessionDuration = 8 * 60 * 60 * 1000;
const digest = token => createHash('sha256').update(token).digest('hex');
export function createAdminSessions(store) {
  async function revoke(token) {
    if (/^[a-f0-9]{64}$/.test(token || '')) await store.remove('adminSessions', { id: digest(token) });
  }
  return {
    async create(profile, previousToken) {
      const now = new Date();
      await store.remove('adminSessions', { expiresAt: { $lte: now.toISOString() } });
      await revoke(previousToken);
      const token = randomBytes(32).toString('hex');
      await store.insert('adminSessions', {
        id: digest(token), adminId: profile.id, username: profile.username, email: profile.email,
        expiresAt: new Date(now.getTime() + adminSessionDuration).toISOString(),
      });
      return token;
    },
    async find(token) {
      if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
      const session = await store.find('adminSessions', { id: digest(token) });
      if (!session) return null;
      if (Date.parse(session.expiresAt) <= Date.now()) { await revoke(token); return null; }
      return session;
    },
    revoke,
  };
}
