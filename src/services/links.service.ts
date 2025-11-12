/**
 * 통합 보호자 연결 관리 서비스
 * Feature Flag에 따라 Supabase/Firebase/Mock 자동 전환
 */

import { ACTIVE_FLAGS } from '../config/env';
import type { CareLink, LinkStatus, LinkInvite, RelationType } from '../types/link';
import { LINK_LIMITS } from '../types/link';

const DEV_ONLY_MESSAGE = 'Mock 서비스는 개발 모드에서만 사용할 수 있습니다.';

type LinkMockModule = typeof import('./link.mock');
let linkMockModule: Promise<LinkMockModule> | null = null;
const loadLinkMock: () => Promise<LinkMockModule> = import.meta.env.DEV
  ? () => {
      if (!linkMockModule) {
        linkMockModule = import('./link.mock');
      }
      return linkMockModule;
    }
  : () => Promise.reject(new Error(`Link Mock: ${DEV_ONLY_MESSAGE}`));

/**
 * 연결 생성
 */
export async function createLink(
  link: Omit<CareLink, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CareLink> {
  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await createWithSupabase(link);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await createWithFirestore(link);
  } else {
    return await createWithMock(link);
  }
}

/**
 * 보호자의 연결 목록 조회
 */
export async function getLinksByCaregiver(caregiverId: string): Promise<CareLink[]> {
  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await getByCaregiverWithSupabase(caregiverId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await getByCaregiverWithFirestore(caregiverId);
  } else {
    return await getByCaregiverWithMock(caregiverId);
  }
}

/**
 * 복용자의 연결 목록 조회
 */
export async function getLinksByPatient(patientId: string): Promise<CareLink[]> {
  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await getByPatientWithSupabase(patientId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await getByPatientWithFirestore(patientId);
  } else {
    return await getByPatientWithMock(patientId);
  }
}

/**
 * 초대 코드로 연결 조회
 */
export async function getLinkByInviteCode(inviteCode: string): Promise<CareLink | null> {
  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await getByInviteCodeWithSupabase(inviteCode);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await getByInviteCodeWithFirestore(inviteCode);
  } else {
    return await getByInviteCodeWithMock(inviteCode);
  }
}

/**
 * 연결 상태 업데이트
 */
export async function updateLinkStatus(linkId: string, status: LinkStatus): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await updateStatusWithSupabase(linkId, status);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await updateStatusWithFirestore(linkId, status);
  } else {
    return await updateStatusWithMock(linkId, status);
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
  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await updateWithSupabase(linkId, updates);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await updateWithFirestore(linkId, updates);
  } else {
    return await updateWithMock(linkId, updates);
  }
}

/**
 * 연결 삭제
 */
export async function deleteLink(linkId: string): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await deleteWithSupabase(linkId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await deleteWithFirestore(linkId);
  } else {
    return await deleteWithMock(linkId);
  }
}

/**
 * 사용자의 연결 목록 조회 (보호자 또는 복용자)
 */
export async function listLinksByUser(userId: string, role: 'caregiver' | 'patient'): Promise<CareLink[]> {
  if (!userId) {
    throw new Error('listLinksByUser: userId is required');
  }

  if (role === 'caregiver') {
    return await getLinksByCaregiver(userId);
  } else {
    return await getLinksByPatient(userId);
  }
}

/**
 * 연결 상태 설정 (updateLinkStatus의 별칭)
 */
export async function setLinkStatus(linkId: string, status: LinkStatus): Promise<void> {
  return updateLinkStatus(linkId, status);
}

/**
 * 초대 생성
 */
export async function createInvite(caregiverId: string): Promise<LinkInvite> {
  const inviteCode = generateInviteCode();
  const expiresAt = Date.now() + LINK_LIMITS.INVITE_EXPIRY_HOURS * 60 * 60 * 1000;
  const deepLink = buildInviteDeepLink(inviteCode);

  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await createInviteWithSupabase({
      caregiverId,
      inviteCode,
      expiresAt,
      deepLink,
    });
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await createInviteWithFirestore(caregiverId);
  } else {
    const linkMock = await loadLinkMock();
    return await linkMock.createInvite(caregiverId);
  }
}

/**
 * 초대 수락
 */
export async function acceptInvite(
  inviteCode: string,
  patientId: string,
  relation: RelationType = 'GUARDIAN',
  nickname?: string
): Promise<CareLink> {
  if (ACTIVE_FLAGS.USE_SUPABASE_LINK) {
    return await acceptInviteWithSupabase(inviteCode, patientId, relation, nickname);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_LINK) {
    return await acceptInviteWithFirestore(inviteCode, patientId, relation, nickname);
  } else {
    const linkMock = await loadLinkMock();
    return await linkMock.acceptInvite(inviteCode, patientId, relation, nickname);
  }
}

/**
 * 초대 코드 생성
 */
