interface SparklinePoint {
  value: number;
  date: string; // "10/15"
  color?: string;
}

interface Sparkline7dProps {
  points: SparklinePoint[];
  unit?: string; // "mmHg" or "mg/dL"
  height?: number;
}

export function Sparkline7d({ points, unit = '', height = 48 }: Sparkline7dProps) {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          height,
          backgroundColor: 'var(--brand-bg)',
          color: 'var(--brand-text-muted)',
          fontSize: '0.875rem',
        }}
      >
        데이터 없음
      </div>
    );
  }

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const width = 200;
  const padding = 8;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // 점 좌표 계산
  const getX = (index: number) => padding + (chartWidth / (points.length - 1)) * index;
  const getY = (value: number) => padding + chartHeight - ((value - min) / range) * chartHeight;

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className="overflow-visible"
      >
        {/* 연결선 */}
        {points.length > 1 && (
          <polyline
            points={points.map((p, i) => `${getX(i)},${getY(p.value)}`).join(' ')}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="2"
            opacity="0.4"
          />
        )}
        
        {/* 점 */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={getX(index)}
              cy={getY(point.value)}
              r="4"
              fill={point.color || 'var(--brand-primary)'}
              stroke="white"
              strokeWidth="2"
            />
            
            {/* 툴팁 (호버 시) */}
            <title>
              {point.date}: {point.value}{unit}
            </title>
          </g>
        ))}
      </svg>
      
      {/* 범위 표시 */}
      <div
        className="flex justify-between mt-1"
        style={{
          fontSize: '0.75rem',
          color: 'var(--brand-text-muted)',
        }}
      >
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}
