import test from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { scrypt } from 'node:crypto';
import { adminDocument } from './setup-admin.js';

test('admin setup validates credentials and stores a salted password hash only', async () => {
  await assert.rejects(adminDocument({ ADMIN_EMAIL: 'invalid', ADMIN_PASSWORD: 'short' }), /Invalid admin configuration/);
  const env = { ADMIN_EMAIL: 'Owner@Example.com', ADMIN_PASSWORD: 'a-long-test-password' };
  const first = await adminDocument(env);
  const second = await adminDocument(env);
  assert.equal(first.email, 'owner@example.com');
  assert.equal(first.role, 'admin');
  assert.equal(first.id, 'environment-owner');
  assert.equal(first.signInCount, 0);
  assert.equal(first.password, undefined);
  assert.notEqual(first.salt, second.salt);
  assert.equal(first.hash, (await promisify(scrypt)(env.ADMIN_PASSWORD, first.salt, 64)).toString('hex'));
});
