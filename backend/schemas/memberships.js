import { document, text, email, timestamp, date, amount } from './common.js';
const schema = document({
  name: text(80, 2), email,
  plan: { type: 'string', enum: ['Starter', 'Standard', 'Premium', 'VIP'] },
  billing: { type: 'string', enum: ['monthly', 'yearly'] },
  status: { type: 'string', enum: ['pending', 'confirmed'], default: 'pending' },
  startDate: date, quotedPrice: amount, price: amount,
  currency: { type: 'string', enum: ['NGN', 'USD'], default: 'NGN' },
  userId: text(100), confirmedAt: timestamp, confirmedBy: email, expiresAt: timestamp,
}, ['email', 'plan', 'billing', 'startDate', 'status', 'currency']);
// Active / scheduled / expired are derived from dates, never written by clients.
schema.anyOf = [
  { properties: { status: { enum: ['pending'] } } },
  { properties: { status: { enum: ['confirmed'] } }, required: ['confirmedAt', 'confirmedBy', 'expiresAt', 'price'] },
];
export default schema;
