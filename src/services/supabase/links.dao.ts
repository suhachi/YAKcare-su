/**
 * Supabase Links DAO
 * 보호자-복용자 연결 데이터 관리
 */

import { supabase } from '../supabase.client';
import type { CareLink, LinkInvite, LinkStatus, RelationType } from '../../types/link';
import { LINK_LIMITS } from '../../types/link';

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

export async function createLinkInvite(params: {
  caregiverId: string;
  inviteCode: string;
  expiresAt: number;
  deepLink: string;
  relation?: RelationType;
}): Promise<LinkInvite> {
  const { caregiverId, inviteCode, expiresAt, deepLink, relation } = params;

  const { data, error } = await supabase
    .from('care_link_invites')
    .insert({
      caregiver_id: caregiverId,
      invite_code: inviteCode,
      expires_at: new Date(expiresAt).toISOString(),
      deep_link: deepLink,
      relation: relation ?? 'GUARDIAN',
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase DAO] Failed to create invite:', error);
    throw new Error(`Failed to create invite: ${error.message}`);
  }

  return {
    inviteCode: data.invite_code,
    caregiverId: data.caregiver_id,
    expiresAt: new Date(data.expires_at).getTime(),
    deepLink: data.deep_link ?? deepLink,
  };
}

export async function acceptInviteByCode(
  inviteCode: string,
  patientId: string,
  relation: RelationType,
  nickname?: string
): Promise<CareLink> {
  const { data: invite, error } = await supabase
    .from('care_link_invites')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('status', 'PENDING')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('INVITE_NOT_FOUND: 초대 코드를 찾을 수 없습니다');
    }
    console.error('[Supabase DAO] Failed to fetch invite:', error);
    throw new Error(`Failed to fetch invite: ${error.message}`);
  }

  const expiresAtMs = new Date(invite.expires_at).getTime();
  if (Date.now() > expiresAtMs) {
    await supabase
      .from('care_link_invites')
      .update({ status: 'EXPIRED' })
      .eq('id', invite.id);
    throw new Error('INVITE_EXPIRED: 초대 코드가 만료되었습니다');
  }

  const { error: caregiverLimitError, count: caregiverCount } = await supabase
    .from('care_links')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patientId)
    .eq('status', 'ACTIVE');

  if (caregiverLimitError) {
    console.error('[Supabase DAO] Failed to check caregiver limit:', caregiverLimitError);
    throw new Error(`Failed to validate caregiver limit: ${caregiverLimitError.message}`);
  }

  if ((caregiverCount ?? 0) >= LINK_LIMITS.MAX_CAREGIVERS_PER_PATIENT) {
    throw new Error(
      `LINK_LIMIT_EXCEEDED: 최대 ${LINK_LIMITS.MAX_CAREGIVERS_PER_PATIENT}명의 보호자만 연결할 수 있습니다`
    );
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from('care_links')
    .select('id')
    .eq('patient_id', patientId)
    .eq('caregiver_id', invite.caregiver_id)
    .maybeSingle();

  if (duplicateError && duplicateError.code !== 'PGRST116') {
    console.error('[Supabase DAO] Failed to check duplicate link:', duplicateError);
    throw new Error(`Failed to validate duplicate link: ${duplicateError.message}`);
  }

  if (duplicate) {
    throw new Error('ALREADY_LINKED: 이미 연결된 보호자입니다');
  }

  const { error: caregiverActiveError, count: caregiverActiveCount } = await supabase
    .from('care_links')
    .select('id', { count: 'exact', head: true })
    .eq('caregiver_id', invite.caregiver_id)
    .eq('status', 'ACTIVE');

  if (caregiverActiveError) {
    console.error('[Supabase DAO] Failed to check caregiver active links:', caregiverActiveError);
    throw new Error(`Failed to validate caregiver link count: ${caregiverActiveError.message}`);
  }

  if ((caregiverActiveCount ?? 0) >= LINK_LIMITS.MAX_PATIENTS_PER_CAREGIVER) {
    throw new Error(
      `LINK_LIMIT_EXCEEDED: 최대 ${LINK_LIMITS.MAX_PATIENTS_PER_CAREGIVER}명까지 연결할 수 있습니다`
    );
  }

  const { data: linkRow, error: linkError } = await supabase
    .from('care_links')
    .insert({
      caregiver_id: invite.caregiver_id,
      patient_id: patientId,
      status: 'ACTIVE',
      relation: relation ?? invite.relation ?? 'GUARDIAN',
      nickname,
    })
    .select()
    .single();

  if (linkError) {
    console.error('[Supabase DAO] Failed to create link from invite:', linkError);
    throw new Error(`Failed to create link from invite: ${linkError.message}`);
  }

  const { error: updateInviteError } = await supabase
    .from('care_link_invites')
    .update({
      status: 'ACCEPTED',
      accepted_by: patientId,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invite.id);

  if (updateInviteError) {
    console.error('[Supabase DAO] Failed to update invite status:', updateInviteError);
    throw new Error(`Failed to update invite status: ${updateInviteError.message}`);
  }

  return rowToLink(linkRow);
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
