import { useState, useEffect, type MouseEvent } from "react";
import { ProgressRing } from "./ProgressRing";
import { HealthSection } from "./HealthSection";
import { HealthBadge } from "./HealthBadge";
import { SourcePicker } from "./SourcePicker";
import { MedConfirmSheet } from "./MedConfirmSheet";
import { QRScanner } from "./QRScanner";
import { BPRecord } from "./BPRecord";
import { BGRecord } from "./BGRecord";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { MappingResult } from "../../services/intake.mapper";
import { listTodayDoses } from "../../services/doses.service";
import { CATEGORY_LABELS, CATEGORY_ORDER, type MedCategory } from "../../types/meds";
import { getTodayRecords } from "../../services/health.service";
import { getBPStatus, getBGStatus } from "../../types/health";
import { subscribeDoseChange, markDone } from "../../services/doses.service";
import { useDayRollover } from "../../hooks/useDayRollover";
import type { DoseInstance } from "../../types/dose";
import type { SourceType } from "../../types/meds";
import type { HealthRecord } from "../../types/health";

// 카드 데이터 타입 (규칙: 만성/영양제=1카드, 처방=복용군별 카드)
interface DoseCardData {
  cardKey: string;           // 카드 식별자
  cardTitle: string;         // 카드 제목
  category: MedCategory;     // 카테고리
  remainingCount: number;    // 오늘 남은 복용 횟수 (DONE/MISSED 제외)
  doses: DoseInstance[];     // 해당 카드의 인스턴스들
  earliestTime: string;      // 가장 이른 복용 시간 ("08:00")
}

// 카테고리 섹션 데이터
interface CategorySection {
  category: MedCategory;
  label: string;
  cards: DoseCardData[];     // 카드 목록
}

