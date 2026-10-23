import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { scrypt } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from './index.js';
import { createStore } from './database.js';
import { confirmedMembership } from './validation/membership.js';
import { validateInstructorBooking } from './instructorBookings.js';

let mongo, store, server, base, managerCookie, ownerCookie;
const owner = { email: 'owner@instructors.example', password: 'owner-instructor-password' };
const previous = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
const date = days => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const request = (path, cookie, body) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
const sessionCookie = response => response.headers.get('set-cookie').split(';')[0];
async function member(label, plan, state = 'confirmed') {
  const email = `${label}@members.example`;
  const signup = await request('/api/signup', null, { name: 'Instructor Member', email, password: 'member-instructor-password', confirmPassword: 'member-instructor-password', acceptTerms: true });
  assert.equal(signup.status, 201);
  const user = await signup.json(), cookie = sessionCookie(signup);
  let membership;
  if (plan) {
    const record = { email, userId: user.id, plan, billing: 'monthly', startDate: date(state === 'expired' ? -65 : state === 'scheduled' ? 2 : -1) };
    membership = await store.insert('memberships', { ...record, ...(state === 'pending' ? { status: 'pending' } : confirmedMembership(record, owner.email)) });
  }
  return { id: user.id, cookie, membership };
}
before(async () => {
  process.env.ADMIN_EMAIL = owner.email; process.env.ADMIN_PASSWORD = owner.password;
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  store = createStore({ uri: mongo.getUri(), database: 'instructor_tests' }); await store.ready();
  server = createApp({ store }).listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  ownerCookie = sessionCookie(await request('/api/admin/login', null, owner));
  const salt = '1'.repeat(32), hash = (await promisify(scrypt)('manager-instructor-password', salt, 64)).toString('hex');
  await store.insert('administrators', { username: 'instructor.manager', email: 'manager@instructors.example', salt, hash, createdBy: owner.email });
  managerCookie = sessionCookie(await request('/api/admin/login', null, { email: 'instructor.manager', password: 'manager-instructor-password' }));
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await store?.close(); await mongo?.stop();
  if (previous.email === undefined) delete process.env.ADMIN_EMAIL; else process.env.ADMIN_EMAIL = previous.email;
  if (previous.password === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previous.password;
});

test('instructor validation checks real dates, listed times and Nigerian UTC conversion', () => {
  const valid = validateInstructorBooking({ instructorId: 'tunde-adeyemi', date: '2030-01-03', time: '09:00' }, Date.parse('2030-01-02T00:00:00Z'));
  assert.deepEqual(valid.errors, {}); assert.equal(valid.startsAt, '2030-01-03T08:00:00.000Z'); assert.equal(valid.endsAt, '2030-01-03T08:45:00.000Z');
  assert.ok(validateInstructorBooking({ instructorId: 'unknown', date: '2030-02-30', time: '25:00' }).errors.date);
  assert.ok(validateInstructorBooking({ instructorId: 'tunde-adeyemi', date: '2020-01-01', time: '09:00' }).errors.date);
});
test('public, unapproved, expired and scheduled memberships cannot view or book instructors', async () => {
  assert.equal((await request('/api/member/instructors')).status, 401);
  for (const [label, tier, state] of [['no-plan', null], ['pending-plan', 'VIP', 'pending'], ['expired-plan', 'VIP', 'expired'], ['scheduled-plan', 'VIP', 'scheduled']]) {
    const user = await member(label, tier, state);
    assert.equal((await request('/api/member/instructors', user.cookie)).status, 403);
    assert.equal((await request('/api/member/instructor-bookings', user.cookie, { instructorId: 'tunde-adeyemi', date: date(3), time: '09:00' })).status, 403);
    assert.deepEqual((await (await request('/api/member/instructor-bookings', user.cookie)).json()).bookings, []);
  }
  assert.equal((await request('/api/member/instructors', ownerCookie)).status, 401);
});
test('all active tiers can request sessions; both owner and ordinary admin can approve safely', async () => {
  const members = [];
  for (const tier of ['Starter', 'Standard', 'Premium', 'VIP']) {
    const user = await member(`active-${tier.toLowerCase()}`, tier); members.push(user);
    const catalogue = await request('/api/member/instructors', user.cookie); assert.equal(catalogue.status, 200);
    assert.equal((await catalogue.json()).instructors.length, 3);
    const payload = { instructorId: 'tunde-adeyemi', date: date(3), time: '09:00', status: 'confirmed', userId: 'forged', email: 'forged@example.com' };
    const result = await request('/api/member/instructor-bookings', user.cookie, payload); assert.equal(result.status, 201, await result.clone().text());
    user.booking = (await result.json()).booking;
    assert.equal(user.booking.status, 'pending'); assert.equal(user.booking.userId, user.id); assert.equal(user.booking.timeZone, 'Africa/Lagos');
    assert.equal(user.booking.confirmedBy, undefined);
    const duplicate = await request('/api/member/instructor-bookings', user.cookie, payload); assert.equal(duplicate.status, 200); assert.equal((await duplicate.json()).booking.id, user.booking.id);
  }
  const first = members[0], second = members[1];
  assert.equal((await request('/api/admin/instructor-bookings')).status, 401);
  assert.equal((await request(`/api/admin/instructor-bookings/${first.booking.id}/confirm`, first.cookie, {})).status, 401);
  const race = await Promise.all([request(`/api/admin/instructor-bookings/${first.booking.id}/confirm`, managerCookie, {}), request(`/api/admin/instructor-bookings/${second.booking.id}/confirm`, ownerCookie, {})]);
  assert.deepEqual(race.map(response => response.status).sort(), [200, 409]);
  const winner = await store.find('instructorBookings', { instructorId: 'tunde-adeyemi', startsAt: first.booking.startsAt, status: 'confirmed' });
  assert.ok(winner.confirmedById); assert.ok(winner.confirmedAt);
  assert.equal((await request(`/api/admin/instructor-bookings/${winner.id}/confirm`, ownerCookie, {})).status, 409);
  const own = (await (await request('/api/member/instructor-bookings', first.cookie)).json()).bookings;
  assert.ok(own.every(booking => booking.userId === first.id)); assert.equal(own.length, 1);
  const ownerRequest = await request('/api/member/instructor-bookings', first.cookie, { instructorId: 'amara-okafor', date: date(4), time: '10:30' });
  const ownerBooking = (await ownerRequest.json()).booking;
  assert.equal((await request(`/api/admin/instructor-bookings/${ownerBooking.id}/confirm`, ownerCookie, {})).status, 200);
  const overlap = await request('/api/member/instructor-bookings', first.cookie, { instructorId: 'chidi-obi', date: date(4), time: '10:30' });
  assert.equal((await request(`/api/admin/instructor-bookings/${(await overlap.json()).booking.id}/confirm`, managerCookie, {})).status, 409);
  assert.equal((await request('/api/admin/instructor-bookings', managerCookie)).status, 200);
  assert.equal((await request('/api/admin/administrators', managerCookie, {})).status, 403);
  assert.ok((await store.list('activity')).some(event => event.action === 'instructor_booking_confirmed'));
});
test('coverage and approval are rechecked and instructor requests cannot use the public class endpoint', async () => {
  const user = await member('coverage-check', 'Starter');
  assert.equal((await request('/api/member/instructor-bookings', user.cookie, { instructorId: 'amara-okafor', date: date(60), time: '12:00' })).status, 403);
  assert.equal((await request('/api/member/instructor-bookings', user.cookie, { instructorId: 'invalid', date: date(3), time: '12:00' })).status, 400);
  const pending = await request('/api/member/instructor-bookings', user.cookie, { instructorId: 'amara-okafor', date: date(5), time: '12:00' });
  assert.equal(pending.status, 201, await pending.clone().text()); const booking = (await pending.json()).booking;
  await store.update('memberships', { id: user.membership.id }, { expiresAt: new Date(Date.now() - 1000).toISOString() });
  assert.equal((await request(`/api/admin/instructor-bookings/${booking.id}/confirm`, managerCookie, {})).status, 409);
  assert.equal((await store.find('instructorBookings', { id: booking.id })).status, 'pending');
  assert.equal((await request('/api/bookings', null, { email: 'guest@example.com', item: 'Train with Tunde Adeyemi', date: date(4), time: '09:00' })).status, 403);
  assert.equal((await request('/api/bookings', null, { email: 'guest@example.com', item: 'Class', instructorId: 'tunde-adeyemi', date: date(4), time: '09:00' })).status, 403);
  assert.equal((await request('/api/bookings', null, { email: 'guest@example.com', item: 'Strength Foundations', date: date(4), time: '09:00' })).status, 201);
});
