import { useState } from 'react';
import { validateSignup } from '../validation/signup.js';
export default function SignupForm() {
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.acceptTerms = data.acceptTerms === 'on';
    const issues = validateSignup(data); setErrors(issues); setMessage('');
    if (Object.keys(issues).length) { form.elements.namedItem(Object.keys(issues)[0])?.focus(); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) { setErrors(result.errors || {}); throw new Error(result.error || 'Unable to create your account.'); }
      form.reset(); window.dispatchEvent(new Event('member-session-changed')); location.hash = 'Dashboard';
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section className="page-section account-panel card auth-page">
    <span className="eyebrow">CREATE YOUR MEMBER ACCOUNT</span><h2>Sign up for FORMA</h2><p>Create your account, then choose and track your membership from your dashboard.</p>
    {message && <p role="alert" className="error">{message}</p>}
    <form noValidate onSubmit={submit}>
      {[['name', 'Full name', 'text', 'name'], ['email', 'Email address', 'email', 'email'], ['password', 'Password', 'password', 'new-password'], ['confirmPassword', 'Confirm password', 'password', 'new-password']].map(([name, label, type, autoComplete]) => <label key={name} htmlFor={`signup-${name}`}>{label}<input id={`signup-${name}`} name={name} aria-label={label} type={type} autoComplete={autoComplete} required maxLength={name === 'name' ? 80 : name === 'email' ? 254 : 128} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined}/>{name === 'password' && <span className="fine">Use between 12 and 128 characters.</span>}{errors[name] && <span id={`${name}-error`} className="error">{errors[name]}</span>}</label>)}
      <p className="fine">Creating an account does not activate a paid plan. Membership requests are reviewed by management.</p>
      <label className="checkbox-label"><input type="checkbox" name="acceptTerms" aria-invalid={!!errors.acceptTerms} aria-describedby={errors.acceptTerms ? 'terms-error' : undefined}/>I accept the account terms above.</label>{errors.acceptTerms && <p id="terms-error" className="error">{errors.acceptTerms}</p>}
      <button className="button" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
    </form><p>Already a member? <a href="#Signin">Sign in</a></p>
  </section>;
}
