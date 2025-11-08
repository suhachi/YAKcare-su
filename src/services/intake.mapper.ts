/**
 * 스캔 Payload → MedicationDraft 변환기
 * 
 * Step 4.5.B: QR/OCR 소스 → 구조화된 약 정보
 */

import { MedicationDraft } from '../types/meds';
import { normalizeIntake, extractMedicationName } from './intake.normalize';

export type ScanSource = 'qr' | 'ocr';

export interface ScanPayload {
  source: ScanSource;
  rawText?: string;       // OCR 원문
  url?: string;           // QR URL
  metadata?: any;         // 추가 메타데이터
}

export interface MappingResult {
  draft: Partial<MedicationDraft>;
  confidence: 'full' | 'partial' | 'none';
  missingFields: string[]; // 부족한 필드 목록
  warnings: string[];      // 경고 메시지
}

/**
 * QR URL 파싱
 * - 약학정보원 등의 QR 형식 지원
 */
function parseQRUrl(url: string): { text?: string } {
  // MVP: URL에서 약 정보 추출은 서버 API 필요
  // 현재는 URL만 기록
  console.log('[IntakeMapper] QR URL:', url);
  
  // TODO: 실제 구현 시 서버 API 호출
  // const response = await fetch(`/api/parse-qr?url=${encodeURIComponent(url)}`);
  
  return {};
}

/**
 * 스캔 데이터 → MedicationDraft 변환
 * 
 * @param payload - 스캔 원본 데이터
 * @param userId - 대상 사용자 ID
 * @returns MappingResult
 */
export function mapScanToDraft(
  payload: ScanPayload,
  userId: string
): MappingResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];
  
  // 1. 원본 텍스트 추출
  let rawText = payload.rawText || '';
  
  if (payload.source === 'qr' && payload.url) {
    const parsed = parseQRUrl(payload.url);
    rawText = parsed.text || '';
    
    if (!rawText) {
      warnings.push('QR URL에서 정보를 추출할 수 없습니다');
    }
  }
  
  if (!rawText || rawText.trim().length === 0) {
    return {
      draft: {
        userId,
        source: payload.source,
        sourceUrl: payload.url,
      },
      confidence: 'none',
      missingFields: ['name', 'times'],
      warnings: ['스캔 정보를 불러오지 못했어요'],
    };
  }
  
  // 2. 정규화
  const normalized = normalizeIntake(rawText);
  
  // 3. 약 이름 추출
  const name = extractMedicationName(rawText);
  
  // 4. Draft 생성
  const draft: Partial<MedicationDraft> = {
    userId,
    name,
    category: 'PRESCRIPTION', // 기본값
    times: normalized.times,
    slots: [], // times에서 자동 결정
    source: payload.source,
    sourceUrl: payload.url,
  };
  
  // 5. 기간 설정
  if (normalized.durationDays) {
    draft.durationDays = normalized.durationDays;
    draft.isContinuous = false;
  } else {
    // 기본값: 7일
    draft.durationDays = 7;
    draft.isContinuous = false;
  }
  
  // 6. 누락 필드 체크
  if (!draft.name) {
    missingFields.push('name');
    warnings.push('약 이름을 확인해 주세요');
  }
  
  if (!draft.times || draft.times.length === 0) {
    missingFields.push('times');
    warnings.push('복용 시간을 선택해 주세요');
  }
  
  // 7. 신뢰도 결정
  let confidence: 'full' | 'partial' | 'none' = normalized.confidence;
  
  // 필수 필드가 모두 있으면 full, 하나라도 없으면 partial
  if (missingFields.length > 0) {
    confidence = missingFields.length >= 2 ? 'none' : 'partial';
  }
  
  // 8. IntakeContext 정보는 별도로 반환 (MedicationDraft에는 없음)
  // MedConfirmSheet에서 useState로 관리
  if (normalized.context) {
    // @ts-ignore - 임시로 draft에 추가 (MedConfirmSheet에서 읽어서 상태로 설정)
    draft.suggestedIntakeContext = normalized.context;
  }
  
  console.log('[IntakeMapper] Mapped:', {
    confidence,
    name: draft.name,
    times: draft.times,
    context: normalized.context,
    missingFields,
  });
  
  return {
    draft,
    confidence,
    missingFields,
    warnings,
  };
}

/**
 * 테스트 픽스처 (Step 4.5.B 명세)
 */
export const TEST_FIXTURES = {
  T1: {
    input: '아침 저녁 식후 2회',
    expected: {
      times: ['08:00', '18:00'],
      context: 'POSTMEAL',
      confidence: 'full',
    },
  },
  T2: {
    input: '취침 전 1회',
    expected: {
      times: ['22:00'],
      context: 'BEDTIME',
      confidence: 'full',
    },
  },
  T3: {
    input: '아침 1정, 점심 1정, 저녁 1정',
    expected: {
      times: ['08:00', '12:00', '18:00'],
      confidence: 'partial',
    },
  },
  T4: {
    input: '1일 3회 식전',
    expected: {
      times: ['08:00', '12:00', '18:00'],
      context: 'PREMEAL',
      confidence: 'full',
    },
  },
  T5: {
    input: '알 수 없는 텍스트',
    expected: {
      confidence: 'none',
    },
  },
};

/**
 * 스캔 성공 여부 판단
 */
export function isScanSuccessful(result: MappingResult): boolean {
  return result.confidence !== 'none';
}

/**
 * 스캔 결과 메시지 생성
 */
export function getScanResultMessage(result: MappingResult): {
  title: string;
  description: string;
  variant: 'success' | 'warning' | 'error';
} {
  if (result.confidence === 'full') {
    return {
      title: '스캔 성공',
      description: '스캔 결과가 적용되었어요',
      variant: 'success',
    };
  }
  
  if (result.confidence === 'partial') {
    return {
      title: '일부만 인식됨',
      description: '일부만 인식되어 확인이 필요해요',
      variant: 'warning',
    };
  }
  
  return {
    title: '스캔 실패',
    description: '스캔 정보를 불러오지 못했어요. 직접 입력해 주세요.',
    variant: 'error',
  };
}
