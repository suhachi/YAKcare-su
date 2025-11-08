import { Button } from "../ui/button";
import { Plus } from "lucide-react";

interface HealthSectionProps {
  type: 'bp' | 'bg';
  title: string;
  lastValue: string; // "124/78" or "108"
  lastTime: string; // "오전 7:40"
  lastTag?: string; // "저녁 식후2h"
  status?: 'normal' | 'warning' | 'danger'; // 정상/주의/위험
  unit?: string;
  onAddRecord?: () => void;
}

export function HealthSection({
  type,
  title,
  lastValue,
  lastTime,
  lastTag,
  status = 'normal',
  unit = '',
  onAddRecord,
}: HealthSectionProps) {
  // 상태에 따른 색상
  const getStatusColor = () => {
    switch (status) {
      case 'danger':
        return 'var(--brand-danger)';
      case 'warning':
        return 'var(--brand-warn)';
      default:
        return 'var(--brand-primary)';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'danger':
        return 'rgba(224, 49, 49, 0.1)';
      case 'warning':
        return 'rgba(240, 140, 0, 0.1)';
      default:
        return 'rgba(18, 184, 134, 0.1)';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'danger':
        return '위험';
      case 'warning':
        return '주의';
      default:
        return '정상';
    }
  };

  return (
    <div
      className="p-6 rounded-3xl border-2"
      style={{
        backgroundColor: 'white',
        borderColor: 'var(--brand-border)',
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--brand-text)' }}>
          {title}
        </h3>
        <Button
          variant="outline"
          onClick={onAddRecord}
          className="gap-2"
          style={{
            minHeight: '56px',
            minWidth: '100px',
            fontSize: '1.1rem',
            borderColor: 'var(--brand-primary)',
            color: 'var(--brand-primary)',
            borderWidth: '2px',
          }}
        >
          <Plus className="w-6 h-6" />
          기록
        </Button>
      </div>

      {/* 메인 값 - 초대형 */}
      <div 
        className="mb-4 p-6 rounded-2xl text-center"
        style={{
          backgroundColor: getStatusBg(),
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <span
            style={{
              fontSize: '4rem',
              fontWeight: 700,
              color: getStatusColor(),
              lineHeight: 1.2,
            }}
          >
            {lastValue}
          </span>
          {unit && (
            <span
              style={{
                fontSize: '1.6rem',
                color: 'var(--brand-text-secondary)',
                fontWeight: 600,
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* 상태 표시 */}
        <div
          className="mt-4 inline-block px-6 py-2 rounded-full"
          style={{
            backgroundColor: getStatusColor(),
            color: 'white',
            fontSize: '1.3rem',
            fontWeight: 600,
          }}
        >
          {getStatusText()}
        </div>
      </div>

      {/* 기록 시간 */}
      <p
        className="text-center"
        style={{
          fontSize: '1.2rem',
          color: 'var(--brand-text-secondary)',
        }}
      >
        {lastTag && <span style={{ fontWeight: 600 }}>{lastTag} • </span>}
        {lastTime}
      </p>
    </div>
  );
}
