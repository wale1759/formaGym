import { createAdminSessions, adminSessionDuration } from './adminSessions.js';
import { currentMembership, upgradeOptions } from './membershipTiers.js';
import { registerAdminPhotos, adminProfile } from './adminPhotos.js';
import { validateAdministrator } from './validation/administrator.js';
import { getPricing, validatePrices } from './pricing.js';
import { registerMemberAuth } from './memberAuth.js';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { validateSignup } from './validation/signup.js';
import { validateMembership, confirmedMembership, membershipStatus } from './validation/membership.js';
import { recordActivity } from './database.js';

const derive = promisify(scrypt);
export function registerAccounts(app, { store }) {
  const sessions = createAdminSessions(store);
  const attempts = new Map();
  const signupAttempts = new Map();
  const audit = event => recordActivity(store, event);
  const memberAuth = registerMemberAuth(app, store);
  app.post('/api/signup', async (req, res, next) => {
    const now = Date.now();
    for (const [key, attempt] of signupAttempts) if (attempt.until <= now) signupAttempts.delete(key);
    const attempt = signupAttempts.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
    if (attempt.count >= 10) return res.status(429).json({ error: 'Too many registrations. Try again in 15 minutes.' });
    signupAttempts.set(req.ip, { ...attempt, count: attempt.count + 1 });
    const { errors, value } = validateSignup(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the highlighted fields.', errors });
    try {
      const salt = randomBytes(16).toString('hex');
      const hash = (await derive(value.password, salt, 64)).toString('hex');
      const user = await store.insert('users', { name: value.name, email: value.email, role: 'member', salt, hash });
      await audit({ actor: 'member', actorId: user.id, email: user.email, action: 'signup', target: user.id });
      memberAuth.createSession(req, res, user);
      res.status(201).json({ id: user.id, name: user.name });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'An account already exists for this email.', errors: { email: 'This email is already registered.' } });
      next(error);
    }
  });
  app.use('/api/admin', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.post('/api/admin/login', async (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
    const attempt = attempts.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
    if (attempt.count >= 10) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    attempts.set(req.ip, { ...attempt, count: attempt.count + 1 });
    const { email: identifier, password } = req.body || {};
    if (typeof identifier !== 'string' || !identifier.trim() || identifier.length > 254 || typeof password !== 'string' || !password || password.length > 128) return res.status(400).json({ error: 'Enter your admin username or email and password.' });
    try {
      const login = identifier.trim().toLowerCase();
      const ownerConfigured = !!process.env.ADMIN_EMAIL && !!process.env.ADMIN_PASSWORD;
      const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const isOwner = ownerConfigured && login === ownerEmail;
      const administrator = isOwner ? null : await store.find('administrators', { $or: [{ email: login }, { username: login }] });
      if (!ownerConfigured && !administrator && await store.count('administrators') === 0) return res.status(503).json({ error: 'Admin access has not been configured. Set ADMIN_EMAIL and ADMIN_PASSWORD on the server.' });
      const salt = isOwner ? 'forma-admin-credential' : administrator?.salt || 'forma-unknown-administrator';
      const actual = await derive(password, salt, 64);
      const expected = isOwner ? await derive(process.env.ADMIN_PASSWORD, salt, 64) : administrator ? Buffer.from(administrator.hash, 'hex') : Buffer.alloc(64);
      if ((!isOwner && !administrator) || expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
        await audit({ actor: 'anonymous', action: 'admin_login_failed' });
        return res.status(401).json({ error: 'Invalid username, email or password.' });
      }
      const adminEmail = isOwner ? ownerEmail : administrator.email;
      const adminId = isOwner ? 'environment-owner' : administrator.id;
      if (administrator) await store.incrementSignIn(administrator.id, 'administrators');
      await audit({ actor: 'admin', actorId: adminId, email: adminEmail, action: 'admin_login' });
      attempts.delete(req.ip);

      const previousToken = /(?:^|;\s*)forma_admin=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
      const token = await sessions.create({ id: adminId, username: isOwner ? 'Gym owner' : administrator.username, email: adminEmail }, previousToken);
      res.cookie('forma_admin', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/api/admin', maxAge: adminSessionDuration });
      res.json({ authenticated: true });
    } catch (error) { next(error); }
  });
  app.use('/api/admin', async (req, res, next) => {
    const token = /(?:^|;\s*)forma_admin=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
    const session = await sessions.find(token);
    if (!session) return res.status(401).json({ error: 'Please sign in to admin.' });
    req.adminToken = token;
    req.adminEmail = session.email;
    req.adminId = session.adminId;
    req.adminUsername = session.username;
    next();
  });
  registerAdminPhotos(app, store);
  app.get('/api/admin/administrators', async (req, res, next) => {
    try {
      const rows = await store.list('administrators');
      res.json({ administrators: rows.map(({ id, username, email, createdAt, createdBy, lastSignInAt, signInCount }) => ({ id, username, email, createdAt, createdBy, lastSignInAt, signInCount })) });
    } catch (error) { next(error); }
  });
  app.post('/api/admin/administrators', async (req, res, next) => {
    const { errors, value } = validateAdministrator(req.body);
    if (value.email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) errors.email = 'This email belongs to the configured management account.';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the highlighted fields.', errors });
    try {
      const salt = randomBytes(16).toString('hex');
      const hash = (await derive(value.password, salt, 64)).toString('hex');
      const admin = await store.insert('administrators', { username: value.username, email: value.email, salt, hash, createdBy: req.adminEmail });
      await audit({ actor: 'admin', actorId: req.adminId, email: req.adminEmail, action: 'administrator_created', target: admin.id, details: admin.username });
      res.status(201).json({ administrator: { id: admin.id, username: admin.username, email: admin.email, createdAt: admin.createdAt, createdBy: admin.createdBy, signInCount: admin.signInCount } });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'That username or email is already used by an administrator.' });
      next(error);
    }
  });
  app.put('/api/admin/pricing', async (req, res, next) => {
    if (!validatePrices(req.body?.prices)) return res.status(400).json({ error: 'Provide all four plan prices as whole naira amounts between 1 and 100,000,000.' });
    try {
      const previous = await getPricing(store);
      const prices = Object.fromEntries(Object.keys(previous.prices).map(name => [name, req.body.prices[name]]));
      await store.put('settings', 'membership-pricing', { prices, currency: 'NGN', updatedAt: new Date().toISOString(), updatedBy: req.adminEmail });
      await audit({ actor: 'admin', actorId: req.adminId, email: req.adminEmail, action: 'pricing_updated', details: JSON.stringify({ previous: previous.prices, prices }) });
      res.json(await getPricing(store));
    } catch (error) { next(error); }
  });
  app.post('/api/admin/logout', async (req, res, next) => {
    try {
      await sessions.revoke(req.adminToken);
      res.clearCookie('forma_admin', { path: '/api/admin' });
      await audit({ actor: 'admin', email: req.adminEmail, action: 'admin_logout' });
      res.json({ authenticated: false });
    } catch (error) { next(error); }
  });
  app.post('/api/admin/memberships/:id/confirm', async (req, res, next) => {
    try {
      const record = await store.find('memberships', { id: req.params.id });
      if (!record) return res.status(404).json({ error: 'Membership inquiry not found.' });
      const errors = validateMembership(record);
      if (Object.keys(errors).length) return res.status(400).json({ error: 'This inquiry has missing or invalid plan details.', errors });
      if (record.upgradeFromId && record.status === 'pending') {
        const current = currentMembership(await store.list('memberships', { userId: record.userId }));
        if (!current || !upgradeOptions(current).includes(record.plan)) return res.status(409).json({ error: 'This upgrade no longer matches the current plan. Ask them to submit a new request.' });
      }
      const member = await store.find('users', { email: record.email });
      const updated = await store.update('memberships', { id: record.id, status: 'pending' }, { ...confirmedMembership(record, req.adminEmail, (await getPricing(store)).prices), ...(member ? { userId: member.id } : {}) });
      if (!updated) return res.status(409).json({ error: 'This membership has already been confirmed. Refresh the dashboard.' });
      await audit({ actor: 'admin', actorId: req.adminId, email: req.adminEmail, action: 'membership_confirmed', target: record.id, details: `${record.plan} / ${record.billing}` });
      res.json({ membership: { ...updated, status: membershipStatus(updated) } });
    } catch (error) { next(error); }
  });
  app.post('/api/admin/memberships/:id/link-account', async (req, res, next) => {
    try {
      const record = await store.find('memberships', { id: req.params.id });
      if (!record) return res.status(404).json({ error: 'Membership not found.' });
      const member = await store.find('users', { email: record.email, role: 'member' });
      if (!member) return res.status(400).json({ error: 'The applicant must create an account with this email first.' });
      if (record.userId && record.userId !== member.id) return res.status(409).json({ error: 'This membership is already linked to another account.' });
      await store.update('memberships', { id: record.id }, { userId: member.id });
      await audit({ actor: 'admin', actorId: req.adminId, email: req.adminEmail, action: 'membership_account_linked', target: record.id });
      res.json({ linked: true });
    } catch (error) { next(error); }
  });
  app.get('/api/admin/activity', async (req, res, next) => {
    try {
      await audit({ actor: 'admin', email: req.adminEmail, action: 'dashboard_viewed' });
      const types = ['users', 'bookings', 'memberships', 'orders', 'contacts', 'subscriptions'];
      const counts = Object.fromEntries(await Promise.all(types.map(async type => [type, await store.count(type)])));
      const [users, memberships, activity] = await Promise.all([store.list('users'), store.list('memberships'), store.list('activity')]);
      const members = users.map(({ id, name, email, createdAt, lastSignInAt, signInCount }) => ({ id, name, email, createdAt, lastSignInAt, signInCount: signInCount || 0 }));
      const plans = memberships.map(({ id, email, plan, billing, startDate, createdAt, confirmedAt, confirmedBy, expiresAt, price, currency, status, userId }) => ({ id, userId, email, plan, billing, startDate, createdAt, confirmedAt, confirmedBy, expiresAt, price, currency, status: membershipStatus({ status, startDate, expiresAt }) }));
      // Return only allowlisted audit fields. No submitted passwords or request bodies.
      res.json({ currentAdmin: await adminProfile(req, store), pricing: await getPricing(store), counts, members, memberships: plans, activity: activity.map(({ id, actor, actorId, email, action, target, details, createdAt }) => ({ id, actor, actorId, email, action, target, details, createdAt })) });
    } catch (error) { next(error); }
  });
}
