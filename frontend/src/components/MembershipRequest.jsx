import { useState } from 'react';
import MembershipFields from './MembershipFields.jsx';

export default function MembershipRequest({ selectedPlan, billing, onComplete, allowedPlans, upgradeFromId }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.quotedPrice = Number(data.quotedPrice);
    if (upgradeFromId) data.upgradeFromId = upgradeFromId;
    try {
      const response = await fetch('/api/member/memberships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to request membership.');
      onComplete();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit}>{error && <p className="error" role="alert">{error}</p>}<MembershipFields selectedPlan={selectedPlan} billing={billing} allowedPlans={allowedPlans} onReady={setReady}/><button className="button" disabled={busy || !ready}>{busy ? 'Submitting...' : upgradeFromId ? 'Submit upgrade request' : 'Request membership'}</button></form>;
}
