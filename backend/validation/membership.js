import { defaultPrices as prices } from '../pricing.js';
export function validateMembership(data) {
  const errors = {};
  if (!Object.hasOwn(prices, data?.plan)) errors.plan = 'Choose a valid membership plan.';
  if (!['monthly', 'yearly'].includes(data?.billing)) errors.billing = 'Choose monthly or yearly billing.';
  if (typeof data?.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.startDate) || !Number.isFinite(Date.parse(data.startDate)) || new Date(data.startDate).toISOString().slice(0, 10) !== data.startDate) errors.startDate = 'Choose a valid start date.';
  return errors;
}
export function confirmedMembership(record, adminEmail, currentPrices = prices) {
  const date = new Date(`${record.startDate}T00:00:00.000Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + (record.billing === 'yearly' ? 12 : 1));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return { status: 'confirmed', confirmedAt: new Date().toISOString(), confirmedBy: adminEmail, expiresAt: date.toISOString(), price: record.quotedPrice ?? currentPrices[record.plan] * (record.billing === 'yearly' ? 10 : 1), currency: 'NGN' };
}
export function membershipStatus(record) {
  if (record.status !== 'confirmed') return 'pending';
  if (Date.parse(record.expiresAt) <= Date.now()) return 'expired';
  if (Date.parse(`${record.startDate}T00:00:00.000Z`) > Date.now()) return 'scheduled';
  return 'active';
}