export function HomeToday() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 실제 데이터 상태
  const [todayDoses, setTodayDoses] = useState<DoseInstance[]>([]);
  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { supabase } = await import('../../services/supabase.client');
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!alive) return;
        setCurrentUserId(user?.id ?? null);
        setErrorMessage(null);
      } catch (error) {
        console.error('[HomeToday] Failed to get user:', error);
        if (alive) {
          setCurrentUserId(null);
          setErrorMessage(error instanceof Error ? error.message : '인증 오류');
        }
      } finally {
        if (alive) {
          setIsAuthChecked(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  
  // 진행률 계산 (DONE/MISSED 포함 전체 기준)
  const totalScheduled = todayDoses.length;
  const totalDone = todayDoses.filter((dose: DoseInstance) => dose.status === 'DONE').length;
  const totalPending = todayDoses.filter((dose: DoseInstance) => dose.status !== 'DONE' && dose.status !== 'MISSED').length;

  // 건강 기록 상태
  const [lastBPRecord, setLastBPRecord] = useState<HealthRecord | null>(null);
  const [lastBGRecord, setLastBGRecord] = useState<HealthRecord | null>(null);

  /**
   * 오늘의 복용 인스턴스를 카테고리 → 카드별로 그룹핑
   * 
   * 규칙:
   * - 만성/영양제: 1등록=1카드 (여러 복용 시간이어도 합산)
   * - 처방: 복용군별 카드 (아침/점심/저녁/취침전, 식전/식후 세분화)
   */
  const groupDosesByCategoryAndCard = (doses: DoseInstance[]): CategorySection[] => {
    // DONE/MISSED 제외 - 먹어야 할 약만 표시
    const pendingDoses = doses.filter((dose: DoseInstance) => dose.status !== 'DONE' && dose.status !== 'MISSED');
    
    if (pendingDoses.length === 0) {
      return [];
    }
    
    // 카테고리 → 카드(cardKey) → 인스턴스 2단계 그룹핑
    const categoryMap = new Map<MedCategory, Map<string, DoseInstance[]>>();
    
    for (const dose of pendingDoses) {
      const category = (dose.medCategory as MedCategory) || 'PRESCRIPTION';
      const cardKey = dose.cardKey;
      
      if (!cardKey) {
        console.warn('[HomeToday] Missing cardKey for dose:', dose.id);
        continue;
      }
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }
      
      const cardMap = categoryMap.get(category)!;
      if (!cardMap.has(cardKey)) {
        cardMap.set(cardKey, []);
      }
      
      cardMap.get(cardKey)!.push(dose);
    }
    
    // 카테고리 섹션 생성
    const sections: CategorySection[] = [];
    
    for (const category of CATEGORY_ORDER) {
      const cardMap = categoryMap.get(category);
      if (!cardMap) continue;
      
      const cards: DoseCardData[] = [];
      
      // 각 카드별로 데이터 생성
      for (const [cardKey, cardDoses] of cardMap.entries()) {
        if (cardDoses.length === 0) continue;
        
        // 시간 정렬
        const sortedDoses = cardDoses.sort((a: DoseInstance, b: DoseInstance) => a.scheduledAt - b.scheduledAt);
        
        // 가장 이른 복용 시간
        const earliestTime = new Date(sortedDoses[0].scheduledAt);
        const timeStr = `${earliestTime.getHours().toString().padStart(2, '0')}:${earliestTime.getMinutes().toString().padStart(2, '0')}`;
        
        // 카드 제목 (첫 번째 인스턴스의 cardTitle 사용)
        const cardTitle = sortedDoses[0].cardTitle || '약';
        
        cards.push({
          cardKey,
          cardTitle,
          category,
          remainingCount: sortedDoses.length, // 남은 복용 횟수
          doses: sortedDoses,
          earliestTime: timeStr,
        });
      }
      
      // 카드 정렬 (가장 이른 시간 순)
      cards.sort((a: DoseCardData, b: DoseCardData) => {
        const timeA = a.earliestTime.split(':').map(Number);
        const timeB = b.earliestTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
      
      if (cards.length > 0) {
        sections.push({
          category,
          label: CATEGORY_LABELS[category],
          cards,
        });
      }
    }
    
    return sections;
  };

  useEffect(() => {
    if (!isAuthChecked || !currentUserId) return;

    let alive = true;

    (async () => {
      try {
        const [doses, bpRecords, bgRecords] = await Promise.all([
          listTodayDoses(currentUserId),
          getTodayRecords(currentUserId, 'BP'),
          getTodayRecords(currentUserId, 'BG'),
        ]);

        if (!alive) return;

        setTodayDoses(doses);
        setCategorySections(groupDosesByCategoryAndCard(doses));
        setLastBPRecord(bpRecords?.[0] ?? null);
        setLastBGRecord(bgRecords?.[0] ?? null);
        setErrorMessage(null);
      } catch (error) {
        console.error('[HomeToday] Failed to load data:', error);
        if (alive) {
          setErrorMessage(error instanceof Error ? error.message : '데이터 로드 오류');
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthChecked, currentUserId, refreshTrigger]);

  /**
   * 카드 완료 처리
   * 해당 카드의 가장 이른 인스턴스를 DONE 처리
   */
  const handleCardComplete = (cardKey: string) => {
    // 해당 카드의 미완료 인스턴스 찾기
    const pendingDoses = todayDoses.filter(
      (dose: DoseInstance) =>
        dose.cardKey === cardKey &&
        dose.status !== 'DONE' &&
        dose.status !== 'MISSED'
    );
    
    if (pendingDoses.length === 0) {
      toast.error('완료할 약이 없습니다');
      return;
    }
    
    // 가장 이른 인스턴스 찾기 (시간 정렬)
    const sortedDoses = pendingDoses.sort((a: DoseInstance, b: DoseInstance) => a.scheduledAt - b.scheduledAt);
    const earliestDose = sortedDoses[0];
    
    // DONE 처리
    markDone(earliestDose.id);
    
    toast.success('확인되었습니다');
    console.log('[HomeToday] Completed dose:', earliestDose.id, 'Card:', cardKey);
    // subscribeDoseChange가 자동으로 리프레시 트리거
  };
  
  // Dose 상태 변경 구독
  useEffect(() => {
    if (!isAuthChecked) return;
    const unsubscribe = subscribeDoseChange(() => {
      setRefreshTrigger((prev: number) => prev + 1);
    });
    return unsubscribe;
  }, [isAuthChecked]);

  // 자정 롤오버 시 자동 복원
  useDayRollover(() => {
    setRefreshTrigger((prev: number) => prev + 1);
    toast.info('오늘의 복약 일정이 준비되었어요');
  });

  // 혈압 표시 헬퍼
  const getBPDisplayValue = () => {
    if (!lastBPRecord || !lastBPRecord.systolic || !lastBPRecord.diastolic) {
      return '기록 없음';
    }
    return `${lastBPRecord.systolic}/${lastBPRecord.diastolic}`;
  };

  const getBPDisplayTime = () => {
    if (!lastBPRecord) return '';
    const date = new Date(lastBPRecord.time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${period} ${displayHour}:${minutes.toString().padStart(2, '0')}`;
  };

  const getBPDisplayTag = () => {
    if (!lastBPRecord) return '';
    const tagLabels: Record<string, string> = {
      MORNING: '아침',
      NOON: '점심',
      EVENING: '저녁',
      BEDTIME: '취침 전',
      OTHER: '기타',
    };
    return tagLabels[lastBPRecord.tag] || '';
  };

  const getBPDisplayStatus = (): 'normal' | 'warning' | 'danger' => {
    if (!lastBPRecord || !lastBPRecord.systolic || !lastBPRecord.diastolic) {
      return 'normal';
    }
    const status = getBPStatus(lastBPRecord.systolic, lastBPRecord.diastolic);
    if (status === 'VERY_HIGH' || status === 'HIGH') return 'danger';
    if (status === 'ELEVATED') return 'warning';
    return 'normal';
  };

  // 혈당 표시 헬퍼
  const getBGDisplayValue = () => {
    if (!lastBGRecord || !lastBGRecord.glucose) {
      return '기록 없음';
    }
    return `${lastBGRecord.glucose}`;
  };

  const getBGDisplayTime = () => {
    if (!lastBGRecord) return '';
    const date = new Date(lastBGRecord.time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${period} ${displayHour}:${minutes.toString().padStart(2, '0')}`;
  };

  const getBGDisplayTag = () => {
    if (!lastBGRecord) return '';
    const tagLabels: Record<string, string> = {
      MORNING: '아침',
      NOON: '점심',
      EVENING: '저녁',
      BEDTIME: '취침 전',
      OTHER: '기타',
    };
    const measurementLabels: Record<'FASTING' | 'POST_2H', string> = {
      FASTING: '공복',
      POST_2H: '식후 2시간',
    };
    const tag = tagLabels[lastBGRecord.tag] || '';
    const measurementKey = lastBGRecord.measurementType as 'FASTING' | 'POST_2H' | undefined;
    const measurement = measurementKey ? measurementLabels[measurementKey] ?? '' : '';
    return measurement && tag ? `${tag} ${measurement}` : tag || measurement;
  };

  const getBGDisplayStatus = (): 'normal' | 'warning' | 'danger' => {
    if (!lastBGRecord || !lastBGRecord.glucose) {
      return 'normal';
    }
    const isFasting = lastBGRecord.measurementType === 'FASTING';
    const status = getBGStatus(lastBGRecord.glucose, isFasting);
    if (status === 'HIGH') return 'danger';
    if (status === 'ELEVATED') return 'warning';
    return 'normal';
  };

  const handleCardClick = (cardKey: string) => {
    console.log('카드 상세:', cardKey);
    // TODO: 카드 상세 시트 열기 (해당 카드의 모든 인스턴스 표시)
  };

  // 모달 상태
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showMedConfirmSheet, setShowMedConfirmSheet] = useState(false);
  const [medConfirmSource, setMedConfirmSource] = useState<SourceType>('manual');
  const [medConfirmDraft, setMedConfirmDraft] = useState<any>(null);
  const [scanConfidence, setScanConfidence] = useState<'full' | 'partial' | 'none'>('none');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanMode, setScanMode] = useState<'qr' | 'ocr'>('qr');
  const [showBPRecord, setShowBPRecord] = useState(false);
  const [showBGRecord, setShowBGRecord] = useState(false);

  const handleAddBP = () => {
    setShowBPRecord(true);
  };

  const handleAddBG = () => {
    setShowBGRecord(true);
  };

  const handleHealthRecordComplete = () => {
    refreshData();
  };

  const handleAddMed = () => {
    console.log('GA4: med_add_fab_tap');
    setShowSourcePicker(true);
  };

  const handleSourceSelect = (source: SourceType) => {
    setMedConfirmSource(source);
    if (source === 'qr' || source === 'ocr') {
      setScanMode(source);
      setShowQRScanner(true);
    } else {
      // 수기 입력은 바로 MedConfirmSheet 열기
      setShowMedConfirmSheet(true);
    }
  };

  const handleScanSuccess = (result: MappingResult, mode: 'qr' | 'ocr') => {
    // Step 4.5: 스캔 결과를 MedConfirmSheet에 전달
    setMedConfirmSource(mode);
    setMedConfirmDraft(result.draft);
    setScanConfidence(result.confidence);
    setShowQRScanner(false);
    setShowMedConfirmSheet(true);
    
    console.log('[HomeToday] Scan success:', {
      confidence: result.confidence,
      missingFields: result.missingFields,
    });
  };

  const handleScanError = (error: string) => {
    // 실패 시 수기 입력으로 폴백
    toast.error(`${error}. 수기 입력으로 진행합니다`);
    setMedConfirmSource('manual');
    setShowMedConfirmSheet(true);
  };

  const handleMedSaveComplete = () => {
    // 약 저장 완료 후 데이터 갱신
    refreshData();
    toast.success('약이 등록되었습니다');
  };

  const refreshData = () => {
    setRefreshTrigger((prev: number) => prev + 1);
  };



  // 빈 화면 상태 (먹을 약이 없으면 빈 화면)
  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">사용자 인증 중...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">로그인이 필요합니다</p>
        </div>
      </div>
    );
  }

  const hasNoMeds = categorySections.length === 0;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'white' }}
    >
      {/* 컨테이너 */}
      <div className="px-4 pb-24">
        {/* 헤더 + 진행률 */}
        <div className="flex items-center justify-between mb-8">
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--brand-text)',
              lineHeight: 1.3,
              maxWidth: '60%',
            }}
          >
            오늘 약 챙겨 먹어요
          </h1>
          <ProgressRing completed={totalDone} total={totalScheduled} size={100} />
        </div>

        {/* 빈 화면 */}
        {hasNoMeds ? (
          <div
            className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed"
            style={{
              borderColor: 'var(--brand-border)',
              backgroundColor: 'var(--brand-bg)',
            }}
          >
            <p
              className="mb-8 text-center"
              style={{
                fontSize: '1.6rem',
                color: 'var(--brand-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              약을 등록하면<br />알림을 드려요
            </p>
            <Button
              onClick={handleAddMed}
              style={{
                minHeight: '80px',
                fontSize: '1.6rem',
                fontWeight: 700,
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
                paddingLeft: '3rem',
                paddingRight: '3rem',
                borderRadius: '20px',
              }}
            >
              <Plus className="w-7 h-7 mr-3" />
              약 등록하기
            </Button>
          </div>
        ) : (
          <>
            {/* 카테고리별 섹션 - 만성질환약 / 영양제 / 처방약 */}
            {categorySections.map((section: CategorySection) => (
              <div key={section.category} className="mb-12">
                {/* 섹션 헤더 */}
                <h2 
                  className="mb-6"
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: 'var(--brand-text)',
                  }}
                  aria-level={2}
                >
                  {section.label}
                </h2>
                
                {/* 카드들 */}
                <div className="space-y-5">
                  {section.cards.map((card: DoseCardData) => (
                    <div
                      key={card.cardKey}
                      onClick={() => handleCardClick(card.cardKey)}
                      className="relative p-6 rounded-3xl border-2 transition-all cursor-pointer active:scale-[0.98]"
                      style={{
                        backgroundColor: 'white',
                        borderColor: 'var(--brand-border)',
                        borderWidth: '2px',
                        minHeight: '160px',
                      }}
                      aria-label={`${section.label}, ${card.cardTitle}, 오늘 남은 복용 ${card.remainingCount}건`}
                    >
                      {/* 카드 제목 */}
                      <div
                        className="mb-4"
                        style={{
                          fontSize: '1.6rem',
                          fontWeight: 700,
                          color: 'var(--brand-text)',
                          lineHeight: 1.3,
                        }}
                      >
                        {card.cardTitle}
                      </div>
                      
                      {/* 복용 정보 */}
                      <div className="flex items-center gap-4 mb-6">
                        {/* 가장 이른 시간 */}
                        <div
                          style={{
                            fontSize: '1.4rem',
                            color: 'var(--brand-text-secondary)',
                          }}
                        >
                          {card.earliestTime}
                          {card.remainingCount > 1 && (
                            <span style={{ marginLeft: '8px' }}>
                              외 {card.remainingCount - 1}회
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 남은 복용 횟수 */}
                      <div
                        className="mb-6"
                        style={{
                          fontSize: '1.3rem',
                          color: 'var(--brand-text-secondary)',
                        }}
                      >
                        오늘 남은 복용 {card.remainingCount}건
                      </div>
                      
                      {/* 복용 완료 버튼 */}
                      <Button
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          handleCardComplete(card.cardKey);
                        }}
                        className="w-full"
                        style={{
                          minHeight: '64px',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--brand-primary)',
                          color: 'white',
                          borderRadius: '16px',
                        }}
                      >
                        복용 완료
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 완료 메시지 */}
            {totalPending === 0 && totalScheduled > 0 && (
              <div
                className="p-8 rounded-3xl text-center mb-8"
                style={{
                  backgroundColor: 'rgba(18, 184, 134, 0.15)',
                  color: 'var(--brand-primary)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                🎉<br />오늘도 잘 챙기셨어요!
              </div>
            )}

            {/* 건강 관리 섹션 */}
            <div className="space-y-5">
              {/* 건강 섹션 헤더 + 배지 */}
              <div className="flex items-center justify-between mb-2">
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--brand-text)',
                  }}
                >
                  건강 기록
                </h2>
                <HealthBadge
                  completed={(lastBPRecord ? 1 : 0) + (lastBGRecord ? 1 : 0)}
                  total={2}
                />
              </div>

              <HealthSection
                type="bp"
                title="혈압"
                lastValue={getBPDisplayValue()}
                lastTime={getBPDisplayTime()}
                lastTag={getBPDisplayTag()}
                status={getBPDisplayStatus()}
                unit="mmHg"
                onAddRecord={handleAddBP}
              />
              
              <HealthSection
                type="bg"
                title="혈당"
                lastValue={getBGDisplayValue()}
                lastTime={getBGDisplayTime()}
                lastTag={getBGDisplayTag()}
                status={getBGDisplayStatus()}
                unit="mg/dL"
                onAddRecord={handleAddBG}
              />
            </div>
          </>
        )}
      </div>

      {/* FAB (약 등록) */}
      {!hasNoMeds && (
        <button
          onClick={handleAddMed}
          className="fixed shadow-lg transition-transform active:scale-95"
          style={{
            bottom: '34px',
            right: '16px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="약 등록"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />

      {/* 모달들 */}
      <SourcePicker
        open={showSourcePicker}
        onOpenChange={setShowSourcePicker}
        onSelectSource={handleSourceSelect}
      />

      <MedConfirmSheet
        open={showMedConfirmSheet}
        onOpenChange={setShowMedConfirmSheet}
        onSaveComplete={handleMedSaveComplete}
        userId={currentUserId}
        source={medConfirmSource}
        initialDraft={medConfirmDraft}
        scanConfidence={scanConfidence}
      />

      <QRScanner
        open={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onSuccess={handleScanSuccess}
        onError={handleScanError}
        mode={scanMode}
        userId={currentUserId}
      />

      <BPRecord
        open={showBPRecord}
        onOpenChange={setShowBPRecord}
        userId={currentUserId}
        onComplete={handleHealthRecordComplete}
      />

      <BGRecord
        open={showBGRecord}
        onOpenChange={setShowBGRecord}
        userId={currentUserId}
        onComplete={handleHealthRecordComplete}
      />


    </div>
  );
}
