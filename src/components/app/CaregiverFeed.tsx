import { useState, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { HealthRecordList } from "./HealthRecordList";
import { HealthRecordHistory } from "./HealthRecordHistory";
import { SourcePicker } from "./SourcePicker";
import { MedConfirmSheet } from "./MedConfirmSheet";
import { ArrowLeft, Bell, CheckCircle2, AlertCircle, Clock, Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import type { SourceType, MedCategory } from "../../types/meds";
import { listPatientCardsAll, summarizeCardToday } from "../../services/medications.service";
import { subscribeDoseChange } from "../../services/doses.service";
import { CATEGORY_LABELS } from "../../types/meds";

// CardSummary 타입 정의
export interface CardSummary {
  cardKey: string;
  cardTitle: string;
  category: MedCategory;
  remaining: number;
  done: number;
  missed: number;
  nextTime?: string;
}
import { 
  sendManualRemind, 
  getRemindCooldown, 
  canRemind,
  formatCooldownTime 
} from "../../services/caregiver.mock";

type LinkStatus = 'ACTIVE' | 'PAUSED';
type FilterCategory = 'ALL' | MedCategory;
type FilterStatus = 'ALL' | 'REMAINING' | 'DONE' | 'MISSED';

interface CaregiverFeedProps {
  patientId: string;
  patientName: string;
  linkStatus?: LinkStatus;
  onBack?: () => void;
}

export function CaregiverFeed({
  patientId,
  patientName,
  linkStatus = 'ACTIVE',
  onBack,
}: CaregiverFeedProps) {
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showMedConfirmSheet, setShowMedConfirmSheet] = useState(false);
  const [medConfirmSource, setMedConfirmSource] = useState<SourceType>('manual');
  
  // 카드 데이터
  const [cardSummaries, setCardSummaries] = useState<CardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 필터 상태
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  // 쿨다운 타이머 (카드별 리마인드용)
  const [cooldownTick, setCooldownTick] = useState(0);

  // 카드 데이터 로드
  const loadCards = async () => {
    setIsLoading(true);
    try {
      const cards = await listPatientCardsAll(patientId);
      const summaries: CardSummary[] = [];

      for (const card of cards) {
        const summary = await summarizeCardToday(patientId, card.cardKey);
        if (summary) {
          summaries.push(summary);
        } else {
          // 인스턴스가 없어도 카드는 표시 (remaining=0 상태)
          summaries.push({
            cardKey: card.cardKey,
            cardTitle: card.cardTitle,
            category: card.category,
            remaining: 0,
            done: 0,
            missed: 0,
            nextTime: undefined,
          });
        }
      }

      setCardSummaries(summaries);
    } catch (error) {
      console.error('Failed to load cards:', error);
      toast.error('카드 정보를 불러오지 못했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadCards();
  }, [patientId]);

  // 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeDoseChange(() => {
      loadCards();
    });

    return unsubscribe;
  }, [patientId]);

  // 쿨다운 타이머 (1초마다 업데이트)
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 6개월치 혈압/혈당 기록 생성 (최신순)
  const allBpRecords = useMemo(() => {
    const records = [];
    const today = new Date('2025-10-22');
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let id = 1;
    for (let d = new Date(sixMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
      // 하루 1회 기록 (80% 확률)
      if (Math.random() > 0.2) {
        const hour = Math.floor(Math.random() * 3) + 7; // 7-9시
        const minute = Math.floor(Math.random() * 60);
        const systolic = Math.floor(Math.random() * 30) + 115; // 115-145
        const diastolic = Math.floor(Math.random() * 20) + 75; // 75-95
        
        let status: 'normal' | 'warning' | 'danger' = 'normal';
        if (systolic >= 140 || diastolic >= 90) status = 'danger';
        else if (systolic >= 130 || diastolic >= 85) status = 'warning';

        records.push({
          id: `bp${id++}`,
          date: new Date(d).toISOString().split('T')[0],
          time: `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(minute).padStart(2, '0')}`,
          systolic,
          diastolic,
          status,
        });
      }
    }
    
    // 최신순으로 정렬
    return records.reverse();
  }, []);

  const allBgRecords = useMemo(() => {
    const records = [];
    const today = new Date('2025-10-22');
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const tags = ['아침 공복', '저녁 식후2h', '점심 식후2h'];
    
    let id = 1;
    for (let d = new Date(sixMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
      // 하루 1회 기록 (80% 확률)
      if (Math.random() > 0.2) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        const hour = tag.includes('아침') ? Math.floor(Math.random() * 2) + 7 : Math.floor(Math.random() * 2) + 20;
        const minute = Math.floor(Math.random() * 60);
        const value = Math.floor(Math.random() * 50) + 90; // 90-140
        
        let status: 'normal' | 'warning' | 'danger' = 'normal';
        if (value >= 126) status = 'danger';
        else if (value >= 110) status = 'warning';

        records.push({
          id: `bg${id++}`,
          date: new Date(d).toISOString().split('T')[0],
          time: `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(minute).padStart(2, '0')}`,
          value,
          tag,
          status,
        });
      }
    }
    
    // 최신순으로 정렬
    return records.reverse();
  }, []);

  // 최근 14일 데이터만 필터링
  const recent14Days = useMemo(() => {
    const today = new Date('2025-10-22');
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    return {
      bp: allBpRecords.filter(r => new Date(r.date) > fourteenDaysAgo),
      bg: allBgRecords.filter(r => new Date(r.date) > fourteenDaysAgo),
    };
  }, [allBpRecords, allBgRecords]);

  // 필터링 및 정렬
  const filteredAndSortedCards = useMemo(() => {
    let filtered = [...cardSummaries];

    // 카테고리 필터
    if (filterCategory !== 'ALL') {
      filtered = filtered.filter((c) => c.category === filterCategory);
    }

    // 상태 필터
    if (filterStatus === 'REMAINING') {
      filtered = filtered.filter((c) => c.remaining > 0);
    } else if (filterStatus === 'DONE') {
      filtered = filtered.filter((c) => c.done > 0);
    } else if (filterStatus === 'MISSED') {
      filtered = filtered.filter((c) => c.missed > 0);
    }

    // 정렬: 누락 많은 순 → 남은 많은 순 → 다음 예정 빠른 순
    filtered.sort((a, b) => {
      // 1순위: 누락 많은 순
      if (a.missed !== b.missed) return b.missed - a.missed;
      
      // 2순위: 남은 많은 순
      if (a.remaining !== b.remaining) return b.remaining - a.remaining;
      
      // 3순위: 다음 예정 빠른 순
      if (a.nextTime && !b.nextTime) return -1;
      if (!a.nextTime && b.nextTime) return 1;
      if (a.nextTime && b.nextTime) {
        return a.nextTime.localeCompare(b.nextTime);
      }
      
      return 0;
    });

    return filtered;
  }, [cardSummaries, filterCategory, filterStatus]);

  // 전체 리마인드 전송
  const handleSendRemind = async () => {
    const caregiverId = 'caregiver-001'; // TODO: 실제 보호자 ID
    
    const result = sendManualRemind(caregiverId, patientId);
    
    if (!result.success && result.cooldownMs) {
      const timeLeft = formatCooldownTime(result.cooldownMs);
      toast(`${timeLeft} 후 다시 보낼 수 있어요`);
      return;
    }

    console.log('GA4: care_remind_global', { patientId });
    toast.success('리마인드를 보냈어요');
  };

  // 카드별 리마인드 전송
  const handleCardRemind = (cardKey: string, cardTitle: string) => {
    const caregiverId = 'caregiver-001'; // TODO: 실제 보호자 ID
    
    const result = sendManualRemind(caregiverId, patientId, cardKey);
    
    if (!result.success && result.cooldownMs) {
      const timeLeft = formatCooldownTime(result.cooldownMs);
      toast(`${timeLeft} 후 다시 보낼 수 있어요`);
      return;
    }

    console.log('GA4: care_remind_card', { patientId, cardKey });
    toast.success(`${cardTitle} 리마인드를 보냈어요`);
  };

  const handleAddMed = () => {
    console.log('GA4: care_med_add_tap', { patientId });
    setShowSourcePicker(true);
  };

  const handleSourceSelect = (source: SourceType) => {
    setMedConfirmSource(source);
    // QR/OCR은 추후 구현, 일단 수기 입력만
    setShowMedConfirmSheet(true);
  };

  const handleMedSaveComplete = () => {
    toast.success(`${patientName}님의 약이 등록되었습니다`);
    loadCards(); // 카드 목록 갱신
  };

  // 전체 기록 페이지 표시
  if (showHistoryPage) {
    return (
      <HealthRecordHistory
        patientName={patientName}
        bpRecords={allBpRecords}
        bgRecords={allBgRecords}
        onBack={() => setShowHistoryPage(false)}
      />
    );
  }

  // 빈 상태 체크
  const isEmpty = cardSummaries.length === 0 && !isLoading;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'white' }}
    >
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
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--brand-text)' }} />
          </button>
          <div className="flex-1">
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--brand-text)',
              }}
            >
              {patientName}
            </h1>
            <Badge
              variant="outline"
              style={{
                backgroundColor: linkStatus === 'ACTIVE' 
                  ? 'rgba(18, 184, 134, 0.1)' 
                  : 'rgba(255, 193, 7, 0.1)',
                color: linkStatus === 'ACTIVE' 
                  ? 'var(--brand-primary)' 
                  : 'var(--brand-warn)',
                border: 'none',
                marginTop: '4px',
              }}
            >
              {linkStatus === 'ACTIVE' ? '활성' : '일시중지'}
            </Badge>
          </div>
          <button
            onClick={handleAddMed}
            className="flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'var(--brand-primary)',
              color: 'white',
              border: 'none',
              flexShrink: 0,
            }}
            aria-label="약 등록"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* 필터 */}
        {!isEmpty && !isLoading && (
          <div className="mb-4 space-y-2">
            {/* 카테고리 필터 */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <FilterButton
                active={filterCategory === 'ALL'}
                onClick={() => setFilterCategory('ALL')}
                label="전체"
              />
              <FilterButton
                active={filterCategory === 'CHRONIC'}
                onClick={() => setFilterCategory('CHRONIC')}
                label="만성질환약"
              />
              <FilterButton
                active={filterCategory === 'SUPPLEMENT'}
                onClick={() => setFilterCategory('SUPPLEMENT')}
                label="영양제"
              />
              <FilterButton
                active={filterCategory === 'PRESCRIPTION'}
                onClick={() => setFilterCategory('PRESCRIPTION')}
                label="처방약"
              />
            </div>

            {/* 상태 필터 */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <FilterButton
                active={filterStatus === 'ALL'}
                onClick={() => setFilterStatus('ALL')}
                label="전체"
              />
              <FilterButton
                active={filterStatus === 'REMAINING'}
                onClick={() => setFilterStatus('REMAINING')}
                label="예정 있음"
              />
              <FilterButton
                active={filterStatus === 'MISSED'}
                onClick={() => setFilterStatus('MISSED')}
                label="누락 있음"
                variant="danger"
              />
            </div>
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="space-y-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{
                  backgroundColor: 'var(--brand-bg)',
                  height: '120px',
                }}
              />
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {isEmpty && (
          <div
            className="rounded-2xl flex flex-col items-center justify-center mb-6"
            style={{
              backgroundColor: 'var(--brand-bg)',
              padding: '40px 20px',
              minHeight: '200px',
            }}
          >
            <Bell className="w-12 h-12 mb-4" style={{ color: 'var(--brand-text-muted)' }} />
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--brand-text)',
                marginBottom: '8px',
              }}
            >
              등록된 약이 없어요
            </p>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--brand-text-secondary)',
                textAlign: 'center',
              }}
            >
              약을 등록하면 복약 일정을 확인할 수 있어요
            </p>
          </div>
        )}

        {/* 카드 리스트 */}
        {!isEmpty && !isLoading && (
          <div className="space-y-3 mb-6">
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--brand-text)',
                marginBottom: '12px',
              }}
            >
              오늘 복약 일정 ({filteredAndSortedCards.length}개)
            </h2>
            {filteredAndSortedCards.map((card) => (
              <CaregiverDoseCard 
                key={card.cardKey} 
                card={card}
                patientId={patientId}
                onRemind={handleCardRemind}
                cooldownTick={cooldownTick}
              />
            ))}
          </div>
        )}

        {/* 건강 기록 - 최근 14일 */}
        <div className="space-y-4 mb-6">
          <HealthRecordList
            type="bp"
            title="혈압 기록 (최근 14일)"
            records={recent14Days.bp}
            initialShowCount={5}
            onViewAll={() => setShowHistoryPage(true)}
            viewAllLabel="전체 기록 보기 (6개월)"
          />
          
          <HealthRecordList
            type="bg"
            title="혈당 기록 (최근 14일)"
            records={recent14Days.bg}
            initialShowCount={5}
            onViewAll={() => setShowHistoryPage(true)}
            viewAllLabel="전체 기록 보기 (6개월)"
          />
        </div>

        {/* 전체 리마인드 버튼 */}
        {(() => {
          const caregiverId = 'caregiver-001'; // TODO: 실제 보호자 ID
          const cooldownMs = getRemindCooldown(caregiverId, patientId);
          const isDisabled = cooldownMs > 0;
          const timeLeft = isDisabled ? formatCooldownTime(cooldownMs) : '';

          return (
            <>
              <Button
                onClick={handleSendRemind}
                disabled={isDisabled}
                className="w-full gap-2"
                style={{
                  minHeight: '64px',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  backgroundColor: isDisabled ? 'var(--brand-bg)' : 'var(--brand-primary)',
                  color: isDisabled ? 'var(--brand-text-muted)' : 'white',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                <Bell className="w-5 h-5" />
                {isDisabled ? `${timeLeft} 후 다시 보낼 수 있어요` : '전체 리마인드 보내기'}
              </Button>

              {isDisabled && (
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--brand-text-secondary)',
                    textAlign: 'center',
                    marginTop: '8px',
                  }}
                >
                  리마인드는 20분마다 보낼 수 있어요
                </p>
              )}
            </>
          );
        })()}
      </div>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />

      {/* 모달들 */}
      <SourcePicker
        open={showSourcePicker}
        onOpenChange={setShowSourcePicker}
        onSelectSource={handleSourceSelect}
        targetName={patientName}
      />

      <MedConfirmSheet
        open={showMedConfirmSheet}
        onOpenChange={setShowMedConfirmSheet}
        onSaveComplete={handleMedSaveComplete}
        userId={patientId}
        targetDisplayName={patientName}
        source={medConfirmSource}
      />
    </div>
  );
}

