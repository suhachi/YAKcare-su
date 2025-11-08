/**
 * 통합 약 관리 서비스
 * Feature Flag에 따라 Supabase/Firebase/Mock 자동 전환
 */

import { ACTIVE_FLAGS } from '../config/env';
import type { Medication, MedicationDraft } from '../types/meds';

const DEV_ONLY_MESSAGE = 'Mock 서비스는 개발 모드에서만 사용할 수 있습니다.';

type MedicationsMockModule = typeof import('./meds.mock');
let medsMockModule: Promise<MedicationsMockModule> | null = null;
const loadMedsMock: () => Promise<MedicationsMockModule> = import.meta.env.DEV
  ? () => {
      if (!medsMockModule) {
        medsMockModule = import('./meds.mock');
      }
      return medsMockModule;
    }
  : () => Promise.reject(new Error(`Medications Mock: ${DEV_ONLY_MESSAGE}`));

/**
 * 약 저장
 */
export async function saveMedication(draft: MedicationDraft): Promise<Medication> {
  if (ACTIVE_FLAGS.USE_SUPABASE_MEDS) {
    return await saveWithSupabase(draft);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_MEDS) {
    return await saveWithFirestore(draft);
  } else {
    return await saveWithMock(draft);
  }
}

/**
 * 사용자의 모든 약 조회
 */
export async function listMedications(userId: string): Promise<Medication[]> {
  if (ACTIVE_FLAGS.USE_SUPABASE_MEDS) {
    return await listWithSupabase(userId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_MEDS) {
    return await listWithFirestore(userId);
  } else {
    return await listWithMock(userId);
  }
}

/**
 * 특정 약 조회
 */
export async function getMedication(medId: string): Promise<Medication | null> {
  if (ACTIVE_FLAGS.USE_SUPABASE_MEDS) {
    return await getWithSupabase(medId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_MEDS) {
    return await getWithFirestore(medId);
  } else {
    return await getWithMock(medId);
  }
}

/**
 * 약 수정
 */
export async function updateMedication(medId: string, updates: Partial<MedicationDraft>): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_MEDS) {
    return await updateWithSupabase(medId, updates);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_MEDS) {
    return await updateWithFirestore(medId, updates);
  } else {
    return await updateWithMock(medId, updates);
  }
}

/**
 * 약 삭제
 */
export async function deleteMedication(medId: string): Promise<void> {
  if (ACTIVE_FLAGS.USE_SUPABASE_MEDS) {
    return await deleteWithSupabase(medId);
  } else if (ACTIVE_FLAGS.USE_FIRESTORE_MEDS) {
    return await deleteWithFirestore(medId);
  } else {
    return await deleteWithMock(medId);
  }
}

/**
 * 환자의 등록된 모든 카드 목록 조회 (보호자용)
 */
export async function listPatientCardsAll(userId: string): Promise<any[]> {
  // Mock에만 있는 함수 - 필요 시 Supabase/Firestore에도 구현
  const medsMock = await loadMedsMock();
  return await medsMock.listPatientCardsAll(userId);
}

/**
 * 특정 카드의 오늘 복용 상태 집계 (보호자용)
 */
export async function summarizeCardToday(
  userId: string,
  cardKey: string,
  date: Date = new Date()
): Promise<any | null> {
  // Mock에만 있는 함수 - 필요 시 Supabase/Firestore에도 구현
  const medsMock = await loadMedsMock();
  return await medsMock.summarizeCardToday(userId, cardKey, date);
}

// ========== Supabase 구현 ==========

async function saveWithSupabase(draft: MedicationDraft): Promise<Medication> {
  const { createMedication } = await import('./supabase/medications.dao');
  const { generateDoseInstances } = await import('./doses.service');
  
  // 카테고리별 기본값 적용
  const finalDraft = applyDefaults(draft);
  
  // Supabase에 약 저장
  const medication = await createMedication(finalDraft);
  
  // 복용 인스턴스 생성
  await generateDoseInstances(medication);
  
  console.log('GA4: med_save_success (Supabase)', {
    medId: medication.id,
    category: medication.category,
    source: medication.source,
  });
  
  return medication;
}

async function listWithSupabase(userId: string): Promise<Medication[]> {
  const { getMedicationsByUserId } = await import('./supabase/medications.dao');
  return await getMedicationsByUserId(userId);
}

async function getWithSupabase(medId: string): Promise<Medication | null> {
  const { getMedicationById } = await import('./supabase/medications.dao');
  return await getMedicationById(medId);
}

async function updateWithSupabase(medId: string, updates: Partial<MedicationDraft>): Promise<void> {
  const { updateMedication: updateMed } = await import('./supabase/medications.dao');
  return await updateMed(medId, updates);
}

async function deleteWithSupabase(medId: string): Promise<void> {
  const { deleteMedication: deleteMed } = await import('./supabase/medications.dao');
  const { deleteDosesByMedId } = await import('./doses.service');
  
  // 관련 복용 인스턴스 삭제
  await deleteDosesByMedId(medId);
  
  // 약 삭제
  await deleteMed(medId);
}

// ========== Firestore 구현 ==========

async function saveWithFirestore(draft: MedicationDraft): Promise<Medication> {
  const { saveMedication: saveMed } = await import('./firestore/medications.dao');
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function listWithFirestore(userId: string): Promise<Medication[]> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function getWithFirestore(medId: string): Promise<Medication | null> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function updateWithFirestore(medId: string, updates: Partial<MedicationDraft>): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

async function deleteWithFirestore(medId: string): Promise<void> {
  // TODO: Firestore DAO 구현 필요
  throw new Error('Firestore not implemented yet');
}

// ========== Mock 구현 ==========

async function saveWithMock(draft: MedicationDraft): Promise<Medication> {
  const medsMock = await loadMedsMock();
  return await medsMock.saveMedication(draft);
}

async function listWithMock(userId: string): Promise<Medication[]> {
  const medsMock = await loadMedsMock();
  return await medsMock.listMedications(userId);
}

async function getWithMock(medId: string): Promise<Medication | null> {
  const medsMock = await loadMedsMock();
  const result = await medsMock.getMedication(medId);
  return result || null;
}

async function updateWithMock(medId: string, updates: Partial<MedicationDraft>): Promise<void> {
  const medsMock = await loadMedsMock();
  if (typeof medsMock.updateMedication === 'function') {
    await medsMock.updateMedication(medId, updates);
    return;
  }

  console.warn('[Mock] updateMedication not implemented');
}

async function deleteWithMock(medId: string): Promise<void> {
  const medsMock = await loadMedsMock();
  if (typeof medsMock.deleteMedication === 'function') {
    await medsMock.deleteMedication(medId);
    return;
  }

  console.warn('[Mock] deleteMedication not implemented');
}

// ========== 유틸리티 함수 ==========

/**
 * 카테고리별 기본값 적용
 */
function applyDefaults(draft: MedicationDraft): MedicationDraft {
  let finalDurationDays = draft.durationDays;
  let finalIsContinuous = draft.isContinuous ?? false;

  if (!draft.durationDays && !draft.isContinuous) {
    if (draft.category === 'CHRONIC' || draft.category === 'SUPPLEMENT') {
      // 만성/영양제: 계속 복용
      finalIsContinuous = true;
      finalDurationDays = undefined;
    } else {
      // 처방약: 7일
      finalIsContinuous = false;
      finalDurationDays = 7;
    }
  }

  return {
    ...draft,
    durationDays: finalDurationDays,
    isContinuous: finalIsContinuous,
  };
}
