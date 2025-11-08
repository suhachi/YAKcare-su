// Mock 약 저장/조회 서비스 (Step 2에서 Firestore로 교체)

import { MedicationDraft, Medication } from '../types/meds';
import { DoseInstance } from '../types/dose';
import { combineDateAndTime, getTodayStart, getTodayEnd, getSlotBucket } from './time';
import { registerDose, doseMemory } from './dose.mock';

// 메모리 저장소
const memory = {
  meds: new Map<string, Medication>(),
  doses: doseMemory, // dose.mock.ts와 공유
};

// 고유 ID 생성
function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * 약 정보 저장 및 복용 인스턴스 생성
 * @param draft - 약 정보 초안
 * @returns 저장된 약 정보
 */
export async function saveMedication(draft: MedicationDraft): Promise<Medication> {
  // Step 4.5.B: 카테고리별 기본 durationDays 적용
  let finalDurationDays = draft.durationDays;
  let finalIsContinuous = draft.isContinuous ?? false;

  if (!draft.durationDays && !draft.isContinuous) {
    // durationDays가 없을 때 기본값 적용
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

  // 약 정보 생성
  const medication: Medication = {
    ...draft,
    durationDays: finalDurationDays,
    isContinuous: finalIsContinuous,
    id: generateId(),
    createdAt: Date.now(),
  };

  // 메모리에 저장
  memory.meds.set(medication.id, medication);

  // 복용 인스턴스 생성
  await generateDoseInstances(medication);

  console.log('GA4: med_save_success', {
    medId: medication.id,
    category: medication.category,
    source: medication.source,
    intakeContext: medication.intakeContext,
    timesCount: medication.times.length,
    durationDays: medication.isContinuous ? 'continuous' : medication.durationDays,
  });

  return medication;
}

/**
 * 복용 인스턴스 생성
 * @param med - 약 정보
 */
async function generateDoseInstances(med: Medication): Promise<void> {
  const { makeCardKeyTitle } = await import('../types/meds');
  
  // 기간 계산: 계속 복용이면 30일, 아니면 지정된 기간
  const days = med.isContinuous ? 30 : (med.durationDays ?? 3);
  const today = getTodayStart();

  // 각 날짜에 대해 복용 시간별로 인스턴스 생성
  for (let d = 0; d < days; d++) {
    const targetDate = new Date(today.getTime() + d * 24 * 60 * 60 * 1000);

    for (const time of med.times) {
      const scheduledAt = combineDateAndTime(targetDate, time);
      const slotBucket = getSlotBucket(scheduledAt);
      
      // Step 4.5+: 사용자가 선택한 IntakeContext 사용 (없으면 추론)
      const intakeContext = med.intakeContext || inferIntakeContext(med, time);
      
      // 카드 키/타이틀 생성
      const { key: cardKey, title: cardTitle } = makeCardKeyTitle(
        med,
        slotBucket,
        intakeContext
      );

      const dose: DoseInstance = {
        id: generateId(),
        userId: med.userId,
        medId: med.id,
        medCategory: med.category, // 카테고리 포함 (섹션 분리용)
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

      memory.doses.set(dose.id, dose);
      registerDose(dose); // dose.mock.ts에 등록하여 알림 스케줄링
    }
  }

  console.log(`Generated ${days * med.times.length} dose instances for med ${med.id}`);
}

/**
 * 복용 맥락 추론 (MVP 버전)
 * TODO: MedConfirmSheet에서 사용자가 선택한 값 사용
 * 
 * @param med - 약 정보
 * @param time - 복용 시간 ("08:00")
 * @returns IntakeContext
 */
function inferIntakeContext(
  med: Medication,
  time: string
): 'PLAIN' | 'PREMEAL' | 'POSTMEAL' | 'BEDTIME' {
  // MVP: 모두 PLAIN으로 처리
  // 추후 확장:
  // - QR/OCR 파싱 결과에서 식전/식후 정보 추출
  // - MedConfirmSheet에서 사용자 선택 값 반영
  // - 취침 시간(21:30 이후)은 자동으로 BEDTIME
  
  const hour = parseInt(time.split(':')[0], 10);
  
  // 취침 시간대 (21:30~02:29)는 자동으로 BEDTIME 맥락
  if (hour >= 22 || hour < 3) {
    return 'BEDTIME';
  }
  
  return 'PLAIN';
}

/**
 * 사용자의 오늘 복용 인스턴스 조회
 * @param userId - 사용자 ID
 * @param date - 조회 날짜 (기본: 오늘)
 * @returns 복용 인스턴스 배열
 */
export async function listTodayDoses(userId: string, date: Date = new Date()): Promise<DoseInstance[]> {
  // dose.mock.ts의 함수를 사용하여 중복 방지
  const { listTodayByUser } = await import('./dose.mock');
  return listTodayByUser(userId, date);
}

/**
 * 사용자의 모든 약 조회
 * @param userId - 사용자 ID
 * @returns 약 정보 배열
 */
export async function listMedications(userId: string): Promise<Medication[]> {
  const meds = Array.from(memory.meds.values())
    .filter((m) => m.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);

  return meds;
}

/**
 * 특정 약 정보 조회
 * @param medId - 약 ID
 * @returns 약 정보 또는 undefined
 */
export async function getMedication(medId: string): Promise<Medication | undefined> {
  return memory.meds.get(medId);
}

/**
 * 복용 인스턴스 상태 업데이트
 * @param doseId - 복용 인스턴스 ID
 * @param status - 새 상태
 * @returns 업데이트된 인스턴스
 */
export async function updateDoseStatus(doseId: string, status: DoseInstance['status']): Promise<DoseInstance | undefined> {
  const dose = memory.doses.get(doseId);
  if (!dose) return undefined;

  dose.status = status;
  memory.doses.set(doseId, dose);

  console.log('GA4: dose_status_update', { doseId, status });

  return dose;
}

/**
 * 사용자의 오늘 복용률 계산
 * @param userId - 사용자 ID
 * @returns 복용률 (0-100)
 */
export async function getTodayCompletionRate(userId: string): Promise<number> {
  const doses = await listTodayDoses(userId);
  if (doses.length === 0) return 0;

  const completedCount = doses.filter((d) => d.status === 'DONE').length;
  return Math.round((completedCount / doses.length) * 100);
}

/**
 * 메모리 초기화 (테스트용)
 */
export function clearMemory(): void {
  memory.meds.clear();
  memory.doses.clear();
  console.log('Memory cleared');
}

/**
 * 메모리 상태 확인 (디버깅용)
 */
export function getMemoryStats() {
  return {
    medications: memory.meds.size,
    doses: memory.doses.size,
  };
}

// ===== Step 4.1: 보호자 화면용 헬퍼 =====

export interface PatientCard {
  cardKey: string;
  cardTitle: string;
  category: MedicationDraft['category'];
  medId: string;
}

export interface CardSummary {
  cardKey: string;
  cardTitle: string;
  category: MedicationDraft['category'];
  remaining: number;   // 오늘 남은 건수
  done: number;        // 오늘 완료 건수
  missed: number;      // 오늘 누락 건수
  nextTime?: string;   // 다음 예정 시간 (HH:mm 형식), 없으면 undefined
}

/**
 * 환자의 등록된 모든 카드 목록 조회 (보호자용)
 * - 만성/영양제: 1등록=1카드
 * - 처방: 복용군별 카드
 * @param userId - 환자 ID
 * @returns 카드 목록
 */
export async function listPatientCardsAll(userId: string): Promise<PatientCard[]> {
  const meds = await listMedications(userId);
  const cards: PatientCard[] = [];
  const { makeCardKeyTitle } = await import('../types/meds');

  for (const med of meds) {
    if (med.category === 'CHRONIC' || med.category === 'SUPPLEMENT') {
      // 만성/영양제: 1등록=1카드
      const { key, title } = makeCardKeyTitle(med, 'MORNING', 'PLAIN'); // slot은 더미
      cards.push({
        cardKey: key,
        cardTitle: title,
        category: med.category,
        medId: med.id,
      });
    } else {
      // 처방: 실제 등록된 인스턴스에서 고유 cardKey 추출
      const doses = await listTodayDoses(userId);
      const uniqueKeys = new Set<string>();
      
      doses
        .filter((d) => d.medId === med.id)
        .forEach((d) => {
          if (d.cardKey && !uniqueKeys.has(d.cardKey)) {
            uniqueKeys.add(d.cardKey);
            cards.push({
              cardKey: d.cardKey,
              cardTitle: d.cardTitle,
              category: med.category,
              medId: med.id,
            });
          }
        });
    }
  }

  return cards;
}

/**
 * 특정 카드의 오늘 복용 상태 집계 (보호자용)
 * @param userId - 환자 ID
 * @param cardKey - 카드 키
 * @param date - 날짜 (기본: 오늘)
 * @returns 카드 요약 정보
 */
export async function summarizeCardToday(
  userId: string,
  cardKey: string,
  date: Date = new Date()
): Promise<CardSummary | null> {
  const doses = await listTodayDoses(userId, date);
  const cardDoses = doses.filter((d) => d.cardKey === cardKey);

  if (cardDoses.length === 0) {
    return null;
  }

  const remaining = cardDoses.filter(
    (d) => d.status !== 'DONE' && d.status !== 'MISSED'
  ).length;
  const done = cardDoses.filter((d) => d.status === 'DONE').length;
  const missed = cardDoses.filter((d) => d.status === 'MISSED').length;

  // 다음 예정 시간 찾기
  const nextDose = cardDoses
    .filter((d) => d.status !== 'DONE' && d.status !== 'MISSED')
    .sort((a, b) => a.scheduledAt - b.scheduledAt)[0];

  let nextTime: string | undefined;
  if (nextDose) {
    const dt = new Date(nextDose.scheduledAt);
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    nextTime = `${hh}:${mm}`;
  }

  return {
    cardKey,
    cardTitle: cardDoses[0].cardTitle,
    category: cardDoses[0].medCategory,
    remaining,
    done,
    missed,
    nextTime,
  };
}
