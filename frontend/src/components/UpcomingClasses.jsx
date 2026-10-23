const classes = [
  { name: 'HIIT Cardio Blast', time: '09:00', image: 'coach-chidi', focus: 'Cardio and conditioning' },
  { name: 'Strength Foundations', time: '10:30', image: 'coach-tunde', focus: 'Build confident strength' },
  { name: 'Yoga Flow', time: '12:00', image: 'coach-amara', focus: 'Mobility and balance', waitlist: true },
  { name: 'Core and Mobility', time: '14:00', image: 'hero-nigeria', focus: 'Control and recovery' },
];
export default function UpcomingClasses({ onBook }) {
  return <section className="upcoming-classes"><div className="section-heading"><span className="eyebrow">MAKE TIME FOR YOURSELF</span><h2>Upcoming classes</h2><p>Sample class schedule · 45-minute sessions · Nigeria (WAT, UTC+1)</p></div><div className="class-grid">{classes.map(item => <article className="card class-card" key={item.name}><img src={`/assets/${item.image}.jpg`} alt={`${item.name} training illustration`} loading="lazy" width="480" height="260"/><div><span className="eyebrow">{item.time} · 45 MIN</span><h3>{item.name}</h3><p>{item.focus}</p><button className={item.waitlist ? 'button secondary' : 'button'} onClick={() => onBook(item)}>{item.waitlist ? 'Join waitlist' : 'Book class'}</button></div></article>)}</div></section>;
}
