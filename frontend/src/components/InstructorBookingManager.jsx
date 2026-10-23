import { useCallback, useEffect, useState } from 'react';
import { gymTimeLabel } from '../../../shared/gym.js';
export default function InstructorBookingManager() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/instructor-bookings');
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to load instructor bookings.');
      setBookings(result.bookings);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function accept(id) {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/instructor-bookings/${encodeURIComponent(id)}/confirm`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to accept this booking.');
      setBookings(current => current.map(item => item.id === id ? result.booking : item));
      setMessage(`Booking accepted: ${result.booking.memberName} with ${result.booking.instructorName}, ${result.booking.date} at ${result.booking.time} WAT.`);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  const visible = bookings.filter(item => filter === 'all' || item.status === filter);
  return <section className="instructor-management"><h2>Instructor bookings</h2><p>Requests from active subscribers. All sessions are 45 minutes · {gymTimeLabel}.</p>
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="card">{message}</p>}
    <button className="button secondary" disabled={busy} onClick={load}>Refresh instructor requests</button>
    <div className="filters" aria-label="Instructor booking status">{['pending', 'confirmed', 'all'].map(status => <button key={status} className={filter === status ? 'selected' : ''} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status === 'all' ? 'All requests' : status === 'pending' ? 'Pending requests' : 'Confirmed requests'}</button>)}</div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Member</th><th>Instructor</th><th>Session (WAT)</th><th>Status</th><th>Management</th></tr></thead><tbody>{visible.map(booking => <tr key={booking.id}><td>{booking.memberName}<br/>{booking.email}</td><td>{booking.instructorName}</td><td>{booking.date}<br/>{booking.time} WAT</td><td><span className={`status booking-${booking.status}`}>{booking.status === 'pending' ? 'Pending approval' : 'Confirmed'}</span></td><td>{booking.status === 'pending' ? <button className="button" disabled={busy} onClick={() => accept(booking.id)}>Accept booking</button> : <>Accepted{booking.confirmedBy && <p className="fine">{booking.confirmedBy}</p>}</>}</td></tr>)}</tbody></table></div>
    {!busy && !visible.length && <p>No instructor bookings match this filter.</p>}
  </section>;
}
