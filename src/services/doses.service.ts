/**
 * 통합 복용 인스턴스 관리 서비스
 * Feature Flag에 따라 Supabase/Firebase/Mock 자동 전환
 */

import { ACTIVE_FLAGS } from '../config/env';
import type { DoseInstance, DoseStatus } from '../types/dose';
import { LOOP, shouldAutoMiss } from '../types/dose';
import type { Medication } from '../types/meds';
import { combineDateAndTime, getTodayStart, getTodayEnd, getSlotBucket } from './time';
import { supabase } from './supabase.client';

const DEV_ONLY_MESSAGE = 'Mock 서비스는 개발 모드에서만 사용할 수 있습니다.';

type DoseMockModule = typeof import('./dose.mock');
let doseMockModule: Promise<DoseMockModule> | null = null;
const loadDoseMock: () => Promise<DoseMockModule> = import.meta.env.DEV
  ? () => {
      if (!doseMockModule) {
        doseMockModule = import('./dose.mock');
      }
      return doseMockModule;
    }
  : () => Promise.reject(new Error(`Dose Mock: ${DEV_ONLY_MESSAGE}`));

type MedsMockModule = typeof import('./meds.mock');
let medsMockModule: Promise<MedsMockModule> | null = null;
const loadMedsMock: () => Promise<MedsMockModule> = import.meta.env.DEV
  ? () => {
      if (!medsMockModule) {
        medsMockModule = import('./meds.mock');
      }
      return medsMockModule;
    }
  : () => Promise.reject(new Error(`Meds Mock: ${DEV_ONLY_MESSAGE}`));

type CaregiverMockModule = typeof import('./caregiver.mock');
let caregiverMockModule: Promise<CaregiverMockModule> | null = null;
const loadCaregiverMock: () => Promise<CaregiverMockModule> = import.meta.env.DEV
  ? () => {
      if (!caregiverMockModule) {
        caregiverMockModule = import('./caregiver.mock');
      }
      return caregiverMockModule;
    }
  : () => Promise.reject(new Error(`Caregiver Mock: ${DEV_ONLY_MESSAGE}`));

/**
 * 오늘의 복용 인스턴스 조회
 */
export async function listTodayDoses(userId: string, date: Date = new Date()): Promise<DoseInstance[]> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    return await listTodayWithSupabase(userId, date);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    return await listTodayWithFirestore(userId, date);
  } else {
    return await listTodayWithMock(userId, date);
  }
}

/**
 * 복용 완료 처리
 */
export async function markDone(doseId: string): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    return await markDoneWithSupabase(doseId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    return await markDoneWithFirestore(doseId);
  } else {
    return await markDoneWithMock(doseId);
  }
}

/**
 * 복용 누락 처리
 */
export async function markMissed(doseId: string): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    return await markMissedWithSupabase(doseId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    return await markMissedWithFirestore(doseId);
  } else {
    return await markMissedWithMock(doseId);
  }
}

/**
 * 복용 인스턴스 상태 업데이트
 */
export async function updateDoseStatus(
  doseId: string,
  status: DoseStatus,
  updates?: {
    retries?: number;
    hasConfirmAlert?: boolean;
    nextAlertAt?: number | null;
  }
): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    return await updateStatusWithSupabase(doseId, status, updates);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    return await updateStatusWithFirestore(doseId, status, updates);
  } else {
    return await updateStatusWithMock(doseId, status, updates);
  }
}

/**
 * 약의 모든 복용 인스턴스 삭제
 */
export async function deleteDosesByMedId(medId: string): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    return await deleteDosesByMedIdWithSupabase(medId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    return await deleteDosesByMedIdWithFirestore(medId);
  } else {
    return await deleteDosesByMedIdWithMock(medId);
  }
}

/**
 * 복용 인스턴스 생성 (약 등록 시)
 */
export async function generateDoseInstances(med: Medication): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    return await generateWithSupabase(med);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    return await generateWithFirestore(med);
  } else {
    return await generateWithMock(med);
  }
}

/**
 * Dose 상태 변경 구독 (실시간 업데이트)
 */
export function subscribeDoseChange(listener: () => void): () => void {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    return subscribeWithSupabase(listener);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    return subscribeWithFirestore(listener);
  } else {
    return subscribeWithMock(listener);
  }
}

/**
 * ID로 복용 인스턴스 조회
 */
export async function getById(doseId: string): Promise<DoseInstance | undefined> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    const { getDoseById } = await import('./supabase/doses.dao');
    const result = await getDoseById(doseId);
    return result || undefined;
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    throw new Error('Firestore not implemented yet');
  } else {
    const doseMock = await loadDoseMock();
    return doseMock.getById(doseId);
  }
}

