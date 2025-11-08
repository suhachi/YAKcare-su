/**
 * Supabase Doses DAO
 * 복용 인스턴스 데이터 관리
 */

import { supabase } from '../supabase.client';
import type { DoseInstance, DoseStatus } from '../../types/dose';

/**
 * 복용 인스턴스 생성
 */
export async function createDose(dose: Omit<DoseInstance, 'id'>): Promise<DoseInstance> {
  
  const { data, error } = await supabase
    .from('doses')
    .insert({
      user_id: dose.userId,
      med_id: dose.medId,
      med_category: dose.medCategory,
      scheduled_at: new Date(dose.scheduledAt).toISOString(),
      slot_bucket: dose.slotBucket,
      intake_context: dose.intakeContext,
      status: dose.status,
      retries: dose.retries,
      has_pre_alert: dose.hasPreAlert,
      has_confirm_alert: dose.hasConfirmAlert,
      next_alert_at: dose.nextAlertAt ? new Date(dose.nextAlertAt).toISOString() : null,
      card_key: dose.cardKey,
      card_title: dose.cardTitle,
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase DAO] Failed to create dose:', error);
    throw new Error(`Failed to create dose: ${error.message}`);
  }

  return rowToDose(data);
}

/**
 * 특정 날짜 범위의 복용 인스턴스 조회
 */
export async function getDosesByDateRange(
  userId: string,
  startTime: number,
  endTime: number
): Promise<DoseInstance[]> {
  const { data, error } = await supabase
    .from('doses')
    .select('*')
    .eq('user_id', userId)
    .gte('scheduled_at', new Date(startTime).toISOString())
    .lt('scheduled_at', new Date(endTime).toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('[Supabase DAO] Failed to fetch doses:', error);
    throw new Error(`Failed to fetch doses: ${error.message}`);
  }

  return data.map(rowToDose);
}

/**
 * 복용 인스턴스 ID로 조회
 */
export async function getDoseById(doseId: string): Promise<DoseInstance | null> {
  const { data, error } = await supabase
    .from('doses')
    .select('*')
    .eq('id', doseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Supabase DAO] Failed to fetch dose:', error);
    throw new Error(`Failed to fetch dose: ${error.message}`);
  }

  return rowToDose(data);
}

/**
 * 복용 인스턴스 상태 업데이트
 */
export async function updateDoseStatus(
  doseId: string,
  status: DoseStatus,
  updates?: {
    retries?: number;
    hasConfirmAlert?: boolean;
    nextAlertAt?: number | null;
  }
): Promise<void> {
  const updateData: any = { status };
  if (updates?.retries !== undefined) updateData.retries = updates.retries;
  if (updates?.hasConfirmAlert !== undefined) updateData.has_confirm_alert = updates.hasConfirmAlert;
  if (updates?.nextAlertAt !== undefined) {
    updateData.next_alert_at = updates.nextAlertAt ? new Date(updates.nextAlertAt).toISOString() : null;
  }

  const { error } = await supabase
    .from('doses')
    .update(updateData)
    .eq('id', doseId);

  if (error) {
    console.error('[Supabase DAO] Failed to update dose status:', error);
    throw new Error(`Failed to update dose status: ${error.message}`);
  }
}

/**
 * 복용 인스턴스 삭제
 */
export async function deleteDose(doseId: string): Promise<void> {
  const { error } = await supabase
    .from('doses')
    .delete()
    .eq('id', doseId);

  if (error) {
    console.error('[Supabase DAO] Failed to delete dose:', error);
    throw new Error(`Failed to delete dose: ${error.message}`);
  }
}

/**
 * 특정 약의 모든 복용 인스턴스 삭제
 */
export async function deleteDosesByMedId(medId: string): Promise<void> {
  const { error } = await supabase
    .from('doses')
    .delete()
    .eq('med_id', medId);

  if (error) {
    console.error('[Supabase DAO] Failed to delete doses by med_id:', error);
    throw new Error(`Failed to delete doses by med_id: ${error.message}`);
  }
}

/**
 * 특정 사용자의 미래 복용 인스턴스 모두 삭제
 */
export async function deleteFutureDoses(userId: string, fromTime: number): Promise<void> {
  const { error } = await supabase
    .from('doses')
    .delete()
    .eq('user_id', userId)
    .gte('scheduled_at', new Date(fromTime).toISOString());

  if (error) {
    console.error('[Supabase DAO] Failed to delete future doses:', error);
    throw new Error(`Failed to delete future doses: ${error.message}`);
  }
}

/**
 * Row를 DoseInstance로 변환
 */
function rowToDose(row: any): DoseInstance {
  return {
    id: row.id,
    userId: row.user_id,
    medId: row.med_id,
    medCategory: row.med_category,
    scheduledAt: new Date(row.scheduled_at).getTime(),
    slotBucket: row.slot_bucket,
    intakeContext: row.intake_context,
    status: row.status,
    retries: row.retries,
    hasPreAlert: row.has_pre_alert,
    hasConfirmAlert: row.has_confirm_alert,
    nextAlertAt: row.next_alert_at ? new Date(row.next_alert_at).getTime() : undefined,
    cardKey: row.card_key,
    cardTitle: row.card_title,
  };
}
