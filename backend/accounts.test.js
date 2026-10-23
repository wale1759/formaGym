import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createApp } from './index.js';
import { createStore } from './database.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { validateSignup } from './validation/signup.js';
import { validateSignup as validateClient } from '../frontend/src/validation/signup.js';

let server, base, directory, store, mongo;
const credentials = { email: 'manager@example.com', password: 'management-test-password' };
const valid = { name: 'Test Member', email: 'member@example.com', password: 'a-long-test-password', confirmPassword: 'a-long-test-password', acceptTerms: true };
const previousEmail = process.env.ADMIN_EMAIL;
const previousPassword = process.env.ADMIN_PASSWORD;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'forma-accounts-'));
  process.env.ADMIN_EMAIL = credentials.email;
  process.env.ADMIN_PASSWORD = credentials.password;
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  store = createStore({ uri: mongo.getUri(), database: 'forma_test' });
  await store.ready();
  const app = createApp({ store });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await store?.close();
  await mongo?.stop();
  await rm(directory, { recursive: true, force: true });
  if (previousEmail === undefined) delete process.env.ADMIN_EMAIL; else process.env.ADMIN_EMAIL = previousEmail;
  if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previousPassword;
});
const post = (route, body, cookie) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });

test('frontend and backend agree on valid signup and field errors', () => {
  for (const data of [valid, { ...valid, name: ' ' }, { ...valid, email: 'broken' }, { ...valid, password: 'short' }, { ...valid, confirmPassword: 'different' }, { ...valid, acceptTerms: false }, { ...valid, password: 'a'.repeat(129) }]) {
    assert.deepEqual(validateClient(data), validateSignup(data).errors);
  }
  assert.equal(Object.keys(validateSignup(null).errors).length, 5);
});
test('invalid signup is rejected with field errors', async () => {
  const response = await post('/api/signup', { name: 'A', email: 'invalid', password: 'short' });
  assert.equal(response.status, 400);
  assert.ok((await response.json()).errors.email);
});
test('signup persists a hash, disallows duplicate normalized email, and cannot grant admin', async () => {
  const response = await post('/api/signup', { ...valid, role: 'admin' });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.password, undefined);
  const user = await store.find('users', { email: valid.email });
  assert.equal(user.role, 'member');
  assert.equal(user.password, undefined);
  assert.equal(user.hash.length, 128);
  assert.notEqual(user.hash, valid.password);
  assert.equal((await post('/api/signup', { ...valid, email: ' MEMBER@example.com ' })).status, 409);
});
test('admin activity requires authentication; login, cookie flags, data filtering and logout work', async () => {
  assert.equal((await fetch(base + '/api/admin/activity')).status, 401);
  assert.equal((await post('/api/admin/login', { ...credentials, password: 'wrong' })).status, 401);
  const response = await post('/api/admin/login', credentials);
  assert.equal(response.status, 200);
  const header = response.headers.get('set-cookie');
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Strict/i);
  const cookie = header.split(';')[0];
  const activity = await fetch(base + '/api/admin/activity', { headers: { Cookie: cookie } });
  assert.equal(activity.status, 200);
  assert.equal(activity.headers.get('cache-control'), 'no-store');
  const result = await activity.json();
  assert.equal(result.counts.users, 1);
  assert.equal(result.activity[0].hash, undefined);
  assert.equal(result.activity[0].salt, undefined);
  assert.equal((await post('/api/admin/logout', {}, cookie)).status, 200);
  assert.equal((await fetch(base + '/api/admin/activity', { headers: { Cookie: cookie } })).status, 401);
});
test('unconfigured admin access stays disabled', async () => {
  delete process.env.ADMIN_PASSWORD;
  assert.equal((await post('/api/admin/login', credentials)).status, 503);
  process.env.ADMIN_PASSWORD = credentials.password;
});
test('repeated failed admin logins are rate limited', async () => {
  for (let i = 0; i < 10; i++) await post('/api/admin/login', { ...credentials, password: 'wrong' });
  assert.equal((await post('/api/admin/login', credentials)).status, 429);
});
import { validateSignin } from './validation/signin.js';
import { validateSignin as validateSigninClient } from '../frontend/src/validation/signin.js';

