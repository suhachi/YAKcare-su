import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface BPRecord {
  id: string;
  date: string; // "2025-10-22"
  time: string; // "오전 8:20"
  systolic: number;
  diastolic: number;
  status?: 'normal' | 'warning' | 'danger';
}

interface BGRecord {
  id: string;
  date: string; // "2025-10-22"
  time: string; // "오전 7:45"
  value: number;
  tag?: string; // "아침 공복", "저녁 식후2h"
  status?: 'normal' | 'warning' | 'danger';
}

interface HealthRecordListProps {
  type: 'bp' | 'bg';
  title: string;
  records: (BPRecord | BGRecord)[];
  initialShowCount?: number;
  onViewAll?: () => void; // 전체 기록 보기 콜백
  viewAllLabel?: string;
}

export function HealthRecordList({
  type,
  title,
  records,
  initialShowCount = 5,
  onViewAll,
  viewAllLabel = "전체 기록 보기",
}: HealthRecordListProps) {
  const [showAll, setShowAll] = useState(false);

  const displayRecords = showAll ? records : records.slice(0, initialShowCount);
  const hasMore = records.length > initialShowCount;

  const getStatusColor = (status?: 'normal' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger':
        return 'var(--brand-danger)';
      case 'warning':
        return 'var(--brand-warn)';
      default:
        return 'var(--brand-text-secondary)';
    }
  };

  const getStatusBg = (status?: 'normal' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger':
        return 'rgba(224, 49, 49, 0.1)';
      case 'warning':
        return 'rgba(240, 140, 0, 0.1)';
      default:
        return 'transparent';
    }
  };

  const getStatusText = (status?: 'normal' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger':
        return '위험';
      case 'warning':
        return '주의';
      case 'normal':
        return '정상';
      default:
        return '';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    }
  };

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: 'white',
        border: '2px solid var(--brand-border)',
        padding: '20px',
      }}
    >
      {/* 헤더 */}
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--brand-text)',
          marginBottom: '16px',
        }}
      >
        {title}
      </h3>

      {/* 기록 없음 */}
      {records.length === 0 && (
        <div
          className="py-8 text-center rounded-xl"
          style={{
            backgroundColor: 'var(--brand-bg)',
          }}
        >
          <p style={{ fontSize: '0.95rem', color: 'var(--brand-text-secondary)' }}>
            아직 기록이 없어요
          </p>
        </div>
      )}

      {/* 기록 리스트 */}
      {records.length > 0 && (
        <div className="space-y-3">
          {displayRecords.map((record) => (
            <div
              key={record.id}
              className="rounded-xl transition-all"
              style={{
                backgroundColor: getStatusBg(record.status),
                border: `1px solid ${record.status === 'danger' || record.status === 'warning' ? getStatusColor(record.status) : 'var(--brand-border)'}`,
                padding: '14px 16px',
              }}
            >
              <div className="flex items-center justify-between">
                {/* 왼쪽: 날짜/시간 */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--brand-text)',
                      }}
                    >
                      {formatDate(record.date)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--brand-text-secondary)',
                      }}
                    >
                      {record.time}
                    </span>
                  </div>
                  {'tag' in record && record.tag && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--brand-text-muted)',
                      }}
                    >
                      {record.tag}
                    </span>
                  )}
                </div>

                {/* 오른쪽: 수치 + 상태 */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {type === 'bp' && 'systolic' in record && (
                      <p
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 700,
                          color: getStatusColor(record.status),
                          lineHeight: 1.2,
                        }}
                      >
                        {record.systolic}/{record.diastolic}
                      </p>
                    )}
                    {type === 'bg' && 'value' in record && (
                      <p
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 700,
                          color: getStatusColor(record.status),
                          lineHeight: 1.2,
                        }}
                      >
                        {record.value}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--brand-text-muted)',
                      }}
                    >
                      {type === 'bp' ? 'mmHg' : 'mg/dL'}
                    </p>
                  </div>

                  {/* 상태 배지 */}
                  {record.status && record.status !== 'normal' && (
                    <Badge
                      style={{
                        backgroundColor: getStatusColor(record.status),
                        color: 'white',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 8px',
                      }}
                    >
                      {getStatusText(record.status)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 더보기/접기/전체보기 버튼 */}
      {onViewAll ? (
        // 전체 기록 보기 버튼
        <Button
          variant="outline"
          onClick={onViewAll}
          className="w-full mt-3"
          style={{
            fontSize: '0.95rem',
            color: 'var(--brand-primary)',
            fontWeight: 600,
            borderColor: 'var(--brand-primary)',
            backgroundColor: 'rgba(18, 184, 134, 0.05)',
            height: '44px',
          }}
        >
          {viewAllLabel}
        </Button>
      ) : (
        // 기존 더보기/접기 버튼
        hasMore && (
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-3 gap-2"
            style={{
              fontSize: '0.9rem',
              color: 'var(--brand-primary)',
              fontWeight: 600,
            }}
          >
            {showAll ? (
              <>
                접기 <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                {records.length - initialShowCount}개 더보기 <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        )
      )}
    </div>
  );
}
