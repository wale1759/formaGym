import { membershipStatus } from './validation/membership.js';
export const tierOrder = ['Starter', 'Standard', 'Premium', 'VIP'];
export function currentMembership(records) {
  return records.filter(record => membershipStatus(record) === 'active').sort((a, b) => tierOrder.indexOf(b.plan) - tierOrder.indexOf(a.plan) || b.startDate.localeCompare(a.startDate))[0] || null;
}
export function upgradeOptions(record) {
  return record ? tierOrder.slice(tierOrder.indexOf(record.plan) + 1) : [];
}
