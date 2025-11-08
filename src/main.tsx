import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import AppRouter from './AppRouter';
import { Splash } from './components/app/Splash';
import { useState } from 'react';

if (import.meta.env.DEV) {
  import('./debug/showErrorOverlay').then(({ installDebugOverlay }) => {
    installDebugOverlay();
  }).catch((error) => {
    console.error('[DebugOverlay] 설치 실패:', error);
  });
}

// ENV 주입 확인 (DEV 한정)
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('[ENV Check]', {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
}

function AppWithSplash() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return <AppRouter />;
}

const el = document.getElementById('root');
if (!el) throw new Error('Root #root not found');
createRoot(el).render(<React.StrictMode><AppWithSplash /></React.StrictMode>);

