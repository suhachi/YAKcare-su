import { useState } from 'react';
import { supabase } from '@/services/supabase.client';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const nav = useNavigate();
  const from = (useLocation() as any).state?.from?.pathname ?? '/';

  const onLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) return alert(error.message);
    nav(from, { replace: true });
  };

  return (
    <div className="min-h-screen grid place-content-center gap-2 p-6">
      <h1 className="text-xl font-bold">로그인</h1>
      <input className="border rounded px-3 py-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border rounded px-3 py-2" placeholder="password" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
      <button onClick={onLogin} className="bg-emerald-600 text-white rounded py-2">로그인</button>
    </div>
  );
}
