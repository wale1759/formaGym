import { useCallback, useEffect, useState } from 'react';
import SigninForm from './SigninForm.jsx';
import MembershipRequest from './MembershipRequest.jsx';
const money = (value, currency = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
export default function MemberDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/member/dashboard');
      if (response.status === 401) { setData(null); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load your dashboard.');
      setData(result);
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    window.addEventListener('member-session-changed', load);
    const timer = setInterval(load, 60000);
    return () => { window.removeEventListener('focus', load); window.removeEventListener('member-session-changed', load); clearInterval(timer); };
  }, [load]);
  async function logout() {
    setError('');
    try {
      const response = await fetch('/api/member/logout', { method: 'POST' });
      if (!response.ok && response.status !== 401) throw new Error('Unable to sign out. Please try again.');
      setData(null); location.hash = 'Signin';
    } catch (error) { setError(error.message); }
  }
  if (loading) return <p role="status">Loading your membership...</p>;
  if (!data) return <>{error && <p className="error" role="alert">{error}</p>}<SigninForm/></>;
  return <section className="page-section member-dashboard">
    <div className="card"><span className="eyebrow">YOUR FORMA MEMBERSHIP</span><h2>Welcome back, {data.user.name}.</h2><p>{data.user.email}</p><div className="admin-actions"><button className="button secondary" onClick={load}>Refresh membership</button><button className="button secondary" onClick={logout}>Sign out</button></div></div>
    {error && <p className="error" role="alert">{error}</p>}
    <h2>Your subscription details</h2>
    {!data.memberships.length && <div className="card"><p>No membership is linked to your account yet. Choose a plan below. If management already accepted an earlier inquiry, ask them to link it to this account.</p></div>}
    <div className="grid two">{data.memberships.map(plan => <article className="card" key={plan.id}><span className="status">{plan.status === 'pending' ? 'Pending approval' : plan.status}</span><h3>{plan.plan} membership</h3><p>{plan.billing} billing{plan.price !== undefined && ` · ${money(plan.price, plan.currency)}`}</p><dl className="subscription-dates"><div><dt>Start date</dt><dd>{plan.startDate}</dd></div><div><dt>End date</dt><dd>{plan.expiresAt ? plan.expiresAt.slice(0,10) : 'Awaiting admin approval'}</dd></div><div><dt>Days remaining</dt><dd>{plan.daysRemaining !== null ? `${plan.daysRemaining} days` : plan.status === 'expired' ? '0 days' : plan.status === 'pending' ? 'Available after approval' : 'Subscription has not started'}</dd></div></dl>{plan.status === 'pending' && <p className="fine">Your preferred start date is shown above. Management will confirm your membership and end date.</p>}</article>)}</div>
    <div className="admin-actions"><button className="button" onClick={() => setRequesting(value => !value)}>{requesting ? 'Close plan request' : 'Request a membership or new plan'}</button><a className="button secondary" href="#Bookings">View booking diary</a></div>
    {requesting && <div className="card account-panel"><MembershipRequest onComplete={() => { setRequesting(false); load(); }}/></div>}
  </section>;
}
