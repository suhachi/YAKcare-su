/**
 * 보호자-복용자 연결 타입 정의
 * Step 4.6: 연결/온보딩 시스템
 */

export type LinkStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'REVOKED';
export type RelationType = 'PARENT' | 'CHILD' | 'SPOUSE' | 'GUARDIAN' | 'OTHER';

export interface CareLink {
  id: string;
  caregiverId: string;      // 보호자 ID
  patientId: string;        // 복용자 ID
  status: LinkStatus;
  relation: RelationType;   // 관계 라벨
  nickname?: string;        // \"아버님\", \"어머님\" 등
  createdAt: number;
  updatedAt: number;
  inviteCode?: string;      // PENDING 상태일 때만
}

export interface LinkInvite {
  inviteCode: string;       // 6자리 코드
  caregiverId: string;
  expiresAt: number;        // 만료 시각 (24시간)
  deepLink: string;         // 딥링크 URL
  qrDataUrl?: string;       // QR 코드 이미지 (Base64)
}

// 상태 라벨
export const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  PENDING: '대기 중',
  ACTIVE: '연결됨',
  PAUSED: '일시중지',
  REVOKED: '해제됨',
};

// 상태 색상
export const LINK_STATUS_COLORS: Record<LinkStatus, string> = {
  PENDING: '#F08C00',   // Warning
  ACTIVE: '#12B886',    // Primary
  PAUSED: '#868E96',    // Gray
  REVOKED: '#E03131',   // Danger
};

// 관계 라벨
export const RELATION_LABELS: Record<RelationType, string> = {
  PARENT: '부모님',
  CHILD: '자녀',
  SPOUSE: '배우자',
  GUARDIAN: '보호자',
  OTHER: '기타',
};

// 연결 제한
export const LINK_LIMITS = {
  MAX_CAREGIVERS_PER_PATIENT: 5,   // 환자당 보호자 최대 수
  MAX_PATIENTS_PER_CAREGIVER: 10,  // 보호자당 환자 최대 수
  INVITE_EXPIRY_HOURS: 24,         // 초대 코드 유효 기간
} as const;
