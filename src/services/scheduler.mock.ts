// 알림 루프 워커 (개발용 시뮬레이터)
// 실제 환경에서는 Cloud Functions scheduled job으로 교체

import { listDue, markMissed, scheduleConfirm, onPreAlert } from './dose.mock';
import { shouldAutoMiss, getAlertType } from '../types/dose';
import { notifyCaregiversOnce } from './caregiver.mock';

let workerInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

/**
 * 매분 워커 틱
 * Step 4.4: PRE 알림 처리 추가
 */
export function tick(now = Date.now()): void {
  const dueDoses = listDue(now);

  for (const dose of dueDoses) {
    // T+90 자동 MISSED 체크
    if (shouldAutoMiss(dose, now)) {
      markMissed(dose.id);
      notifyCaregiversOnce(dose.id, dose.userId, 'MISSED');
      console.log(`[Scheduler] Auto-missed dose ${dose.id}`);
      continue;
    }

    // 알림 타입 결정
    const alertType = getAlertType(dose, now);
    
    // PRE 알림 (T-15)
    if (alertType === 'PRE' && !dose.hasPreAlert) {
      onPreAlert(dose);
      console.log(`[Scheduler] PRE alert triggered for ${dose.id}`);
      // 실제 환경에서는 여기서 푸시 알림 전송
      // sendPushNotification(dose.userId, { type: 'PRE', dose });
      continue;
    }

    // MAIN/CONFIRM 알림은 AlertModal에서 처리됨
    // 여기서는 SNOOZED 또는 PENDING 상태의 재스케줄만
    if (dose.status === 'SNOOZED' || dose.status === 'PENDING') {
      scheduleConfirm(dose, now);
    }
  }

  // 상태 로깅 (디버깅용)
  if (dueDoses.length > 0) {
    console.log(`[Scheduler] Processed ${dueDoses.length} due doses at ${new Date(now).toISOString()}`);
  }
}

/**
 * 워커 시작 (1분 간격)
 */
export function startWorker(intervalMs = 60000): void {
  if (isRunning) {
    console.warn('[Scheduler] Worker already running');
    return;
  }

  console.log('[Scheduler] Starting worker with interval:', intervalMs);
  isRunning = true;

  // 즉시 1회 실행
  tick();

  // 정기 실행
  workerInterval = setInterval(() => {
    tick();
  }, intervalMs);
}

/**
 * 워커 중지
 */
export function stopWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
  isRunning = false;
  console.log('[Scheduler] Worker stopped');
}

/**
 * 워커 상태 확인
 */
export function isWorkerRunning(): boolean {
  return isRunning;
}

/**
 * 개발용: 빠른 테스트를 위한 10초 간격 워커
 */
export function startDevWorker(): void {
  startWorker(10000); // 10초 간격
  console.log('[Scheduler] Dev worker started (10s interval)');
}
