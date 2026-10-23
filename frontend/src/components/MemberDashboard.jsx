import { useCallback, useEffect, useState } from 'react';
import MembershipRequest from './MembershipRequest.jsx';
import UpcomingClasses from './UpcomingClasses.jsx';
const money = (value, currency = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
const dateLabel = value => value ? new Date(`${value.slice(0,10)}T00:00:00Z`).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'Awaiting approval';
export default function MemberDashboard({ enrollment = { selectedPlan: 'Starter', billing: 'monthly' }, onBook }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestPlan, setRequestPlan] = useState(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/member/dashboard');
      if (response.status === 401) { setData(null); window.dispatchEvent(new Event('member-session-expired')); location.hash = 'Signin'; return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load your dashboard.');
      setData(result);
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    load(); window.addEventListener('focus', load); window.addEventListener('member-session-changed', load);
    const timer = setInterval(load, 60000);
    return () => { window.removeEventListener('focus', load); window.removeEventListener('member-session-changed', load); clearInterval(timer); };
  }, [load]);
  if (loading) return <p role="status">Loading your membership...</p>;
  if (!data) return <div className="card"><p role="alert">{error || 'Opening sign in...'}</p><a href="#Signin" className="button">Sign in</a></div>;
  const current = data.memberships.find(plan => plan.id === data.currentMembershipId);
  const pending = data.memberships.filter(plan => plan.status === 'pending');
  const scheduled = data.memberships.find(plan => plan.status === 'scheduled');
  const overview = current || scheduled || pending[0] || data.memberships[0];
  const options = data.upgradeOptions || [];
  return <section className="page-section member-dashboard">
    <div className="member-welcome"><div><span className="eyebrow">YOUR FORMA MEMBERSHIP</span><h2>Welcome back, {data.user.name}.</h2><p>Your membership, progress and next session in one place.</p></div><button className="button secondary" onClick={load}>Refresh details</button></div>
    {error && <p className="error" role="alert">{error}</p>}{notice && <p className="card" role="status">{notice}</p>}
    <div className="membership-overview card"><div><span className="eyebrow">{current ? 'CURRENT PLAN' : overview?.status === 'scheduled' ? 'UPCOMING PLAN' : overview?.status === 'expired' ? 'LAST PLAN' : 'YOUR MEMBERSHIP'}</span><h3>{overview ? `${overview.plan} membership` : 'Choose your first membership'}</h3><p>{overview ? `${overview.billing} billing${overview.price !== undefined ? ` · ${money(overview.price,overview.currency)}` : ''}` : 'Select a plan below to send your request to management.'}</p>{overview && <span className="status">{overview.status === 'pending' ? 'Pending approval' : overview.status}</span>}</div><dl className="subscription-dates"><div><dt>{overview?.status === 'pending' ? 'Requested start' : 'Start date'}</dt><dd>{dateLabel(overview?.startDate)}</dd></div><div><dt>Expiry date</dt><dd>{dateLabel(overview?.expiresAt)}</dd></div><div><dt>Days remaining</dt><dd>{current ? `${current.daysRemaining} days` : overview?.status === 'expired' ? '0 days' : overview?.status === 'pending' ? 'Available after approval' : overview?.status === 'scheduled' ? 'Not started yet' : 'No active subscription'}</dd></div></dl></div>
    {pending.length > 0 && <div className="card membership-pending"><h3>Requests awaiting approval</h3>{pending.map(plan => <p key={plan.id}>{plan.plan} · {plan.billing} · Requested start {dateLabel(plan.startDate)}</p>)}<p className="fine">Your current subscription remains unchanged while management reviews a request.</p></div>}
    {current && <section className="member-upgrades"><div className="section-heading"><span className="eyebrow">YOUR NEXT LEVEL</span><h2>{options.length ? 'Upgrade your membership' : 'You have VIP access'}</h2><p>{options.length ? 'Choose any tier above your current plan. Management will review your request and confirm the access dates.' : 'VIP is our highest membership tier.'}</p></div><div className="upgrade-grid">{options.map(name => <article className="card" key={name}><h3>{name}</h3><p>A higher level of FORMA membership.</p><button className="button" onClick={() => setRequestPlan(name)}>Upgrade to {name}</button></article>)}</div></section>}
    {(!current || requestPlan) && <section className="card account-panel member-plan-request"><h3>{current ? `Request your ${requestPlan} upgrade` : 'Choose your membership plan'}</h3>{current && <button className="button secondary" onClick={() => setRequestPlan(null)}>Cancel upgrade request</button>}<MembershipRequest key={`${current?.id || 'new'}-${requestPlan || enrollment.selectedPlan}`} selectedPlan={requestPlan || enrollment.selectedPlan} billing={current?.billing || enrollment.billing} allowedPlans={current ? options : undefined} upgradeFromId={current?.id} onComplete={() => { setRequestPlan(null); setNotice('Your request is pending management approval. Your confirmed subscription dates will appear here once accepted.'); load(); }}/></section>}
    <UpcomingClasses onBook={onBook}/>
    {data.memberships.length > 0 && <details className="membership-history"><summary>Membership history</summary><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Plan</th><th scope="col">Start</th><th scope="col">Expiry</th><th scope="col">Status</th></tr></thead><tbody>{data.memberships.map(plan => <tr key={plan.id}><td>{plan.plan} / {plan.billing}</td><td>{dateLabel(plan.startDate)}</td><td>{dateLabel(plan.expiresAt)}</td><td>{plan.status === 'pending' ? 'Pending approval' : plan.status}</td></tr>)}</tbody></table></div></details>}
  </section>;
}