test('sign-in validation agrees on both sides and rejects malformed input', () => {
  for (const data of [{ email: valid.email, password: valid.password }, { email: 'broken', password: '' }, { email: ' MEMBER@example.com ', password: 'x'.repeat(129) }]) {
    assert.deepEqual(validateSigninClient(data), validateSignin(data).errors);
  }
  assert.equal(Object.keys(validateSignin(null).errors).length, 2);
  assert.equal(Object.keys(validateSignin({ email: [], password: {} }).errors).length, 2);
});
test('member sign-in rejects invalid fields and uses generic credential errors', async () => {
  const malformed = await post('/api/member/login', { email: 'broken', password: '' });
  assert.equal(malformed.status, 400);
  assert.ok((await malformed.json()).errors.email);
  const wrong = await post('/api/member/login', { email: valid.email, password: 'wrong-long-password' });
  const missing = await post('/api/member/login', { email: 'missing@example.com', password: valid.password });
  assert.equal(wrong.status, 401);
  assert.equal(missing.status, 401);
  assert.deepEqual(await wrong.json(), await missing.json());
});
test('member session restores, rotates, logs out and cannot access admin', async () => {
  assert.equal((await fetch(base + '/api/member/session')).status, 401);
  const response = await post('/api/member/login', { email: ' MEMBER@example.com ', password: valid.password });
  assert.equal(response.status, 200);
  const user = (await response.json()).user;
  assert.equal(user.email, valid.email);
  assert.equal(user.hash, undefined);
  assert.equal(user.password, undefined);
  const header = response.headers.get('set-cookie');
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Strict/i);
  const cookie = header.split(';')[0];
  const restored = await fetch(base + '/api/member/session', { headers: { Cookie: cookie } });
  assert.equal(restored.status, 200);
  assert.deepEqual((await restored.json()).user, user);
  assert.equal((await fetch(base + '/api/admin/activity', { headers: { Cookie: cookie } })).status, 401);
  const rotated = await post('/api/member/login', { email: valid.email, password: valid.password }, cookie);
  assert.equal(rotated.status, 200);
  assert.equal((await fetch(base + '/api/member/session', { headers: { Cookie: cookie } })).status, 401);
  const nextCookie = rotated.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/api/member/logout', {}, nextCookie)).status, 200);
  assert.equal((await fetch(base + '/api/member/session', { headers: { Cookie: nextCookie } })).status, 401);
});
test('repeated failed member sign-ins are rate limited', async () => {
  for (let i = 0; i < 10; i++) await post('/api/member/login', { email: valid.email, password: 'wrong-long-password' });
  assert.equal((await post('/api/member/login', { email: valid.email, password: valid.password })).status, 429);
});

import { migrateLegacy } from './migrate.js';
import { validateMembership, confirmedMembership, membershipStatus } from './validation/membership.js';

test('membership dates handle month ends and leap years', () => {
  assert.deepEqual(validateMembership({ plan: 'Unknown', billing: 'weekly', startDate: '2026-02-30' }), { plan: 'Choose a valid membership plan.', billing: 'Choose monthly or yearly billing.', startDate: 'Choose a valid start date.' });
  assert.equal(confirmedMembership({ plan: 'Premium', billing: 'monthly', startDate: '2026-01-31' }, credentials.email).expiresAt, '2026-02-28T00:00:00.000Z');
  assert.equal(confirmedMembership({ plan: 'VIP', billing: 'yearly', startDate: '2024-02-29' }, credentials.email).expiresAt, '2025-02-28T00:00:00.000Z');
  assert.equal(membershipStatus({ status: 'confirmed', startDate: '2020-01-01', expiresAt: '2020-02-01T00:00:00Z' }), 'expired');
});
test('migration is repeatable, preserves source files, and keeps inquiries pending', async () => {
  const original = JSON.stringify([{ id: 'legacy-booking', email: ' OLD@example.com ', item: 'Yoga', date: '2026-10-27', time: '10:30', createdAt: '2026-01-01T00:00:00.000Z' }]);
  await writeFile(join(directory, 'bookings.json'), original);
  await writeFile(join(directory, 'memberships.json'), JSON.stringify([{ id: 'legacy-plan', email: valid.email, plan: 'Starter', billing: 'monthly', startDate: '2026-01-01', createdAt: '2026-01-01T00:00:00Z', status: 'active' }]));
  const first = await migrateLegacy(store, pathToFileURL(directory + '/'));
  const second = await migrateLegacy(store, pathToFileURL(directory + '/'));
  assert.equal(first.bookings, 1);
  assert.equal(second.bookings, 0);
  assert.equal((await store.find('memberships', { id: 'legacy-plan' })).status, 'pending');
  assert.equal(await readFile(join(directory, 'bookings.json'), 'utf8'), original);
});
test('database enforces email uniqueness under concurrent signup', async () => {
  const responses = await Promise.all([post('/api/signup', { ...valid, email: 'race@example.com' }), post('/api/signup', { ...valid, email: 'race@example.com' })]);
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 409]);
});
test('a new store connection can read the persisted account', async () => {
  const other = createStore({ uri: mongo.getUri(), database: 'forma_test' });
  try { assert.equal((await other.find('users', { email: valid.email })).name, valid.name); }
  finally { await other.close(); }
});
// Clear the admin rate limit using a new application instance to test management writes.
test('admin sees sign-in details, confirms plans and records audit history', async () => {
  const management = createApp({ store });
  const extra = management.listen(0, '127.0.0.1');
  await new Promise(resolve => extra.once('listening', resolve));
  const url = `http://127.0.0.1:${extra.address().port}`;
  const send = (path, body, cookie) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  try {
    const inquiry = await send('/api/memberships', { email: valid.email, name: valid.name, plan: 'Premium', billing: 'monthly', startDate: '2026-10-27', status: 'confirmed', expiresAt: '2099-01-01', password: 'do-not-store' });
    assert.equal(inquiry.status, 201);
    const { id } = await inquiry.json();
    const record = await store.find('memberships', { id });
    assert.equal(record.status, 'pending');
    assert.equal(record.password, undefined);
    assert.equal(record.expiresAt, undefined);
    assert.equal((await send(`/api/admin/memberships/${id}/confirm`, {})).status, 401);
    const login = await send('/api/admin/login', credentials);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const confirm = await send(`/api/admin/memberships/${id}/confirm`, {}, cookie);
    assert.equal(confirm.status, 200);
    assert.equal((await confirm.json()).membership.expiresAt, '2026-11-27T00:00:00.000Z');
    assert.equal((await send(`/api/admin/memberships/${id}/confirm`, {}, cookie)).status, 409);
    const dashboard = await fetch(url + '/api/admin/activity', { headers: { Cookie: cookie } });
    const body = await dashboard.json();
    assert.ok(body.members.find(member => member.email === valid.email).lastSignInAt);
    assert.ok(body.members.find(member => member.email === valid.email).signInCount >= 1);
    assert.ok(body.activity.some(event => event.action === 'membership_confirmed' && event.actor === 'admin'));
    assert.ok(body.activity.some(event => event.action === 'member_login' && event.actor === 'member'));
    assert.ok(body.activity.some(event => event.action === 'signup'));
    assert.equal(JSON.stringify(body).includes(valid.password), false);
    assert.equal(body.members[0].hash, undefined);
    assert.equal(body.members[0].salt, undefined);
    assert.equal((await send('/api/memberships', { email: valid.email, plan: 'Unknown' })).status, 400);
    const auth = await send('/api/member/login', { email: valid.email, password: valid.password });
    const memberCookie = auth.headers.get('set-cookie').split(';')[0];
    assert.equal((await send('/api/member/activity', { action: 'page_view', target: 'Workouts', actor: 'admin' }, memberCookie)).status, 201);
    assert.equal((await send('/api/member/activity', { action: 'admin_login', target: 'Admin' }, memberCookie)).status, 400);
    assert.equal((await store.list('activity', { action: 'page_view' }))[0].actor, 'member');
  } finally { await new Promise(resolve => extra.close(resolve)); }
});

