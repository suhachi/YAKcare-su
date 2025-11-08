import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../ui/sheet";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { NumericKeypad } from "./NumericKeypad";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { saveHealthRecord } from "../../services/health.service";
import { validateBG, getBGStatus, BG_STATUS_CONFIG, HealthTag, BGMeasurementType } from "../../types/health";
import { getCurrentUserId } from "../../services/auth.helpers";

type BGType = 'FASTING' | 'POST_2H';
type MealTag = 'MORNING' | 'NOON' | 'EVENING' | 'OTHER';

interface BGRecordProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string; // 복용자 ID
  onComplete?: () => void; // 저장 완료 후 콜백
}

export function BGRecord({ open, onOpenChange, userId, onComplete }: BGRecordProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const [value, setValue] = useState('');
  const [bgType, setBgType] = useState<BGType>('FASTING');
  const [meal, setMeal] = useState<MealTag>('BREAKFAST');
  const [measuredAt, setMeasuredAt] = useState(new Date());
  const [error, setError] = useState<string>();
  
  // userId가 없으면 인증된 사용자 ID 가져오기
  useEffect(() => {
    if (!userId) {
      getCurrentUserId()
        .then((uid) => {
          if (uid) {
            setCurrentUserId(uid);
          } else {
            toast.error('로그인이 필요합니다.');
            onOpenChange(false);
          }
        })
        .catch((err) => {
          console.error('[BGRecord] Failed to get user:', err);
          toast.error('사용자 정보를 가져올 수 없습니다.');
          onOpenChange(false);
        });
    } else {
      setCurrentUserId(userId);
    }
  }, [userId, onOpenChange]);

  // 초기화 및 자동 제안
  useEffect(() => {
    if (open) {
      setValue('');
      setError(undefined);
      setMeasuredAt(new Date());
      
      // 시간대별 자동 제안
      const { type, mealTag } = getDefaultTags();
      setBgType(type);
      setMeal(mealTag);
    }
  }, [open]);

  // 시간대별 기본 태그 제안
  const getDefaultTags = (): { type: BGType; mealTag: MealTag } => {
    const hour = new Date().getHours();
    
    // 05:00~09:00 아침 공복
    if (hour >= 5 && hour < 9) {
      return { type: 'FASTING', mealTag: 'MORNING' };
    }
    // 09:00~11:00 아침 식후
    if (hour >= 9 && hour < 11) {
      return { type: 'POST_2H', mealTag: 'MORNING' };
    }
    // 11:00~14:00 점심 공복
    if (hour >= 11 && hour < 14) {
      return { type: 'FASTING', mealTag: 'NOON' };
    }
    // 14:00~17:00 점심 식후
    if (hour >= 14 && hour < 17) {
      return { type: 'POST_2H', mealTag: 'NOON' };
    }
    // 17:00~20:00 저녁 공복
    if (hour >= 17 && hour < 20) {
      return { type: 'FASTING', mealTag: 'EVENING' };
    }
    // 20:00~23:00 저녁 식후
    if (hour >= 20 && hour < 23) {
      return { type: 'POST_2H', mealTag: 'EVENING' };
    }
    
    return { type: 'FASTING', mealTag: 'MORNING' };
  };

  const handleKeyPress = (key: string) => {
    // 최대 3자리
    if (value.length >= 3) return;

    const newValue = value + key;
    setValue(newValue);
    setError(undefined);
  };

  const handleDelete = () => {
    setValue(value.slice(0, -1));
  };

  const handleSave = async () => {
    const glucoseValue = value ? parseInt(value) : undefined;

    // 검증
    const validation = validateBG(glucoseValue);
    
    if (!validation.valid) {
      setError(validation.errors[0]);
      toast.error(validation.errors[0]);
      return;
    }

    try {
      // 저장
      const uid = currentUserId || await getCurrentUserId();
      if (!uid) {
        toast.error('로그인이 필요합니다.');
        onOpenChange(false);
        return;
      }
      
      await saveHealthRecord({
        userId: uid,
        type: 'BG',
        glucose: glucoseValue!,
        measurementType: bgType as BGMeasurementType,
        tag: meal as HealthTag,
        time: measuredAt.getTime(),
      });

      // 상태 표시
      const status = getBGStatus(glucoseValue!, bgType === 'FASTING');
      const statusInfo = BG_STATUS_CONFIG[status];
      
      toast.success(`혈당이 기록되었어요 (${statusInfo.label})`, {
        description: `${glucoseValue} mg/dL (${typeLabels[bgType]})`,
      });

      console.log('GA4: bg_save_success', { glucose: glucoseValue, type: bgType, status });

      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('BG save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    }
  };

  const typeLabels: Record<BGType, string> = {
    FASTING: '공복',
    POST_2H: '식후 2시간',
  };

  const mealLabels: Record<MealTag, string> = {
    MORNING: '아침',
    NOON: '점심',
    EVENING: '저녁',
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
            혈당 기록
          </SheetTitle>
          <SheetDescription style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
            오늘의 혈당을 기록해 주세요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* 혈당 값 입력 */}
          <div>
            <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
              혈당
            </Label>
            <div
              className="w-full rounded-2xl"
              style={{
                minHeight: '80px',
                padding: '20px',
                fontSize: '2rem',
                fontWeight: 700,
                backgroundColor: 'rgba(18, 184, 134, 0.05)',
                color: value ? 'var(--brand-text)' : 'var(--brand-text-muted)',
                border: error ? '2px solid var(--brand-danger)' : '2px solid var(--brand-primary)',
                textAlign: 'center',
              }}
            >
              <div className="flex items-baseline justify-center gap-2">
                <span>{value || '100'}</span>
                <span style={{ fontSize: '1.25rem', color: 'var(--brand-text-secondary)' }}>mg/dL</span>
              </div>
            </div>
            {error && (
              <p style={{ fontSize: '0.875rem', color: 'var(--brand-danger)', marginTop: '4px' }}>
                {error}
              </p>
            )}
          </div>

          {/* 측정 구분 */}
          <div>
            <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
              측정 구분
            </Label>
            <div className="flex gap-2">
              {(Object.keys(typeLabels) as BGType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setBgType(type)}
                  className="flex-1 rounded-xl transition-all"
                  style={{
                    minHeight: '56px',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    backgroundColor: bgType === type ? 'var(--brand-primary)' : 'white',
                    color: bgType === type ? 'white' : 'var(--brand-text)',
                    border: bgType === type ? '2px solid var(--brand-primary)' : '2px solid var(--brand-border)',
                  }}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* 식사 */}
          <div>
            <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
              식사
            </Label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(mealLabels) as MealTag[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMeal(m)}
                  className="rounded-xl transition-all"
                  style={{
                    minHeight: '44px',
                    padding: '8px 16px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    backgroundColor: meal === m ? 'var(--brand-primary)' : 'white',
                    color: meal === m ? 'white' : 'var(--brand-text)',
                    border: meal === m ? '2px solid var(--brand-primary)' : '2px solid var(--brand-border)',
                  }}
                >
                  {mealLabels[m]}
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
