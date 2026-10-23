import { createSessionStore, sessionDuration } from './sessionStore.js';
export const adminSessionDuration = sessionDuration;
export function createAdminSessions(store) {
  return createSessionStore(store, 'adminSessions', profile => ({ adminId: profile.id, username: profile.username, email: profile.email }));
}