/**
 * AlertModal용 함수들 - Mock에서만 사용
 */
export async function onMainTapNow(dose: DoseInstance): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    await markDone(dose.id);
    return;
  }

  if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    throw new Error('Firestore not implemented yet');
  }

  const doseMock = await loadDoseMock();
  doseMock.onMainTapNow(dose);
}

export async function onMainTapSnooze(dose: DoseInstance, now?: number): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    const nextAlertAt = (now ?? Date.now()) + LOOP.SNOOZE_MIN * 60 * 1000;
    await updateDoseStatus(dose.id, 'SNOOZED', {
      retries: dose.retries + 1,
      nextAlertAt,
    });
    return;
  }

  if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    throw new Error('Firestore not implemented yet');
  }

  const doseMock = await loadDoseMock();
  doseMock.onMainTapSnooze(dose, now);
}

export async function onConfirmTapDone(dose: DoseInstance): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    await markDone(dose.id);
    return;
  }

  if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    throw new Error('Firestore not implemented yet');
  }

  const doseMock = await loadDoseMock();
  doseMock.onConfirmTapDone(dose);
}

export async function onConfirmTapNotYet(dose: DoseInstance, now?: number): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_DOSE) {
    const currentTime = now ?? Date.now();

    if (shouldAutoMiss(dose, currentTime)) {
      await updateDoseStatus(dose.id, 'MISSED', {
        nextAlertAt: null,
      });
      return;
    }

    await updateDoseStatus(dose.id, 'PENDING', {
      retries: dose.retries + 1,
      nextAlertAt: currentTime + LOOP.CONFIRM_STEP_MIN * 60 * 1000,
      hasConfirmAlert: true,
    });
    return;
  }

  if (ACTIVE_FLAGS.USE_FIRESTORE_DOSE) {
    throw new Error('Firestore not implemented yet');
  }

  const doseMock = await loadDoseMock();
  doseMock.onConfirmTapNotYet(dose, now);
}

// ========== Supabase 구현 ==========

async function listTodayWithSupabase(userId: string, date: Date): Promise<DoseInstance[]> {
  const { getDosesByDateRange } = await import('./supabase/doses.dao');
  
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return await getDosesByDateRange(userId, start.getTime(), end.getTime());
}

async function markDoneWithSupabase(doseId: string): Promise<void> {
  const { updateDoseStatus } = await import('./supabase/doses.dao');
  await updateDoseStatus(doseId, 'DONE', {
    nextAlertAt: null,
  });
  
  console.log(`[Dose] DONE: ${doseId} at ${new Date().toISOString()}`);
  
  // 보호자 통지
  const { getDoseById } = await import('./supabase/doses.dao');
  const dose = await getDoseById(doseId);
  if (dose) {
    if (import.meta.env.DEV) {
      const caregiverMock = await loadCaregiverMock();
      caregiverMock.notifyCaregiversOnce(doseId, dose.userId, 'DONE');
    }
  }
}

async function markMissedWithSupabase(doseId: string): Promise<void> {
  const { updateDoseStatus } = await import('./supabase/doses.dao');
  await updateDoseStatus(doseId, 'MISSED', {
    nextAlertAt: null,
  });
  
  console.log(`[Dose] MISSED: ${doseId} at ${new Date().toISOString()}`);
  
  // 보호자 통지
  const { getDoseById } = await import('./supabase/doses.dao');
  const dose = await getDoseById(doseId);
  if (dose) {
    if (import.meta.env.DEV) {
      const caregiverMock = await loadCaregiverMock();
      caregiverMock.notifyCaregiversOnce(doseId, dose.userId, 'MISSED');
    }
  }
}

async function updateStatusWithSupabase(
  doseId: string,
  status: DoseStatus,
  updates?: {
    retries?: number;
    hasConfirmAlert?: boolean;
    nextAlertAt?: number | null;
  }
): Promise<void> {
  const { updateDoseStatus } = await import('./supabase/doses.dao');
  await updateDoseStatus(doseId, status, updates);
}

async function deleteDosesByMedIdWithSupabase(medId: string): Promise<void> {
  const { deleteDosesByMedId } = await import('./supabase/doses.dao');
  await deleteDosesByMedId(medId);
}

