import { getPricing } from './pricing.js';
import { registerAccounts } from './accounts.js';
import { createStore, recordActivity } from './database.js';
import { validateMembership } from './validation/membership.js';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function createApp({ store = createStore() } = {}) {
  const app = express();
  app.use(express.json({ limit: '32kb' }));
  registerAccounts(app, { store });
  app.get('/api/pricing', async (_, res, next) => {
    res.set('Cache-Control', 'no-store');
    try { res.json(await getPricing(store)); } catch (error) { next(error); }
  });
  app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
  app.get('/api/ready', async (_, res, next) => {
    try { await store.ready(); res.json({ status: 'ok', database: 'mongodb' }); }
    catch (error) { next(error); }
  });
  for (const type of ['bookings', 'contacts', 'memberships', 'orders', 'subscriptions']) {
    app.post(`/api/${type}`, async (req, res, next) => {
      try {
        const body = req.body;
        if (type === 'bookings' && (body?.instructorId !== undefined || /^(Train with |Personal training$)/i.test(body?.item || ''))) return res.status(403).json({ error: 'Request instructor sessions from your active member dashboard.' });
        if (!body || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return res.status(400).json({ error: 'Please enter a valid email address.' });
        if (type === 'bookings' && (!body.date || !body.time || !body.item)) return res.status(400).json({ error: 'Choose a session, date and time.' });
        if (type === 'orders' && (!Array.isArray(body.items) || !body.items.length)) return res.status(400).json({ error: 'Your bag is empty.' });
        if (type === 'memberships') {
          const errors = validateMembership(body);
          if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check your membership details.', errors });
        }
        const fields = { bookings: ['item', 'date', 'time', 'waitlist'], contacts: ['name', 'message'], memberships: ['name', 'plan', 'billing', 'startDate'], orders: ['name', 'address', 'city', 'items'], subscriptions: [] };
        const data = { email: body.email.trim().toLowerCase() };
        for (const field of fields[type]) if (body[field] !== undefined) data[field] = body[field];
        if (type === 'memberships') {
          const { prices } = await getPricing(store);
          data.status = 'pending';
          data.quotedPrice = prices[data.plan] * (data.billing === 'yearly' ? 10 : 1);
          data.currency = 'NGN';
          if (body.quotedPrice !== undefined && body.quotedPrice !== data.quotedPrice) return res.status(409).json({ error: 'This plan price has changed. Refresh the page and reopen your membership inquiry.' });
        }
        const record = await store.insert(type, data);
        await recordActivity(store, { actor: 'guest', email: record.email, action: `${type}_submitted`, target: record.id, details: 'Public form submission; email is unverified' });
        res.status(201).json({ id: record.id, status: type === 'orders' ? 'demo-order-received' : type === 'memberships' ? 'pending' : type === 'bookings' ? record.status : 'confirmed' });
      } catch (error) { next(error); }
    });
  }
  const frontendDist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
  app.use(express.static(frontendDist));
  app.get('/{*path}', (req, res, next) => req.path.startsWith('/api/') ? res.status(404).json({ error: 'Endpoint not found' }) : res.sendFile(path.join(frontendDist, 'index.html'), error => error && next(error)));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    // Do not print driver errors or incoming bodies containing credentials.
    if (error.status === 413) return res.status(413).json({ error: 'The uploaded file is too large. Profile photos must be 5 MB or smaller.' });
    if ([400, 415].includes(error.status) && error.photoError) return res.status(error.status).json({ error: error.message });
    if (error.status === 400 && error.errors) return res.status(400).json({ error: error.message, errors: error.errors });
    if (error.code === 121) return res.status(400).json({ error: 'The submitted data does not match the required structure.' });
    res.status(error.status || 500).json({ error: error.status === 503 ? error.message : 'Unable to complete your request. Please try again.' });
  });
  return app;
}
export const app = createApp();
export default app;
if (!process.env.VERCEL && process.argv[1] === fileURLToPath(import.meta.url)) app.listen(process.env.PORT || 3001, () => console.log(`FORMA API: http://localhost:${process.env.PORT || 3001}`));
