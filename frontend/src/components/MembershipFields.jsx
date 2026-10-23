import { useEffect, useState } from 'react';

export default function MembershipFields({ selectedPlan = 'Starter', billing = 'monthly', onReady, allowedPlans = ['Starter', 'Standard', 'Premium', 'VIP'] }) {
  const [prices, setPrices] = useState(null);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(selectedPlan);
  const [cycle, setCycle] = useState(billing);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/pricing', { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load membership pricing.');
      setPrices(result.prices); onReady(true);
    }).catch(error => { if (error.name !== 'AbortError') { setError(error.message); onReady(false); } });
    return () => controller.abort();
  }, [onReady]);
  const price = prices ? prices[plan] * (cycle === 'yearly' ? 10 : 1) : 0;
  return <fieldset className="membership-fields" disabled={!prices}>
    <legend>Your membership</legend>
    {error && <p className="error" role="alert">{error}</p>}
    {!prices && !error && <p role="status">Loading plans...</p>}
    <label>Plan<select aria-label="Plan" name="plan" value={plan} onChange={event => setPlan(event.target.value)}>{allowedPlans.map(name => <option key={name}>{name}</option>)}</select></label>
    <label>Billing<select aria-label="Billing" name="billing" value={cycle} onChange={event => setCycle(event.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly — save 17%</option></select></label>
    <label>Preferred start date<input name="startDate" type="date" required/></label>
    {prices && <p>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price)} / {cycle === 'yearly' ? 'year' : 'month'}</p>}
    <input type="hidden" name="quotedPrice" value={price}/>
    <p className="fine">Your membership remains pending until management accepts it. Subscription end dates appear after approval.</p>
  </fieldset>;
}
