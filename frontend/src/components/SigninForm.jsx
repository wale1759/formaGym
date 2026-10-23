import FormInput from './FormInput.jsx';
import { useEffect, useState } from 'react';
import { validateSignin } from '../validation/signin.js';
function openDashboard() {
  window.dispatchEvent(new Event('member-session-changed'));
  location.hash = 'Dashboard';
}
export default function SigninForm() {
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/member/session', { signal: controller.signal }).then(async response => {
      if (response.status === 401) return;
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to check your session.');
      openDashboard();
    }).catch(error => { if (error.name !== 'AbortError') setMessage(error.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, []);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const issues = validateSignin(data); setErrors(issues); setMessage('');
    if (Object.keys(issues).length) { form.elements.namedItem(Object.keys(issues)[0])?.focus(); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/member/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) { setErrors(result.errors || {}); throw new Error(result.error || 'Unable to sign in.'); }
      form.reset(); openDashboard();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section className="page-section account-panel card auth-page"><span className="eyebrow">MEMBER SIGN IN</span><h2>Sign in to your member account</h2><p>Open your personal membership dashboard.</p>
    {message && <p role="alert" className="error">{message}</p>}
    <form noValidate onSubmit={submit}>{[['email', 'Email address', 'email', 'username'], ['password', 'Password', 'password', 'current-password']].map(([name,label,type,autoComplete]) => <label key={name} htmlFor={`signin-${name}`}>{label}<FormInput passwordLabel={label} id={`signin-${name}`} name={name} aria-label={label} type={type} autoComplete={autoComplete} maxLength={name === 'email' ? 254 : 128} required aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `signin-${name}-error` : undefined}/>{errors[name] && <span id={`signin-${name}-error`} className="error">{errors[name]}</span>}</label>)}<button className="button" disabled={busy}>{busy ? 'Please wait...' : 'Sign in'}</button></form><p>New to FORMA? <a href="#Signup">Create an account</a></p>
  </section>;
}
