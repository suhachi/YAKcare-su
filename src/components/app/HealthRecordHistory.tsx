import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BPRecord {
  id: string;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  status?: 'normal' | 'warning' | 'danger';
}

interface BGRecord {
  id: string;
  date: string;
  time: string;
  value: number;
  tag?: string;
  status?: 'normal' | 'warning' | 'danger';
}

interface HealthRecordHistoryProps {
  patientName: string;
  bpRecords: BPRecord[];
  bgRecords: BGRecord[];
  onBack: () => void;
}

export function HealthRecordHistory({
  patientName,
  bpRecords,
  bgRecords,
  onBack,
}: HealthRecordHistoryProps) {
  const [activeTab, setActiveTab] = useState<'bp' | 'bg'>('bp');

  // 월별로 그룹핑
  const groupByMonth = (records: (BPRecord | BGRecord)[]) => {
    const groups: { [key: string]: (BPRecord | BGRecord)[] } = {};
    
    records.forEach(record => {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  // 혈압 통계
  const bpStats = useMemo(() => {
    if (bpRecords.length === 0) return null;
    
    const systolicValues = bpRecords.map(r => r.systolic);
    const diastolicValues = bpRecords.map(r => r.diastolic);
    
    return {
      avgSystolic: Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length),
      avgDiastolic: Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length),
      maxSystolic: Math.max(...systolicValues),
      minSystolic: Math.min(...systolicValues),
      normalCount: bpRecords.filter(r => r.status === 'normal').length,
      warningCount: bpRecords.filter(r => r.status === 'warning').length,
      dangerCount: bpRecords.filter(r => r.status === 'danger').length,
    };
  }, [bpRecords]);

  // 혈당 통계
  const bgStats = useMemo(() => {
    if (bgRecords.length === 0) return null;
    
    const values = bgRecords.map(r => r.value);
    
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      max: Math.max(...values),
      min: Math.min(...values),
      normalCount: bgRecords.filter(r => r.status === 'normal').length,
      warningCount: bgRecords.filter(r => r.status === 'warning').length,
      dangerCount: bgRecords.filter(r => r.status === 'danger').length,
    };
  }, [bgRecords]);

  const bpGrouped = groupByMonth(bpRecords);
  const bgGrouped = groupByMonth(bgRecords);

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

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
        return 'rgba(224, 49, 49, 0.08)';
      case 'warning':
        return 'rgba(240, 140, 0, 0.08)';
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
      default:
        return '';
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-bg)' }}
    >
      {/* Safe Area Top */}
      <div style={{ height: '44px' }} />

      {/* 헤더 */}
      <div
        className="sticky top-0 z-10 px-4 py-3"
        style={{ backgroundColor: 'white', borderBottom: '1px solid var(--brand-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'var(--brand-bg)',
              border: '1px solid var(--brand-border)',
            }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--brand-text)' }} />
          </button>
          <div>
            <h1
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'var(--brand-text)',
              }}
            >
              건강 기록
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--brand-text-secondary)' }}>
              {patientName} · 최근 6개월
            </p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'bp' | 'bg')} className="px-4 pt-4">
        <TabsList
          className="grid w-full grid-cols-2 mb-4"
          style={{
            backgroundColor: 'white',
            border: '2px solid var(--brand-border)',
            padding: '4px',
            height: 'auto',
          }}
        >
          <TabsTrigger
            value="bp"
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              padding: '12px',
            }}
          >
            혈압
          </TabsTrigger>
          <TabsTrigger
            value="bg"
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              padding: '12px',
            }}
          >
            혈당
          </TabsTrigger>
        </TabsList>

        {/* 혈압 탭 */}
        <TabsContent value="bp" className="space-y-4 pb-8">
          {/* 통계 카드 */}
          {bpStats && (
            <div
              className="rounded-2xl p-5"
              style={{
                backgroundColor: 'white',
                border: '2px solid var(--brand-border)',
              }}
            >
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--brand-text)',
                  marginBottom: '12px',
                }}
              >
                전체 통계 · {bpRecords.length}회
              </h3>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <p style={{ fontSize: '0.75rem', color: 'var(--brand-text-muted)', marginBottom: '4px' }}>
                    평균
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-text)' }}>
                    {bpStats.avgSystolic}/{bpStats.avgDiastolic}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: '0.75rem', color: 'var(--brand-text-muted)', marginBottom: '4px' }}>
                    최고
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-danger)' }}>
                    {bpStats.maxSystolic}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: '0.75rem', color: 'var(--brand-text-muted)', marginBottom: '4px' }}>
                    최저
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {bpStats.minSystolic}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                {bpStats.dangerCount > 0 && (
                  <Badge
                    style={{
                      backgroundColor: 'rgba(224, 49, 49, 0.1)',
                      color: 'var(--brand-danger)',
                      border: 'none',
                      fontSize: '0.75rem',
                    }}
                  >
                    위험 {bpStats.dangerCount}회
                  </Badge>
                )}
                {bpStats.warningCount > 0 && (
                  <Badge
                    style={{
                      backgroundColor: 'rgba(240, 140, 0, 0.1)',
                      color: 'var(--brand-warn)',
                      border: 'none',
                      fontSize: '0.75rem',
                    }}
                  >
                    주의 {bpStats.warningCount}회
                  </Badge>
                )}
                <Badge
                  style={{
                    backgroundColor: 'rgba(18, 184, 134, 0.1)',
                    color: 'var(--brand-primary)',
                    border: 'none',
                    fontSize: '0.75rem',
                  }}
                >
                  정상 {bpStats.normalCount}회
                </Badge>
              </div>
            </div>
          )}

          {/* 월별 기록 */}
          {bpGrouped.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                backgroundColor: 'white',
                border: '2px solid var(--brand-border)',
              }}
            >
              <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
                아직 혈압 기록이 없어요
              </p>
            </div>
          ) : (
            bpGrouped.map(([monthKey, records]) => (
              <div key={monthKey}>
                <h3
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--brand-text-secondary)',
                    marginBottom: '8px',
                    paddingLeft: '4px',
                  }}
                >
                  {formatMonthLabel(monthKey)}
                </h3>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: 'white',
                    border: '2px solid var(--brand-border)',
                  }}
                >
                  {(records as BPRecord[]).map((record, idx) => (
                    <div
                      key={record.id}
                      className="px-4 py-3"
                      style={{
                        backgroundColor: getStatusBg(record.status),
                        borderTop: idx > 0 ? '1px solid var(--brand-border)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: 'var(--brand-text)',
                              marginBottom: '2px',
                            }}
                          >
                            {formatDate(record.date)}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--brand-text-secondary)' }}>
                            {record.time}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              style={{
                                fontSize: '1.3rem',
                                fontWeight: 700,
                                color: getStatusColor(record.status),
                                lineHeight: 1.2,
                              }}
                            >
                              {record.systolic}/{record.diastolic}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--brand-text-muted)' }}>
                              mmHg
                            </p>
                          </div>

                          {record.status && record.status !== 'normal' && (
                            <Badge
                              style={{
                                backgroundColor: getStatusColor(record.status),
                                color: 'white',
                                border: 'none',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '3px 8px',
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
              </div>
            ))
          )}
        </TabsContent>

        {/* 혈당 탭 */}
        <TabsContent value="bg" className="space-y-4 pb-8">
          {/* 통계 카드 */}
          {bgStats && (
            <div
              className="rounded-2xl p-5"
              style={{
                backgroundColor: 'white',
                border: '2px solid var(--brand-border)',
              }}
            >
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--brand-text)',
                  marginBottom: '12px',
                }}
              >
                전체 통계 · {bgRecords.length}회
              </h3>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <p style={{ fontSize: '0.75rem', color: 'var(--brand-text-muted)', marginBottom: '4px' }}>
                    평균
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-text)' }}>
                    {bgStats.avg}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: '0.75rem', color: 'var(--brand-text-muted)', marginBottom: '4px' }}>
                    최고
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-danger)' }}>
                    {bgStats.max}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: '0.75rem', color: 'var(--brand-text-muted)', marginBottom: '4px' }}>
                    최저
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {bgStats.min}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                {bgStats.dangerCount > 0 && (
                  <Badge
                    style={{
                      backgroundColor: 'rgba(224, 49, 49, 0.1)',
                      color: 'var(--brand-danger)',
                      border: 'none',
                      fontSize: '0.75rem',
                    }}
                  >
                    위험 {bgStats.dangerCount}회
                  </Badge>
                )}
                {bgStats.warningCount > 0 && (
                  <Badge
                    style={{
                      backgroundColor: 'rgba(240, 140, 0, 0.1)',
                      color: 'var(--brand-warn)',
                      border: 'none',
                      fontSize: '0.75rem',
                    }}
                  >
                    주의 {bgStats.warningCount}회
                  </Badge>
                )}
                <Badge
                  style={{
                    backgroundColor: 'rgba(18, 184, 134, 0.1)',
                    color: 'var(--brand-primary)',
                    border: 'none',
                    fontSize: '0.75rem',
                  }}
                >
                  정상 {bgStats.normalCount}회
                </Badge>
              </div>
            </div>
          )}

          {/* 월별 기록 */}
          {bgGrouped.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                backgroundColor: 'white',
                border: '2px solid var(--brand-border)',
              }}
            >
              <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
                아직 혈당 기록이 없어요
              </p>
            </div>
          ) : (
            bgGrouped.map(([monthKey, records]) => (
              <div key={monthKey}>
                <h3
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--brand-text-secondary)',
                    marginBottom: '8px',
                    paddingLeft: '4px',
                  }}
                >
                  {formatMonthLabel(monthKey)}
                </h3>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: 'white',
                    border: '2px solid var(--brand-border)',
                  }}
                >
                  {(records as BGRecord[]).map((record, idx) => (
                    <div
                      key={record.id}
                      className="px-4 py-3"
                      style={{
                        backgroundColor: getStatusBg(record.status),
                        borderTop: idx > 0 ? '1px solid var(--brand-border)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: 'var(--brand-text)',
                              marginBottom: '2px',
                            }}
                          >
                            {formatDate(record.date)}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--brand-text-secondary)' }}>
                            {record.time} {record.tag && `· ${record.tag}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              style={{
                                fontSize: '1.3rem',
                                fontWeight: 700,
                                color: getStatusColor(record.status),
                                lineHeight: 1.2,
                              }}
                            >
                              {record.value}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--brand-text-muted)' }}>
                              mg/dL
                            </p>
                          </div>

                          {record.status && record.status !== 'normal' && (
                            <Badge
                              style={{
                                backgroundColor: getStatusColor(record.status),
                                color: 'white',
                                border: 'none',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '3px 8px',
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
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
