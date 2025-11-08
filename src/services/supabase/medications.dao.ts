/**
 * Supabase Medications DAO
 * 약 등록 데이터 관리
 */

import { supabase } from '../supabase.client';
import type { Medication, MedicationDraft } from '../../types/meds';

/**
 * 약 등록 생성
 */
export async function createMedication(draft: MedicationDraft): Promise<Medication> {
  
  const { data, error } = await supabase
    .from('medications')
    .insert({
      user_id: draft.userId,
      name: draft.name,
      category: draft.category,
      chronic_type: draft.chronicType,
      duration_days: draft.durationDays,
      is_continuous: draft.isContinuous || false,
      slots: draft.slots,
      times: draft.times,
      intake_context: draft.intakeContext,
      source: draft.source,
      source_url: draft.sourceUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase DAO] Failed to create medication:', error);
    throw new Error(`Failed to create medication: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    category: data.category,
    chronicType: data.chronic_type,
    durationDays: data.duration_days,
    isContinuous: data.is_continuous,
    slots: data.slots,
    times: data.times,
    intakeContext: data.intake_context,
    source: data.source,
    sourceUrl: data.source_url,
    createdAt: new Date(data.created_at).getTime(),
  };
}

/**
 * 특정 사용자의 약 목록 조회
 */
export async function getMedicationsByUserId(userId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase DAO] Failed to fetch medications:', error);
    throw new Error(`Failed to fetch medications: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    chronicType: row.chronic_type,
    durationDays: row.duration_days,
    isContinuous: row.is_continuous,
    slots: row.slots,
    times: row.times,
    intakeContext: row.intake_context,
    source: row.source,
    sourceUrl: row.source_url,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

/**
 * 약 ID로 조회
 */
export async function getMedicationById(medId: string): Promise<Medication | null> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', medId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('[Supabase DAO] Failed to fetch medication:', error);
    throw new Error(`Failed to fetch medication: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    category: data.category,
    chronicType: data.chronic_type,
    durationDays: data.duration_days,
    isContinuous: data.is_continuous,
    slots: data.slots,
    times: data.times,
    intakeContext: data.intake_context,
    source: data.source,
    sourceUrl: data.source_url,
    createdAt: new Date(data.created_at).getTime(),
  };
}

/**
 * 약 수정
 */
export async function updateMedication(medId: string, updates: Partial<MedicationDraft>): Promise<void> {
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.chronicType !== undefined) updateData.chronic_type = updates.chronicType;
  if (updates.durationDays !== undefined) updateData.duration_days = updates.durationDays;
  if (updates.isContinuous !== undefined) updateData.is_continuous = updates.isContinuous;
  if (updates.slots !== undefined) updateData.slots = updates.slots;
  if (updates.times !== undefined) updateData.times = updates.times;
  if (updates.intakeContext !== undefined) updateData.intake_context = updates.intakeContext;
  if (updates.sourceUrl !== undefined) updateData.source_url = updates.sourceUrl;

  const { error } = await supabase
    .from('medications')
    .update(updateData)
    .eq('id', medId);

  if (error) {
    console.error('[Supabase DAO] Failed to update medication:', error);
    throw new Error(`Failed to update medication: ${error.message}`);
  }
}

/**
 * 약 삭제
 */
export async function deleteMedication(medId: string): Promise<void> {
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', medId);

  if (error) {
    console.error('[Supabase DAO] Failed to delete medication:', error);
    throw new Error(`Failed to delete medication: ${error.message}`);
  }
}
