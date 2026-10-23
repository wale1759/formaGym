import { instructors } from './instructors.js';
import { instructorTimes, gymTimeZone } from '../shared/gym.js';
import { membershipStatus } from './validation/membership.js';
import { recordActivity } from './database.js';

async function activePlans(store, userId) {
  return (await store.list('memberships', { userId })).filter(plan => membershipStatus(plan) === 'active');
}
function coveringPlan(plans, endsAt) {
  return plans.find(plan => Date.parse(plan.expiresAt) >= Date.parse(endsAt));
}
export function validateInstructorBooking(data, now = Date.now()) {
  const errors = {};
  const instructor = instructors.find(item => item.id === data?.instructorId);
  if (!instructor) errors.instructorId = 'Choose a listed instructor.';
  if (typeof data?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(Date.parse(data.date)) || new Date(data.date).toISOString().slice(0, 10) !== data.date) errors.date = 'Choose a valid date.';
  if (!instructorTimes.includes(data?.time)) errors.time = 'Choose a listed session time.';
  if (Object.keys(errors).length) return { errors };
  const startsAt = new Date(`${data.date}T${data.time}:00+01:00`).toISOString();
  const endsAt = new Date(Date.parse(startsAt) + 45 * 60000).toISOString();
  if (Date.parse(startsAt) <= now) errors.date = 'Choose a future session in Nigerian time.';
  return { errors, instructor, startsAt, endsAt };
}
export function registerInstructorMember(app, store) {
  app.get('/api/member/instructors', async (req, res) => {
    if (!(await activePlans(store, req.member.id)).length) return res.status(403).json({ error: 'An approved, active membership is required to view and book instructors.' });
    res.json({ instructors, times: instructorTimes, timeZone: gymTimeZone });
  });
  app.get('/api/member/instructor-bookings', async (req, res) => {
    res.json({ bookings: await store.list('instructorBookings', { userId: req.member.id }) });
  });
  app.post('/api/member/instructor-bookings', async (req, res) => {
    const plans = await activePlans(store, req.member.id);
    if (!plans.length) return res.status(403).json({ error: 'An approved, active membership is required to book an instructor.' });
    const { errors, instructor, startsAt, endsAt } = validateInstructorBooking(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Check your instructor booking.', errors });
    const plan = coveringPlan(plans, endsAt);
    if (!plan) return res.status(403).json({ error: 'Choose a session that finishes within your active subscription.' });
    const existing = await store.find('instructorBookings', { userId: req.member.id, instructorId: instructor.id, startsAt });
    if (existing) return res.json({ booking: existing });
    if (await store.find('instructorBookings', { instructorId: instructor.id, startsAt, status: 'confirmed' })) return res.status(409).json({ error: 'This instructor already has a confirmed session at that time.' });
    try {
      const booking = await store.insert('instructorBookings', { userId: req.member.id, memberName: req.member.name, email: req.member.email, membershipId: plan.id, instructorId: instructor.id, instructorName: instructor.name, date: req.body.date, time: req.body.time, timeZone: gymTimeZone, startsAt, endsAt, status: 'pending' });
      await recordActivity(store, { actor: 'member', actorId: req.member.id, email: req.member.email, action: 'instructor_booking_requested', target: booking.id, details: `${instructor.name} / ${booking.date} ${booking.time} WAT` });
      res.status(201).json({ booking });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const booking = await store.find('instructorBookings', { userId: req.member.id, instructorId: instructor.id, startsAt });
      if (booking) return res.json({ booking });
      throw error;
    }
  });
}
export function registerInstructorAdmin(app, store) {
  app.get('/api/admin/instructor-bookings', async (req, res) => res.json({ bookings: await store.list('instructorBookings') }));
  app.post('/api/admin/instructor-bookings/:id/confirm', async (req, res) => {
    const record = await store.find('instructorBookings', { id: req.params.id });
    if (!record) return res.status(404).json({ error: 'Instructor booking not found.' });
    if (record.status !== 'pending') return res.status(409).json({ error: 'This booking has already been accepted.' });
    if (Date.parse(record.startsAt) <= Date.now()) return res.status(409).json({ error: 'This session is in the past. Ask the member to request a future session.' });
    if (!coveringPlan(await activePlans(store, record.userId), record.endsAt)) return res.status(409).json({ error: 'The member needs an active subscription covering this session before it can be accepted.' });
    try {
      const booking = await store.update('instructorBookings', { id: record.id, status: 'pending' }, { status: 'confirmed', confirmedAt: new Date().toISOString(), confirmedBy: req.adminEmail, confirmedById: req.adminId });
      if (!booking) return res.status(409).json({ error: 'This booking has already been accepted.' });
      await recordActivity(store, { actor: 'admin', actorId: req.adminId, email: req.adminEmail, action: 'instructor_booking_confirmed', target: booking.id, details: `${booking.instructorName} / ${booking.date} ${booking.time} WAT` });
      res.json({ booking });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'The instructor or member already has a confirmed session at that time.' });
      throw error;
    }
  });
}
