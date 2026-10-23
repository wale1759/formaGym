import { document, text, email } from './common.js';
export default document({ email, name: text(80, 2), message: text(5000), status: { type: 'string', enum: ['new', 'resolved'], default: 'new' } }, ['email', 'name', 'message', 'status']);
