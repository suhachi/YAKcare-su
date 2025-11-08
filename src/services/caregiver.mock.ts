// 보호자 통지 서비스 (Mock)
// 실제 환경에서는 Cloud Functions callable로 교체

import { toast } from 'sonner';
import { listLinksByUser } from './link.mock';

// 중복 통지 방지용 Set
const notified = new Set<string>();

export type NotificationType = 'DONE' | 'MISSED';

/**
 * 보호자에게 복용 상태 통지 (1회만)
 * Step 4.6: ACTIVE 연결만 통지
 * @param doseId 복용 인스턴스 ID
 * @param patientId 환자 ID
 * @param type 통지 타입
 * @returns 통지 성공 여부 (중복이면 false)
 */
export async function notifyCaregiversOnce(
  doseId: string,
  patientId: string,
  type: NotificationType
): Promise<boolean> {
  const key = `${doseId}:${type}`;

  // 이미 통지했으면 스킵
  if (notified.has(key)) {
    console.log(`[CaregiverNotify] Skipped duplicate notification: ${key}`);
    return false;
  }

  // Step 4.6: ACTIVE 연결만 통지
  const links = await listLinksByUser(patientId, false); // 환자의 보호자 목록
  const activeLinks = links.filter(link => link.status === 'ACTIVE');

  if (activeLinks.length === 0) {
    console.log(`[CaregiverNotify] No active caregivers for patient ${patientId}`);
    return false;
  }

  // 통지 기록
  notified.add(key);

  // MVP: 콘솔 로그
  const message = type === 'DONE' ? '복용 완료' : '복용 누락';
  console.log(`[CaregiverNotify] ${message} for dose ${doseId} to ${activeLinks.length} caregiver(s)`);
  console.log('GA4: caregiver_notify', { type: type.toLowerCase(), count: activeLinks.length });
  
  // 실제 환경에서는 여기서 Cloud Functions callable 호출
  // await callable('notifyCaregiversOnDoseStatus', { doseId, type, caregiverIds: activeLinks.map(l => l.caregiverId) });

  return true;
}

/**
 * 보호자 통지 테스트용 토스트
 * Step 4.6: ACTIVE 연결만 통지
 */
export async function notifyCaregiversWithToast(
  doseId: string,
  patientId: string,
  type: NotificationType,
  patientName?: string
): Promise<boolean> {
  const key = `${doseId}:${type}`;

  if (notified.has(key)) {
    return false;
  }

  // Step 4.6: ACTIVE 연결만 통지
  const links = await listLinksByUser(patientId, false);
  const activeLinks = links.filter(link => link.status === 'ACTIVE');

  if (activeLinks.length === 0) {
    console.log(`[CaregiverNotify] No active caregivers for patient ${patientId}`);
    return false;
  }

  notified.add(key);

  const message = type === 'DONE' 
    ? `${patientName || '환자'}님이 약을 복용했습니다` 
    : `${patientName || '환자'}님이 약을 누락했습니다`;

  toast.info(`[보호자 통지] ${message}`);
  console.log(`[CaregiverNotify] ${message} (doseId: ${doseId}) to ${activeLinks.length} caregiver(s)`);

  return true;
}

/**
 * 통지 기록 초기화 (테스트용)
 */
export function clearNotifications(): void {
  notified.clear();
  console.log('[CaregiverNotify] Notification history cleared');
}

/**
 * 통지 기록 확인
 */
export function getNotificationHistory(): string[] {
  return Array.from(notified);
}

/**
 * 특정 dose가 통지되었는지 확인
 */
export function hasNotified(doseId: string, type: NotificationType): boolean {
  return notified.has(`${doseId}:${type}`);
}

// ===== Step 4.3: 수동 리마인드 20분 쿨다운 =====

// 쿨다운 맵: key = `${caregiverId}:${patientId}:${cardKey}`, value = timestamp
const remindCooldown = new Map<string, number>();
const COOLDOWN_MS = 20 * 60 * 1000; // 20분

/**
 * 수동 리마인드 쿨다운 체크
 * @param caregiverId - 보호자 ID
 * @param patientId - 환자 ID
 * @param cardKey - 카드 키 (옵션, 없으면 전체 리마인드)
 * @returns 남은 쿨다운 시간 (밀리초), 0이면 가능
 */
export function getRemindCooldown(
  caregiverId: string,
  patientId: string,
  cardKey?: string
): number {
  const key = cardKey 
    ? `${caregiverId}:${patientId}:${cardKey}`
    : `${caregiverId}:${patientId}`;
  
  const lastRemind = remindCooldown.get(key);
  if (!lastRemind) return 0;

  const elapsed = Date.now() - lastRemind;
  const remaining = COOLDOWN_MS - elapsed;

  return remaining > 0 ? remaining : 0;
}

/**
 * 수동 리마인드 전송 가능 여부
 */
export function canRemind(
  caregiverId: string,
  patientId: string,
  cardKey?: string
): boolean {
  return getRemindCooldown(caregiverId, patientId, cardKey) === 0;
}

/**
 * 수동 리마인드 전송
 * Step 4.6: ACTIVE 연결만 가능
 * @param caregiverId - 보호자 ID
 * @param patientId - 환자 ID
 * @param cardKey - 카드 키 (옵션)
 * @returns 성공 여부
 */
export async function sendManualRemind(
  caregiverId: string,
  patientId: string,
  cardKey?: string
): Promise<{ success: boolean; cooldownMs?: number; error?: string }> {
  // Step 4.6: ACTIVE 연결 체크
  const links = await listLinksByUser(caregiverId, true); // 보호자의 환자 목록
  const activeLink = links.find(link => link.patientId === patientId && link.status === 'ACTIVE');

  if (!activeLink) {
    console.log(`[CaregiverRemind] No active link between ${caregiverId} and ${patientId}`);
    return { success: false, error: 'LINK_NOT_ACTIVE' };
  }

  const cooldown = getRemindCooldown(caregiverId, patientId, cardKey);
  
  if (cooldown > 0) {
    console.log(`[CaregiverRemind] Cooldown active: ${Math.ceil(cooldown / 1000)}s remaining`);
    console.log('GA4: caregiver_remind_cooldown', { cooldownMs: cooldown });
    return { success: false, cooldownMs: cooldown };
  }

  const key = cardKey 
    ? `${caregiverId}:${patientId}:${cardKey}`
    : `${caregiverId}:${patientId}`;

  // 쿨다운 설정
  remindCooldown.set(key, Date.now());

  // MVP: 콘솔 로그
  console.log(`[CaregiverRemind] Manual remind sent: ${key}`);
  console.log('GA4: caregiver_remind_send', { cardKey });
  
  // 실제 환경에서는 여기서 Cloud Functions callable 호출
  // await callable('sendManualRemind', { patientId, cardKey })

  return { success: true };
}

/**
 * 쿨다운 초기화 (테스트용)
 */
export function clearRemindCooldown(): void {
  remindCooldown.clear();
  console.log('[CaregiverRemind] Cooldown cleared');
}

/**
 * 분:초 형식으로 남은 시간 표시
 */
export function formatCooldownTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
