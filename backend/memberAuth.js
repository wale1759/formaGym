import { validateMembership, membershipStatus } from './validation/membership.js';
import { getPricing } from './pricing.js';
import { recordActivity } from './database.js';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { validateSignin } from './validation/signin.js';

const derive = promisify(scrypt);
const duration = 8 * 60 * 60 * 1000;
export function registerMemberAuth(app, store) {
  const sessions = new Map();
  const attempts = new Map();
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/api/member' };
  function createSession(req, res, user) {
    const now = Date.now();
    for (const [key, session] of sessions) if (session.expires <= now) sessions.delete(key);
      const previous = /(?:^|;\s*)forma_member=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
      if (previous) sessions.delete(previous);
      const token = randomBytes(32).toString('hex');
      const profile = { id: user.id, name: user.name, email: user.email };
      sessions.set(token, { profile, expires: now + duration });
      res.cookie('forma_member', token, { ...cookieOptions, maxAge: duration });

    return profile;
  }
  app.use('/api/member', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.post('/api/member/login', async (req, res, next) => {
    const now = Date.now();
    for (const [key, attempt] of attempts) if (attempt.until <= now) attempts.delete(key);
    const attempt = attempts.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
    if (attempt.count >= 10) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    attempts.set(req.ip, { ...attempt, count: attempt.count + 1 });
    const { errors, value } = validateSignin(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the highlighted fields.', errors });
    try {
      const user = await store.find('users', { email: value.email, role: 'member' });
      // Derive a hash even for unknown emails to avoid a fast account-existence check.
      const actual = await derive(value.password, user?.salt || 'forma-unknown-member', 64);
      const expected = user ? Buffer.from(user.hash, 'hex') : Buffer.alloc(64);
      if (!user || expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
        await recordActivity(store, { actor: 'anonymous', action: 'member_login_failed' });
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      await store.incrementSignIn(user.id);
      await recordActivity(store, { actor: 'member', actorId: user.id, email: user.email, action: 'member_login' });
      attempts.delete(req.ip);
      const profile = createSession(req, res, user);
      res.json({ user: profile });
    } catch (error) { next(error); }
  });
  app.use('/api/member', (req, res, next) => {
    const token = /(?:^|;\s*)forma_member=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
    const session = sessions.get(token);
    if (!session || session.expires <= Date.now()) {
      sessions.delete(token);
      return res.status(401).json({ error: 'Please sign in to your member account.' });
    }
    req.member = session.profile;
    req.memberToken = token;
    next();
  });
  app.get('/api/member/session', (req, res) => res.json({ user: req.member }));
  app.get('/api/member/dashboard', async (req, res, next) => {
    try {
      const records = await store.list('memberships', { userId: req.member.id });
      const memberships = records.map(({ id, plan, billing, startDate, expiresAt, confirmedAt, price, quotedPrice, currency, status }) => {
        const state = membershipStatus({ status, startDate, expiresAt });
        return { id, plan, billing, startDate, expiresAt, confirmedAt, price: price ?? quotedPrice, currency, status: state, daysRemaining: state === 'active' ? Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 86400000)) : null };
      });
      res.json({ user: req.member, memberships });
    } catch (error) { next(error); }
  });
  app.post('/api/member/memberships', async (req, res, next) => {
    const errors = validateMembership(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Check your membership details.', errors });
    try {
      const { plan, billing, startDate, quotedPrice } = req.body;
      const { prices } = await getPricing(store);
      const price = prices[plan] * (billing === 'yearly' ? 10 : 1);
      if (quotedPrice !== undefined && quotedPrice !== price) return res.status(409).json({ error: 'This plan price has changed. Refresh the page before submitting.' });
      const existing = await store.find('memberships', { userId: req.member.id, plan, billing, startDate, status: 'pending' });
      if (existing) return res.json({ id: existing.id, status: 'pending' });
      const record = await store.insert('memberships', { email: req.member.email, name: req.member.name, userId: req.member.id, plan, billing, startDate, quotedPrice: price, currency: 'NGN', status: 'pending' });
      await recordActivity(store, { actor: 'member', actorId: req.member.id, email: req.member.email, action: 'memberships_submitted', target: record.id });
      res.status(201).json({ id: record.id, status: 'pending' });
    } catch (error) { next(error); }
  });
  app.post('/api/member/activity', async (req, res, next) => {
    const { action, target } = req.body || {};
    if (!['page_view', 'cart_add', 'wishlist_update', 'workout_started', 'workout_completed'].includes(action) || typeof target !== 'string' || target.length > 100) return res.status(400).json({ error: 'Invalid activity.' });
    try {
      await recordActivity(store, { actor: 'member', actorId: req.member.id, email: req.member.email, action, target, details: 'Reported by member browser' });
      res.status(201).json({ recorded: true });
    } catch (error) { next(error); }
  });
  app.post('/api/member/logout', async (req, res, next) => {
    try {
    sessions.delete(req.memberToken);
    res.clearCookie('forma_member', cookieOptions);
    await recordActivity(store, { actor: 'member', actorId: req.member.id, email: req.member.email, action: 'member_logout' });
    res.json({ authenticated: false });
    } catch (error) { next(error); }
  });
  return { createSession };
}
