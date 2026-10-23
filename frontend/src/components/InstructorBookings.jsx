import { useCallback, useEffect, useRef, useState } from 'react';
import { gymToday, gymTimeLabel } from '../../../shared/gym.js';

export default function InstructorBookings({ active }) {
  const [instructors, setInstructors] = useState([]);
  const [times, setTimes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const requestForm = useRef(null);
  useEffect(() => {
    if (!selected) return;
    requestForm.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    requestForm.current?.querySelector('input')?.focus({ preventScroll: true });
  }, [selected]);
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/member/instructor-bookings');
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to load instructor requests.');
      setBookings(result.bookings);
      if (active) {
        const response = await fetch('/api/member/instructors');
        const result = await response.json();
        if (!response.ok) { setInstructors([]); throw Error(result.error || 'Unable to load instructors.'); }
        setInstructors(result.instructors); setTimes(result.times);
      } else { setInstructors([]); setSelected(null); }
      setError('');
    } catch (error) { setError(error.message); }
  }, [active]);
  useEffect(() => {
    load(); window.addEventListener('focus', load);
    const timer = setInterval(load, 60000);
    return () => { window.removeEventListener('focus', load); clearInterval(timer); };
  }, [load]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch('/api/member/instructor-bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, instructorId: selected.id }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to request this session.');
      setBookings(current => [result.booking, ...current.filter(item => item.id !== result.booking.id)]);
      setSelected(null); setMessage(result.booking.status === 'confirmed' ? 'This session is already confirmed.' : 'Your instructor request is pending management approval.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <section className="instructor-bookings">
    <div className="section-heading"><span className="eyebrow">PERSONAL COACHING</span><h2>Your instructors</h2><p>45-minute sessions · {gymTimeLabel} · Management approval required.</p></div>
    {error && !selected && <p className="error" role="alert">{error}</p>}{message && <p role="status" className="card">{message}</p>}
    {!active ? <p className="card">Instructor booking unlocks when management approves your membership and your subscription is active.</p> : <>
      <button className="button secondary" type="button" onClick={load}>Refresh instructor bookings</button>
      <div className="grid three instructor-grid">{instructors.map(instructor => <article className="card trainer" key={instructor.id}>
        <img src={`/assets/${instructor.image}.jpg`} alt={instructor.name} loading="lazy"/>
        <h3>{instructor.name}</h3><p>{instructor.specialty}</p><p className="trainer-note">{instructor.description}</p>
        <ul className="trainer-focus" aria-label={`${instructor.name} training focus`}>{instructor.focus.map(item => <li key={item}>{item}</li>)}</ul>
        <button className="button" onClick={() => { setSelected(instructor); setMessage(''); setError(''); }}>Book {instructor.name}</button>
      </article>)}</div>
      {selected && <div ref={requestForm} className="card account-panel instructor-request"><h3>Request a session with {selected.name}</h3><p>Choose a future session within your subscription. Times shown are Nigerian time; availability is confirmed by management.</p>
        <form onSubmit={submit}>{error && <p className="error" role="alert">{error}</p>}<label htmlFor="instructor-date">Session date<input id="instructor-date" name="date" type="date" min={gymToday()} required/></label>
          <label htmlFor="instructor-time">Session time<select aria-label="Session time" id="instructor-time" name="time" required>{times.map(time => <option key={time} value={time}>{time} WAT</option>)}</select></label>
          <div className="admin-actions"><button className="button" disabled={busy}>{busy ? 'Submitting...' : 'Request instructor booking'}</button><button className="button secondary" type="button" disabled={busy} onClick={() => setSelected(null)}>Cancel</button></div>
        </form></div>}
    </>}
    {bookings.length > 0 && <><h3>Your instructor requests</h3><div className="grid two">{bookings.map(booking => <article className="card" key={booking.id}><h4>{booking.instructorName}</h4><p>{booking.date} · {booking.time} WAT</p><span className={`status booking-${booking.status}`}>{booking.status === 'pending' ? 'Pending approval' : 'Confirmed'}</span>{booking.confirmedAt && <p className="fine">Accepted by management. Your session lasts 45 minutes.</p>}</article>)}</div></>}
  </section>;
}
