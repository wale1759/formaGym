import { document, text } from './common.js';
export default document({
  data: { ...text(700000), pattern: '^[A-Za-z0-9+/]+={0,2}$' },
  contentType: { type: 'string', enum: ['image/jpeg'], default: 'image/jpeg' },
}, ['data', 'contentType']);
