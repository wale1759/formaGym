import FormInput from './FormInput.jsx';
import AdminProfile from './AdminProfile.jsx';
import AdministratorManager from './AdministratorManager.jsx';
import PricingEditor from './PricingEditor.jsx';
import { useEffect, useState } from 'react';

const labels = { users: 'Member accounts', bookings: 'Bookings', memberships: 'Membership inquiries', orders: 'Demo orders', contacts: 'Messages', subscriptions: 'Newsletter subscriptions' };
const dateTime = value => value ? new Date(value).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' }) : 'Not recorded';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Members');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [confirmationId, setConfirmationId] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  async function load() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/activity');
      if (response.status === 401) { setData(null); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load activity.');
      setData(result);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  useEffect(() => { load(); }, []);
  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      await load();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (!response.ok && response.status !== 401) throw new Error('Unable to sign out. Try again.');
      setData(null);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function confirm(id) {
    if (busy) return;
    setConfirmationId(id);
    setConfirmationMessage('');
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/memberships/${encodeURIComponent(id)}/confirm`, { method: 'POST' });
      const result = await response.json();
      if (response.status === 401) setData(null);
      if (!response.ok) throw new Error(result.error || 'Unable to confirm membership.');
      setData(current => current ? { ...current, memberships: current.memberships.map(plan => plan.id === id ? result.membership : plan) } : current);
      setConfirmationMessage(`${result.membership.plan} membership accepted for ${result.membership.email}. Access: ${result.membership.startDate} to ${new Date(result.membership.expiresAt).toISOString().slice(0,10)}.`);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); setConfirmationId(null); }
  }
  async function linkAccount(id) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/admin/memberships/${encodeURIComponent(id)}/link-account`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to link account.');
      await load();
      setConfirmationMessage('Membership linked. The member can now see it in their personal dashboard.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  const pendingCount = data?.memberships.filter(plan => plan.status === 'pending').length || 0;
  const matches = item => [item.name, item.email, item.plan, item.action, item.target].some(value => String(value || '').toLowerCase().includes(search.toLowerCase()));
  return <section className="page-section admin-dashboard">
    {error && <p className="error" role="alert">{error}</p>}
    {confirmationMessage && <p className="card" role="status">{confirmationMessage}</p>}
    {!data ? <div className="card account-panel"><h2>Management sign-in</h2><p>Sign in with your gym administrator credentials.</p><form onSubmit={login}><label>Username or email<input name="email" type="text" autoComplete="username" required maxLength={254}/></label><label>Password<FormInput id="admin-login-password" name="password" type="password" autoComplete="current-password" required maxLength={128}/></label><button className="button" disabled={busy}>{busy ? 'Please wait...' : 'Sign in'}</button></form></div> : <>
      {data.currentAdmin && <AdminProfile profile={data.currentAdmin} onChanged={profile => setData(current => current ? { ...current, currentAdmin: profile } : current)}/>}
      <div className="admin-actions"><button className="button secondary" disabled={busy} onClick={() => { setTab('Memberships'); setFilter('pending'); setSearch(''); }}>Review pending memberships ({pendingCount})</button><button className="button" disabled={busy} onClick={load}>{busy ? 'Refreshing...' : 'Refresh dashboard'}</button><button className="button secondary" disabled={busy} onClick={logout}>Sign out</button></div>
      <div className="grid three">{Object.entries(data.counts).map(([type, count]) => <div className="card metric" key={type}><h3>{count}</h3><p>{labels[type]}</p></div>)}</div>
      <div className="filters" aria-label="Dashboard sections">{['Members', 'Memberships', 'Pricing', 'Administrators', 'Activity'].map(name => <button key={name} className={tab === name ? 'selected' : ''} onClick={() => { setTab(name); setFilter('All'); }}>{name}</button>)}</div>
      <input className="search" aria-label={`Search ${tab.toLowerCase()}`} placeholder="Search by name, email, plan or activity..." value={search} onChange={event => setSearch(event.target.value)}/>
      <p className="fine">Latest 500 records per section. Times shown in Australia/Brisbane.</p>
      {tab === 'Administrators' && <AdministratorManager canCreate={data.currentAdmin?.canManageAdministrators === true}/>}
      {tab === 'Pricing' && <PricingEditor pricing={data.pricing} onSaved={pricing => setData(current => ({ ...current, pricing }))}/>}
      {tab === 'Members' && <><h2>Member accounts</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Member</th><th scope="col">Signed up</th><th scope="col">Last sign-in</th><th scope="col">Sign-ins</th><th scope="col">Confirmed plans</th></tr></thead><tbody>{data.members.filter(matches).map(member => <tr key={member.id}><td><strong>{member.name}</strong><br/>{member.email}</td><td>{dateTime(member.createdAt)}</td><td>{dateTime(member.lastSignInAt)}</td><td>{member.signInCount}</td><td>{data.memberships.filter(plan => plan.email === member.email && plan.status !== 'pending').map(plan => `${plan.plan} (${plan.status})`).join(', ') || 'No confirmed plan'}</td></tr>)}</tbody></table></div>{!data.members.some(matches) && <p>No matching members.</p>}</>}
      {tab === 'Memberships' && <><h2>Plans and subscription dates</h2><p>Confirm only after verifying the member and completing your membership arrangements. Confirmation records access dates; it does not collect payment.</p><div className="filters">{['All', 'pending', 'scheduled', 'active', 'expired'].map(status => <button key={status} className={filter === status ? 'selected' : ''} onClick={() => setFilter(status)}>{status}</button>)}</div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Member / plan</th><th scope="col">Requested</th><th scope="col">Access period</th><th scope="col">Status</th><th scope="col">Management</th></tr></thead><tbody>{data.memberships.filter(matches).filter(plan => filter === 'All' || plan.status === filter).map(plan => <tr key={plan.id}><td>{plan.email}<br/><strong>{plan.plan || 'Plan missing'}</strong> / {plan.billing || 'Billing missing'}{plan.price !== undefined && <p>{plan.currency} {plan.price}</p>}</td><td>{dateTime(plan.createdAt)}</td><td>Start: {plan.startDate || 'Not recorded'}<br/>Expires: {plan.expiresAt ? dateTime(plan.expiresAt) : 'Awaiting confirmation'}<br/>Confirmed: {plan.confirmedAt ? dateTime(plan.confirmedAt) : 'Pending'}{plan.confirmedBy && <><br/>Accepted by: {plan.confirmedBy}</>}</td><td><span className="status">{plan.status}</span></td><td>{plan.status === 'pending' ? <button className="button secondary" disabled={busy} onClick={() => confirm(plan.id)}>{confirmationId === plan.id ? 'Accepting...' : 'Confirm membership'}</button> : <><span>Accepted</span>{!plan.userId && <button className="button secondary" disabled={busy} onClick={() => linkAccount(plan.id)}>Link member account</button>}</>}</td></tr>)}</tbody></table></div>{!data.memberships.some(plan => matches(plan) && (filter === 'All' || plan.status === filter)) && <p>No matching memberships.</p>}</>}
      {tab === 'Activity' && <><h2>Member and admin activity</h2><p>Sign-ins, registrations, submitted forms and management changes. Browser-reported actions are labelled separately.</p><div className="filters">{['All', 'member', 'admin', 'guest', 'anonymous'].map(actor => <button key={actor} className={filter === actor ? 'selected' : ''} onClick={() => setFilter(actor)}>{actor}</button>)}</div><div aria-live="polite">{data.activity.filter(matches).filter(item => filter === 'All' || item.actor === filter).map(item => <article className="card class-row" key={item.id}><div><span className="eyebrow">{item.actor}</span><h3>{item.action.replaceAll('_', ' ')}</h3>{item.email && <p>{item.email}</p>}{item.target && <p>{item.target}</p>}{item.details && <p className="fine">{item.details}</p>}<p className="fine">{dateTime(item.createdAt)}</p></div></article>)}{!data.activity.some(item => matches(item) && (filter === 'All' || item.actor === filter)) && <p>No matching activity.</p>}</div></>}
    </>}
  </section>;
}
