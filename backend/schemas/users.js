import { document, text, email, timestamp, integer } from './common.js';
export default document({
  name: text(80, 2), email,
  role: { type: 'string', enum: ['member'], default: 'member' },
  salt: { type: 'string', pattern: '^[a-f0-9]{32}$' },
  hash: { type: 'string', pattern: '^[a-f0-9]{128}$' },
  signInCount: { ...integer(), default: 0 },
  lastSignInAt: timestamp,
}, ['name', 'email', 'role', 'salt', 'hash', 'signInCount']);
