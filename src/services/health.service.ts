/**
 * 통합 건강 기록 관리 서비스
 * Feature Flag에 따라 Supabase/Firebase/Mock 자동 전환
 */

import { ACTIVE_FLAGS } from '../config/env';
import type { HealthRecord, HealthRecordType } from '../types/health';

const DEV_ONLY_MESSAGE = 'Mock 서비스는 개발 모드에서만 사용할 수 있습니다.';

type HealthMockModule = typeof import('./health.mock');
let healthMockModule: Promise<HealthMockModule> | null = null;
const loadHealthMock: () => Promise<HealthMockModule> = import.meta.env.DEV
  ? () => {
      if (!healthMockModule) {
        healthMockModule = import('./health.mock');
      }
      return healthMockModule;
    }
  : () => Promise.reject(new Error(`Health Mock: ${DEV_ONLY_MESSAGE}`));

/**
 * 건강 기록 생성
 */
export async function createHealthRecord(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
  if (ACTIVE_FLAGS.USE_SUPABASE_HEALTH) {
    return await createWithSupabase(record);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_HEALTH) {
    return await createWithFirestore(record);
  } else {
    return await createWithMock(record);
  }
}

/**
 * 건강 기록 저장 (createHealthRecord의 별칭)
 */
export async function saveHealthRecord(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
  return createHealthRecord(record);
}

/**
 * 오늘의 건강 기록 조회
 */
export async function getTodayRecords(
  userId: string,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  if (ACTIVE_FLAGS.USE_SUPABASE_HEALTH) {
    return await getTodayWithSupabase(userId, type);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_HEALTH) {
    return await getTodayWithFirestore(userId, type);
  } else {
    return await getTodayWithMock(userId, type);
  }
}

/**
 * 최근 N개 건강 기록 조회
 */
export async function getRecentRecords(
  userId: string,
  type?: HealthRecordType,
  limit = 30
): Promise<HealthRecord[]> {
  if (ACTIVE_FLAGS.USE_SUPABASE_HEALTH) {
    return await getRecentWithSupabase(userId, type, limit);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_HEALTH) {
    return await getRecentWithFirestore(userId, type, limit);
  } else {
    return await getRecentWithMock(userId, type, limit);
  }
}

/**
 * 특정 날짜 범위의 건강 기록 조회
 */
export async function getRecordsByDateRange(
  userId: string,
  startTime: number,
  endTime: number,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  if (ACTIVE_FLAGS.USE_SUPABASE_HEALTH) {
    return await getByRangeWithSupabase(userId, startTime, endTime, type);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_HEALTH) {
    return await getByRangeWithFirestore(userId, startTime, endTime, type);
  } else {
    return await getByRangeWithMock(userId, startTime, endTime, type);
  }
}

/**
 * 건강 기록 수정
 */
export async function updateHealthRecord(
  recordId: string,
  updates: Partial<Omit<HealthRecord, 'id' | 'userId' | 'type'>>
): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_HEALTH) {
    return await updateWithSupabase(recordId, updates);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_HEALTH) {
    return await updateWithFirestore(recordId, updates);
  } else {
    return await updateWithMock(recordId, updates);
  }
}

/**
 * 건강 기록 삭제
 */
export async function deleteHealthRecord(recordId: string): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_HEALTH) {
    return await deleteWithSupabase(recordId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_HEALTH) {
    return await deleteWithFirestore(recordId);
  } else {
    return await deleteWithMock(recordId);
  }
}

// ========== Supabase 구현 ==========

async function createWithSupabase(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
  const { createHealthRecord } = await import('./supabase/health.dao');
  return await createHealthRecord(record);
}

async function getTodayWithSupabase(
  userId: string,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  const { getHealthRecordsByDateRange } = await import('./supabase/health.dao');
  
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  return await getHealthRecordsByDateRange(userId, start.getTime(), end.getTime(), type);
}

async function getRecentWithSupabase(
  userId: string,
  type?: HealthRecordType,
  limit = 30
): Promise<HealthRecord[]> {
  const { getHealthRecordsByUserId } = await import('./supabase/health.dao');
  return await getHealthRecordsByUserId(userId, type, limit);
}

async function getByRangeWithSupabase(
  userId: string,
  startTime: number,
  endTime: number,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  const { getHealthRecordsByDateRange } = await import('./supabase/health.dao');
  return await getHealthRecordsByDateRange(userId, startTime, endTime, type);
}

async function updateWithSupabase(
  recordId: string,
  updates: Partial<Omit<HealthRecord, 'id' | 'userId' | 'type'>>
): Promise<void> {
  const { updateHealthRecord } = await import('./supabase/health.dao');
  return await updateHealthRecord(recordId, updates);
}

async function deleteWithSupabase(recordId: string): Promise<void> {
  const { deleteHealthRecord } = await import('./supabase/health.dao');
  return await deleteHealthRecord(recordId);
}

// ========== Firestore 구현 ==========

async function createWithFirestore(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function getTodayWithFirestore(
  userId: string,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function getRecentWithFirestore(
  userId: string,
  type?: HealthRecordType,
  limit = 30
): Promise<HealthRecord[]> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function getByRangeWithFirestore(
  userId: string,
  startTime: number,
  endTime: number,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function updateWithFirestore(
  recordId: string,
  updates: Partial<Omit<HealthRecord, 'id' | 'userId' | 'type'>>
): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function deleteWithFirestore(recordId: string): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

// ========== Mock 구현 ==========

async function createWithMock(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
  const healthMock = await loadHealthMock();
  return await healthMock.createHealthRecord(record);
}

async function getTodayWithMock(
  userId: string,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  const healthMock = await loadHealthMock();
  return await healthMock.getTodayRecords(userId, type);
}

async function getRecentWithMock(
  userId: string,
  type?: HealthRecordType,
  limit = 30
): Promise<HealthRecord[]> {
  const healthMock = await loadHealthMock();
  return await healthMock.getRecentRecords(userId, type, limit);
}

async function getByRangeWithMock(
  userId: string,
  startTime: number,
  endTime: number,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  const healthMock = await loadHealthMock();
  return await healthMock.getRecordsByDateRange(userId, startTime, endTime, type);
}

async function updateWithMock(
  recordId: string,
  updates: Partial<Omit<HealthRecord, 'id' | 'userId' | 'type'>>
): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error(`Health Mock: ${DEV_ONLY_MESSAGE}`);
  }
  console.warn('[Mock] updateHealthRecord not implemented');
}

async function deleteWithMock(recordId: string): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error(`Health Mock: ${DEV_ONLY_MESSAGE}`);
  }
  console.warn('[Mock] deleteHealthRecord not implemented');
}
