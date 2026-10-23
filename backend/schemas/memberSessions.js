import { document, text, email, timestamp } from './common.js';
export default document({
  id: { type: 'string', pattern: '^[a-f0-9]{64}$' },
  memberId: text(100), name: text(80, 2), email, expiresAt: timestamp,
}, ['memberId', 'name', 'email', 'expiresAt']);
