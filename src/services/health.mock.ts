// 건강 기록 저장/조회 서비스 (Mock)

import { HealthRecord, HealthStats, HealthRecordType } from '../types/health';

// 메모리 저장소
const store = new Map<string, HealthRecord>();

// 고유 ID 생성
function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * 건강 기록 저장
 */
export async function saveHealthRecord(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
  const newRecord: HealthRecord = {
    ...record,
    id: generateId(),
    time: record.time || Date.now(),
  };

  store.set(newRecord.id, newRecord);

  console.log('GA4: health_record_save', {
    type: newRecord.type,
    tag: newRecord.tag,
    userId: newRecord.userId,
  });

  return newRecord;
}

/**
 * 건강 기록 조회
 */
export async function listHealthRecords(
  userId: string,
  type: HealthRecordType,
  days = 7
): Promise<HealthRecord[]> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;

  return Array.from(store.values())
    .filter((r) => r.userId === userId && r.type === type && r.time >= since)
    .sort((a, b) => b.time - a.time); // 최신순
}

/**
 * 건강 기록 통계
 */
export async function getHealthStats(
  userId: string,
  type: HealthRecordType,
  days = 7
): Promise<HealthStats> {
  const records = await listHealthRecords(userId, type, days);

  if (type === 'BP') {
    const validRecords = records.filter((r) => r.systolic && r.diastolic);
    const avgSystolic = validRecords.length
      ? Math.round(validRecords.reduce((sum, r) => sum + (r.systolic || 0), 0) / validRecords.length)
      : undefined;
    const avgDiastolic = validRecords.length
      ? Math.round(validRecords.reduce((sum, r) => sum + (r.diastolic || 0), 0) / validRecords.length)
      : undefined;
    const avgPulse = validRecords.length
      ? Math.round(validRecords.reduce((sum, r) => sum + (r.pulse || 0), 0) / validRecords.length)
      : undefined;

    return {
      avgSystolic,
      avgDiastolic,
      avgPulse,
      recentCount: validRecords.length,
      recent: records.slice(0, 10), // 최근 10개
    };
  } else {
    // BG
    const validRecords = records.filter((r) => r.glucose);
    const avgGlucose = validRecords.length
      ? Math.round(validRecords.reduce((sum, r) => sum + (r.glucose || 0), 0) / validRecords.length)
      : undefined;

    return {
      avgGlucose,
      recentCount: validRecords.length,
      recent: records.slice(0, 10),
    };
  }
}

/**
 * 오늘의 기록 조회
 */
export async function getTodayRecords(userId: string, type: HealthRecordType): Promise<HealthRecord[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  return Array.from(store.values())
    .filter((r) => r.userId === userId && r.type === type && r.time >= todayStart && r.time < todayEnd)
    .sort((a, b) => b.time - a.time);
}

/**
 * 특정 기록 삭제
 */
export async function deleteHealthRecord(id: string): Promise<boolean> {
  const exists = store.has(id);
  if (exists) {
    store.delete(id);
    console.log('GA4: health_record_delete', { id });
  }
  return exists;
}

/**
 * 메모리 초기화 (테스트용)
 */
export function clearHealthRecords(): void {
  store.clear();
  console.log('[HealthRecord] Memory cleared');
}

/**
 * 디버깅용 통계
 */
export function getStoreStats() {
  const all = Array.from(store.values());
  return {
    total: all.length,
    bp: all.filter((r) => r.type === 'BP').length,
    bg: all.filter((r) => r.type === 'BG').length,
    users: new Set(all.map((r) => r.userId)).size,
  };
}

/**
 * Sparkline용 7일 데이터
 */
export async function getSparklineData(
  userId: string,
  type: HealthRecordType
): Promise<{ date: string; value: number }[]> {
  const records = await listHealthRecords(userId, type, 7);
  
  // 날짜별로 그룹화
  const byDate = new Map<string, number[]>();
  
  records.forEach((r) => {
    const date = new Date(r.time).toISOString().split('T')[0];
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    
    if (type === 'BP' && r.systolic) {
      byDate.get(date)!.push(r.systolic);
    } else if (type === 'BG' && r.glucose) {
      byDate.get(date)!.push(r.glucose);
    }
  });
  
  // 평균 계산
  const result: { date: string; value: number }[] = [];
  byDate.forEach((values, date) => {
    const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    result.push({ date, value: avg });
  });
  
  return result.sort((a, b) => a.date.localeCompare(b.date));
}
