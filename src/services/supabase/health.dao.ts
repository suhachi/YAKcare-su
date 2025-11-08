/**
 * Supabase Health Records DAO
 * 건강 기록 데이터 관리
 */

import { supabase } from '../supabase.client';
import type { HealthRecord, HealthRecordType } from '../../types/health';

/**
 * 건강 기록 생성
 */
export async function createHealthRecord(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
  
  const { data, error } = await supabase
    .from('health_records')
    .insert({
      user_id: record.userId,
      type: record.type,
      systolic: record.systolic,
      diastolic: record.diastolic,
      pulse: record.pulse,
      glucose: record.glucose,
      measurement_type: record.measurementType,
      tag: record.tag,
      time: new Date(record.time).toISOString(),
      memo: record.memo,
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase DAO] Failed to create health record:', error);
    throw new Error(`Failed to create health record: ${error.message}`);
  }

  return rowToHealthRecord(data);
}

/**
 * 특정 사용자의 건강 기록 조회 (최근 N개)
 */
export async function getHealthRecordsByUserId(
  userId: string,
  type?: HealthRecordType,
  limit = 30
): Promise<HealthRecord[]> {
  let query = supabase
    .from('health_records')
    .select('*')
    .eq('user_id', userId)
    .order('time', { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase DAO] Failed to fetch health records:', error);
    throw new Error(`Failed to fetch health records: ${error.message}`);
  }

  return data.map(rowToHealthRecord);
}

/**
 * 특정 날짜 범위의 건강 기록 조회
 */
export async function getHealthRecordsByDateRange(
  userId: string,
  startTime: number,
  endTime: number,
  type?: HealthRecordType
): Promise<HealthRecord[]> {
  let query = supabase
    .from('health_records')
    .select('*')
    .eq('user_id', userId)
    .gte('time', new Date(startTime).toISOString())
    .lt('time', new Date(endTime).toISOString())
    .order('time', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase DAO] Failed to fetch health records by date range:', error);
    throw new Error(`Failed to fetch health records by date range: ${error.message}`);
  }

  return data.map(rowToHealthRecord);
}

/**
 * 건강 기록 ID로 조회
 */
export async function getHealthRecordById(recordId: string): Promise<HealthRecord | null> {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Supabase DAO] Failed to fetch health record:', error);
    throw new Error(`Failed to fetch health record: ${error.message}`);
  }

  return rowToHealthRecord(data);
}

/**
 * 건강 기록 수정
 */
export async function updateHealthRecord(
  recordId: string,
  updates: Partial<Omit<HealthRecord, 'id' | 'userId' | 'type'>>
): Promise<void> {
  const updateData: any = {};
  if (updates.systolic !== undefined) updateData.systolic = updates.systolic;
  if (updates.diastolic !== undefined) updateData.diastolic = updates.diastolic;
  if (updates.pulse !== undefined) updateData.pulse = updates.pulse;
  if (updates.glucose !== undefined) updateData.glucose = updates.glucose;
  if (updates.measurementType !== undefined) updateData.measurement_type = updates.measurementType;
  if (updates.tag !== undefined) updateData.tag = updates.tag;
  if (updates.time !== undefined) updateData.time = new Date(updates.time).toISOString();
  if (updates.memo !== undefined) updateData.memo = updates.memo;

  const { error } = await supabase
    .from('health_records')
    .update(updateData)
    .eq('id', recordId);

  if (error) {
    console.error('[Supabase DAO] Failed to update health record:', error);
    throw new Error(`Failed to update health record: ${error.message}`);
  }
}

/**
 * 건강 기록 삭제
 */
export async function deleteHealthRecord(recordId: string): Promise<void> {
  const { error } = await supabase
    .from('health_records')
    .delete()
    .eq('id', recordId);

  if (error) {
    console.error('[Supabase DAO] Failed to delete health record:', error);
    throw new Error(`Failed to delete health record: ${error.message}`);
  }
}

/**
 * Row를 HealthRecord로 변환
 */
function rowToHealthRecord(row: any): HealthRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    glucose: row.glucose,
    measurementType: row.measurement_type,
    tag: row.tag,
    time: new Date(row.time).getTime(),
    memo: row.memo,
  };
}
