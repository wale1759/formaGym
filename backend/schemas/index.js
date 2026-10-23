import profilePhotos from './profilePhotos.js';
import administrators from './administrators.js';
import Ajv from 'ajv';
import { randomUUID } from 'node:crypto';
import users from './users.js';
import memberships from './memberships.js';
import bookings from './bookings.js';
import orders from './orders.js';
import contacts from './contacts.js';
import subscriptions from './subscriptions.js';
import activity from './activity.js';
import settings from './settings.js';

export const schemas = { profilePhotos, administrators, users, memberships, bookings, orders, contacts, subscriptions, activity, settings };
const ajv = new Ajv({ allErrors: true, useDefaults: true, strict: false });
const validators = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)]));
export function prepareDocument(type, input, { touch = false } = {}) {
  if (!validators[type]) throw new Error('Unknown data collection.');
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Object.assign(new Error(`Invalid ${type} document.`), { status: 400, errors: { document: 'Expected an object.' } });
  const now = new Date().toISOString();
  const value = structuredClone(input);
  value.id ??= randomUUID();
  value.createdAt ??= now;
  value.updatedAt = touch ? now : value.updatedAt ?? value.createdAt;
  if (typeof value.email === 'string') value.email = value.email.trim().toLowerCase();
  if (typeof value.name === 'string') value.name = value.name.trim();
  if (type === 'bookings' && value.status === undefined) value.status = value.waitlist ? 'waitlisted' : 'confirmed';
  const valid = validators[type](value);
  const errors = {};
  for (const issue of validators[type].errors || []) {
    const field = issue.instancePath.slice(1).replaceAll('/', '.') || issue.params.missingProperty || issue.params.additionalProperty || 'document';
    errors[field] = `Invalid ${type} field: ${field} (${issue.keyword}).`;
  }
  // Validate real calendar dates as well as the schema's string patterns.
  for (const field of ['createdAt', 'updatedAt', 'lastSignInAt', 'confirmedAt', 'expiresAt', 'startDate', 'date']) {
    if (value[field] === undefined) continue;
    const parsed = new Date(value[field]);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== String(value[field]).slice(0, 10)) errors[field] = `Enter a valid ${field}.`;
  }
  if (type === 'memberships' && value.status === 'confirmed' && Date.parse(value.expiresAt) <= Date.parse(value.startDate)) errors.expiresAt = 'Expiry must be after the membership start date.';
  if (!valid || Object.keys(errors).length) throw Object.assign(new Error(`Invalid ${type} data. Please check the highlighted fields.`), { status: 400, errors });
  return value;
}
function mongoSchema(schema) {
  if (Array.isArray(schema)) return schema.map(mongoSchema);
  if (!schema || typeof schema !== 'object') return schema;
  return Object.fromEntries(Object.entries(schema).filter(([key]) => key !== 'default').map(([key, value]) => [key, mongoSchema(value)]));
}
export async function installSchemas(db) {
  for (const [name, schema] of Object.entries(schemas)) {
    const options = { validator: { $jsonSchema: mongoSchema(schema) }, validationLevel: 'strict', validationAction: 'error' };
    try { await db.createCollection(name, options); }
    catch (error) { if (error.code !== 48) throw error; await db.command({ collMod: name, ...options }); }
  }
}
