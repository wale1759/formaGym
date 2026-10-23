import { useEffect, useState } from 'react';
import { validateSignin } from '../validation/signin.js';

export default function SigninForm() {
  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/member/session', { signal: controller.signal }).then(async response => {
      if (response.status === 401) return;
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to check your session.');
      setUser(result.user);
      window.dispatchEvent(new Event('member-session-changed'));
      location.hash = 'Dashboard';
    }).catch(error => { if (error.name !== 'AbortError') setMessage(error.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, []);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const issues = validateSignin(data);
    setErrors(issues);
    setMessage('');
    if (Object.keys(issues).length) { form.elements.namedItem(Object.keys(issues)[0])?.focus(); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/member/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) { setErrors(result.errors || {}); throw new Error(result.error || 'Unable to sign in.'); }
      form.reset();
      setUser(result.user);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/member/logout', { method: 'POST' });
      if (!response.ok && response.status !== 401) throw new Error('Unable to sign out. Please try again.');
      setUser(null);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section className="page-section account-panel card">
    <h2>{user ? `Welcome back, ${user.name}.` : 'Sign in to your member account'}</h2>
    {message && <p role="alert" className="error">{message}</p>}
    {user ? <><p role="status">You are signed in as {user.email}.</p><div className="admin-actions"><a className="button" href="#Bookings">View bookings</a><button className="button secondary" disabled={busy} onClick={logout}>{busy ? 'Signing out...' : 'Sign out'}</button></div></> : <>
      <p>Keep your FORMA journey moving.</p>
      <form noValidate onSubmit={submit}>
        {[['email', 'Email address', 'email', 'username'], ['password', 'Password', 'password', 'current-password']].map(([name, label, type, autoComplete]) => <label key={name} htmlFor={`signin-${name}`}>{label}
          <input id={`signin-${name}`} name={name} type={type} autoComplete={autoComplete} required maxLength={name === 'email' ? 254 : 128} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `signin-${name}-error` : undefined}/>
          {errors[name] && <span id={`signin-${name}-error`} className="error">{errors[name]}</span>}
        </label>)}
        <button className="button" disabled={busy}>{busy ? 'Please wait...' : 'Sign in'}</button>
      </form>
      <p>New to FORMA? <a href="#Signup">Create an account</a></p>
    </>}
  </section>;
}
