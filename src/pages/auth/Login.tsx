import { useState } from 'react';
import { supabase } from '@/services/supabase.client';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const nav = useNavigate();
  const from = (useLocation() as any).state?.from?.pathname ?? '/';

  const onLogin = async () => {
    if (pending) return;
    setPending(true);
    setErrorMessage(null);
    setNeedsVerification(false);
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) {
        const msg = error.message ?? '로그인에 실패했습니다.';
        setErrorMessage(msg);
        if (msg.toLowerCase().includes('confirm')) {
          setNeedsVerification(true);
        }
        return;
      }
      nav(from, { replace: true });
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendPending) return;
    setResendPending(true);
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        setResendMessage(error.message ?? '재전송에 실패했습니다.');
        return;
      }
      setResendMessage('인증 메일을 다시 보냈습니다. 받은 편지함을 확인해 주세요.');
    } finally {
      setResendPending(false);
    }
  };

  return (
    <div className="min-h-screen grid place-content-center gap-3 p-6">
      <h1 className="text-xl font-bold text-center">로그인</h1>
      <div className="flex flex-col gap-2 w-72">
        <input
          className="border rounded px-3 py-2"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password"
        />
        {errorMessage && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMessage}
            {needsVerification && (
              <div className="mt-2 text-xs text-red-500">
                이메일 인증 후 다시 로그인해 주세요. 인증 메일을 받지 못했다면 재전송을 눌러주세요.
              </div>
            )}
          </div>
        )}
        <button
          onClick={onLogin}
          className="bg-emerald-600 text-white rounded py-2 disabled:opacity-60"
          disabled={pending || !email || !pw}
        >
          {pending ? '로그인 중...' : '로그인'}
        </button>
        {needsVerification && (
          <button
            onClick={handleResend}
            className="rounded py-2 border border-emerald-500 text-emerald-600 disabled:opacity-60"
            disabled={resendPending}
          >
            {resendPending ? '재전송 중...' : '인증 메일 다시 보내기'}
          </button>
        )}
        {resendMessage && (
          <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            {resendMessage}
          </div>
        )}
        <button
          className="text-sm text-emerald-700 underline"
          onClick={() => nav('/signup')}
        >
          계정이 없으신가요? 회원가입
        </button>
      </div>
    </div>
  );
}
