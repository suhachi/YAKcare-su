import { Badge } from "../ui/badge";
import { Activity } from "lucide-react";

interface HealthBadgeProps {
  completed: number; // 완료된 측정 수 (0-2)
  total: number;     // 총 측정 목표 (기본 2: BP + BG)
  onClick?: () => void;
}

/**
 * 건강 기록 배지 (HomeToday 우측 상단)
 * "오늘 측정 x/2" 형식
 * 
 * F5 스펙: HealthBadge 컴포넌트
 */
export function HealthBadge({ completed = 0, total = 2, onClick }: HealthBadgeProps) {
  const isComplete = completed >= total;
  const hasProgress = completed > 0;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all active:scale-95"
      style={{
        backgroundColor: isComplete 
          ? 'rgba(18, 184, 134, 0.1)' 
          : hasProgress
          ? 'rgba(240, 140, 0, 0.1)'
          : 'var(--brand-bg)',
        border: `1px solid ${
          isComplete
            ? 'var(--brand-primary)'
            : hasProgress
            ? 'var(--brand-warn)'
            : 'var(--brand-border)'
        }`,
      }}
      aria-label={`오늘 건강 측정 ${completed}/${total}`}
    >
      <Activity
        className="w-4 h-4"
        style={{
          color: isComplete
            ? 'var(--brand-primary)'
            : hasProgress
            ? 'var(--brand-warn)'
            : 'var(--brand-text-muted)',
        }}
      />
      <span
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: isComplete
            ? 'var(--brand-primary)'
            : hasProgress
            ? 'var(--brand-warn)'
            : 'var(--brand-text-secondary)',
        }}
      >
        오늘 측정 {completed}/{total}
      </span>
    </button>
  );
}
