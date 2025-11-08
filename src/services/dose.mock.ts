// 복용 인스턴스 상태 관리 서비스 (Mock)

import { DoseInstance, DoseStatus, LOOP, shouldAutoMiss } from '../types/dose';

// 메모리 저장소 - meds.mock.ts와 공유
// export하여 meds.mock.ts에서도 접근 가능하게 함
export const doseMemory = new Map<string, DoseInstance>();

// 호환성을 위한 alias
const doses = doseMemory;

// 상태 변경 구독 메커니즘
type DoseChangeListener = () => void;
const changeListeners = new Set<DoseChangeListener>();

/**
 * Dose 상태 변경 이벤트 구독
 * @param listener - 상태 변경 시 호출될 콜백
 * @returns 구독 취소 함수
 */
export function subscribeDoseChange(listener: DoseChangeListener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

/**
 * 모든 구독자에게 상태 변경 알림
 */
function notifyChange(): void {
  changeListeners.forEach(listener => listener());
}

/**
 * ID로 복용 인스턴스 조회
 */
export function getById(id: string): DoseInstance | undefined {
  return doses.get(id);
}

/**
 * 모든 복용 인스턴스 조회
 */
export function listAll(): DoseInstance[] {
  return Array.from(doses.values());
}

/**
 * 알림 예정 인스턴스 조회
 */
export function listDue(now = Date.now()): DoseInstance[] {
  return Array.from(doses.values()).filter((d) => d.nextAlertAt && d.nextAlertAt <= now && d.status !== 'DONE' && d.status !== 'MISSED');
}

/**
 * 사용자의 오늘 인스턴스 조회
 */
export function listTodayByUser(userId: string, date = new Date()): DoseInstance[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return Array.from(doses.values())
    .filter((d) => d.userId === userId && d.scheduledAt >= start.getTime() && d.scheduledAt <= end.getTime())
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
}

/**
 * 복용 완료 처리
 */
export function markDone(id: string): DoseInstance | undefined {
  const dose = doses.get(id);
  if (!dose) return undefined;

  dose.status = 'DONE';
  dose.nextAlertAt = undefined;
  doses.set(id, dose);

  console.log(`[Dose] DONE: ${id} at ${new Date().toISOString()}`);
  
  // Step 4.2: 보호자 DONE 통지
  import('./caregiver.mock').then(({ notifyCaregiversOnce }) => {
    notifyCaregiversOnce(id, dose.userId, 'DONE');
  });
  
  notifyChange(); // 구독자에게 알림
  return dose;
}

/**
 * 복용 누락 처리
 */
export function markMissed(id: string): DoseInstance | undefined {
  const dose = doses.get(id);
  if (!dose) return undefined;

  dose.status = 'MISSED';
  dose.nextAlertAt = undefined;
  doses.set(id, dose);

  console.log(`[Dose] MISSED: ${id} at ${new Date().toISOString()}`);
  
  // 보호자 MISSED 통지
  import('./caregiver.mock').then(({ notifyCaregiversOnce }) => {
    notifyCaregiversOnce(id, dose.userId, 'MISSED');
  });
  
  notifyChange(); // 구독자에게 알림
  return dose;
}

/**
 * 정시 알림 스케줄 (T-15 예고 + T 정시)
 * Step 4.4: T-15 예고 알림 구현
 */
export function schedulePreMain(dose: DoseInstance, now = Date.now()): void {
  dose.status = 'SCHEDULED';
  
  const timeUntilT = dose.scheduledAt - now;
  const PRE_ALERT_MS = LOOP.PRE_ALERT_MIN * 60 * 1000; // 15분
  
  // T-15 이전이면 예고 알림 스케줄
  if (timeUntilT > PRE_ALERT_MS) {
    dose.nextAlertAt = dose.scheduledAt - PRE_ALERT_MS; // T-15
    dose.hasPreAlert = false;
    console.log(`[Dose] Scheduled PRE alert for ${dose.id} at ${new Date(dose.nextAlertAt).toISOString()} (T-15)`);
  } 
  // T-15 ~ T 사이면 바로 정시 알림
  else if (timeUntilT > 0) {
    dose.nextAlertAt = dose.scheduledAt;
    dose.hasPreAlert = true; // 예고 알림은 이미 지났음
    console.log(`[Dose] Scheduled MAIN alert for ${dose.id} at ${new Date(dose.nextAlertAt).toISOString()} (PRE skipped)`);
  }
  // T가 이미 지났으면 바로 정시 알림
  else {
    dose.nextAlertAt = now;
    dose.hasPreAlert = true;
    console.log(`[Dose] Scheduled immediate MAIN alert for ${dose.id} (overdue)`);
  }
  
  doses.set(dose.id, dose);
}

/**
 * 예고 알림(T-15) 처리
 */
export function onPreAlert(dose: DoseInstance): void {
  dose.hasPreAlert = true;
  dose.nextAlertAt = dose.scheduledAt; // 다음은 정시 알림(T)
  doses.set(dose.id, dose);
  
  console.log(`[Dose] PRE alert shown for ${dose.id}, next MAIN at ${new Date(dose.nextAlertAt).toISOString()}`);
}

/**
 * Main 알림 - [지금 복용] 버튼
 */
export function onMainTapNow(dose: DoseInstance): void {
  dose.status = 'DONE';
  dose.nextAlertAt = undefined;
  doses.set(dose.id, dose);

  console.log(`[Dose] Main → DONE (지금 복용): ${dose.id}`);
  
  // Step 4.2: 보호자 DONE 통지
  import('./caregiver.mock').then(({ notifyCaregiversOnce }) => {
    notifyCaregiversOnce(dose.id, dose.userId, 'DONE');
  });
  
  notifyChange(); // 구독자에게 알림
}

/**
 * Main 알림 - [10분 뒤] 버튼
 */
export function onMainTapSnooze(dose: DoseInstance, now = Date.now()): void {
  dose.status = 'SNOOZED';
  dose.nextAlertAt = now + LOOP.SNOOZE_MIN * 60 * 1000;
  dose.retries += 1;
  doses.set(dose.id, dose);

  console.log(`[Dose] Main → SNOOZED (10분 뒤): ${dose.id}, next at ${new Date(dose.nextAlertAt).toISOString()}`);
  notifyChange(); // 구독자에게 알림
}

/**
 * 스누즈 후 또는 T+15부터 확인 알림 스케줄
 */
export function scheduleConfirm(dose: DoseInstance, now = Date.now()): void {
  const elapsedFromT = now - dose.scheduledAt;
  
  // T+15가 되지 않았으면 T+15로 설정
  if (elapsedFromT < LOOP.CONFIRM_STEP_MIN * 60 * 1000) {
    dose.nextAlertAt = dose.scheduledAt + LOOP.CONFIRM_STEP_MIN * 60 * 1000;
  } else {
    // 이미 T+15 이후면 15분 후
    dose.nextAlertAt = now + LOOP.CONFIRM_STEP_MIN * 60 * 1000;
  }

  dose.status = 'PENDING';
  dose.hasConfirmAlert = true;
  doses.set(dose.id, dose);

  console.log(`[Dose] Scheduled confirm alert for ${dose.id} at ${new Date(dose.nextAlertAt).toISOString()}`);
}

/**
 * Confirm 알림 - [약 먹었음] 버튼
 */
export function onConfirmTapDone(dose: DoseInstance): void {
  dose.status = 'DONE';
  dose.nextAlertAt = undefined;
  doses.set(dose.id, dose);

  console.log(`[Dose] Confirm → DONE (약 먹었음): ${dose.id}`);
  
  // Step 4.2: 보호자 DONE 통지
  import('./caregiver.mock').then(({ notifyCaregiversOnce }) => {
    notifyCaregiversOnce(dose.id, dose.userId, 'DONE');
  });
  
  notifyChange(); // 구독자에게 알림
}

/**
 * Confirm 알림 - [아직 안 먹음] 버튼
 */
export function onConfirmTapNotYet(dose: DoseInstance, now = Date.now()): void {
  // T+90 경과 체크
  if (shouldAutoMiss(dose, now)) {
    dose.status = 'MISSED';
    dose.nextAlertAt = undefined;
    doses.set(dose.id, dose);
    console.log(`[Dose] Confirm → MISSED (시간 초과): ${dose.id}`);
    return;
  }

  // 15분 후 재알림
  dose.status = 'PENDING';
  dose.nextAlertAt = now + LOOP.CONFIRM_STEP_MIN * 60 * 1000;
  dose.retries += 1;
  doses.set(dose.id, dose);

  console.log(`[Dose] Confirm → PENDING (아직 안 먹음): ${dose.id}, retry ${dose.retries}, next at ${new Date(dose.nextAlertAt!).toISOString()}`);
  notifyChange(); // 구독자에게 알림
}

/**
 * 인스턴스 등록 (meds.mock.ts에서 호출)
 */
export function registerDose(dose: DoseInstance): void {
  doses.set(dose.id, dose);
  schedulePreMain(dose);
  notifyChange(); // 구독자에게 알림
}

/**
 * 메모리 초기화 (테스트용)
 */
export function clearDoses(): void {
  doses.clear();
  console.log('[Dose] Memory cleared');
}

/**
 * 디버깅용 상태 확인
 */
export function getStats() {
  const all = Array.from(doses.values());
  return {
    total: all.length,
    scheduled: all.filter((d) => d.status === 'SCHEDULED').length,
    pending: all.filter((d) => d.status === 'PENDING').length,
    snoozed: all.filter((d) => d.status === 'SNOOZED').length,
    done: all.filter((d) => d.status === 'DONE').length,
    missed: all.filter((d) => d.status === 'MISSED').length,
  };
}
