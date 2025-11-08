import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    `[Supabase] 환경 변수가 누락되었습니다.
    해결:
      1) 루트에 .env.local 생성
      2) 아래 키 채우기
         VITE_SUPABASE_URL=https://{project}.supabase.co
         VITE_SUPABASE_ANON_KEY=********
    참고: .env.example 를 보세요.`
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
