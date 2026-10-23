import { useEffect, useState } from 'react';
export default function useMemberSession() {
  const [session, setSession] = useState({ user: null, loading: true });
  useEffect(() => {
    let controller;
    const refresh = () => {
      controller?.abort(); controller = new AbortController();
      fetch('/api/member/session', { signal: controller.signal }).then(async response => {
        if (response.status === 401) { setSession({ user: null, loading: false }); return; }
        if (!response.ok) throw new Error('Session unavailable');
        const result = await response.json(); setSession({ user: result.user, loading: false });
      }).catch(error => { if (error.name !== 'AbortError') setSession(current => ({ ...current, loading: false })); });
    };
    const expire=()=>setSession({user:null,loading:false});
    window.addEventListener('member-session-expired',expire);
    refresh(); window.addEventListener('member-session-changed', refresh); window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('member-session-expired',expire); controller?.abort(); window.removeEventListener('member-session-changed', refresh); window.removeEventListener('focus', refresh); };
  }, []);
  return session;
}
