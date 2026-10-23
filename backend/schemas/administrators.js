import { document, text, email, timestamp, integer } from './common.js';
export default document({
  username: { ...text(32, 3), pattern: '^[a-z][a-z0-9_.-]{2,31}$' },
  email, role: { type: 'string', enum: ['admin'], default: 'admin' },
  salt: { type: 'string', pattern: '^[a-f0-9]{32}$' },
  hash: { type: 'string', pattern: '^[a-f0-9]{128}$' },
  createdBy: email,
  signInCount: { ...integer(), default: 0 }, lastSignInAt: timestamp,
}, ['username', 'email', 'role', 'salt', 'hash', 'createdBy', 'signInCount']);
