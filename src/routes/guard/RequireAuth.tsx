import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/services/supabase.client';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // DEV: 사용자 없으면 익명 로그인 시도
        if (!user && import.meta.env.DEV) {
          console.log('[RequireAuth] DEV: anonymous sign-in');
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          if (!mounted) return;
          setOk(!!data.user);
          setReady(true);
          return;
        }

        if (!mounted) return;
        setOk(!!user);
        setReady(true);
      } catch (e) {
        console.error('[RequireAuth] auth check failed:', e);
        if (!mounted) return;
        setOk(false);
        setReady(true);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setOk(!!session?.user);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (!ready) return <div className="p-6 text-center text-gray-500">인증 확인 중…</div>;
  return ok ? children : <Navigate to="/login" state={{ from: loc }} replace />;
}