// 필터 버튼 컴포넌트
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  variant?: 'default' | 'danger';
}

function FilterButton({ active, onClick, label, variant = 'default' }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg transition-all active:scale-95 whitespace-nowrap"
      style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        backgroundColor: active
          ? variant === 'danger'
            ? 'var(--brand-danger)'
            : 'var(--brand-primary)'
          : 'var(--brand-bg)',
        color: active ? 'white' : 'var(--brand-text)',
        border: active ? 'none' : '1px solid var(--brand-border)',
      }}
    >
      {label}
    </button>
  );
}

// 보호자용 카드 컴포넌트
interface CaregiverDoseCardProps {
  card: CardSummary;
  patientId: string;
  onRemind: (cardKey: string, cardTitle: string) => void;
  cooldownTick: number; // 1초마다 증가하는 틱 (쿨다운 업데이트용)
}

function CaregiverDoseCard({ card, patientId, onRemind, cooldownTick }: CaregiverDoseCardProps) {
  const isComplete = card.remaining === 0 && card.done > 0;
  const hasIssue = card.missed > 0 || (card.remaining > 0 && !card.nextTime);
  
  // 카드별 쿨다운 체크
  const caregiverId = 'caregiver-001'; // TODO: 실제 보호자 ID
  const cooldownMs = getRemindCooldown(caregiverId, patientId, card.cardKey);
  const isRemindDisabled = cooldownMs > 0;
  const timeLeft = isRemindDisabled ? formatCooldownTime(cooldownMs) : '';

  return (
    <div
      className="rounded-2xl transition-all"
      style={{
        backgroundColor: 'white',
        border: `2px solid ${
          hasIssue ? 'var(--brand-danger)' : 'var(--brand-border)'
        }`,
        padding: '20px',
        opacity: card.remaining === 0 && card.done === 0 && card.missed === 0 ? 0.6 : 1,
      }}
    >
      {/* 제목 & 카테고리 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--brand-text)',
              marginBottom: '4px',
            }}
          >
            {card.cardTitle}
          </h3>
          <Badge
            variant="outline"
            style={{
              backgroundColor: 'var(--brand-bg)',
              color: 'var(--brand-text-secondary)',
              border: 'none',
              fontSize: '0.8rem',
            }}
          >
            {CATEGORY_LABELS[card.category]}
          </Badge>
        </div>
        {isComplete && (
          <CheckCircle2
            className="w-6 h-6"
            style={{ color: 'var(--brand-success)', flexShrink: 0 }}
          />
        )}
        {hasIssue && (
          <AlertCircle
            className="w-6 h-6"
            style={{ color: 'var(--brand-danger)', flexShrink: 0 }}
          />
        )}
      </div>

      {/* 상태 집계 */}
      <div className="flex gap-2 mb-3">
        {card.remaining > 0 && (
          <Badge
            style={{
              backgroundColor: 'rgba(18, 184, 134, 0.1)',
              color: 'var(--brand-primary)',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '4px 10px',
            }}
          >
            남은 {card.remaining}
          </Badge>
        )}
        {card.done > 0 && (
          <Badge
            style={{
              backgroundColor: 'rgba(18, 184, 134, 0.15)',
              color: 'var(--brand-success)',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '4px 10px',
            }}
          >
            완료 {card.done}
          </Badge>
        )}
        {card.missed > 0 && (
          <Badge
            style={{
              backgroundColor: 'rgba(224, 49, 49, 0.1)',
              color: 'var(--brand-danger)',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '4px 10px',
            }}
          >
            누락 {card.missed}
          </Badge>
        )}
      </div>

      {/* 다음 예정 */}
      <div
        className="flex items-center gap-2 rounded-lg mb-3"
        style={{
          backgroundColor: 'var(--brand-bg)',
          padding: '8px 12px',
        }}
      >
        <Clock className="w-4 h-4" style={{ color: 'var(--brand-text-secondary)' }} />
        <span
          style={{
            fontSize: '0.875rem',
            color: 'var(--brand-text-secondary)',
          }}
        >
          {card.nextTime ? `다음: ${card.nextTime}` : '오늘 일정 없음'}
        </span>
      </div>

      {/* 카드별 리마인드 버튼 */}
      {card.remaining > 0 && (
        <Button
          onClick={() => onRemind(card.cardKey, card.cardTitle)}
          disabled={isRemindDisabled}
          variant="outline"
          className="w-full gap-2"
          style={{
            minHeight: '44px',
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: isRemindDisabled ? 'var(--brand-bg)' : 'white',
            color: isRemindDisabled ? 'var(--brand-text-muted)' : 'var(--brand-primary)',
            borderColor: isRemindDisabled ? 'var(--brand-border)' : 'var(--brand-primary)',
            cursor: isRemindDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          <Bell className="w-4 h-4" />
          {isRemindDisabled ? `${timeLeft} 후 가능` : '리마인드 보내기'}
        </Button>
      )}
    </div>
  );
}
