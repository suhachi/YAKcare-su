// 약 등록 타입 정의

import { IntakeContext } from './dose';

export type MedCategory = 'PRESCRIPTION' | 'SUPPLEMENT' | 'CHRONIC';
export type ChronicType = 'HYPERTENSION' | 'DIABETES' | 'HYPERLIPIDEMIA' | 'OTHER';
export type SlotType = 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME';
export type SourceType = 'qr' | 'ocr' | 'manual';

export interface MedicationDraft {
  userId: string;                 // 대상 복용자
  name: string;                   // 약 이름(필수)
  category: MedCategory;
  chronicType?: ChronicType;
  durationDays?: number;          // '계속'이면 undefined
  isContinuous?: boolean;         // true면 30일 롤링
  slots: SlotType[];
  times: string[];                // "08:00" 형태, 고유, ≤ 6
  intakeContext?: IntakeContext;  // Step 4.5+: 복용 맥락 (식전/식후/취침전)
  source: SourceType;
  sourceUrl?: string;
}

export interface Medication extends MedicationDraft {
  id: string;
  createdAt: number;
}

// 검증 규칙
export const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 40,
  MAX_TIMES: 6,
  MIN_TIMES: 1,
  DURATION_PRESETS: [3, 5, 7, 30],
} as const;

// 카테고리 라벨
export const CATEGORY_LABELS: Record<MedCategory, string> = {
  PRESCRIPTION: '처방약',
  SUPPLEMENT: '영양제',
  CHRONIC: '만성질환약',
};

// 만성질환 타입 라벨
export const CHRONIC_TYPE_LABELS: Record<ChronicType, string> = {
  HYPERTENSION: '고혈압',
  DIABETES: '당뇨',
  HYPERLIPIDEMIA: '고지혈증',
  OTHER: '기타',
};

// 만성질환 라벨 (별칭)
export const CHRONIC_LABELS = CHRONIC_TYPE_LABELS;

// 슬롯 라벨
export const SLOT_LABELS: Record<SlotType, string> = {
  MORNING: '아침',
  NOON: '점심',
  EVENING: '저녁',
  BEDTIME: '취침 전',
};

/**
 * 약 이름 표시 함수 - 만성질환약은 "약 이름 (질환명)" 형식으로 표시
 * @param med - 약 정보
 * @returns 표시용 약 이름
 * 
 * @example
 * // 만성질환약
 * displayMedName({ name: '아테놀', category: 'CHRONIC', chronicType: 'HYPERTENSION' })
 * // → "아테놀 (고혈압)"
 * 
 * // 일반 약
 * displayMedName({ name: '타이레놀', category: 'PRESCRIPTION' })
 * // → "타이레놀"
 */
export function displayMedName(med: Medication | MedicationDraft): string {
  if (med.category === 'CHRONIC' && med.chronicType) {
    const label = CHRONIC_TYPE_LABELS[med.chronicType];
    return `${med.name} (${label})`;
  }
  return med.name;
}

// 카테고리 헬퍼 함수
export const isChronic = (category?: MedCategory) => category === 'CHRONIC';
export const isSupplement = (category?: MedCategory) => category === 'SUPPLEMENT';
export const isPrescription = (category?: MedCategory) => category === 'PRESCRIPTION';

// 카테고리 정렬 순서 (홈 화면 섹션 표시용)
export const CATEGORY_ORDER: MedCategory[] = ['CHRONIC', 'SUPPLEMENT', 'PRESCRIPTION'];

