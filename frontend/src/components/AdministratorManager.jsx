import FormInput from './FormInput.jsx';
import { useEffect, useState } from 'react';

export default function AdministratorManager() {
  const [administrators, setAdministrators] = useState([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/administrators', { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load administrators.');
      setAdministrators(result.administrators);
    }).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    return () => controller.abort();
  }, []);
  async function create(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const issues = {};
    if (!/^[a-z][a-z0-9_.-]{2,31}$/i.test(data.username.trim())) issues.username = 'Use 3–32 characters starting with a letter; letters, numbers, dots, underscores and hyphens are allowed.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || data.email.trim().length > 254) issues.email = 'Enter a valid email address.';
    if (data.password.length < 12 || data.password.length > 128) issues.password = 'Use a password between 12 and 128 characters.';
    if (data.confirmPassword !== data.password) issues.confirmPassword = 'Passwords must match.';
    setErrors(issues); setError(''); setMessage('');
    if (Object.keys(issues).length) { form.elements.namedItem(Object.keys(issues)[0])?.focus(); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/admin/administrators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) { setErrors(result.errors || {}); throw new Error(result.error || 'Unable to create administrator.'); }
      setAdministrators(current => [result.administrator, ...current]);
      form.reset();
      setMessage(`Administrator ${result.administrator.username} created. They can sign in with their username or email and the password you assigned.`);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <>
    <div className="card account-panel"><h2>Add an administrator</h2><p>New administrators have full management access, including pricing, member records and adding other administrators.</p>
      {error && <p className="error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <form noValidate onSubmit={create}>
        {[['username', 'Username', 'text', 'off'], ['email', 'Email address', 'email', 'off'], ['password', 'Password', 'password', 'new-password'], ['confirmPassword', 'Confirm password', 'password', 'new-password']].map(([name, label, type, autoComplete]) => <label key={name} htmlFor={`administrator-${name}`}>{label}<FormInput passwordLabel={label} id={`administrator-${name}`} name={name} type={type} autoComplete={autoComplete} maxLength={name === 'username' ? 32 : name === 'email' ? 254 : 128} required aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `administrator-${name}-error` : undefined}/>{errors[name] && <span className="error" id={`administrator-${name}-error`}>{errors[name]}</span>}</label>)}
        <p className="fine">Choose a unique password of 12–128 characters. Passwords cannot be viewed after creation.</p><button className="button" disabled={busy}>{busy ? 'Creating...' : 'Create administrator'}</button>
      </form>
    </div>
    <h2>Administrator accounts</h2><p>The original management account stays configured in the server environment. The list below shows additional administrators.</p>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Username / email</th><th scope="col">Created</th><th scope="col">Created by</th><th scope="col">Last sign-in</th></tr></thead><tbody>{administrators.map(admin => <tr key={admin.id}><td><strong>{admin.username}</strong><br/>{admin.email}</td><td>{new Date(admin.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })}</td><td>{admin.createdBy}</td><td>{admin.lastSignInAt ? new Date(admin.lastSignInAt).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' }) : 'Not yet signed in'}</td></tr>)}</tbody></table></div>{!administrators.length && <p>No additional administrators have been created.</p>}
  </>;
}
