import { supabase } from '@/services/supabase.client';

export async function rlsSmoke() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[smoke] user:', user?.id ?? null);
  const r = await supabase.from('medications').insert([
    {
      user_id: user?.id,
      name: '테스트',
      category: 'PRESCRIPTION',
      source: 'manual',
    },
  ]);
  console.log('[smoke] status:', r.status, 'err:', r.error?.message ?? null);
}
