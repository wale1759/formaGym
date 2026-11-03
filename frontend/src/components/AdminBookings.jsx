import { useState } from 'react';

const statusLabels = { confirmed: 'Confirmed', waitlisted: 'Waitlisted' };

function submissionDate(value) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
  });
}

export default function AdminBookings({ bookings = [], search = '' }) {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const searchText = search.trim().toLowerCase();

  // Start with all bookings, then keep only the ones matching both choices.
  const visibleBookings = bookings.filter((booking) => {
    const matchesStatus =
      selectedStatus === 'All' || booking.status === selectedStatus;
    const searchableValues = [
      booking.email,
      booking.item,
      booking.date,
      booking.time,
      booking.id,
    ];
    const matchesSearch = searchableValues.some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(searchText),
    );
    return matchesStatus && matchesSearch;
  });

  return (
    <section aria-labelledby="admin-bookings-heading">
      <h2 id="admin-bookings-heading">Class and equipment bookings</h2>
      <p>
        Submitted reservations and waitlist requests. Contact emails are
        supplied by the person booking and are not verified member identities.
      </p>
      <p className="fine">
        Session dates and times appear exactly as booked. Use Refresh dashboard
        to load newer requests.
      </p>
      <div className="filters" aria-label="Filter bookings by status">
        {['All', 'confirmed', 'waitlisted'].map((status) => (
          <button
            key={status}
            type="button"
            className={selectedStatus === status ? 'selected' : ''}
            aria-pressed={selectedStatus === status}
            onClick={() => setSelectedStatus(status)}
          >
            {statusLabels[status] || 'All'}
          </button>
        ))}
      </div>
      <p role="status">
        Showing {visibleBookings.length} of {bookings.length} loaded bookings.
      </p>
      {visibleBookings.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Saved class and equipment bookings
            </caption>
            <thead>
              <tr>
                <th scope="col">Contact email</th>
                <th scope="col">Session or equipment</th>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.email}</td>
                  <td>{booking.item}</td>
                  <td>{booking.date}</td>
                  <td>{booking.time}</td>
                  <td>
                    <span className="status">
                      {statusLabels[booking.status] || 'Not recorded'}
                    </span>
                  </td>
                  <td>{submissionDate(booking.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          {bookings.length === 0
            ? 'No bookings have been submitted yet.'
            : 'No bookings match your search and status filter.'}
        </p>
      )}
    </section>
  );
}
