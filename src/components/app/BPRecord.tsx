import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../ui/sheet";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { NumericKeypad } from "./NumericKeypad";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { saveHealthRecord } from "../../services/health.service";
import { validateBP, getBPStatus, BP_STATUS_CONFIG, HealthTag } from "../../types/health";
import { getCurrentUserId } from "../../services/auth.helpers";

// 태그 매핑 (기존 BPTag → HealthTag)
const TAG_MAP: Record<string, HealthTag> = {
  WAKE: 'MORNING',
  LUNCH: 'NOON',
  DINNER: 'EVENING',
  BEDTIME: 'BEDTIME',
  OTHER: 'OTHER',
};

interface BPRecordProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string; // 복용자 ID
  onComplete?: () => void; // 저장 완료 후 콜백 (홈 갱신용)
}

export function BPRecord({ open, onOpenChange, userId, onComplete }: BPRecordProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  
  // userId가 없으면 인증된 사용자 ID 가져오기
  useEffect(() => {
    if (!userId) {
      const fetchUserId = async () => {
        try {
          const { supabase } = await import('../../services/supabase.client');
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            setCurrentUserId(user.id);
          } else {
            console.error('[BPRecord] No authenticated user');
            toast.error('로그인이 필요합니다.');
            onOpenChange(false);
          }
        } catch (error) {
          console.error('[BPRecord] Failed to get user:', error);
          toast.error('사용자 정보를 가져올 수 없습니다.');
          onOpenChange(false);
        }
      };
      fetchUserId();
    } else {
      setCurrentUserId(userId);
    }
  }, [userId, onOpenChange]);
  const [tag, setTag] = useState<BPTag>('WAKE');
  const [measuredAt, setMeasuredAt] = useState(new Date());
  const [activeField, setActiveField] = useState<'systolic' | 'diastolic' | 'pulse'>('systolic');
  const [errors, setErrors] = useState<{ systolic?: string; diastolic?: string; pulse?: string }>({});

  // 초기화
  useEffect(() => {
    if (open) {
      setSystolic('');
      setDiastolic('');
      setPulse('');
      setTag(getDefaultTag());
      setMeasuredAt(new Date());
      setActiveField('systolic');
      setErrors({});
    }
  }, [open]);

  // 시간대별 기본 태그 제안
  const getDefaultTag = (): BPTag => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'WAKE';
    if (hour >= 11 && hour < 14) return 'LUNCH';
    if (hour >= 17 && hour < 21) return 'DINNER';
    if (hour >= 21 || hour < 5) return 'BEDTIME';
    return 'OTHER';
  };

  const handleKeyPress = (key: string) => {
    const currentValue = activeField === 'systolic' ? systolic : activeField === 'diastolic' ? diastolic : pulse;
    
    // 최대 3자리
    if (currentValue.length >= 3) return;

    const newValue = currentValue + key;
    
    if (activeField === 'systolic') {
      setSystolic(newValue);
      setErrors({ ...errors, systolic: undefined });
    } else if (activeField === 'diastolic') {
      setDiastolic(newValue);
      setErrors({ ...errors, diastolic: undefined });
    } else {
      setPulse(newValue);
      setErrors({ ...errors, pulse: undefined });
    }
  };

  const handleDelete = () => {
    if (activeField === 'systolic') {
      setSystolic(systolic.slice(0, -1));
    } else if (activeField === 'diastolic') {
      setDiastolic(diastolic.slice(0, -1));
    } else {
      setPulse(pulse.slice(0, -1));
    }
  };

  const handleSave = async () => {
    const sysValue = systolic ? parseInt(systolic) : undefined;
    const diaValue = diastolic ? parseInt(diastolic) : undefined;
    const pulseValue = pulse ? parseInt(pulse) : undefined;

    // 검증
    const validation = validateBP(sysValue, diaValue, pulseValue);
    
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      // 에러 표시를 위한 간단한 매핑
      const newErrors: { systolic?: string; diastolic?: string; pulse?: string } = {};
      validation.errors.forEach(err => {
        if (err.includes('수축')) newErrors.systolic = err;
        if (err.includes('이완')) newErrors.diastolic = err;
        if (err.includes('맥박')) newErrors.pulse = err;
      });
      setErrors(newErrors);
      return;
    }

    try {
      // 저장
      const healthTag = TAG_MAP[tag] || 'OTHER';
      const uid = currentUserId || await getCurrentUserId();
      if (!uid) {
        toast.error('로그인이 필요합니다.');
        onOpenChange(false);
        return;
      }
      
      await saveHealthRecord({
        userId: uid,
        type: 'BP',
        systolic: sysValue!,
        diastolic: diaValue!,
        pulse: pulseValue,
        tag: healthTag,
        time: measuredAt.getTime(),
      });

      // 상태 표시
      const status = getBPStatus(sysValue!, diaValue!);
      const statusInfo = BP_STATUS_CONFIG[status];
      
      toast.success(`혈압이 기록되었어요 (${statusInfo.label})`, {
        description: `${sysValue}/${diaValue} mmHg`,
      });

      console.log('GA4: bp_save_success', { systolic: sysValue, diastolic: diaValue, status });

      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('BP save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    }
  };

  type BPTag = 'WAKE' | 'LUNCH' | 'DINNER' | 'BEDTIME' | 'OTHER';

  const tagLabels: Record<BPTag, string> = {
    WAKE: '아침',
    LUNCH: '점심',
    DINNER: '저녁',
    BEDTIME: '취침 전',
    OTHER: '기타',
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${period} ${displayHour}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle style={{ fontSize: '1.5rem', color: 'var(--brand-text)' }}>
            혈압 기록
          </SheetTitle>
          <SheetDescription style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
            오늘의 혈압을 기록해 주세요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* 입력 필드들 */}
          <div className="space-y-4">
            {/* 수축 혈압 */}
            <div>
              <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
                수축 혈압 (SYS)
              </Label>
              <button
                onClick={() => setActiveField('systolic')}
                className="w-full rounded-2xl transition-all text-left"
                style={{
                  minHeight: '64px',
                  padding: '16px 20px',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  backgroundColor: activeField === 'systolic' ? 'rgba(18, 184, 134, 0.05)' : 'white',
                  color: systolic ? 'var(--brand-text)' : 'var(--brand-text-muted)',
                  border: activeField === 'systolic' 
                    ? '2px solid var(--brand-primary)' 
                    : errors.systolic 
                    ? '2px solid var(--brand-danger)' 
                    : '2px solid var(--brand-border)',
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span>{systolic || '120'}</span>
                  <span style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>mmHg</span>
                </div>
              </button>
              {errors.systolic && (
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-danger)', marginTop: '4px' }}>
                  {errors.systolic}
                </p>
              )}
            </div>

            {/* 이완 혈압 */}
            <div>
              <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
                이완 혈압 (DIA)
              </Label>
              <button
                onClick={() => setActiveField('diastolic')}
                className="w-full rounded-2xl transition-all text-left"
                style={{
                  minHeight: '64px',
                  padding: '16px 20px',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  backgroundColor: activeField === 'diastolic' ? 'rgba(18, 184, 134, 0.05)' : 'white',
                  color: diastolic ? 'var(--brand-text)' : 'var(--brand-text-muted)',
                  border: activeField === 'diastolic' 
                    ? '2px solid var(--brand-primary)' 
                    : errors.diastolic 
                    ? '2px solid var(--brand-danger)' 
                    : '2px solid var(--brand-border)',
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span>{diastolic || '80'}</span>
                  <span style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>mmHg</span>
                </div>
              </button>
              {errors.diastolic && (
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-danger)', marginTop: '4px' }}>
                  {errors.diastolic}
                </p>
              )}
            </div>

            {/* 맥박 (선택) */}
            <div>
              <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
                맥박 (선택)
              </Label>
              <button
                onClick={() => setActiveField('pulse')}
                className="w-full rounded-2xl transition-all text-left"
                style={{
                  minHeight: '64px',
                  padding: '16px 20px',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  backgroundColor: activeField === 'pulse' ? 'rgba(18, 184, 134, 0.05)' : 'white',
                  color: pulse ? 'var(--brand-text)' : 'var(--brand-text-muted)',
                  border: activeField === 'pulse' 
                    ? '2px solid var(--brand-primary)' 
                    : errors.pulse 
                    ? '2px solid var(--brand-danger)' 
                    : '2px solid var(--brand-border)',
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span>{pulse || '72'}</span>
                  <span style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>bpm</span>
                </div>
              </button>
              {errors.pulse && (
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-danger)', marginTop: '4px' }}>
                  {errors.pulse}
                </p>
              )}
            </div>
          </div>

          {/* 태그 선택 */}
          <div>
            <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
              측정 시간대
            </Label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(tagLabels) as BPTag[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className="rounded-xl transition-all"
                  style={{
                    minHeight: '44px',
                    padding: '8px 16px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    backgroundColor: tag === t ? 'var(--brand-primary)' : 'white',
                    color: tag === t ? 'white' : 'var(--brand-text)',
                    border: tag === t ? '2px solid var(--brand-primary)' : '2px solid var(--brand-border)',
                  }}
                >
                  {tagLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {/* 시간 */}
          <div>
            <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
              측정 시간
            </Label>
            <div
              className="flex items-center gap-2 rounded-xl"
              style={{
                minHeight: '56px',
                padding: '12px 16px',
                backgroundColor: 'var(--brand-bg)',
                border: '1px solid var(--brand-border)',
              }}
            >
              <Clock className="w-5 h-5" style={{ color: 'var(--brand-text-secondary)' }} />
              <span style={{ fontSize: '1.125rem', color: 'var(--brand-text)' }}>
                {formatTime(measuredAt)} (지금)
              </span>
            </div>
          </div>

          {/* 숫자 패드 */}
          <div className="pt-4">
            <NumericKeypad onKey={handleKeyPress} onDelete={handleDelete} />
          </div>
        </div>

        <SheetFooter className="gap-2 flex-row sticky bottom-0 bg-white pt-4 pb-6">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            style={{ minHeight: '56px', fontSize: '1.125rem' }}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            style={{
              minHeight: '56px',
              fontSize: '1.125rem',
              backgroundColor: 'var(--brand-primary)',
              color: 'white',
            }}
          >
            저장
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
