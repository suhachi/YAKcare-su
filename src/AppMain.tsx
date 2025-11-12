import { Toaster } from "./components/ui/sonner";
import { HomeToday } from "./components/app/HomeToday";
import { CareLinks } from "./components/app/CareLinks";
import { SettingsPatient } from "./components/app/SettingsPatient";
import { useAuth } from "@/contexts/AuthContext";

type MainSubView = 'home' | 'onboarding' | 'carelinks' | 'settings' | 'about' | 'invite';

interface AppMainProps {
  mainSubView: MainSubView;
  setMainSubView: (view: MainSubView) => void;
  activeTab: 'patient' | 'caregiver';
}

export default function AppMain({
  mainSubView,
  setMainSubView,
  activeTab,
}: AppMainProps) {
  const { userId, loading } = useAuth();

  return (
    <>
      {/* 하위 뷰들 */}
      {mainSubView === 'carelinks' && (
        <>
          {loading ? (
            <div className="p-4 text-sm text-gray-500">사용자 확인 중...</div>
          ) : userId ? (
            <CareLinks
              userId={userId}
              asCaregiver={activeTab === 'caregiver'}
              onBack={() => setMainSubView('home')}
            />
          ) : (
            <div className="p-4 text-sm text-red-500">로그인이 필요합니다.</div>
          )}
        </>
      )}

      {mainSubView === 'settings' && (
        <SettingsPatient
          onBack={() => setMainSubView('home')}
          onOpenCareLinks={() => setMainSubView('carelinks')}
          onOpenAbout={undefined}
          role={activeTab}
        />
      )}

      {/* 메인 홈 뷰 */}
      {mainSubView === 'home' && (
        <>
          {activeTab === 'patient' && <HomeToday />}

          {activeTab === 'caregiver' && import.meta.env.DEV && (
            <div className="px-4 py-10 text-center text-muted-foreground">
              보호자 전용 화면은 개발 모드에서만 확인할 수 있습니다.
            </div>
          )}
        </>
      )}

      <Toaster />
    </>
  );
}
