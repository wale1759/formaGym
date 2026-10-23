import { document, text, email, object, integer } from './common.js';
export default document({
  email, name: text(80, 2), address: text(300), city: text(150),
  status: { type: 'string', enum: ['demo-order-received'], default: 'demo-order-received' },
  items: { type: 'array', minItems: 1, maxItems: 100, items: object({ name: text(200), quantity: integer(1, 20), size: { type: 'string', enum: ['S', 'M', 'L', 'XL'], default: 'M' } }, ['name', 'quantity', 'size']) },
}, ['email', 'name', 'address', 'city', 'status', 'items']);
