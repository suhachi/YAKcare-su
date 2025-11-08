import { useState } from 'react';
import { supabase } from '@/services/supabase.client';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const nav = useNavigate();

  const handleSignup = async () => {
    if (pending) return;

    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setPending(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert('회원가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.');
      nav('/login', { replace: true, state: { newUser: true } });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen grid place-content-center gap-3 p-6">
      <h1 className="text-xl font-bold">회원가입</h1>

      <div className="flex flex-col gap-2 w-72">
        <input
          className="border rounded px-3 py-2"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={pending}
        />
        <button
          className="bg-emerald-600 text-white rounded py-2 disabled:opacity-60"
          onClick={handleSignup}
          disabled={pending}
        >
          {pending ? '가입 중...' : '회원가입'}
        </button>
        <button
          className="text-sm text-emerald-700 underline"
          onClick={() => nav('/login')}
          disabled={pending}
        >
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

