import { document, text, email } from './common.js';
export default document({
  actor: { type: 'string', enum: ['guest', 'anonymous', 'member', 'admin'], default: 'guest' },
  actorId: { ...text(100, 0), default: '' },
  email: { anyOf: [email, { type: 'string', enum: [''] }], default: '' },
  action: { type: 'string', enum: ['instructor_booking_requested', 'instructor_booking_confirmed', 'profile_photo_updated', 'administrator_created', 'signup', 'member_login', 'member_login_failed', 'member_logout', 'admin_login', 'admin_login_failed', 'admin_logout', 'dashboard_viewed', 'membership_account_linked', 'membership_confirmed', 'pricing_updated', 'bookings_submitted', 'memberships_submitted', 'orders_submitted', 'contacts_submitted', 'subscriptions_submitted', 'page_view', 'cart_add', 'wishlist_update', 'workout_started', 'workout_completed'] },
  target: { ...text(100, 0), default: '' }, details: { ...text(2000, 0), default: '' },
}, ['actor', 'actorId', 'email', 'action', 'target', 'details']);
