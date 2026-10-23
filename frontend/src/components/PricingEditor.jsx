import { useState } from 'react';

export default function PricingEditor({ pricing, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function save(event) {
    event.preventDefault();
    const prices = Object.fromEntries([...new FormData(event.currentTarget)].map(([name, value]) => [name, Number(value)]));
    setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/admin/pricing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prices }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save prices.');
      setMessage('Membership prices saved.');
      window.dispatchEvent(new Event('pricing-updated'));
      onSaved(result);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <div className="card"><h2>Membership pricing</h2><p>Monthly amounts in Nigerian naira (NGN). Yearly billing costs ten monthly payments. New prices apply to new inquiries; existing quotes and confirmed memberships keep their recorded amounts.</p>
    {error && <p className="error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <form onSubmit={save}><div className="grid four">{Object.entries(pricing.prices).map(([name, price]) => <label key={name}>{name} (₦)<input name={name} type="number" min="1" max="100000000" step="1" defaultValue={price} required/></label>)}</div><button className="button" disabled={busy}>{busy ? 'Saving...' : 'Save prices'}</button></form>
  </div>;
}
