interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export function ProgressRing({ completed, total, size = 64 }: ProgressRingProps) {
  // 0/25/50/75/100 단계로 반올림
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const step = Math.round(percentage / 25) * 25;
  
  // 원형 진행률 계산
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (step / 100) * circumference;
  
  // 색상 결정
  const getColor = (step: number) => {
    if (step === 100) return 'var(--brand-primary)';
    if (step >= 75) return 'var(--brand-accent)';
    if (step >= 50) return 'var(--brand-warn)';
    return 'var(--brand-text-muted)';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* 배경 원 */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--brand-border)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(step)}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease',
            }}
          />
        </svg>
        
        {/* 중앙 퍼센트 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="tabular-nums"
            style={{
              fontSize: size * 0.3,
              fontWeight: 600,
              color: getColor(step),
            }}
          >
            {step}%
          </span>
        </div>
      </div>
      
      {/* 완료/예정 텍스트 */}
      <p
        className="text-center"
        style={{
          fontSize: '1.2rem',
          fontWeight: 600,
          color: 'var(--brand-text-secondary)',
        }}
      >
        {completed}/{total}
      </p>
    </div>
  );
}
