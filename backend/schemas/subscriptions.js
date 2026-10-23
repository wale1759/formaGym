import { document, email } from './common.js';
export default document({ email, status: { type: 'string', enum: ['subscribed', 'unsubscribed'], default: 'subscribed' } }, ['email', 'status']);
