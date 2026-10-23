export const gymTimeZone = 'Africa/Lagos';
export const gymTimeLabel = 'Nigeria (WAT, UTC+1)';
export const instructorTimes = ['09:00', '10:30', '12:00', '14:00'];
export function gymToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: gymTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
