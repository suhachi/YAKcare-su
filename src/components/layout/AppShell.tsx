import { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import AppMain from '../../AppMain';

type MainSubView = 'home' | 'onboarding' | 'carelinks' | 'settings' | 'about' | 'invite';

export default function AppShell() {
  const [mainSubView, setMainSubView] = useState<MainSubView>('home');
  const [activeTab, setActiveTab] = useState<'patient' | 'caregiver'>('patient');

  useEffect(() => {
    if (!import.meta.env.DEV && activeTab !== 'patient') {
      setActiveTab('patient');
    }
  }, [activeTab]);

  // 스케줄러 워커 시작 (개발용)
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    let stop: (() => void) | undefined;

    import('../../services/scheduler.mock')
      .then(({ startDevWorker, stopWorker }) => {
        console.log('[AppShell] Starting dev scheduler worker');
        startDevWorker();
        stop = stopWorker;
      })
      .catch((error) => {
        console.error('[AppShell] Failed to start dev scheduler worker', error);
      });

    return () => {
      if (stop) {
        console.log('[AppShell] Stopping scheduler worker');
        stop();
      }
    };
  }, []);

  // RLS 스모크 테스트 (DEV 한정)
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    import('../../dev/rls.smoke')
      .then(m => m.rlsSmoke())
      .catch(error => {
        console.error('[AppShell] RLS smoke 테스트 실패', error);
      });
  }, []);

  const handleLogoClick = () => {
    setMainSubView('home');
    console.log('GA4: logo_click_home');
  };

  return (
    <div className="min-h-screen">
      <AppHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mainSubView={mainSubView}
        onLogoClick={handleLogoClick}
        onSettingsClick={() => setMainSubView('settings')}
      />
      <main className="pt-14">
        <AppMain
          mainSubView={mainSubView}
          setMainSubView={setMainSubView}
          activeTab={activeTab}
        />
      </main>
    </div>
  );
}
