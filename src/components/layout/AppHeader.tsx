import { YakCareLogo } from '../YakCareLogo';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { User, Users, Settings } from 'lucide-react';

type MainSubView = 'home' | 'onboarding' | 'carelinks' | 'settings' | 'about' | 'invite';

interface AppHeaderProps {
  activeTab: 'patient' | 'caregiver';
  setActiveTab: (tab: 'patient' | 'caregiver') => void;
  mainSubView: MainSubView;
  onLogoClick: () => void;
  onSettingsClick: () => void;
}

export default function AppHeader({ 
  activeTab, 
  setActiveTab, 
  mainSubView,
  onLogoClick,
  onSettingsClick 
}: AppHeaderProps) {
  // home 뷰일 때만 탭과 설정 버튼 표시
  const showTabs = mainSubView === 'home';
  const caregiverEnabled = import.meta.env.DEV;

  const handleTabChange = (value: 'patient' | 'caregiver') => {
    if (!caregiverEnabled && value === 'caregiver') {
      return;
    }
    setActiveTab(value);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b" style={{ borderBottom: '1px solid var(--brand-border)' }}>
      <div style={{ height: '44px' }} />
      
      {/* 로고 영역 */}
      <div className="flex justify-center py-3">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-3 transition-all active:scale-95"
          aria-label="홈으로 이동"
        >
          <YakCareLogo size={72} />
          <span style={{ 
            color: 'var(--brand-primary)', 
            fontSize: '32px', 
            fontWeight: 700 
          }}>
            {mainSubView === 'home' ? '약 챙겨먹어요' : '약 챙겨드세요'}
          </span>
        </button>
      </div>

      {/* 탭과 설정 (home 뷰일 때만) */}
      {showTabs && (
        <div className="flex items-center justify-between px-4 pb-3">
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as 'patient' | 'caregiver')} className="flex-1">
            <TabsList
              className={`grid w-full ${caregiverEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}
              style={{ height: '56px' }}
            >
              <TabsTrigger value="patient" className="gap-2" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                <User className="w-5 h-5" />
                복용자
              </TabsTrigger>
              {caregiverEnabled && (
                <TabsTrigger value="caregiver" className="gap-2" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                  <Users className="w-5 h-5" />
                  보호자
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          <button
            onClick={onSettingsClick}
            className="ml-3 flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'var(--brand-bg)',
              border: '2px solid var(--brand-border)',
            }}
          >
            <Settings className="w-6 h-6" style={{ color: 'var(--brand-text)' }} />
          </button>
        </div>
      )}
    </header>
  );
}
