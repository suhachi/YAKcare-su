import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { ProgressRing } from "./ProgressRing";
import { Plus, ArrowUpDown, Bell } from "lucide-react";

type SortMode = 'priority' | 'name';

interface CarePatient {
  id: string;
  name: string;
  progress: number; // 0-100
  missedCount: number;
  lastBP?: {
    systolic: number;
    diastolic: number;
    time: string;
  };
  lastBG?: {
    value: number;
    tag: string;
    time: string;
  };
  lastRemind?: {
    minutesAgo: number;
  };
}

interface CaregiverHomeProps {
  onOpenFeed?: (patientId: string) => void;
  onAddPatient?: () => void;
}

export function CaregiverHome({ onOpenFeed, onAddPatient }: CaregiverHomeProps) {
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [isLoading, setIsLoading] = useState(false);

  // 임시 데이터
  const [patients] = useState<CarePatient[]>([
    {
      id: '1',
      name: '김영희',
      progress: 75,
      missedCount: 1,
      lastBP: {
        systolic: 128,
        diastolic: 82,
        time: '오전 8:20',
      },
      lastBG: {
        value: 112,
        tag: '아침 공복',
        time: '오전 7:45',
      },
      lastRemind: {
        minutesAgo: 35,
      },
    },
    {
      id: '2',
      name: '박철수',
      progress: 100,
      missedCount: 0,
      lastBP: {
        systolic: 122,
        diastolic: 78,
        time: '오후 2:10',
      },
    },
    {
      id: '3',
      name: '이순자',
      progress: 50,
      missedCount: 3,
      lastBG: {
        value: 98,
        tag: '저녁 식후2h',
        time: '어제',
      },
    },
  ]);

  const sortedPatients = [...patients].sort((a, b) => {
    if (sortMode === 'priority') {
      // 미복용 많은 순 → 진행률 낮은 순
      if (a.missedCount !== b.missedCount) {
        return b.missedCount - a.missedCount;
      }
      return a.progress - b.progress;
    } else {
      // 이름순
      return a.name.localeCompare(b.name);
    }
  });

  const handleSort = () => {
    setSortMode(sortMode === 'priority' ? 'name' : 'priority');
  };

  const handleCardClick = (patientId: string) => {
    onOpenFeed?.(patientId);
    console.log('GA4: care_open_feed', { patientId });
  };

  const handleAddPatient = () => {
    onAddPatient?.();
    console.log('GA4: care_add_patient_tap');
  };

  // 빈 상태
  const isEmpty = patients.length === 0;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'white' }}
    >
      {/* 컨테이너 */}
      <div className="px-4 pb-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--brand-text)',
            }}
          >
            내가 돌보는 분들
          </h1>
          <Button
            onClick={handleAddPatient}
            className="gap-2"
            style={{
              minHeight: '48px',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: 'var(--brand-primary)',
              color: 'white',
              borderRadius: '12px',
            }}
          >
            <Plus className="w-5 h-5" />
            추가
          </Button>
        </div>

        {/* 정렬 툴바 */}
        {!isEmpty && (
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)' }}>
              {patients.length}명
            </p>
            <button
              onClick={handleSort}
              className="flex items-center gap-1 px-3 py-2 rounded-lg transition-all active:scale-95"
              style={{
                fontSize: '0.875rem',
                color: 'var(--brand-text)',
                backgroundColor: 'var(--brand-bg)',
                border: '1px solid var(--brand-border)',
              }}
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortMode === 'priority' ? '우선순위' : '이름순'}
            </button>
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} style={{ height: '160px', borderRadius: '16px' }} />
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {isEmpty && !isLoading && (
          <div
            className="flex flex-col items-center justify-center rounded-2xl"
            style={{
              minHeight: '320px',
              backgroundColor: 'var(--brand-bg)',
              padding: '32px',
            }}
          >
            <div
              className="flex items-center justify-center rounded-full mb-4"
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'white',
              }}
            >
              <Bell className="w-10 h-10" style={{ color: 'var(--brand-text-muted)' }} />
            </div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--brand-text)',
                marginBottom: '8px',
              }}
            >
              연결된 복용자가 없어요
            </h3>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--brand-text-secondary)',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              복용자를 추가하고<br />복약 관리를 시작해 보세요
            </p>
            <Button
              onClick={handleAddPatient}
              className="gap-1"
              style={{
                minHeight: '56px',
                fontSize: '1.125rem',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
              }}
            >
              <Plus className="w-5 h-5" />
              복용자 추가
            </Button>
          </div>
        )}

        {/* 카드 리스트 */}
        {!isEmpty && !isLoading && (
          <div className="space-y-3">
            {sortedPatients.map(patient => (
              <div
                key={patient.id}
                className="rounded-2xl cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--brand-border)',
                  padding: '20px',
                }}
                onClick={() => handleCardClick(patient.id)}
              >
                {/* 상단: 이름 + 진행률 */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: 'var(--brand-text)',
                        marginBottom: '6px',
                      }}
                    >
                      {patient.name}
                    </h3>
                    {patient.missedCount > 0 && (
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: 'rgba(224, 49, 49, 0.1)',
                          color: 'var(--brand-danger)',
                          border: 'none',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                        }}
                      >
                        미복용 {patient.missedCount}건
                      </Badge>
                    )}
                  </div>
                  <ProgressRing completed={patient.progress} total={100} size={64} />
                </div>

                {/* 건강 정보 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* 혈압 */}
                  {patient.lastBP && (
                    <div
                      className="rounded-xl"
                      style={{
                        backgroundColor: 'var(--brand-bg)',
                        padding: '12px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: 'var(--brand-text-secondary)',
                          marginBottom: '4px',
                        }}
                      >
                        혈압
                      </p>
                      <p
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'var(--brand-text)',
                          marginBottom: '2px',
                        }}
                      >
                        {patient.lastBP.systolic}/{patient.lastBP.diastolic}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--brand-text-muted)' }}>
                        {patient.lastBP.time}
                      </p>
                    </div>
                  )}

                  {/* 혈당 */}
                  {patient.lastBG && (
                    <div
                      className="rounded-xl"
                      style={{
                        backgroundColor: 'var(--brand-bg)',
                        padding: '12px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: 'var(--brand-text-secondary)',
                          marginBottom: '4px',
                        }}
                      >
                        혈당
                      </p>
                      <p
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'var(--brand-text)',
                          marginBottom: '2px',
                        }}
                      >
                        {patient.lastBG.value}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--brand-text-muted)' }}>
                        {patient.lastBG.tag} · {patient.lastBG.time}
                      </p>
                    </div>
                  )}

                  {/* 데이터 없음 표시 */}
                  {!patient.lastBP && !patient.lastBG && (
                    <div
                      className="col-span-2 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: 'var(--brand-bg)',
                        padding: '12px',
                        minHeight: '72px',
                      }}
                    >
                      <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
                        건강 기록 없음
                      </p>
                    </div>
                  )}
                </div>

                {/* 리마인드 정보 */}
                {patient.lastRemind && (
                  <div
                    className="rounded-lg"
                    style={{
                      backgroundColor: 'rgba(18, 184, 134, 0.05)',
                      padding: '8px 12px',
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', color: 'var(--brand-primary)' }}>
                      리마인드 • {patient.lastRemind.minutesAgo}분 전
                    </p>
                  </div>
                )}

                {/* [상세] 버튼 */}
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  style={{
                    minHeight: '44px',
                    fontSize: '1rem',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(patient.id);
                  }}
                >
                  상세
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />
    </div>
  );
}
