import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareDocument } from './schemas/index.js';

const user = { name: ' Test Member ', email: ' MEMBER@EXAMPLE.COM ', salt: 'a'.repeat(32), hash: 'b'.repeat(128) };
test('user schema supplies identity, timestamps, role and counters without mutating input', () => {
  const saved = prepareDocument('users', user);
  assert.equal(saved.name, 'Test Member');
  assert.equal(saved.email, 'member@example.com');
  assert.equal(saved.role, 'member');
  assert.equal(saved.signInCount, 0);
  assert.ok(saved.id);
  assert.equal(saved.createdAt, saved.updatedAt);
  assert.equal(user.role, undefined);
});
test('schema rejects unknown fields, plaintext passwords, invalid hashes and roles', () => {
  for (const fields of [{ password: 'never-store-this' }, { salt: 'bad' }, { role: 'admin' }, { signInCount: -1 }, { hash: 'bad' }]) {
    assert.throws(() => prepareDocument('users', { ...user, ...fields }), error => error.status === 400 && error.errors && !error.message.includes('never-store-this'));
  }
  assert.throws(() => prepareDocument('users', null), error => error.status === 400);
});
test('bookings validate real dates, times and booleans and default waitlist status', () => {
  const booking = { email: 'test@example.com', item: 'Yoga Flow', date: '2026-10-27', time: '10:30' };
  assert.equal(prepareDocument('bookings', booking).waitlist, false);
  assert.equal(prepareDocument('bookings', { ...booking, waitlist: true }).status, 'waitlisted');
  for (const fields of [{ date: '2026-02-30' }, { time: '24:00' }, { waitlist: 'yes' }]) assert.throws(() => prepareDocument('bookings', { ...booking, ...fields }), error => error.status === 400);
});
test('orders validate nested items, quantity bounds and defaults', () => {
  const order = { email: 'test@example.com', name: 'Test Member', address: '123 Test Street', city: 'Lagos', items: [{ name: 'Training tee', quantity: 2 }] };
  const saved = prepareDocument('orders', order);
  assert.equal(saved.status, 'demo-order-received');
  assert.equal(saved.items[0].size, 'M');
  for (const quantity of [0, 21, 1.5, '2']) assert.throws(() => prepareDocument('orders', { ...order, items: [{ name: 'Training tee', quantity }] }), error => error.status === 400);
  assert.throws(() => prepareDocument('orders', { ...order, items: [] }));
});
test('confirmed memberships require confirmation data; pending records retain NGN default', () => {
  const plan = { email: 'test@example.com', plan: 'Premium', billing: 'monthly', startDate: '2026-10-27' };
  assert.equal(prepareDocument('memberships', plan).status, 'pending');
  assert.equal(prepareDocument('memberships', plan).currency, 'NGN');
  assert.throws(() => prepareDocument('memberships', { ...plan, status: 'confirmed' }));
  assert.throws(() => prepareDocument('memberships', { ...plan, plan: 'Unknown' }));
});
test('settings, contacts, newsletters and audits have distinct defaults', () => {
  assert.equal(prepareDocument('settings', { id: 'membership-pricing' }).prices.Standard, 17000);
  assert.equal(prepareDocument('subscriptions', { email: 'test@example.com' }).status, 'subscribed');
  assert.equal(prepareDocument('contacts', { email: 'test@example.com', name: 'Test Member', message: 'Please contact me.' }).status, 'new');
  assert.equal(prepareDocument('activity', { action: 'page_view' }).actor, 'guest');
  assert.throws(() => prepareDocument('activity', { action: 'unknown' }));
});