test('database readiness checks MongoDB and missing configuration fails without fallback', async () => {
  assert.equal((await fetch(base + '/api/ready')).status, 200);
  const unavailable = createApp({ store: createStore({ uri: '' }) });
  const extra = unavailable.listen(0, '127.0.0.1');
  await new Promise(resolve => extra.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${extra.address().port}/api/ready`);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /MONGODB_URI/);
  } finally { await new Promise(resolve => extra.close(resolve)); }
});

test('admin controls persistent NGN pricing and existing quotes keep their price', async () => {
  const extra = createApp({ store }).listen(0, '127.0.0.1');
  await new Promise(resolve => extra.once('listening', resolve));
  const url = `http://127.0.0.1:${extra.address().port}`;
  const send = (route, method, body, cookie) => fetch(url + route, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  try {
    const defaults = await (await fetch(url + '/api/pricing')).json();
    assert.deepEqual(defaults.prices, { Starter: 15000, Standard: 17000, Premium: 29000, VIP: 40000 });
    assert.equal(defaults.currency, 'NGN');
    const inquiry = await send('/api/memberships', 'POST', { email: valid.email, plan: 'Premium', billing: 'monthly', startDate: '2026-10-27', quotedPrice: 29000 });
    const { id } = await inquiry.json();
    const prices = { ...defaults.prices, Premium: 35000 };
    assert.equal((await send('/api/admin/pricing', 'PUT', { prices })).status, 401);
    const login = await send('/api/admin/login', 'POST', credentials);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    assert.equal((await send('/api/admin/pricing', 'PUT', { prices: { ...prices, Starter: -1 } }, cookie)).status, 400);
    assert.equal((await send('/api/admin/pricing', 'PUT', { prices: { ...prices, VIP: '40000' } }, cookie)).status, 400);
    assert.equal((await send('/api/admin/pricing', 'PUT', { prices }, cookie)).status, 200);
    assert.equal((await (await fetch(url + '/api/pricing')).json()).prices.Premium, 35000);
    assert.equal((await store.find('settings', { id: 'membership-pricing' })).prices.Premium, 35000);
    const confirmed = await send(`/api/admin/memberships/${id}/confirm`, 'POST', {}, cookie);
    const plan = (await confirmed.json()).membership;
    assert.equal(plan.price, 29000);
    assert.equal(plan.currency, 'NGN');
    const next = await send('/api/memberships', 'POST', { email: valid.email, plan: 'Premium', billing: 'yearly', startDate: '2026-10-27' });
    assert.equal((await store.find('memberships', { id: (await next.json()).id })).quotedPrice, 350000);
    assert.equal((await send('/api/memberships', 'POST', { email: valid.email, plan: 'Premium', billing: 'monthly', startDate: '2026-10-27', quotedPrice: 29000 })).status, 409);
    assert.ok((await store.list('activity', { action: 'pricing_updated' })).length);
  } finally { await new Promise(resolve => extra.close(resolve)); }
});

import { MongoClient } from 'mongodb';
test('MongoDB enforces schemas for direct inserts and updates outside the app', async () => {
  const client = new MongoClient(mongo.getUri());
  try {
    await client.connect();
    const collection = client.db('forma_test').collection('users');
    const user = await store.find('users', { email: valid.email });
    await assert.rejects(collection.insertOne({ ...user, id: 'invalid-direct-role', email: 'direct@example.com', role: 'admin' }), error => error.code === 121);
    await assert.rejects(collection.updateOne({ id: user.id }, { $set: { password: 'never-store-this' } }), error => error.code === 121);
    await assert.rejects(store.update('users', { id: user.id }, { role: 'admin' }), error => error.status === 400);
    assert.equal((await store.find('users', { id: user.id })).role, 'member');
  } finally { await client.close(); }
});

test('administrators can create unique admin accounts; member/public access cannot', async () => {
  const extra = createApp({ store }).listen(0, '127.0.0.1');
  await new Promise(resolve => extra.once('listening', resolve));
  const url = `http://127.0.0.1:${extra.address().port}`;
  const send = (path, body, cookie) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const account = { username: 'Gym.Manager', email: 'NEW.ADMIN@example.com', password: 'new-admin-long-password', confirmPassword: 'new-admin-long-password' };
  try {
    assert.equal((await send('/api/admin/administrators', account)).status, 401);
    assert.equal((await fetch(url + '/api/admin/profile/photo')).status, 401);
    const member = await send('/api/member/login', { email: valid.email, password: valid.password });
    const memberCookie = member.headers.get('set-cookie').split(';')[0];
    assert.equal((await send('/api/admin/administrators', account, memberCookie)).status, 401);
    const owner = await send('/api/admin/login', credentials);
    const ownerCookie = owner.headers.get('set-cookie').split(';')[0];
    assert.equal((await send('/api/admin/administrators', { ...account, password: 'short' }, ownerCookie)).status, 400);
    assert.equal((await send('/api/admin/administrators', { ...account, email: credentials.email }, ownerCookie)).status, 400);
    const created = await send('/api/admin/administrators', account, ownerCookie);
    assert.equal(created.status, 201);
    const admin = (await created.json()).administrator;
    assert.equal(admin.username, 'gym.manager');
    assert.equal(admin.email, 'new.admin@example.com');
    assert.equal(admin.hash, undefined);
    const stored = await store.find('administrators', { id: admin.id });
    assert.equal(stored.password, undefined);
    assert.equal(stored.hash.length, 128);
    assert.equal(stored.role, 'admin');
    assert.equal(stored.createdBy, credentials.email);
    assert.equal((await send('/api/admin/administrators', { ...account, email: 'other@example.com' }, ownerCookie)).status, 409);
    assert.equal((await send('/api/admin/administrators', { ...account, username: 'another.manager' }, ownerCookie)).status, 409);
    assert.equal((await send('/api/admin/login', { email: account.username, password: 'incorrect-long-password' })).status, 401);
    const login = await send('/api/admin/login', { email: account.username.toUpperCase(), password: account.password });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const dashboard = await fetch(url + '/api/admin/activity', { headers: { Cookie: cookie } });
    assert.equal(dashboard.status, 200);
    const profileDashboard = await dashboard.json();
    assert.equal(profileDashboard.currentAdmin.email, admin.email);
    assert.equal(profileDashboard.currentAdmin.photoUrl, null);
    assert.equal((await fetch(url + '/api/admin/profile/photo', { headers: { Cookie: cookie } })).status, 404);
    const events = profileDashboard.activity;
    assert.ok(events.some(event => event.action === 'admin_login' && event.actorId === admin.id && event.email === admin.email));
    assert.ok(events.some(event => event.action === 'administrator_created' && event.actorId === 'environment-owner'));
    const list = await fetch(url + '/api/admin/administrators', { headers: { Cookie: cookie } });
    const rows = (await list.json()).administrators;
    assert.equal(rows[0].hash, undefined);
    assert.equal(rows[0].salt, undefined);
    assert.equal(rows[0].signInCount, 1);
    assert.ok(rows[0].lastSignInAt);
    const second = await send('/api/admin/administrators', { ...account, username: 'second.manager', email: 'second@example.com' }, cookie);
    assert.equal(second.status, 201);
    assert.equal((await store.find('administrators', { username: 'second.manager' })).createdBy, admin.email);
    const byEmail = await send('/api/admin/login', { email: admin.email, password: account.password });
    assert.equal(byEmail.status, 200);
    assert.equal((await send('/api/admin/logout', {}, cookie)).status, 200);
    assert.equal((await fetch(url + '/api/admin/activity', { headers: { Cookie: cookie } })).status, 401);
    assert.equal((await send('/api/member/login', { email: admin.email, password: account.password })).status, 401);
    // Database admins still work when bootstrap credentials are unavailable.
    const saved = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    try { assert.equal((await send('/api/admin/login', { email: admin.email, password: account.password })).status, 200); }
    finally { process.env.ADMIN_PASSWORD = saved; }
  } finally { await new Promise(resolve => extra.close(resolve)); }
});

import sharp from 'sharp';
test('administrators can replace only their own validated profile photo', async () => {
  const extra = createApp({ store }).listen(0, '127.0.0.1');
  await new Promise(resolve => extra.once('listening', resolve));
  const url = `http://127.0.0.1:${extra.address().port}`;
  const send = (path, body, cookie) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const upload = (buffer, type, cookie, query = '') => fetch(url + '/api/admin/profile/photo' + query, { method: 'PUT', headers: { 'Content-Type': type, ...(cookie ? { Cookie: cookie } : {}) }, body: buffer });
  try {
    const jpeg = await sharp({ create: { width: 128, height: 160, channels: 3, background: '#d3243b' } }).jpeg().toBuffer();
    assert.equal((await upload(jpeg, 'image/jpeg')).status, 401);
    const ownerLogin = await send('/api/admin/login', credentials);
    const ownerCookie = ownerLogin.headers.get('set-cookie').split(';')[0];
    const other = { username: 'photo.manager', email: 'photo-manager@example.com', password: 'photo-manager-password', confirmPassword: 'photo-manager-password' };
    const created = await send('/api/admin/administrators', other, ownerCookie);
    const admin = (await created.json()).administrator;
    const otherLogin = await send('/api/admin/login', { email: other.username, password: other.password });
    const otherCookie = otherLogin.headers.get('set-cookie').split(';')[0];
    assert.equal((await upload(Buffer.from('fake image'), 'image/jpeg', ownerCookie)).status, 400);
    assert.equal((await upload(jpeg, 'image/png', ownerCookie)).status, 400);
    assert.equal((await upload(jpeg, 'text/plain', ownerCookie)).status, 415);
    assert.equal((await upload(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/jpeg', ownerCookie)).status, 413);
    const tiny = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#fff' } }).png().toBuffer();
    assert.equal((await upload(tiny, 'image/png', ownerCookie)).status, 400);
    const response = await upload(jpeg, 'image/jpeg', ownerCookie);
    assert.equal(response.status, 200);
    assert.match((await response.json()).profile.photoUrl, /\/api\/admin\/profile\/photo\?v=/);
    const photo = await fetch(url + '/api/admin/profile/photo', { headers: { Cookie: ownerCookie } });
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get('content-type'), 'image/jpeg');
    assert.equal(photo.headers.get('cache-control'), 'no-store');
    const ownerBytes = Buffer.from(await photo.arrayBuffer());
    const metadata = await sharp(ownerBytes).metadata();
    assert.equal(metadata.width, 512);
    assert.equal(metadata.height, 512);
    assert.equal(metadata.exif, undefined);
    assert.equal((await fetch(url + '/api/admin/profile/photo', { headers: { Cookie: otherCookie } })).status, 404);
    const png = await sharp({ create: { width: 128, height: 128, channels: 3, background: '#00ff00' } }).png().toBuffer();
    assert.equal((await upload(png, 'image/png', otherCookie, '?id=environment-owner')).status, 200);
    const stored = await store.find('profilePhotos', { id: admin.id });
    assert.ok(stored.data);
    assert.equal((await store.find('profilePhotos', { id: 'environment-owner' })).data, ownerBytes.toString('base64'));
    const anotherConnection = createStore({ uri: mongo.getUri(), database: 'forma_test' });
    try { assert.equal((await anotherConnection.find('profilePhotos', { id: admin.id })).data, stored.data); }
    finally { await anotherConnection.close(); }
    assert.equal((await upload(Buffer.from('damaged'), 'image/jpeg', otherCookie)).status, 400);
    assert.equal((await store.find('profilePhotos', { id: admin.id })).data, stored.data);
    assert.ok((await store.list('activity', { action: 'profile_photo_updated', actorId: admin.id })).length);
  } finally { await new Promise(resolve => extra.close(resolve)); }
});

test('management accepts a pending applicant without requiring a website account', async () => {
  const extra = createApp({ store }).listen(0, '127.0.0.1');
  await new Promise(resolve => extra.once('listening', resolve));
  const url = `http://127.0.0.1:${extra.address().port}`;
  const send = (path, body, cookie) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  try {
    const email = 'new-applicant@example.com';
    const inquiry = await send('/api/memberships', { email, plan: 'Starter', billing: 'monthly', startDate: '2026-10-23' });
    assert.equal(inquiry.status, 201);
    const { id } = await inquiry.json();
    assert.equal((await send(`/api/admin/memberships/${id}/confirm`, {})).status, 401);
    const login = await send('/api/admin/login', credentials);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const response = await send(`/api/admin/memberships/${id}/confirm`, {}, cookie);
    assert.equal(response.status, 200);
    const { membership } = await response.json();
    assert.equal(membership.confirmedBy, credentials.email);
    assert.equal(membership.expiresAt, '2026-11-23T00:00:00.000Z');
    assert.equal(membership.price, 15000);
    assert.equal(membership.userId, undefined);
    assert.equal(await store.find('users', { email }), null);
    assert.equal((await store.find('memberships', { id })).status, 'confirmed');
    assert.equal((await send(`/api/admin/memberships/${id}/confirm`, {}, cookie)).status, 409);
    const event = await store.find('activity', { action: 'membership_confirmed', target: id });
    assert.equal(event.actorId, 'environment-owner');
    const refreshed = await fetch(url + '/api/admin/activity', { headers: { Cookie: cookie } });
    assert.equal((await refreshed.json()).memberships.find(plan => plan.id === id).confirmedBy, credentials.email);
  } finally { await new Promise(resolve => extra.close(resolve)); }
});

test('signup starts a member session and the dashboard shows only linked subscription data', async () => {
  const extra = createApp({ store }).listen(0, '127.0.0.1');
  await new Promise(resolve => extra.once('listening', resolve));
  const url = `http://127.0.0.1:${extra.address().port}`;
  const send = (path, body, cookie) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const view = cookie => fetch(url + '/api/member/dashboard', { headers: { Cookie: cookie } });
  try {
    assert.equal((await fetch(url + '/api/member/dashboard')).status, 401);
    const signup = await send('/api/signup', { ...valid, email: 'dashboard-member@example.com' });
    assert.equal(signup.status, 201);
    const cookie = signup.headers.get('set-cookie').split(';')[0];
    const user = await signup.json();
    const initial = await (await view(cookie)).json();
    assert.equal(initial.user.id, user.id);
    assert.equal(initial.user.hash, undefined);
    assert.equal(initial.memberships.length, 0);
    const today = new Date().toISOString().slice(0,10);
    const payload = { plan: 'Standard', billing: 'monthly', startDate: today, userId: 'another-user', email: valid.email, status: 'confirmed' };
    const requested = await send('/api/member/memberships', payload, cookie);
    assert.equal(requested.status, 201);
    const { id } = await requested.json();
    const saved = await store.find('memberships', { id });
    assert.equal(saved.userId, user.id);
    assert.equal(saved.email, 'dashboard-member@example.com');
    assert.equal(saved.status, 'pending');
    assert.equal(saved.quotedPrice, 17000);
    assert.equal((await send('/api/member/memberships', payload, cookie)).status, 200);
    const pending = await (await view(cookie)).json();
    assert.equal(pending.memberships[0].status, 'pending');
    assert.equal(pending.memberships[0].daysRemaining, null);
    assert.equal(pending.memberships[0].expiresAt, undefined);
    const adminLogin = await send('/api/admin/login', credentials);
    const adminCookie = adminLogin.headers.get('set-cookie').split(';')[0];
    assert.equal((await send(`/api/admin/memberships/${id}/confirm`, {}, adminCookie)).status, 200);
    const accepted = await (await view(cookie)).json();
    assert.equal(accepted.memberships[0].status, 'active');
    assert.ok(accepted.memberships[0].daysRemaining > 0);
    assert.ok(accepted.memberships[0].expiresAt);
    const otherSignup = await send('/api/signup', { ...valid, email: 'dashboard-other@example.com' });
    const otherCookie = otherSignup.headers.get('set-cookie').split(';')[0];
    const other = await fetch(url + `/api/member/dashboard?userId=${user.id}`, { headers: { Cookie: otherCookie } });
    assert.equal((await other.json()).memberships.length, 0);
    const legacy = await store.insert('memberships', { email: 'dashboard-member@example.com', plan: 'Starter', billing: 'monthly', startDate: today });
    assert.equal((await (await view(cookie)).json()).memberships.length, 1);
    assert.equal((await send(`/api/admin/memberships/${legacy.id}/link-account`, {}, cookie)).status, 401);
    assert.equal((await send(`/api/admin/memberships/${legacy.id}/link-account`, {}, adminCookie)).status, 200);
    assert.equal((await (await view(cookie)).json()).memberships.length, 2);
    await send('/api/member/logout', {}, cookie);
    assert.equal((await view(cookie)).status, 401);
    const signin = await send('/api/member/login', { email: 'dashboard-member@example.com', password: valid.password });
    const restoredCookie = signin.headers.get('set-cookie').split(';')[0];
    assert.equal((await (await view(restoredCookie)).json()).memberships.length, 2);
  } finally { await new Promise(resolve => extra.close(resolve)); }
});

test('members can request only higher-tier upgrades and pending requests preserve the current plan', async () => {
  const extra = createApp({ store }).listen(0, '127.0.0.1');
  await new Promise(resolve => extra.once('listening', resolve));
  const url = `http://127.0.0.1:${extra.address().port}`;
  const send = (path, body, cookie) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const view = async cookie => (await fetch(url + '/api/member/dashboard', { headers: { Cookie: cookie } })).json();
  try {
    const signup = await send('/api/signup', { ...valid, email: 'upgrade-member@example.com' });
    const cookie = signup.headers.get('set-cookie').split(';')[0];
    const today = new Date().toISOString().slice(0,10);
    const first = await send('/api/member/memberships', { plan: 'Starter', billing: 'monthly', startDate: today }, cookie);
    const { id } = await first.json();
    const owner = await send('/api/admin/login', credentials);
    const ownerCookie = owner.headers.get('set-cookie').split(';')[0];
    assert.equal((await send(`/api/admin/memberships/${id}/confirm`, {}, ownerCookie)).status, 200);
    const dashboard = await view(cookie);
    assert.equal(dashboard.currentMembershipId, id);
    assert.deepEqual(dashboard.upgradeOptions, ['Standard', 'Premium', 'VIP']);
    const request = { plan: 'Standard', billing: 'monthly', startDate: today, upgradeFromId: id };
    assert.equal((await send('/api/member/memberships', request)).status, 401);
    assert.equal((await send('/api/member/memberships', { ...request, upgradeFromId: 'someone-else' }, cookie)).status, 400);
    assert.equal((await send('/api/member/memberships', { ...request, plan: 'Starter' }, cookie)).status, 400);
    let vipId, standardId;
    for (const plan of ['Standard', 'Premium', 'VIP']) {
      const response = await send('/api/member/memberships', { ...request, plan }, cookie);
      assert.equal(response.status, 201);
      const result = await response.json();
      if (plan === 'VIP') vipId = result.id;
      if (plan === 'Standard') standardId = result.id;
    }
    assert.equal((await view(cookie)).currentMembershipId, id);
    assert.equal((await send(`/api/admin/memberships/${vipId}/confirm`, {}, ownerCookie)).status, 200);
    const upgraded = await view(cookie);
    assert.equal(upgraded.currentMembershipId, vipId);
    assert.deepEqual(upgraded.upgradeOptions, []);
    assert.equal((await send('/api/member/memberships', { ...request, upgradeFromId: vipId, plan: 'Premium' }, cookie)).status, 400);
    assert.equal((await send(`/api/admin/memberships/${standardId}/confirm`, {}, ownerCookie)).status, 409);
  } finally { await new Promise(resolve => extra.close(resolve)); }
});

import { correctTierPricing } from './correct-tier-pricing.js';
test('pricing correction updates only the reversed default pair and preserves quotes and custom values', async () => {
  const quote = await store.insert('memberships', { email: 'quote@example.com', plan: 'Starter', billing: 'monthly', startDate: '2026-10-27', quotedPrice: 17000 });
  await store.put('settings', 'membership-pricing', { prices: { Starter: 17000, Standard: 15000, Premium: 31000, VIP: 45000 }, currency: 'NGN' });
  assert.equal(await correctTierPricing(store, credentials.email), true);
  const corrected = await store.find('settings', { id: 'membership-pricing' });
  assert.deepEqual(corrected.prices, { Starter: 15000, Standard: 17000, Premium: 31000, VIP: 45000 });
  assert.equal((await store.find('memberships', { id: quote.id })).quotedPrice, 17000);
  assert.equal(await correctTierPricing(store, credentials.email), false);
  await store.put('settings', 'membership-pricing', { prices: { Starter: 16000, Standard: 18000, Premium: 29000, VIP: 40000 }, currency: 'NGN' });
  assert.equal(await correctTierPricing(store, credentials.email), false);
});

test('admin sessions survive a fresh backend instance, rotate and revoke across instances', async () => {
  const connection = createStore({ uri: mongo.getUri(), database: 'forma_test' });
  const first = createApp({ store }).listen(0, '127.0.0.1');
  const second = createApp({ store: connection }).listen(0, '127.0.0.1');
  await Promise.all([first, second].map(instance => new Promise(resolve => instance.once('listening', resolve))));
  const send = (instance, path, cookie, body) => fetch(`http://127.0.0.1:${instance.address().port}${path}`, {
    method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  try {
    const login = await send(first, '/api/admin/login', null, credentials);
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const token = cookie.split('=')[1];
    const { createHash } = await import('node:crypto');
    const id = createHash('sha256').update(token).digest('hex');
    const record = await connection.find('adminSessions', { id });
    assert.ok(record);
    assert.equal(JSON.stringify(record).includes(token), false);
    assert.equal(record.adminId, 'environment-owner');
    await new Promise(resolve => first.close(resolve));
    assert.equal((await send(second, '/api/admin/activity', cookie)).status, 200);
    const rotated = await send(second, '/api/admin/login', cookie, credentials);
    assert.equal(rotated.status, 200);
    const nextCookie = rotated.headers.get('set-cookie').split(';')[0];
    assert.notEqual(cookie, nextCookie);
    assert.equal((await send(second, '/api/admin/activity', cookie)).status, 401);
    assert.equal((await send(second, '/api/admin/logout', nextCookie, {})).status, 200);
    assert.equal((await send(second, '/api/admin/activity', nextCookie)).status, 401);
    const finalLogin = await send(second, '/api/admin/login', null, credentials);
    const expiredCookie = finalLogin.headers.get('set-cookie').split(';')[0];
    const expiredId = createHash('sha256').update(expiredCookie.split('=')[1]).digest('hex');
    await connection.update('adminSessions', { id: expiredId }, { expiresAt: new Date(Date.now() - 1000).toISOString() });
    assert.equal((await send(second, '/api/admin/activity', expiredCookie)).status, 401);
    assert.equal(await connection.find('adminSessions', { id: expiredId }), null);
    assert.equal((await send(second, '/api/admin/activity', 'forma_admin=invalid')).status, 401);
  } finally {
    if (first.listening) await new Promise(resolve => first.close(resolve));
    await new Promise(resolve => second.close(resolve));
    await connection.close();
  }
});

test('signup and signin dashboards survive backend changes and show admin-approved plans', async () => {
  const connection = createStore({ uri: mongo.getUri(), database: 'forma_test' });
  const first = createApp({ store }).listen(0, '127.0.0.1');
  const second = createApp({ store: connection }).listen(0, '127.0.0.1');
  await Promise.all([first, second].map(instance => new Promise(resolve => instance.once('listening', resolve))));
  const send = (instance, path, cookie, body) => fetch(`http://127.0.0.1:${instance.address().port}${path}`, {
    method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const signup = { ...valid, email: 'persistent-member@example.com' };
  try {
    const response = await send(first, '/api/signup', null, signup);
    assert.equal(response.status, 201);
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const { createHash } = await import('node:crypto');
    const digest = value => createHash('sha256').update(value.split('=')[1]).digest('hex');
    const saved = await connection.find('memberSessions', { id: digest(cookie) });
    assert.ok(saved);
    assert.equal(JSON.stringify(saved).includes(cookie.split('=')[1]), false);
    await new Promise(resolve => first.close(resolve));
    assert.equal((await send(second, '/api/member/session', cookie)).status, 200);
    assert.equal((await send(second, '/api/member/dashboard', cookie)).status, 200);
    assert.equal((await send(second, '/api/admin/activity', cookie)).status, 401);
    const startDate = new Date().toISOString().slice(0, 10);
    const request = await send(second, '/api/member/memberships', cookie, { plan: 'Standard', billing: 'monthly', startDate });
    assert.equal(request.status, 201);
    const { id } = await request.json();
    const admin = await send(second, '/api/admin/login', null, credentials);
    const adminCookie = admin.headers.get('set-cookie').split(';')[0];
    assert.equal((await send(second, `/api/admin/memberships/${id}/confirm`, adminCookie, {})).status, 200);
    assert.equal((await send(second, `/api/admin/memberships/${id}/confirm`, adminCookie, {})).status, 409);
    const dashboard = await (await send(second, '/api/member/dashboard', cookie)).json();
    assert.equal(dashboard.currentMembershipId, id);
    assert.equal(dashboard.memberships[0].plan, 'Standard');
    assert.equal(dashboard.memberships[0].status, 'active');
    assert.equal(dashboard.memberships[0].startDate, startDate);
    assert.ok(dashboard.memberships[0].expiresAt);
    assert.deepEqual(dashboard.upgradeOptions, ['Premium', 'VIP']);
    const login = await send(second, '/api/member/login', cookie, { email: signup.email, password: signup.password });
    assert.equal(login.status, 200);
    const nextCookie = login.headers.get('set-cookie').split(';')[0];
    assert.equal((await send(second, '/api/member/dashboard', cookie)).status, 401);
    assert.equal((await send(second, '/api/member/dashboard', nextCookie)).status, 200);
    assert.equal((await send(second, '/api/member/logout', nextCookie, {})).status, 200);
    assert.equal(await connection.find('memberSessions', { id: digest(nextCookie) }), null);
    assert.equal((await send(second, '/api/member/dashboard', nextCookie)).status, 401);
    const finalLogin = await send(second, '/api/member/login', null, { email: signup.email, password: signup.password });
    const expired = finalLogin.headers.get('set-cookie').split(';')[0];
    await connection.update('memberSessions', { id: digest(expired) }, { expiresAt: new Date(Date.now() - 1000).toISOString() });
    assert.equal((await send(second, '/api/member/dashboard', expired)).status, 401);
    assert.equal(await connection.find('memberSessions', { id: digest(expired) }), null);
  } finally {
    if (first.listening) await new Promise(resolve => first.close(resolve));
    await new Promise(resolve => second.close(resolve));
    await connection.close();
  }
});