/**
 * 카드 식별자 & 제목 생성
 * 
 * 규칙:
 * - 만성/영양제: 1등록=1카드 → cardKey = "MED:{medId}"
 * - 처방: 복용군별 카드 → cardKey = "MED:{medId}:REGIMEN:{slot}[:{ctx}]"
 * 
 * @param med - 약 정보
 * @param slot - 슬롯 버킷 (MORNING/NOON/EVENING/BEDTIME/OTHER)
 * @param ctx - 복용 맥락 (PLAIN/PREMEAL/POSTMEAL/BEDTIME)
 * @returns { key: string, title: string }
 * 
 * @example
 * // 만성질환약
 * makeCardKeyTitle(med, 'MORNING', 'PLAIN')
 * // → { key: "MED:med123", title: "아테놀 (고혈압)" }
 * 
 * // 영양제
 * makeCardKeyTitle(med, 'MORNING', 'PLAIN')
 * // → { key: "MED:med456", title: "비타민D" }
 * 
 * // 처방약 (아침)
 * makeCardKeyTitle(med, 'MORNING', 'PLAIN')
 * // → { key: "MED:med789:REGIMEN:MORNING", title: "아토르바스타틴 • 아침" }
 * 
 * // 처방약 (저녁 식후)
 * makeCardKeyTitle(med, 'EVENING', 'POSTMEAL')
 * // → { key: "MED:med789:REGIMEN:EVENING:POSTMEAL", title: "아토르바스타틴 • 저녁 식후" }
 */
export function makeCardKeyTitle(
  med: Medication,
  slot: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'OTHER',
  ctx: 'PLAIN' | 'PREMEAL' | 'POSTMEAL' | 'BEDTIME' = 'PLAIN'
): { key: string; title: string } {
  // 만성/영양제: 1등록=1카드
  if (med.category === 'CHRONIC' || med.category === 'SUPPLEMENT') {
    return {
      key: `MED:${med.id}`,
      title: displayMedName(med), // "약이름 (질환명)" 또는 "약이름"
    };
  }

  // 처방: 복용군별 카드
  const slotLabels = {
    MORNING: '아침',
    NOON: '점심',
    EVENING: '저녁',
    BEDTIME: '취침 전',
    OTHER: '기타',
  } as const;

  const ctxLabels = {
    PLAIN: '',
    PREMEAL: ' 식전',
    POSTMEAL: ' 식후',
    BEDTIME: '', // 취침 전은 slot에서 처리
  } as const;

  const slotLabel = slotLabels[slot];
  const ctxLabel = ctxLabels[ctx];

  // 키: MED:${medId}:REGIMEN:${slot}[:ctx]
  const keySuffix = ctx !== 'PLAIN' ? `:${ctx}` : '';
  const key = `MED:${med.id}:REGIMEN:${slot}${keySuffix}`;

  // 타이틀: "약이름 • 아침 식전"
  const title = `${med.name} • ${slotLabel}${ctxLabel}`.trim();

  return { key, title };
}

// 검증 함수
export function validateMedicationDraft(draft: Partial<MedicationDraft>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 약 이름 검증
  if (!draft.name || draft.name.trim().length < VALIDATION.NAME_MIN_LENGTH) {
    errors.push(`약 이름은 최소 ${VALIDATION.NAME_MIN_LENGTH}자 이상이어야 합니다`);
  }
  if (draft.name && draft.name.length > VALIDATION.NAME_MAX_LENGTH) {
    errors.push(`약 이름은 최대 ${VALIDATION.NAME_MAX_LENGTH}자까지 가능합니다`);
  }

  // 시간 검증
  if (!draft.times || draft.times.length < VALIDATION.MIN_TIMES) {
    errors.push('최소 1개 이상의 복용 시간을 선택해야 합니다');
  }
  if (draft.times && draft.times.length > VALIDATION.MAX_TIMES) {
    errors.push(`복용 시간은 최대 ${VALIDATION.MAX_TIMES}개까지 선택할 수 있습니다`);
  }
  if (draft.times && new Set(draft.times).size !== draft.times.length) {
    errors.push('중복된 시간이 있습니다');
  }

  // 기간 검증
  if (!draft.isContinuous && draft.durationDays) {
    if (!VALIDATION.DURATION_PRESETS.includes(draft.durationDays)) {
      errors.push('올바른 복용 기간을 선택해주세요');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