export function generateInviteCode(): string {
  // 6자리 영숫자 조합
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function buildInviteDeepLink(inviteCode: string): string {
  const base =
    ((import.meta as any)?.env?.VITE_INVITE_BASE_URL as string | undefined) ||
    'yakmeal://invite';

  if (base.startsWith('http')) {
    try {
      const url = new URL(base);
      url.searchParams.set('code', inviteCode);
      return url.toString();
    } catch {
      // base가 유효한 URL이 아니라면 fallback
    }
  }

  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalized}/${inviteCode}`;
}

// ========== Supabase 구현 ==========

async function createWithSupabase(
  link: Omit<CareLink, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CareLink> {
  const { createLink } = await import('./supabase/links.dao');
  return await createLink(link);
}

async function getByCaregiverWithSupabase(caregiverId: string): Promise<CareLink[]> {
  const { getLinksByCaregiver } = await import('./supabase/links.dao');
  return await getLinksByCaregiver(caregiverId);
}

async function getByPatientWithSupabase(patientId: string): Promise<CareLink[]> {
  const { getLinksByPatient } = await import('./supabase/links.dao');
  return await getLinksByPatient(patientId);
}

async function getByInviteCodeWithSupabase(inviteCode: string): Promise<CareLink | null> {
  const { getLinkByInviteCode } = await import('./supabase/links.dao');
  return await getLinkByInviteCode(inviteCode);
}

async function updateStatusWithSupabase(linkId: string, status: LinkStatus): Promise<void> {
  const { updateLinkStatus } = await import('./supabase/links.dao');
  return await updateLinkStatus(linkId, status);
}

async function updateWithSupabase(
  linkId: string,
  updates: {
    nickname?: string;
    relation?: CareLink['relation'];
    inviteCode?: string;
  }
): Promise<void> {
  const { updateLink } = await import('./supabase/links.dao');
  return await updateLink(linkId, updates);
}

async function deleteWithSupabase(linkId: string): Promise<void> {
  const { deleteLink } = await import('./supabase/links.dao');
  return await deleteLink(linkId);
}

async function createInviteWithSupabase(params: {
  caregiverId: string;
  inviteCode: string;
  expiresAt: number;
  deepLink: string;
  relation?: RelationType;
}): Promise<LinkInvite> {
  const { createLinkInvite } = await import('./supabase/links.dao');
  return await createLinkInvite(params);
}

async function acceptInviteWithSupabase(
  inviteCode: string,
  patientId: string,
  relation: RelationType,
  nickname?: string
): Promise<CareLink> {
  const { acceptInviteByCode } = await import('./supabase/links.dao');
  return await acceptInviteByCode(inviteCode, patientId, relation, nickname);
}

// ========== Firestore 구현 ==========

async function createWithFirestore(
  link: Omit<CareLink, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CareLink> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function getByCaregiverWithFirestore(caregiverId: string): Promise<CareLink[]> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function getByPatientWithFirestore(patientId: string): Promise<CareLink[]> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function getByInviteCodeWithFirestore(inviteCode: string): Promise<CareLink | null> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function updateStatusWithFirestore(linkId: string, status: LinkStatus): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function updateWithFirestore(
  linkId: string,
  updates: {
    nickname?: string;
    relation?: CareLink['relation'];
    inviteCode?: string;
  }
): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function deleteWithFirestore(linkId: string): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function createInviteWithFirestore(_caregiverId: string): Promise<LinkInvite> {
  throw new Error('Firestore not implemented yet');
}

async function acceptInviteWithFirestore(
  _inviteCode: string,
  _patientId: string,
  _relation: RelationType,
  _nickname?: string
): Promise<CareLink> {
  throw new Error('Firestore not implemented yet');
}

// ========== Mock 구현 ==========

async function createWithMock(
  link: Omit<CareLink, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CareLink> {
  const linkMock = await loadLinkMock();
  return await linkMock.createLink(link);
}

async function getByCaregiverWithMock(caregiverId: string): Promise<CareLink[]> {
  const linkMock = await loadLinkMock();
  return await linkMock.getLinksByCaregiver(caregiverId);
}

async function getByPatientWithMock(patientId: string): Promise<CareLink[]> {
  const linkMock = await loadLinkMock();
  return await linkMock.getLinksByPatient(patientId);
}

async function getByInviteCodeWithMock(inviteCode: string): Promise<CareLink | null> {
  const linkMock = await loadLinkMock();
  return await linkMock.getLinkByInviteCode(inviteCode);
}

async function updateStatusWithMock(linkId: string, status: LinkStatus): Promise<void> {
  const linkMock = await loadLinkMock();
  return await linkMock.updateLinkStatus(linkId, status);
}

async function updateWithMock(
  linkId: string,
  updates: {
    nickname?: string;
    relation?: CareLink['relation'];
    inviteCode?: string;
  }
): Promise<void> {
  const linkMock = await loadLinkMock();
  return await linkMock.updateLink(linkId, updates);
}

async function deleteWithMock(linkId: string): Promise<void> {
  const linkMock = await loadLinkMock();
  return await linkMock.deleteLink(linkId);
}
