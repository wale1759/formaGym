import { createStore, recordActivity } from './database.js';
import { fileURLToPath } from 'node:url';
export async function correctTierPricing(store, adminEmail) {
  const saved = await store.find('settings', { id: 'membership-pricing' });
  if (!saved || saved.prices.Starter !== 17000 || saved.prices.Standard !== 15000) return false;
  const prices = { ...saved.prices, Starter: 15000, Standard: 17000 };
  await store.put('settings', 'membership-pricing', { prices, currency: 'NGN', ...(adminEmail ? { updatedBy: adminEmail } : {}) });
  await recordActivity(store, { actor: 'admin', email: adminEmail || '', action: 'pricing_updated', details: 'Approved tier correction: Starter NGN 15000; Standard NGN 17000. Existing quotes unchanged.' });
  return true;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const store = createStore();
  try { console.log(JSON.stringify({ corrected: await correctTierPricing(store, process.env.ADMIN_EMAIL) })); }
  catch { console.error('Pricing correction failed. Check the database connection.'); process.exitCode = 1; }
  finally { await store.close(); }
}
