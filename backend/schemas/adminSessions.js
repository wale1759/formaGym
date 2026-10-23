import { document, text, email, timestamp } from './common.js';
export default document({
  id: { type: 'string', pattern: '^[a-f0-9]{64}$' },
  adminId: text(100), username: text(80), email, expiresAt: timestamp,
}, ['adminId', 'username', 'email', 'expiresAt']);