async function generateWithSupabase(med: Medication): Promise<void> {
  const { createDose } = await import('./supabase/doses.dao');
  const { makeCardKeyTitle } = await import('../types/meds');
  
  // 기간 계산
  const days = med.isContinuous ? 30 : (med.durationDays ?? 3);
  const today = getTodayStart();
  
  // 각 날짜/시간별로 인스턴스 생성
  for (let d = 0; d < days; d++) {
    const targetDate = new Date(today.getTime() + d * 24 * 60 * 60 * 1000);
    
    for (const time of med.times) {
      const scheduledAt = combineDateAndTime(targetDate, time);
      const slotBucket = getSlotBucket(scheduledAt);
      const intakeContext = med.intakeContext || inferIntakeContext(time);
      
      // 카드 키/타이틀 생성
      const { key: cardKey, title: cardTitle } = makeCardKeyTitle(
        med,
        slotBucket,
        intakeContext
      );
      
      const doseData: Omit<DoseInstance, 'id'> = {
        userId: med.userId,
        medId: med.id,
        medCategory: med.category,
        scheduledAt,
        slotBucket,
        intakeContext,
        status: 'SCHEDULED',
        retries: 0,
        hasPreAlert: false,
        hasConfirmAlert: false,
        cardKey,
        cardTitle,
      };
      
      await createDose(doseData);
    }
  }
  
  console.log(`[Supabase] Generated ${days * med.times.length} dose instances for med ${med.id}`);
}

function subscribeWithSupabase(listener: () => void): () => void {
  // Supabase Realtime 구독
  const channel = supabase
    .channel('dose_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'doses',
      },
      () => {
        listener();
      }
    )
    .subscribe();
  
  // 구독 취소 함수 반환
  return () => {
    supabase.removeChannel(channel);
  };
}

// ========== Firestore 구현 ==========

async function listTodayWithFirestore(userId: string, date: Date): Promise<DoseInstance[]> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function markDoneWithFirestore(doseId: string): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function markMissedWithFirestore(doseId: string): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function updateStatusWithFirestore(
  doseId: string,
  status: DoseStatus,
  updates?: any
): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function deleteDosesByMedIdWithFirestore(medId: string): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function generateWithFirestore(med: Medication): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

function subscribeWithFirestore(listener: () => void): () => void {
  // TODO: Firestore 실시간 구독 구현 필요
  throw new Error('Firestore not implemented yet');
}

// ========== Mock 구현 ==========

async function listTodayWithMock(userId: string, date: Date): Promise<DoseInstance[]> {
  const medsMock = await loadMedsMock();
  return await medsMock.listTodayDoses(userId, date);
}

async function markDoneWithMock(doseId: string): Promise<void> {
  const doseMock = await loadDoseMock();
  doseMock.markDone(doseId);
}

async function markMissedWithMock(doseId: string): Promise<void> {
  const doseMock = await loadDoseMock();
  doseMock.markMissed(doseId);
}

async function updateStatusWithMock(
  doseId: string,
  status: DoseStatus,
  updates?: any
): Promise<void> {
  const doseMock = await loadDoseMock();
  const instance = doseMock.getById(doseId);
  if (instance) {
    instance.status = status;
    if (updates?.retries !== undefined) instance.retries = updates.retries;
    if (updates?.hasConfirmAlert !== undefined) instance.hasConfirmAlert = updates.hasConfirmAlert;
    if (updates?.nextAlertAt !== undefined) instance.nextAlertAt = updates.nextAlertAt;
  }
}

async function deleteDosesByMedIdWithMock(medId: string): Promise<void> {
  // Mock에는 deleteDosesByMedId 구현 필요
  console.warn('[Mock] deleteDosesByMedId not implemented');
}

async function generateWithMock(med: Medication): Promise<void> {
  // Mock의 saveMedication이 이미 인스턴스를 생성하므로 별도 구현 불필요
  console.log('[Mock] Dose instances are generated by saveMedication');
}

function subscribeWithMock(listener: () => void): () => void {
  if (!import.meta.env.DEV) {
    throw new Error('Mock 구독은 개발 모드에서만 사용할 수 있습니다.');
  }

  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  loadDoseMock()
    .then(({ subscribeDoseChange }) => {
      if (cancelled) {
        unsubscribe = subscribeDoseChange(listener);
        unsubscribe();
        return;
      }
      unsubscribe = subscribeDoseChange(listener);
    })
    .catch((error) => {
      console.error('[DoseMock] 구독 초기화 실패', error);
    });

  return () => {
    cancelled = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

// ========== 유틸리티 함수 ==========

/**
 * 복용 맥락 추론
 */
function inferIntakeContext(time: string): 'PLAIN' | 'PREMEAL' | 'POSTMEAL' | 'BEDTIME' {
  const hour = parseInt(time.split(':')[0], 10);
  
  // 취침 시간대 (22:00~02:59)
  if (hour >= 22 || hour < 3) {
    return 'BEDTIME';
  }
  
  return 'PLAIN';
}
