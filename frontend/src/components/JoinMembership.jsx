import { useEffect, useState } from 'react';
import SignupForm from './SignupForm.jsx';
import MembershipRequest from './MembershipRequest.jsx';
export default function JoinMembership({ selectedPlan, billing }) {
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/member/session', { signal: controller.signal }).then(async response => {
      if (response.status === 401) { setState('signup'); return; }
      if (!response.ok) throw new Error('Unable to check your account. Please refresh and try again.');
      setState('member');
    }).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    return () => controller.abort();
  }, []);
  if (error) return <p className="error" role="alert">{error}</p>;
  if (state === 'loading') return <p role="status">Checking your account...</p>;
  if (state === 'signup') return <SignupForm selectedPlan={selectedPlan} billing={billing}/>;
  return <section className="page-section account-panel card"><h2>Choose your next membership</h2><p>You are already signed in. Your request will be linked to your account.</p><MembershipRequest selectedPlan={selectedPlan} billing={billing} onComplete={() => { location.hash = 'Dashboard'; }}/></section>;
}
