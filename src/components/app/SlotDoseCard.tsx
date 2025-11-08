import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Check, AlertCircle } from "lucide-react";

interface SlotDoseCardProps {
  slot: '아침' | '점심' | '저녁' | '취침 전';
  time: string; // "08:00" or "08:00, 08:30" or "08:00 +2"
  scheduledCount: number;
  doneCount: number;
  hasMissed?: boolean;
  hasScanned?: boolean;
  onComplete?: () => void;
  onCardClick?: () => void;
}

export function SlotDoseCard({
  slot,
  time,
  scheduledCount,
  doneCount,
  hasMissed = false,
  hasScanned = false,
  medNames = [],
  onComplete,
  onCardClick,
}: SlotDoseCardProps) {
  const pendingCount = scheduledCount - doneCount;
  const isCompleted = pendingCount === 0 && doneCount > 0;
  
  return (
    <div
      onClick={onCardClick}
      className="relative p-6 rounded-3xl border-2 transition-all cursor-pointer active:scale-[0.98]"
      style={{
        backgroundColor: isCompleted ? 'rgba(18, 184, 134, 0.05)' : 'white',
        borderColor: isCompleted ? 'var(--brand-primary)' : hasMissed ? 'var(--brand-danger)' : 'var(--brand-border)',
        borderWidth: '2px',
        minHeight: '200px',
      }}
    >
      {/* 누락 배지 - 눈에 띄게 */}
      {hasMissed && !isCompleted && (
        <div
          className="absolute top-4 right-4 px-4 py-2 rounded-full flex items-center gap-2"
          style={{
            backgroundColor: 'var(--brand-danger)',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: 700,
          }}
        >
          <AlertCircle className="w-5 h-5" />
          못 드셨어요
        </div>
      )}

      {/* 스캔 배지 */}
      {hasScanned && (
        <div
          className="absolute top-4 right-4 px-4 py-2 rounded-full"
          style={{
            backgroundColor: 'var(--brand-accent)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 600,
          }}
        >
          ✓ 스캔완료
        </div>
      )}

      {/* 슬롯명 - 초대형 */}
      <div className="mb-3">
        <div className="flex items-center gap-3">
          <h3 style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--brand-text)' }}>
            {slot}
          </h3>
          {isCompleted && (
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 40,
                height: 40,
                backgroundColor: 'var(--brand-primary)',
              }}
            >
              <Check className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {/* 시간 - 큰 글씨 */}
      <p
        className="mb-3"
        style={{
          fontSize: '1.8rem',
          fontWeight: 600,
          color: 'var(--brand-text-secondary)',
        }}
      >
        {time}
      </p>

      {/* 약 이름 목록 - 만성질환약은 질환명 포함 */}
      {medNames.length > 0 && (
        <div className="mb-6">
          {medNames.map((name, index) => (
            <div
              key={index}
              className="mb-2"
              style={{
                fontSize: '1.4rem',
                fontWeight: 500,
                color: 'var(--brand-text)',
                lineHeight: 1.4,
              }}
            >
              • {name}
            </div>
          ))}
        </div>
      )}

      {/* 복용 완료 버튼 - 초대형 */}
      {pendingCount > 0 && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.();
          }}
          className="w-full"
          style={{
            minHeight: '80px',
            fontSize: '1.8rem',
            fontWeight: 700,
            backgroundColor: 'var(--brand-primary)',
            color: 'white',
            borderRadius: '20px',
          }}
        >
          약 드셨어요
        </Button>
      )}
      
      {isCompleted && (
        <div
          className="w-full flex items-center justify-center rounded-2xl"
          style={{
            minHeight: '80px',
            backgroundColor: 'rgba(18, 184, 134, 0.15)',
            color: 'var(--brand-primary)',
            fontSize: '1.8rem',
            fontWeight: 700,
          }}
        >
          ✓ 다 드셨어요
        </div>
      )}
    </div>
  );
}
