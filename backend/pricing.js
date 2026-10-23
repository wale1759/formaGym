export const defaultPrices = { Starter: 15000, Standard: 17000, Premium: 29000, VIP: 40000 };
export async function getPricing(store) {
  const saved = await store.find('settings', { id: 'membership-pricing' });
  return { currency: 'NGN', prices: saved?.prices || defaultPrices, yearlyMultiplier: 10 };
}
export function validatePrices(prices) {
  return prices && typeof prices === 'object' && Object.keys(prices).length === 4 && Object.keys(defaultPrices).every(name => Number.isSafeInteger(prices[name]) && prices[name] > 0 && prices[name] <= 100000000);
}
