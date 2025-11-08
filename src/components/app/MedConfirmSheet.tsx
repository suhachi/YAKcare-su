import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { TimeChip15, generate15MinuteTimes } from './TimeChip15';
import { toast } from 'sonner';
import { Pill, Clock, Calendar, Tag } from 'lucide-react';
import {
  MedicationDraft,
  MedCategory,
  ChronicType,
  SlotType,
  SourceType,
  CATEGORY_LABELS,
  CHRONIC_TYPE_LABELS,
  SLOT_LABELS,
  validateMedicationDraft,
  VALIDATION,
} from '../../types/meds';
import { IntakeContext } from '../../types/dose';
import { defaultTimesForSlots, getChronicDefaultTimes } from '../../services/time';
import { saveMedication } from '../../services/medications.service';

interface MedConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveComplete?: () => void;
  userId: string;
  targetDisplayName?: string; // "홍길동(아버님)" - 보호자 모드
  initialDraft?: Partial<MedicationDraft>;
  source: SourceType;
  scanConfidence?: 'full' | 'partial' | 'none'; // Step 4.5: 스캔 신뢰도
}

export function MedConfirmSheet({
  open,
  onOpenChange,
  onSaveComplete,
  userId,
  targetDisplayName,
  initialDraft,
  source,
  scanConfidence,
}: MedConfirmSheetProps) {
  // 약 정보 상태
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MedCategory>('PRESCRIPTION');
  const [chronicType, setChronicType] = useState<ChronicType | undefined>(undefined);
  const [durationDays, setDurationDays] = useState<number | undefined>(7);
  const [isContinuous, setIsContinuous] = useState(false);
  const [slots, setSlots] = useState<SlotType[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [intakeContext, setIntakeContext] = useState<IntakeContext>('PLAIN'); // Step 4+: 복용 맥락
  const [saving, setSaving] = useState(false);

  // 시간 선택 그리드 표시 여부
  const [showTimeGrid, setShowTimeGrid] = useState(false);

  // 초기화
  useEffect(() => {
    if (open) {
      console.log('GA4: med_add_open', { source });
      
      // 초기 데이터 설정
      if (initialDraft) {
        setName(initialDraft.name || '');
        setCategory(initialDraft.category || 'PRESCRIPTION');
        setChronicType(initialDraft.chronicType);
        setDurationDays(initialDraft.durationDays);
        setIsContinuous(initialDraft.isContinuous || false);
        setSlots(initialDraft.slots || []);
        setTimes(initialDraft.times || []);
        
        // Step 4.5: 스캔 결과의 IntakeContext 선채움
        // @ts-ignore - suggestedIntakeContext는 mapper에서 임시로 추가한 필드
        if (initialDraft.suggestedIntakeContext) {
          // @ts-ignore
          setIntakeContext(initialDraft.suggestedIntakeContext);
        } else {
          setIntakeContext('PLAIN');
        }
      } else {
        // 기본값
        setName('');
        setCategory('PRESCRIPTION');
        setChronicType(undefined);
        setDurationDays(7);
        setIsContinuous(false);
        setSlots([]);
        setTimes([]);
        setIntakeContext('PLAIN');
      }
    }
  }, [open, initialDraft, source]);

  // 만성질환 타입 선택 시 권장 시간 자동 제안
  useEffect(() => {
    if (category === 'CHRONIC' && chronicType) {
      const recommendedTimes = getChronicDefaultTimes(chronicType);
      if (recommendedTimes.length > 0) {
        // 기존 시간이 없거나 사용자가 아직 시간을 선택하지 않았을 때만 자동 제안
        if (times.length === 0) {
          setTimes(recommendedTimes);
          console.log(`[MedConfirm] Auto-suggested times for ${chronicType}:`, recommendedTimes);
        }
      }
    }
  }, [category, chronicType]);

  // 슬롯 선택 시 기본 시간 자동 추가
  const handleSlotToggle = (slot: SlotType) => {
    const newSlots = slots.includes(slot) ? slots.filter((s) => s !== slot) : [...slots, slot];
    setSlots(newSlots);

    // 슬롯에 해당하는 기본 시간 자동 추가 (중복 방지)
    if (!slots.includes(slot)) {
      const defaultTimes = defaultTimesForSlots([slot]);
      const newTimes = Array.from(new Set([...times, ...defaultTimes])).sort();
      if (newTimes.length <= VALIDATION.MAX_TIMES) {
        setTimes(newTimes);
      }
    }
  };

  // 시간 선택/해제
  const handleTimeToggle = (time: string) => {
    if (times.includes(time)) {
      setTimes(times.filter((t) => t !== time));
    } else {
      if (times.length >= VALIDATION.MAX_TIMES) {
        toast.error(`최대 ${VALIDATION.MAX_TIMES}개까지 선택할 수 있어요`);
        return;
      }
      setTimes([...times, time].sort());
    }
  };

  // 기간 선택
  const handleDurationSelect = (days: number | 'continuous') => {
    if (days === 'continuous') {
      setIsContinuous(true);
      setDurationDays(undefined);
    } else {
      setIsContinuous(false);
      setDurationDays(days);
    }
  };

  // 저장
  const handleSave = async () => {
    const draft: MedicationDraft = {
      userId,
      name: name.trim(),
      category,
      chronicType: category === 'CHRONIC' ? chronicType : undefined,
      durationDays,
      isContinuous,
      slots,
      times,
      intakeContext, // Step 4.5+: 복용 맥락 저장
      source,
    };

    // 검증
    const validation = validateMedicationDraft(draft);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    setSaving(true);
    console.log('GA4: med_save_tap', { source, category, intakeContext });

    try {
      await saveMedication(draft);
      toast.success('약이 등록되었습니다');
      console.log('GA4: med_save_success', {
        category,
        source,
        intakeContext,
        timesCount: times.length,
        confidence: scanConfidence,
      });
      onOpenChange(false);
      onSaveComplete?.();
    } catch (error) {
      console.error('Save medication error:', error);
      toast.error('저장 중 오류가 발생했습니다');
      console.log('GA4: med_save_error', { error: String(error) });
    } finally {
      setSaving(false);
    }
  };

  const allTimes = generate15MinuteTimes(0, 24);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge
              variant={source === 'manual' ? 'secondary' : 'default'}
              style={{
                fontSize: '0.75rem',
                backgroundColor: source === 'qr' ? 'var(--brand-primary)' : source === 'ocr' ? 'var(--brand-accent)' : 'var(--brand-text-muted)',
                color: 'white',
              }}
            >
              {source === 'qr' ? 'QR 스캔' : source === 'ocr' ? 'OCR 스캔' : '수기 입력'}
            </Badge>
            
            {/* Step 4.5.A: 스캔 결과 배지 */}
            {scanConfidence && scanConfidence !== 'none' && (
              <Badge
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: scanConfidence === 'full' 
                    ? 'rgba(18, 184, 134, 0.1)' 
                    : 'rgba(240, 140, 0, 0.1)',
                  color: scanConfidence === 'full' 
                    ? 'var(--brand-success)' 
                    : 'var(--brand-warn)',
                  border: `1px solid ${scanConfidence === 'full' ? 'var(--brand-success)' : 'var(--brand-warn)'}`,
                }}
              >
                {scanConfidence === 'full' ? '스캔 결과 적용됨' : '일부만 인식됨—확인 필요'}
              </Badge>
            )}
            
            {targetDisplayName && (
              <span style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)' }}>
                대상: {targetDisplayName}
              </span>
            )}
          </div>
          <SheetTitle style={{ fontSize: '1.5rem', color: 'var(--brand-text)' }}>
            약 등록 확인
          </SheetTitle>
          <SheetDescription style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
            약 정보를 확인하고 복용 시간을 설정해 주세요
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* 약 이름 */}
          <div className="space-y-2">
            <Label htmlFor="med-name" className="flex items-center gap-2" style={{ fontSize: '1rem' }}>
              <Pill className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              약 이름 *
            </Label>
            <Input
              id="med-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                category === 'CHRONIC' && chronicType === 'OTHER' 
                  ? '예: 오메가3, 비타민D' 
                  : category === 'SUPPLEMENT'
                  ? '예: 종합비타민, 유산균'
                  : '예: 아토르바스타틴 10mg'
              }
              style={{ fontSize: '1rem', minHeight: '56px' }}
              maxLength={VALIDATION.NAME_MAX_LENGTH}
            />
            <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
              {name.length}/{VALIDATION.NAME_MAX_LENGTH}자
            </p>
          </div>

          <Separator />

          {/* 약 유형 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2" style={{ fontSize: '1rem' }}>
              <Tag className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              약 유형
            </Label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(CATEGORY_LABELS) as MedCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    // 만성질환약이나 영양제는 자동으로 '계속' 선택
                    if (cat === 'CHRONIC' || cat === 'SUPPLEMENT') {
                      setIsContinuous(true);
                      setDurationDays(undefined);
                    } else {
                      // 처방약은 7일 기본값
                      setIsContinuous(false);
                      setDurationDays(7);
                    }
                  }}
                  className="rounded-xl transition-all"
                  style={{
                    minHeight: '44px',
                    padding: '12px 20px',
                    fontSize: '1rem',
                    backgroundColor: category === cat ? 'var(--brand-primary)' : 'white',
                    color: category === cat ? 'white' : 'var(--brand-text)',
                    border: `2px solid ${category === cat ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* 만성질환 타입 (만성질환약 선택 시) */}
          {category === 'CHRONIC' && (
            <div className="space-y-3">
              <Label style={{ fontSize: '1rem' }}>만성질환 종류</Label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(CHRONIC_TYPE_LABELS) as ChronicType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setChronicType(type);
                      // 권장 시간 안내
                      const recommendedTimes = getChronicDefaultTimes(type);
                      if (recommendedTimes.length > 0 && times.length === 0) {
                        toast.info(`권장 복용 시간: ${recommendedTimes.map(t => {
                          const [h, m] = t.split(':');
                          const hour = parseInt(h);
                          return `${hour < 12 ? '오전' : '오후'} ${hour > 12 ? hour - 12 : hour}:${m}`;
                        }).join(', ')}`);
                      }
                    }}
                    className="rounded-xl transition-all"
                    style={{
                      minHeight: '44px',
                      padding: '12px 20px',
                      fontSize: '1rem',
                      backgroundColor: chronicType === type ? 'var(--brand-accent)' : 'white',
                      color: chronicType === type ? 'white' : 'var(--brand-text)',
                      border: `2px solid ${chronicType === type ? 'var(--brand-accent)' : 'var(--brand-border)'}`,
                    }}
                  >
                    {CHRONIC_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              {chronicType && chronicType !== 'OTHER' && (
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)', lineHeight: 1.5 }}>
                  💡 {CHRONIC_TYPE_LABELS[chronicType]}은(는) {
                    chronicType === 'HYPERTENSION' ? '아침/저녁 식후' :
                    chronicType === 'DIABETES' ? '아침 식전/저녁 식후' :
                    '취침 전'
                  } 복용을 권장합니다
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* 복용 기간 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2" style={{ fontSize: '1rem' }}>
              <Calendar className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              복용 기간
            </Label>
            <div className="flex gap-2 flex-wrap">
              {VALIDATION.DURATION_PRESETS.map((days) => (
                <button
                  key={days}
                  onClick={() => handleDurationSelect(days)}
                  className="rounded-xl transition-all"
                  style={{
                    minHeight: '44px',
                    padding: '12px 20px',
                    fontSize: '1rem',
                    backgroundColor: !isContinuous && durationDays === days ? 'var(--brand-primary)' : 'white',
                    color: !isContinuous && durationDays === days ? 'white' : 'var(--brand-text)',
                    border: `2px solid ${!isContinuous && durationDays === days ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                  }}
                >
                  {days}일
                </button>
              ))}
              <button
                onClick={() => handleDurationSelect('continuous')}
                className="rounded-xl transition-all"
                style={{
                  minHeight: '44px',
                  padding: '12px 20px',
                  fontSize: '1rem',
                  backgroundColor: isContinuous ? 'var(--brand-primary)' : 'white',
                  color: isContinuous ? 'white' : 'var(--brand-text)',
                  border: `2px solid ${isContinuous ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                }}
              >
                계속
              </button>
            </div>
            {isContinuous && (
              <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)' }}>
                30일씩 자동으로 갱신됩니다
              </p>
            )}
          </div>

          <Separator />

          {/* 복용 슬롯 (선택 사항) */}
          <div className="space-y-3">
            <Label style={{ fontSize: '1rem' }}>복용 시점 (선택)</Label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(SLOT_LABELS) as SlotType[]).map((slot) => (
                <button
                  key={slot}
                  onClick={() => handleSlotToggle(slot)}
                  className="rounded-xl transition-all"
                  style={{
                    minHeight: '44px',
                    padding: '12px 20px',
                    fontSize: '1rem',
                    backgroundColor: slots.includes(slot) ? 'var(--brand-accent)' : 'white',
                    color: slots.includes(slot) ? 'white' : 'var(--brand-text)',
                    border: `2px solid ${slots.includes(slot) ? 'var(--brand-accent)' : 'var(--brand-border)'}`,
                  }}
                >
                  {SLOT_LABELS[slot]}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* 복용 맥락 (Step 4+: IntakeContext) */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2" style={{ fontSize: '1rem' }}>
              <Tag className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              복용 시점
            </Label>
            <RadioGroup
              value={intakeContext}
              onValueChange={(value) => setIntakeContext(value as IntakeContext)}
            >
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="flex items-center space-x-2 rounded-xl border-2 p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: intakeContext === 'PLAIN' ? 'var(--brand-primary)' : 'var(--brand-border)',
                    backgroundColor: intakeContext === 'PLAIN' ? 'rgba(18, 184, 134, 0.05)' : 'white',
                  }}
                  onClick={() => setIntakeContext('PLAIN')}
                >
                  <RadioGroupItem value="PLAIN" id="context-plain" />
                  <Label htmlFor="context-plain" className="cursor-pointer flex-1" style={{ fontSize: '1rem' }}>
                    일반
                  </Label>
                </div>

                <div
                  className="flex items-center space-x-2 rounded-xl border-2 p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: intakeContext === 'PREMEAL' ? 'var(--brand-primary)' : 'var(--brand-border)',
                    backgroundColor: intakeContext === 'PREMEAL' ? 'rgba(18, 184, 134, 0.05)' : 'white',
                  }}
                  onClick={() => setIntakeContext('PREMEAL')}
                >
                  <RadioGroupItem value="PREMEAL" id="context-premeal" />
                  <Label htmlFor="context-premeal" className="cursor-pointer flex-1" style={{ fontSize: '1rem' }}>
                    식전
                  </Label>
                </div>

                <div
                  className="flex items-center space-x-2 rounded-xl border-2 p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: intakeContext === 'POSTMEAL' ? 'var(--brand-primary)' : 'var(--brand-border)',
                    backgroundColor: intakeContext === 'POSTMEAL' ? 'rgba(18, 184, 134, 0.05)' : 'white',
                  }}
                  onClick={() => setIntakeContext('POSTMEAL')}
                >
                  <RadioGroupItem value="POSTMEAL" id="context-postmeal" />
                  <Label htmlFor="context-postmeal" className="cursor-pointer flex-1" style={{ fontSize: '1rem' }}>
                    식후
                  </Label>
                </div>

                <div
                  className="flex items-center space-x-2 rounded-xl border-2 p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: intakeContext === 'BEDTIME' ? 'var(--brand-primary)' : 'var(--brand-border)',
                    backgroundColor: intakeContext === 'BEDTIME' ? 'rgba(18, 184, 134, 0.05)' : 'white',
                  }}
                  onClick={() => setIntakeContext('BEDTIME')}
                >
                  <RadioGroupItem value="BEDTIME" id="context-bedtime" />
                  <Label htmlFor="context-bedtime" className="cursor-pointer flex-1" style={{ fontSize: '1rem' }}>
                    취침 전
                  </Label>
                </div>
              </div>
            </RadioGroup>
            <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
              {intakeContext === 'PREMEAL' && '식사 30분 전에 복용하세요'}
              {intakeContext === 'POSTMEAL' && '식사 직후 또는 30분 이내에 복용하세요'}
              {intakeContext === 'BEDTIME' && '취침 직전에 복용하세요'}
              {intakeContext === 'PLAIN' && '시간에 맞춰 복용하세요'}
            </p>
          </div>

          <Separator />

          {/* 알림 시간 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2" style={{ fontSize: '1rem' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                알림 시간 * ({times.length}/{VALIDATION.MAX_TIMES})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTimeGrid(!showTimeGrid)}
                style={{ fontSize: '0.875rem' }}
              >
                {showTimeGrid ? '접기' : '시간 추가'}
              </Button>
            </div>

            {/* 선택된 시간 */}
            {times.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {times.map((time) => (
                  <TimeChip15
                    key={time}
                    time={time}
                    selected={true}
                    onSelect={handleTimeToggle}
                  />
                ))}
              </div>
            )}

            {times.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--brand-warning)' }}>
                최소 1개 이상의 시간을 선택해주세요
              </p>
            )}

            {/* 시간 선택 그리드 */}
            {showTimeGrid && (
              <div
                className="rounded-xl p-4 max-h-60 overflow-y-auto"
                style={{ backgroundColor: 'var(--brand-bg)', border: '1px solid var(--brand-border)' }}
              >
                <div className="grid grid-cols-4 gap-2">
                  {allTimes.map((time) => (
                    <TimeChip15
                      key={time}
                      time={time}
                      selected={times.includes(time)}
                      disabled={!times.includes(time) && times.length >= VALIDATION.MAX_TIMES}
                      onSelect={handleTimeToggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            style={{ minHeight: '56px', flex: 1 }}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || times.length === 0}
            style={{
              minHeight: '56px',
              flex: 2,
              backgroundColor: 'var(--brand-primary)',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
