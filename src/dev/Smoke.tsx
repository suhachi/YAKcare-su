import { supabase } from '@/services/supabase.client';

export function RLSSmoke() {
  const run = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[smoke] user:', user?.id ?? null);
    const ins = await supabase.from('medications').insert([{ 
      user_id: user?.id, 
      name: '테스트', 
      category: 'SUPPLEMENT',
      is_continuous: false,
      slots: [],
      times: [],
      source: 'manual'
    }]);
    console.log('[smoke] insert status:', ins.status, 'error:', ins.error?.message ?? null);
    alert(`status=${ins.status} err=${ins.error?.message ?? 'none'}`);
  };
  return <button className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded" onClick={run}>RLS 테스트</button>;
}



