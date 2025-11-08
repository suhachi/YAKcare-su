import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "../ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { TimeChip15, getDefaultTimesBySlot } from "./TimeChip15";
import { X, QrCode, FileText, Edit3, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type MedicationCategory = 'PRESCRIPTION' | 'SUPPLEMENT' | 'CHRONIC';
type ChronicType = 'HYPERTENSION' | 'DIABETES' | 'HYPERLIPIDEMIA' | 'OTHER';
type SourceType = 'qr' | 'ocr' | 'manual';
type SlotType = '아침' | '점심' | '저녁' | '취침 전';

interface ConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: SourceType;
  sourceUrl?: string;
  initialData?: {
    name?: string;
    category?: MedicationCategory;
    chronicType?: ChronicType;
    dosage?: string;
    frequency?: number;
    slots?: SlotType[];
    times?: string[];
    duration?: number;
    isContinuous?: boolean;
  };
  onSave?: (data: any) => void;
}

const DURATION_PRESETS = [
  { label: '3일', value: 3 },
  { label: '5일', value: 5 },
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '계속', value: -1 },
];

export function ConfirmSheet({
  open,
  onOpenChange,
  source = 'manual',
  sourceUrl,
  initialData,
  onSave,
}: ConfirmSheetProps) {
  const [medName, setMedName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<MedicationCategory>(initialData?.category || 'PRESCRIPTION');
  const [chronicType, setChronicType] = useState<ChronicType | undefined>(initialData?.chronicType);
  const [dosage, setDosage] = useState(initialData?.dosage || '1회 1정');
  const [frequency, setFrequency] = useState(initialData?.frequency || 1);
  const [selectedSlots, setSelectedSlots] = useState<SlotType[]>(initialData?.slots || []);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(initialData?.times || []);
  const [duration, setDuration] = useState(initialData?.duration || 7);
  const [isContinuous, setIsContinuous] = useState(initialData?.isContinuous || false);
  const [customDuration, setCustomDuration] = useState('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);

  const getSourceBadge = () => {
    switch (source) {
      case 'qr':
        return (
          <Badge className="gap-1" style={{ backgroundColor: 'var(--brand-accent)', color: 'white' }}>
            <QrCode className="w-3 h-3" />
            스캔 (QR)
          </Badge>
        );
      case 'ocr':
        return (
          <Badge className="gap-1" style={{ backgroundColor: 'var(--brand-warn)', color: 'white' }}>
            <FileText className="w-3 h-3" />
            스캔 (OCR Beta)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Edit3 className="w-3 h-3" />
            수기 입력
          </Badge>
        );
    }
  };

  const handleSlotToggle = (slot: SlotType) => {
    let newSlots: SlotType[];
    if (selectedSlots.includes(slot)) {
      newSlots = selectedSlots.filter(s => s !== slot);
    } else {
      newSlots = [...selectedSlots, slot];
      // 슬롯 추가 시 기본 시간 제안
      const defaultTimes = getDefaultTimesBySlot(slot);
      const newTimes = [...new Set([...selectedTimes, ...defaultTimes])].sort();
      setSelectedTimes(newTimes);
    }
    setSelectedSlots(newSlots);
  };

  const handleTimeToggle = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      if (selectedTimes.length >= 6) {
        toast.error('알림 시간은 최대 6개까지 설정할 수 있어요');
        return;
      }
      setSelectedTimes([...selectedTimes, time].sort());
    }
  };

  const handleDurationSelect = (value: number) => {
    if (value === -1) {
      setIsContinuous(true);
      setDuration(30);
      setShowCustomDuration(false);
    } else {
      setIsContinuous(false);
      setDuration(value);
      setShowCustomDuration(false);
    }
  };

  const handleSave = () => {
    // 유효성 검사
    if (!medName.trim()) {
      toast.error('약 이름을 입력해 주세요');
      return;
    }
    if (selectedTimes.length === 0) {
      toast.error('알림 시간은 최소 1개 필요해요');
      return;
    }

    const finalDuration = showCustomDuration ? parseInt(customDuration) : duration;

    const data = {
      name: medName,
      category,
      chronicType: category === 'CHRONIC' ? chronicType : undefined,
      dosage,
      frequency,
      slots: selectedSlots,
      times: selectedTimes,
      duration: finalDuration,
      isContinuous,
      source,
      sourceUrl,
    };

    onSave?.(data);
    toast.success('약이 등록되었습니다');
    onOpenChange(false);
  };

  const commonTimes = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '12:00', '12:30', '18:00', '18:30', '19:00', '22:00', '22:30'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle style={{ fontSize: '1.5rem', color: 'var(--brand-text)' }}>
              정보 확인
            </SheetTitle>
            {getSourceBadge()}
          </div>
          <SheetDescription style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
            저장 전에 꼭 한 번 확인해 주세요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* 약 정보 */}
          <div className="space-y-4">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--brand-text)' }}>
              약 정보
            </h3>

            {/* 약 이름 */}
            <div>
              <Label htmlFor="med-name" style={{ fontSize: '1rem' }}>약 이름</Label>
              <Input
                id="med-name"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="예: 아스피린정 100mg"
                className="mt-2"
                style={{ minHeight: '56px', fontSize: '1.125rem' }}
              />
            </div>

            {/* 유형 */}
            <div>
              <Label style={{ fontSize: '1rem' }}>유형</Label>
              <ToggleGroup
                type="single"
                value={category}
                onValueChange={(v) => v && setCategory(v as MedicationCategory)}
                className="justify-start mt-2 gap-2"
              >
                <ToggleGroupItem value="PRESCRIPTION" style={{ minHeight: '44px', fontSize: '1rem' }}>
                  처방약
                </ToggleGroupItem>
                <ToggleGroupItem value="SUPPLEMENT" style={{ minHeight: '44px', fontSize: '1rem' }}>
                  영양제
                </ToggleGroupItem>
                <ToggleGroupItem value="CHRONIC" style={{ minHeight: '44px', fontSize: '1rem' }}>
                  만성
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* 만성 타입 */}
            {category === 'CHRONIC' && (
              <div>
                <Label style={{ fontSize: '1rem' }}>만성 질환</Label>
                <ToggleGroup
                  type="single"
                  value={chronicType}
                  onValueChange={(v) => v && setChronicType(v as ChronicType)}
                  className="justify-start mt-2 gap-2 flex-wrap"
                >
                  <ToggleGroupItem value="HYPERTENSION" style={{ minHeight: '44px', fontSize: '1rem' }}>
                    고혈압
                  </ToggleGroupItem>
                  <ToggleGroupItem value="DIABETES" style={{ minHeight: '44px', fontSize: '1rem' }}>
                    당뇨
                  </ToggleGroupItem>
                  <ToggleGroupItem value="HYPERLIPIDEMIA" style={{ minHeight: '44px', fontSize: '1rem' }}>
                    고지혈증
                  </ToggleGroupItem>
                  <ToggleGroupItem value="OTHER" style={{ minHeight: '44px', fontSize: '1rem' }}>
                    기타
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {/* 용법 */}
            <div>
              <Label style={{ fontSize: '1rem' }}>용법</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="1회 1정"
                  style={{ minHeight: '56px', fontSize: '1.125rem' }}
                />
                <ToggleGroup
                  type="single"
                  value={frequency.toString()}
                  onValueChange={(v) => v && setFrequency(parseInt(v))}
                  className="gap-2"
                >
                  {[1, 2, 3, 4].map(f => (
                    <ToggleGroupItem key={f} value={f.toString()} style={{ minHeight: '56px', minWidth: '56px', fontSize: '1rem' }}>
                      {f}회
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            {/* 슬롯 */}
            <div>
              <Label style={{ fontSize: '1rem' }}>복용 시간대</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['아침', '점심', '저녁', '취침 전'] as SlotType[]).map(slot => (
                  <button
                    key={slot}
                    onClick={() => handleSlotToggle(slot)}
                    className="rounded-xl transition-all"
                    style={{
                      minHeight: '56px',
                      fontSize: '1.125rem',
                      fontWeight: 500,
                      backgroundColor: selectedSlots.includes(slot) ? 'var(--brand-primary)' : 'white',
                      color: selectedSlots.includes(slot) ? 'white' : 'var(--brand-text)',
                      border: selectedSlots.includes(slot) ? '2px solid var(--brand-primary)' : '2px solid var(--brand-border)',
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 기간/알림 */}
          <div className="space-y-4">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--brand-text)' }}>
              기간 & 알림
            </h3>

            {/* 기간 */}
            <div>
              <Label style={{ fontSize: '1rem' }}>기간</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {DURATION_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => handleDurationSelect(preset.value)}
                    className="rounded-xl transition-all"
                    style={{
                      minHeight: '44px',
                      padding: '8px 16px',
                      fontSize: '1rem',
                      fontWeight: 500,
                      backgroundColor:
                        (preset.value === -1 && isContinuous) || (preset.value === duration && !isContinuous && !showCustomDuration)
                          ? 'var(--brand-primary)'
                          : 'white',
                      color:
                        (preset.value === -1 && isContinuous) || (preset.value === duration && !isContinuous && !showCustomDuration)
                          ? 'white'
                          : 'var(--brand-text)',
                      border:
                        (preset.value === -1 && isContinuous) || (preset.value === duration && !isContinuous && !showCustomDuration)
                          ? '2px solid var(--brand-primary)'
                          : '2px solid var(--brand-border)',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomDuration(true)}
                  className="rounded-xl transition-all"
                  style={{
                    minHeight: '44px',
                    padding: '8px 16px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    backgroundColor: showCustomDuration ? 'var(--brand-primary)' : 'white',
                    color: showCustomDuration ? 'white' : 'var(--brand-text)',
                    border: showCustomDuration ? '2px solid var(--brand-primary)' : '2px solid var(--brand-border)',
                  }}
                >
                  직접 입력
                </button>
              </div>
              {showCustomDuration && (
                <Input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="일수 입력 (1-365)"
                  min={1}
                  max={365}
                  className="mt-2"
                  style={{ minHeight: '56px', fontSize: '1.125rem' }}
                />
              )}
            </div>

            {/* 알림 시간 */}
            <div>
              <Label style={{ fontSize: '1rem' }}>알림 시간 ({selectedTimes.length}/6)</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {commonTimes.map(time => (
                  <TimeChip15
                    key={time}
                    time={time}
                    selected={selectedTimes.includes(time)}
                    onSelect={handleTimeToggle}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  style={{ minHeight: '44px', fontSize: '1rem' }}
                >
                  <Plus className="w-4 h-4" />
                  시간 추가
                </Button>
              </div>
              {selectedTimes.length > 0 && (
                <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--brand-bg)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', marginBottom: '8px' }}>
                    선택된 시간
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTimes.map(time => (
                      <Badge
                        key={time}
                        variant="outline"
                        className="gap-1"
                        style={{ fontSize: '0.875rem', padding: '4px 8px' }}
                      >
                        {time}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => handleTimeToggle(time)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 출처 */}
          {(source === 'qr' || source === 'ocr') && sourceUrl && (
            <div className="space-y-2">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--brand-text)' }}>
                출처
              </h3>
              <Button
                variant="outline"
                className="gap-2 w-full justify-start"
                style={{ minHeight: '56px', fontSize: '1rem' }}
                onClick={() => window.open(sourceUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                원본 링크 열기
              </Button>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2 flex-row">
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
