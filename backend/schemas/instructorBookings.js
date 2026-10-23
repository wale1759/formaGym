import { document, text, email, timestamp, date } from './common.js';
const schema = document({
  userId: text(100), memberName: text(80, 2), email, membershipId: text(100),
  instructorId: text(100), instructorName: text(80), date,
  time: { type: 'string', enum: ['09:00', '10:30', '12:00', '14:00'] },
  timeZone: { type: 'string', enum: ['Africa/Lagos'], default: 'Africa/Lagos' },
  startsAt: timestamp, endsAt: timestamp,
  status: { type: 'string', enum: ['pending', 'confirmed'], default: 'pending' },
  confirmedAt: timestamp, confirmedBy: email, confirmedById: text(100),
}, ['userId', 'memberName', 'email', 'membershipId', 'instructorId', 'instructorName', 'date', 'time', 'timeZone', 'startsAt', 'endsAt', 'status']);
schema.anyOf = [
  { properties: { status: { enum: ['pending'] } } },
  { properties: { status: { enum: ['confirmed'] } }, required: ['confirmedAt', 'confirmedBy', 'confirmedById'] },
];
export default schema;
