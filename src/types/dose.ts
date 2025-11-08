// 복용 인스턴스 상태 기계 및 알림 루프 타입

export type DoseStatus = 'SCHEDULED' | 'PENDING' | 'SNOOZED' | 'DONE' | 'MISSED';
export type DoseEvent = 'PRE' | 'MAIN' | 'CONFIRM' | 'DONE_TAP' | 'SNOOZE_TAP' | 'NOTYET_TAP' | 'TIMEOUT';
export type SlotBucket = 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'OTHER';

/**
 * 복용 맥락 (식전/식후/취침전)
 * - PLAIN: 일반 (기본값)
 * - PREMEAL: 식전
 * - POSTMEAL: 식후
 * - BEDTIME: 취침 전
 */
export type IntakeContext = 'PLAIN' | 'PREMEAL' | 'POSTMEAL' | 'BEDTIME';

export interface DoseInstance {
  id: string;
  userId: string;
  medId: string;
  medCategory?: string;      // 약 카테고리 (홈 섹션 분리용: CHRONIC/SUPPLEMENT/PRESCRIPTION)
  scheduledAt: number;       // T in epoch ms
  slotBucket: SlotBucket;    // 시간대 버킷 (MORNING/NOON/EVENING/BEDTIME/OTHER)
  intakeContext?: IntakeContext; // 복용 맥락 (식전/식후/취침전)
  status: DoseStatus;        // current
  retries: number;           // confirm 반복 횟수(0..6)
  hasPreAlert: boolean;
  hasConfirmAlert: boolean;
  nextAlertAt?: number;      // 다음 알림 시각
  
  /** 🔑 카드 그룹핑용 */
  cardKey: string;           // 카드 식별자 (규칙: makeCardKeyTitle 참조)
  cardTitle: string;         // 카드 제목 (로컬라이즈된 문자열)
}

// 알림 루프 상수
export const LOOP = {
  PRE_ALERT_MIN: 15,       // T-15 예고 알림 (옵션)
  SNOOZE_MIN: 10,          // [10분 뒤] 스누즈
  CONFIRM_STEP_MIN: 15,    // T+15부터 반복 간격
  HARD_LIMIT_MIN: 90,      // T+90 자동 MISSED
  MAX_RETRIES: 6,          // 최대 반복 횟수
} as const;

// 상태 전이 가드 함수
export function canSnooze(dose: DoseInstance): boolean {
  return dose.status === 'PENDING' && dose.retries === 0;
}

export function canMarkDone(dose: DoseInstance): boolean {
  return dose.status === 'PENDING' || dose.status === 'SNOOZED';
}

export function shouldAutoMiss(dose: DoseInstance, now = Date.now()): boolean {
  const elapsed = (now - dose.scheduledAt) / 60000; // 분 단위
  return elapsed >= LOOP.HARD_LIMIT_MIN && dose.status !== 'DONE';
}

export function isOverdue(dose: DoseInstance, now = Date.now()): boolean {
  return now > dose.scheduledAt && dose.status === 'SCHEDULED';
}

export function getElapsedMinutes(dose: DoseInstance, now = Date.now()): number {
  return Math.floor((now - dose.scheduledAt) / 60000);
}

// 알림 타입 결정
export function getAlertType(dose: DoseInstance, now = Date.now()): 'PRE' | 'MAIN' | 'CONFIRM' | null {
  const elapsedMin = getElapsedMinutes(dose, now);

  // 예고 알림 (T-15)
  if (elapsedMin < -LOOP.PRE_ALERT_MIN + 1 && !dose.hasPreAlert) {
    return null;
  }
  if (elapsedMin >= -LOOP.PRE_ALERT_MIN && elapsedMin < 0 && !dose.hasPreAlert) {
    return 'PRE';
  }

  // 정시 알림 (T)
  if (elapsedMin >= 0 && elapsedMin < LOOP.CONFIRM_STEP_MIN && dose.status === 'SCHEDULED') {
    return 'MAIN';
  }

  // 스누즈 후 재알림
  if (dose.status === 'SNOOZED' && dose.nextAlertAt && now >= dose.nextAlertAt) {
    return 'MAIN';
  }

  // 확인 알림 (T+15부터)
  if (elapsedMin >= LOOP.CONFIRM_STEP_MIN && dose.status === 'PENDING') {
    return 'CONFIRM';
  }

  return null;
}

// 슬롯 라벨 매핑 (한글)
export const SLOT_LABELS: Record<SlotBucket, string> = {
  MORNING: '아침',
  NOON: '점심',
  EVENING: '저녁',
  BEDTIME: '취침 전',
  OTHER: '기타',
} as const;

// 상태 라벨
export const STATUS_LABELS: Record<DoseStatus, string> = {
  SCHEDULED: '예정',
  PENDING: '대기 중',
  SNOOZED: '스누즈됨',
  DONE: '완료',
  MISSED: '누락',
};
