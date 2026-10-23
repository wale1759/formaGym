import { document, text, email, date } from './common.js';
export default document({
  email, item: text(200), date,
  time: { type: 'string', pattern: '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' },
  waitlist: { type: 'boolean', default: false },
  status: { type: 'string', enum: ['confirmed', 'waitlisted'], default: 'confirmed' },
}, ['email', 'item', 'date', 'time', 'waitlist', 'status']);
