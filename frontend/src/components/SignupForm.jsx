import { useState } from 'react';
import { validateSignup } from '../validation/signup.js';
import MembershipFields from './MembershipFields.jsx';

export default function SignupForm({ selectedPlan, billing }) {
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);
  const [ready, setReady] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.acceptTerms = data.acceptTerms === 'on';
    const issues = accountCreated ? {} : validateSignup(data);
    if (!data.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.startDate)) issues.startDate = 'Choose your preferred start date.';
    setErrors(issues); setMessage('');
    if (Object.keys(issues).length) { form.elements.namedItem(Object.keys(issues)[0])?.focus(); return; }
    setBusy(true);
    let created = accountCreated;
    try {
      if (!created) {
        const response = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await response.json();
        if (!response.ok) { setErrors(result.errors || {}); throw new Error(result.error || 'Unable to create your account.'); }
        created = true; setAccountCreated(true);
        form.elements.namedItem('password').value = '';
        form.elements.namedItem('confirmPassword').value = '';
      }
      const response = await fetch('/api/member/memberships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: data.plan, billing: data.billing, startDate: data.startDate, quotedPrice: Number(data.quotedPrice) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit your membership request.');
      location.hash = 'Dashboard';
    } catch (error) { setMessage(`${created ? 'Your account is created. Please retry your membership request, or open your dashboard. ' : ''}${error.message}`); }
    finally { setBusy(false); }
  }
  return <section className="page-section account-panel card">
    <h2>{accountCreated ? 'Complete your membership request' : 'Create your account and choose a plan'}</h2>
    {message && <p role="alert" className="error">{message}</p>}
    <form noValidate onSubmit={submit}>
      {!accountCreated && <>{[['name', 'Full name', 'text', 'name'], ['email', 'Email address', 'email', 'email'], ['password', 'Password', 'password', 'new-password'], ['confirmPassword', 'Confirm password', 'password', 'new-password']].map(([name, label, type, autoComplete]) => <label key={name} htmlFor={`signup-${name}`}>{label}<input id={`signup-${name}`} name={name} type={type} autoComplete={autoComplete} required maxLength={name === 'name' ? 80 : name === 'email' ? 254 : 128} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined}/>{name === 'password' && <span className="fine">Use between 12 and 128 characters.</span>}{errors[name] && <span id={`${name}-error`} className="error">{errors[name]}</span>}</label>)}
      <p className="fine">Account terms: registration creates a member account. Your chosen membership requires management approval. FORMA management can view your registration details.</p>
      <label className="checkbox-label"><input type="checkbox" name="acceptTerms" aria-invalid={!!errors.acceptTerms}/>I accept the account terms above.</label>{errors.acceptTerms && <p className="error">{errors.acceptTerms}</p>}</>}
      <MembershipFields selectedPlan={selectedPlan} billing={billing} onReady={setReady}/>
      {errors.startDate && <p className="error" role="alert">{errors.startDate}</p>}
      <button className="button" disabled={busy || !ready}>{busy ? 'Saving...' : accountCreated ? 'Submit membership request' : 'Create account and request membership'}</button>
    </form>
    {accountCreated ? <p><a href="#Dashboard">Open your dashboard</a></p> : <p>Already registered? <a href="#Signin">Sign in</a></p>}
  </section>;
}
