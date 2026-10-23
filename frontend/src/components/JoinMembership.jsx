import { useEffect } from 'react';
import SignupForm from './SignupForm.jsx';
export default function JoinMembership({ member, sessionLoading }) {
  useEffect(() => { if (member) location.hash = 'Dashboard'; }, [member]);
  if (sessionLoading) return <p role="status">Checking your account...</p>;
  return member ? <p role="status">Opening your dashboard...</p> : <SignupForm/>;
}
