/**
 * 보호자-복용자 연결 Mock 서비스
 * Step 4.6: 연결/온보딩 구현
 */

import { CareLink, LinkInvite, LinkStatus, RelationType, LINK_LIMITS } from '../types/link';

// 메모리 저장소
const linkMemory = {
  links: new Map<string, CareLink>(),
  invites: new Map<string, LinkInvite>(),
};

// 고유 ID 생성
function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// 6자리 초대 코드 생성
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 방지: I, O, 0, 1 제외
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 초대 생성 (보호자가 시작)
 * @param caregiverId - 보호자 ID
 * @returns 초대 정보
 */
export async function createInvite(caregiverId: string): Promise<LinkInvite> {
  // 보호자당 환자 수 제한 체크
  const existingLinks = Array.from(linkMemory.links.values())
    .filter(link => link.caregiverId === caregiverId && link.status === 'ACTIVE');
  
  if (existingLinks.length >= LINK_LIMITS.MAX_PATIENTS_PER_CAREGIVER) {
    throw new Error(`LINK_LIMIT_EXCEEDED: 최대 ${LINK_LIMITS.MAX_PATIENTS_PER_CAREGIVER}명까지 연결할 수 있습니다`);
  }

  const inviteCode = generateInviteCode();
  const expiresAt = Date.now() + LINK_LIMITS.INVITE_EXPIRY_HOURS * 60 * 60 * 1000;
  
  // 딥링크 생성
  const deepLink = `yakmeal://invite/${inviteCode}`;
  
  const invite: LinkInvite = {
    inviteCode,
    caregiverId,
    expiresAt,
    deepLink,
  };

  linkMemory.invites.set(inviteCode, invite);

  console.log('GA4: caregiver_invite_create', { caregiverId, inviteCode });

  return invite;
}

/**
 * 초대 수락 (복용자가 승인)
 * @param inviteCode - 초대 코드
 * @param patientId - 복용자 ID
 * @param relation - 관계 타입
 * @param nickname - 별명 (선택)
 * @returns 생성된 연결
 */
export async function acceptInvite(
  inviteCode: string,
  patientId: string,
  relation: RelationType = 'GUARDIAN',
  nickname?: string
): Promise<CareLink> {
  // 초대 코드 확인
  const invite = linkMemory.invites.get(inviteCode);
  if (!invite) {
    throw new Error('INVITE_NOT_FOUND: 초대 코드를 찾을 수 없습니다');
  }

  // 만료 확인
  if (Date.now() > invite.expiresAt) {
    linkMemory.invites.delete(inviteCode);
    throw new Error('INVITE_EXPIRED: 초대 코드가 만료되었습니다');
  }

  // 환자당 보호자 수 제한 체크
  const existingLinks = Array.from(linkMemory.links.values())
    .filter(link => link.patientId === patientId && link.status === 'ACTIVE');
  
  if (existingLinks.length >= LINK_LIMITS.MAX_CAREGIVERS_PER_PATIENT) {
    throw new Error(`LINK_LIMIT_EXCEEDED: 최대 ${LINK_LIMITS.MAX_CAREGIVERS_PER_PATIENT}명의 보호자만 연결할 수 있습니다`);
  }

  // 이미 연결된 경우 체크
  const duplicate = existingLinks.find(link => link.caregiverId === invite.caregiverId);
  if (duplicate) {
    throw new Error('ALREADY_LINKED: 이미 연결된 보호자입니다');
  }

  // 연결 생성
  const link: CareLink = {
    id: generateId(),
    caregiverId: invite.caregiverId,
    patientId,
    status: 'ACTIVE',
    relation,
    nickname,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  linkMemory.links.set(link.id, link);
  linkMemory.invites.delete(inviteCode); // 초대 삭제

  console.log('GA4: patient_invite_accept', {
    linkId: link.id,
    caregiverId: link.caregiverId,
    patientId: link.patientId,
  });

  return link;
}

/**
 * 연결 상태 변경
 * @param linkId - 연결 ID
 * @param status - 새 상태
 * @returns 업데이트된 연결
 */
export async function setLinkStatus(linkId: string, status: LinkStatus): Promise<CareLink> {
  const link = linkMemory.links.get(linkId);
  if (!link) {
    throw new Error('LINK_NOT_FOUND: 연결을 찾을 수 없습니다');
  }

  link.status = status;
  link.updatedAt = Date.now();
  linkMemory.links.set(linkId, link);

  console.log('GA4: link_status_change', { linkId, status });

  return link;
}

/**
 * 사용자의 모든 연결 조회
 * @param userId - 사용자 ID
 * @param asCaregiver - true면 보호자로서의 연결, false면 복용자로서의 연결
 * @returns 연결 목록
 */
export async function listLinksByUser(userId: string, asCaregiver: boolean = true): Promise<CareLink[]> {
  const links = Array.from(linkMemory.links.values())
    .filter(link => {
      if (asCaregiver) {
        return link.caregiverId === userId;
      } else {
        return link.patientId === userId;
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return links;
}

/**
 * 특정 연결 조회
 * @param linkId - 연결 ID
 * @returns 연결 정보
 */
export async function getLink(linkId: string): Promise<CareLink | undefined> {
  return linkMemory.links.get(linkId);
}

/**
 * 연결 삭제 (취소/해지)
 * @param linkId - 연결 ID
 */
export async function deleteLink(linkId: string): Promise<void> {
  const link = linkMemory.links.get(linkId);
  if (!link) {
    throw new Error('LINK_NOT_FOUND: 연결을 찾을 수 없습니다');
  }

  linkMemory.links.delete(linkId);

  console.log('GA4: link_delete', { linkId });
}

/**
 * 메모리 초기화 (테스트용)
 */
export function clearLinkMemory(): void {
  linkMemory.links.clear();
  linkMemory.invites.clear();
  console.log('[LinkMock] Memory cleared');
}

/**
 * 메모리 상태 확인 (디버깅용)
 */
export function getLinkMemoryStats() {
  return {
    links: linkMemory.links.size,
    invites: linkMemory.invites.size,
  };
}
