/**
 * Supabase Links DAO
 * 보호자-복용자 연결 데이터 관리
 */

import { supabase } from '../supabase.client';
import type { CareLink, LinkStatus } from '../../types/link';

/**
 * 연결 생성
 */
export async function createLink(link: Omit<CareLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareLink> {
  
  const { data, error } = await supabase
    .from('care_links')
    .insert({
      caregiver_id: link.caregiverId,
      patient_id: link.patientId,
      status: link.status,
      relation: link.relation,
      nickname: link.nickname,
      invite_code: link.inviteCode,
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase DAO] Failed to create link:', error);
    throw new Error(`Failed to create link: ${error.message}`);
  }

  return rowToLink(data);
}

/**
 * 보호자의 연결 목록 조회
 */
export async function getLinksByCaregiver(caregiverId: string): Promise<CareLink[]> {
  const { data, error } = await supabase
    .from('care_links')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase DAO] Failed to fetch links by caregiver:', error);
    throw new Error(`Failed to fetch links by caregiver: ${error.message}`);
  }

  return data.map(rowToLink);
}

/**
 * 복용자의 연결 목록 조회
 */
export async function getLinksByPatient(patientId: string): Promise<CareLink[]> {
  const { data, error } = await supabase
    .from('care_links')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase DAO] Failed to fetch links by patient:', error);
    throw new Error(`Failed to fetch links by patient: ${error.message}`);
  }

  return data.map(rowToLink);
}

/**
 * 초대 코드로 연결 조회
 */
export async function getLinkByInviteCode(inviteCode: string): Promise<CareLink | null> {
  const { data, error } = await supabase
    .from('care_links')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Supabase DAO] Failed to fetch link by invite code:', error);
    throw new Error(`Failed to fetch link by invite code: ${error.message}`);
  }

  return rowToLink(data);
}

/**
 * 연결 상태 업데이트
 */
export async function updateLinkStatus(linkId: string, status: LinkStatus): Promise<void> {
  const { error } = await supabase
    .from('care_links')
    .update({ status })
    .eq('id', linkId);

  if (error) {
    console.error('[Supabase DAO] Failed to update link status:', error);
    throw new Error(`Failed to update link status: ${error.message}`);
  }
}

/**
 * 연결 정보 업데이트
 */
export async function updateLink(
  linkId: string,
  updates: {
    nickname?: string;
    relation?: CareLink['relation'];
    inviteCode?: string;
  }
): Promise<void> {
  const updateData: any = {};
  if (updates.nickname !== undefined) updateData.nickname = updates.nickname;
  if (updates.relation !== undefined) updateData.relation = updates.relation;
  if (updates.inviteCode !== undefined) updateData.invite_code = updates.inviteCode;

  const { error } = await supabase
    .from('care_links')
    .update(updateData)
    .eq('id', linkId);

  if (error) {
    console.error('[Supabase DAO] Failed to update link:', error);
    throw new Error(`Failed to update link: ${error.message}`);
  }
}

/**
 * 연결 삭제
 */
export async function deleteLink(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('care_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('[Supabase DAO] Failed to delete link:', error);
    throw new Error(`Failed to delete link: ${error.message}`);
  }
}

/**
 * Row를 CareLink로 변환
 */
function rowToLink(row: any): CareLink {
  return {
    id: row.id,
    caregiverId: row.caregiver_id,
    patientId: row.patient_id,
    status: row.status,
    relation: row.relation,
    nickname: row.nickname,
    inviteCode: row.invite_code,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}
