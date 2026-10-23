import { document, object, integer, timestamp, email } from './common.js';
import { defaultPrices } from '../pricing.js';
export default document({
  id: { type: 'string', enum: ['membership-pricing'] },
  currency: { type: 'string', enum: ['NGN'], default: 'NGN' },
  prices: { ...object(Object.fromEntries(Object.entries(defaultPrices).map(([name, value]) => [name, { ...integer(1, 100000000), default: value }])), Object.keys(defaultPrices)), default: defaultPrices },
  updatedAt: timestamp, updatedBy: email,
}, ['prices', 'currency']);
