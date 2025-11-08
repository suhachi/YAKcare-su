import { useState } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { ArrowLeft, Bell, Target, Users, Shield, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface HealthGoal {
  bpSysMin: number;
  bpSysMax: number;
  bpDiaMin: number;
  bpDiaMax: number;
  bgFastingMin: number;
  bgFastingMax: number;
  bgPp2Min: number;
  bgPp2Max: number;
}

interface SettingsPatientProps {
  onBack?: () => void;
  onOpenCareLinks?: () => void;
  onOpenAbout?: () => void;
  role?: 'patient' | 'caregiver';
}

export function SettingsPatient({ onBack, onOpenCareLinks, onOpenAbout, role = 'patient' }: SettingsPatientProps) {
  const [preAlertEnabled, setPreAlertEnabled] = useState(true);
  const [confirmAlertEnabled, setConfirmAlertEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('granted');

  const [goals, setGoals] = useState<HealthGoal>({
    bpSysMin: 90,
    bpSysMax: 140,
    bpDiaMin: 60,
    bpDiaMax: 90,
    bgFastingMin: 70,
    bgFastingMax: 130,
    bgPp2Min: 90,
    bgPp2Max: 180,
  });

  const [isEditingGoals, setIsEditingGoals] = useState(false);

  const handleTogglePreAlert = (checked: boolean) => {
    setPreAlertEnabled(checked);
    toast(checked ? '예고 알림이 켜졌습니다' : '예고 알림이 꺼졌습니다');
    console.log('GA4: settings_toggle_prealert', { enabled: checked });
  };

  const handleToggleConfirm = (checked: boolean) => {
    setConfirmAlertEnabled(checked);
    toast(checked ? '확인 알림이 켜졌습니다' : '확인 알림이 꺼졌습니다');
    console.log('GA4: settings_toggle_confirm', { enabled: checked });
  };

  const handleOpenPermissions = () => {
    // iOS/Android 설정 앱으로 딥링크
    console.log('GA4: settings_open_permissions');
    toast('설정 앱에서 알림 권한을 변경할 수 있어요');
    // TODO: 실제 딥링크 구현
  };

  const handleSaveGoals = () => {
    // 유효성 검증
    if (goals.bpSysMin >= goals.bpSysMax) {
      toast.error('혈압 목표 범위를 확인해 주세요');
      return;
    }
    if (goals.bpDiaMin >= goals.bpDiaMax) {
      toast.error('혈압 목표 범위를 확인해 주세요');
      return;
    }
    if (goals.bgFastingMin >= goals.bgFastingMax) {
      toast.error('혈당 목표 범위를 확인해 주세요');
      return;
    }
    if (goals.bgPp2Min >= goals.bgPp2Max) {
      toast.error('혈당 목표 범위를 확인해 주세요');
      return;
    }

    console.log('GA4: settings_goal_save', goals);
    toast.success('건강 목표가 저장되었습니다');
    setIsEditingGoals(false);
  };

  const getPermissionBadge = () => {
    if (notificationPermission === 'granted') {
      return (
        <span
          style={{
            fontSize: '0.875rem',
            color: 'var(--brand-success)',
            backgroundColor: 'rgba(18, 184, 134, 0.1)',
            padding: '4px 12px',
            borderRadius: '8px',
          }}
        >
          허용됨
        </span>
      );
    } else if (notificationPermission === 'denied') {
      return (
        <span
          style={{
            fontSize: '0.875rem',
            color: 'var(--brand-danger)',
            backgroundColor: 'rgba(224, 49, 49, 0.1)',
            padding: '4px 12px',
            borderRadius: '8px',
          }}
        >
          거부됨
        </span>
      );
    } else {
      return (
        <span
          style={{
            fontSize: '0.875rem',
            color: 'var(--brand-text-secondary)',
            backgroundColor: 'var(--brand-bg)',
            padding: '4px 12px',
            borderRadius: '8px',
          }}
        >
          미설정
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>
      {/* 컨테이너 */}
      <div className="px-4 pb-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'var(--brand-bg)',
              border: '1px solid var(--brand-border)',
            }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--brand-text)' }} />
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-text)' }}>
            설정
          </h1>
        </div>

        {/* 알림 설정 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-7 h-7" style={{ color: 'var(--brand-primary)' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-text)' }}>
              알림 설정
            </h2>
          </div>

          <div
            className="rounded-2xl"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '16px',
            }}
          >
            {/* 예고 알림 (T-15) */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--brand-text)' }}>
                  예고 알림
                </p>
                <p style={{ fontSize: '1.1rem', color: 'var(--brand-text-secondary)' }}>
                  15분 전에 미리 알려드려요
                </p>
              </div>
              <Switch
                checked={preAlertEnabled}
                onCheckedChange={handleTogglePreAlert}
                style={{ transform: 'scale(1.3)' }}
              />
            </div>

            <Separator style={{ margin: '12px 0' }} />

            {/* 확인 알림 (T+15) */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--brand-text)' }}>
                  확인 알림
                </p>
                <p style={{ fontSize: '1.1rem', color: 'var(--brand-text-secondary)' }}>
                  15분 후에 복용 여부를 확인해요
                </p>
              </div>
              <Switch
                checked={confirmAlertEnabled}
                onCheckedChange={handleToggleConfirm}
                style={{ transform: 'scale(1.3)' }}
              />
            </div>

            <Separator style={{ margin: '8px 0' }} />

            {/* 알림 권한 */}
            <button
              onClick={handleOpenPermissions}
              className="flex items-center justify-between w-full py-4 transition-all active:opacity-70"
            >
              <div className="flex-1 text-left">
                <p style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--brand-text)' }}>
                  알림 권한
                </p>
                <p style={{ fontSize: '1.1rem', color: 'var(--brand-text-secondary)' }}>
                  설정 앱에서 변경할 수 있어요
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getPermissionBadge()}
                <ChevronRight className="w-6 h-6" style={{ color: 'var(--brand-text-muted)' }} />
              </div>
            </button>
          </div>
        </div>

        {/* 건강 목표 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Target className="w-7 h-7" style={{ color: 'var(--brand-primary)' }} />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-text)' }}>
                건강 목표
              </h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => setIsEditingGoals(!isEditingGoals)}
              style={{ fontSize: '1.2rem', minHeight: '48px', padding: '0 20px' }}
            >
              {isEditingGoals ? '취소' : '수정'}
            </Button>
          </div>

          <div
            className="rounded-2xl"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '16px',
            }}
          >
            {/* 혈압 목표 */}
            <div className="mb-4">
              <Label style={{ fontSize: '1rem', marginBottom: '12px', display: 'block' }}>
                혈압 목표 (mmHg)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '4px', display: 'block' }}>
                    수축 최소
                  </Label>
                  <Input
                    type="number"
                    value={goals.bpSysMin}
                    onChange={(e) => setGoals({ ...goals, bpSysMin: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingGoals}
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '4px', display: 'block' }}>
                    수축 최대
                  </Label>
                  <Input
                    type="number"
                    value={goals.bpSysMax}
                    onChange={(e) => setGoals({ ...goals, bpSysMax: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingGoals}
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '4px', display: 'block' }}>
                    이완 최소
                  </Label>
                  <Input
                    type="number"
                    value={goals.bpDiaMin}
                    onChange={(e) => setGoals({ ...goals, bpDiaMin: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingGoals}
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '4px', display: 'block' }}>
                    이완 최대
                  </Label>
                  <Input
                    type="number"
                    value={goals.bpDiaMax}
                    onChange={(e) => setGoals({ ...goals, bpDiaMax: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingGoals}
                    style={{ minHeight: '48px' }}
                  />
                </div>
              </div>
            </div>

            <Separator style={{ margin: '16px 0' }} />

            {/* 혈당 목표 */}
            <div>
              <Label style={{ fontSize: '1rem', marginBottom: '12px', display: 'block' }}>
                혈당 목표 (mg/dL)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '4px', display: 'block' }}>
                    공복 최소
                  </Label>
                  <Input
                    type="number"
                    value={goals.bgFastingMin}
                    onChange={(e) => setGoals({ ...goals, bgFastingMin: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingGoals}
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '4px', display: 'block' }}>
                    공복 최대
                  </Label>
                  <Input
                    type="number"
                    value={goals.bgFastingMax}
                    onChange={(e) => setGoals({ ...goals, bgFastingMax: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingGoals}
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '4px', display: 'block' }}>
                    식후 최소
                  </Label>
                  <Input
                    type="number"
                    value={goals.bgPp2Min}
                    onChange={(e) => setGoals({ ...goals, bgPp2Min: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingGoals}
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '4px', display: 'block' }}>
                    식후 최대
                  </Label>
                  <Input
                    type="number"
                    value={goals.bgPp2Max}
                    onChange={(e) => setGoals({ ...goals, bgPp2Max: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingGoals}
                    style={{ minHeight: '48px' }}
                  />
                </div>
              </div>
            </div>

            {isEditingGoals && (
              <Button
                onClick={handleSaveGoals}
                className="w-full mt-4"
                style={{
                  minHeight: '48px',
                  backgroundColor: 'var(--brand-primary)',
                  color: 'white',
                }}
              >
                저장
              </Button>
            )}
          </div>
        </div>

        {/* 연결 관리 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <Users className="w-7 h-7" style={{ color: 'var(--brand-primary)' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-text)' }}>
              연결 관리
            </h2>
          </div>

          <button
            onClick={onOpenCareLinks}
            className="w-full rounded-3xl transition-all active:opacity-70"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '24px',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--brand-text)' }}>
                  {role === 'caregiver' ? '복용자' : '내 보호자'}
                </p>
                <p style={{ fontSize: '1.15rem', color: 'var(--brand-text-secondary)' }}>
                  {role === 'caregiver' ? '연결된 복용자를 관리해요' : '연결된 보호자를 관리해요'}
                </p>
              </div>
              <ChevronRight className="w-6 h-6" style={{ color: 'var(--brand-text-muted)' }} />
            </div>
          </button>
        </div>

        {/* 기타 */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-7 h-7" style={{ color: 'var(--brand-primary)' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-text)' }}>
              기타
            </h2>
          </div>

          <div
            className="rounded-2xl"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '16px',
            }}
          >
            <button 
              onClick={onOpenAbout}
              className="w-full flex items-center justify-between py-4 transition-all active:opacity-70"
            >
              <p style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--brand-text)' }}>
                앱 소개
              </p>
              <ChevronRight className="w-6 h-6" style={{ color: 'var(--brand-text-muted)' }} />
            </button>

            <Separator style={{ margin: '12px 0' }} />

            <button className="w-full flex items-center justify-between py-4 transition-all active:opacity-70">
              <p style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--brand-text)' }}>
                개인정보 처리방침
              </p>
              <ChevronRight className="w-6 h-6" style={{ color: 'var(--brand-text-muted)' }} />
            </button>

            <Separator style={{ margin: '12px 0' }} />

            <button className="w-full flex items-center justify-between py-4 transition-all active:opacity-70">
              <p style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--brand-text)' }}>
                서비스 이용약관
              </p>
              <ChevronRight className="w-6 h-6" style={{ color: 'var(--brand-text-muted)' }} />
            </button>

            <Separator style={{ margin: '12px 0' }} />

            <button className="w-full flex items-center justify-between py-4 transition-all active:opacity-70">
              <p style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--brand-text-muted)' }}>
                앱 버전
              </p>
              <p style={{ fontSize: '1.2rem', color: 'var(--brand-text-secondary)' }}>
                v0.1.0 (Lite)
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />
    </div>
  );
}
