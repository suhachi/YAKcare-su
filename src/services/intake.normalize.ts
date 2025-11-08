/**
 * 스캔 데이터 정규화 유틸리티
 * QR/OCR 텍스트 → 구조화된 약 정보
 * 
 * Step 4.5.B: 시간/맥락/빈도 패턴 매칭
 */

import { IntakeContext } from '../types/dose';

// 한글 숫자 변환
const KOREAN_NUMBERS: Record<string, number> = {
  '한': 1,
  '두': 2,
  '세': 3,
  '네': 4,
  '다섯': 5,
  '여섯': 6,
  '하나': 1,
  '둘': 2,
  '셋': 3,
  '넷': 4,
};

// 시간대 디폴트 (권장 시간)
const SLOT_DEFAULTS: Record<string, string> = {
  '아침': '08:00',
  '점심': '12:00',
  '저녁': '18:00',
  '취침': '22:00',
  '취침전': '22:00',
};

export interface NormalizedTime {
  time: string;        // "HH:mm" 형식
  context?: IntakeContext;
}

export interface NormalizedIntake {
  times: string[];                    // ["08:00", "18:00"]
  context?: IntakeContext;            // PLAIN/PREMEAL/POSTMEAL/BEDTIME
  frequency?: number;                 // 1~6
  durationDays?: number;
  confidence: 'full' | 'partial' | 'none'; // 매핑 신뢰도
  raw?: string;                       // 원문 (디버깅용)
}

/**
 * 개인정보 마스킹
 * - 주민번호, 전화번호, 처방전 번호 등
 */
export function maskSensitiveInfo(text: string): string {
  let masked = text;
  
  // 주민번호 (6자리-7자리)
  masked = masked.replace(/\d{6}-?\d{7}/g, '******-*******');
  
  // 전화번호 (3자리-3~4자리-4자리)
  masked = masked.replace(/\d{2,3}-?\d{3,4}-?\d{4}/g, '***-****-****');
  
  // 처방전 번호 (연속된 8자리 이상 숫자)
  masked = masked.replace(/\b\d{8,}\b/g, '********');
  
  return masked;
}

/**
 * 시간 패턴 추출
 * - "HH:MM" 형식
 * - "오전/오후 H시 M분"
 */
export function extractTimes(text: string): string[] {
  const times: string[] = [];
  
  // HH:MM 형식 (24시간)
  const timePattern = /(\d{1,2}):(\d{2})/g;
  let match;
  while ((match = timePattern.exec(text)) !== null) {
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  
  // "오전/오후 H시 M분" 형식
  const koreanTimePattern = /(오전|오후)\s*(\d{1,2})\s*시(\s*(\d{1,2})\s*분)?/g;
  while ((match = koreanTimePattern.exec(text)) !== null) {
    const period = match[1];
    let hour = parseInt(match[2], 10);
    const minute = match[4] ? parseInt(match[4], 10) : 0;
    
    // 오후 변환 (12시간 → 24시간)
    if (period === '오후' && hour < 12) {
      hour += 12;
    } else if (period === '오전' && hour === 12) {
      hour = 0;
    }
    
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  
  return Array.from(new Set(times)).sort(); // 중복 제거 + 정렬
}

/**
 * 시간대 키워드 추출 (아침/점심/저녁/취침)
 * - "아침 1정, 저녁 1정" → ['아침', '저녁']
 */
export function extractSlotKeywords(text: string): string[] {
  const slots: string[] = [];
  
  if (/아침/i.test(text)) slots.push('아침');
  if (/점심/i.test(text)) slots.push('점심');
  if (/저녁/i.test(text)) slots.push('저녁');
  if (/취침(전)?/i.test(text)) slots.push('취침전');
  
  return slots;
}

/**
 * 복용 맥락 추출
 * - "식전" → PREMEAL
 * - "식후" → POSTMEAL
 * - "취침전" → BEDTIME
 */
export function extractIntakeContext(text: string): IntakeContext | undefined {
  if (/식전|공복/i.test(text)) return 'PREMEAL';
  if (/식후/i.test(text)) return 'POSTMEAL';
  if (/취침(전)?/i.test(text)) return 'BEDTIME';
  return undefined;
}

/**
 * 복용 빈도 추출
 * - "1일 3회" → 3
 * - "하루 두번" → 2
 */
export function extractFrequency(text: string): number | undefined {
  // "1일 N회" 패턴
  const dailyPattern = /1일\s*([1-6])회/;
  const dailyMatch = text.match(dailyPattern);
  if (dailyMatch) {
    return parseInt(dailyMatch[1], 10);
  }
  
  // "하루 (한|두|세)번" 패턴
  const koreanPattern = /하루\s*(한|두|세|네|다섯|여섯)\s*번/;
  const koreanMatch = text.match(koreanPattern);
  if (koreanMatch) {
    return KOREAN_NUMBERS[koreanMatch[1]] || undefined;
  }
  
  return undefined;
}

/**
 * 복용 기간 추출
 * - "7일분" → 7
 * - "30일분" → 30
 */
export function extractDuration(text: string): number | undefined {
  const durationPattern = /(\d+)\s*일\s*분?/;
  const match = text.match(durationPattern);
  if (match) {
    const days = parseInt(match[1], 10);
    if (days > 0 && days <= 365) {
      return days;
    }
  }
  return undefined;
}

/**
 * 전체 정규화 (통합)
 * 
 * 우선순위:
 * 1. 시간+맥락 동시 추출 → 그대로 사용 (full)
 * 2. 시간만 추출 → 맥락=PLAIN (partial)
 * 3. 맥락+슬롯만 추출 → 시간=디폴트 (partial)
 * 4. 둘 다 없음 → none (수기 폴백)
 */
export function normalizeIntake(text: string): NormalizedIntake {
  const maskedText = maskSensitiveInfo(text);
  
  // 1. 시간 추출
  let times = extractTimes(text);
  
  // 2. 맥락 추출
  const context = extractIntakeContext(text);
  
  // 3. 빈도 추출
  const frequency = extractFrequency(text);
  
  // 4. 기간 추출
  const durationDays = extractDuration(text);
  
  // 5. 시간이 없으면 슬롯 키워드로 디폴트 시간 생성
  if (times.length === 0) {
    const slots = extractSlotKeywords(text);
    times = slots.map(slot => SLOT_DEFAULTS[slot]).filter(Boolean);
  }
  
  // 6. 빈도 정보가 있는데 시간이 부족하면 디폴트로 채우기
  if (frequency && times.length < frequency) {
    const defaultTimes = ['08:00', '12:00', '18:00', '22:00'];
    while (times.length < frequency && times.length < 6) {
      const nextTime = defaultTimes[times.length];
      if (nextTime && !times.includes(nextTime)) {
        times.push(nextTime);
      } else {
        break;
      }
    }
  }
  
  // 7. 신뢰도 결정
  let confidence: 'full' | 'partial' | 'none' = 'none';
  
  if (times.length > 0 && context) {
    confidence = 'full'; // 시간 + 맥락 모두
  } else if (times.length > 0 || context) {
    confidence = 'partial'; // 둘 중 하나만
  }
  
  return {
    times: times.slice(0, 6), // 최대 6개
    context,
    frequency,
    durationDays,
    confidence,
    raw: maskedText,
  };
}

/**
 * 약 이름 추출 (간단한 휴리스틱)
 * - 첫 줄 또는 가장 긴 단어
 */
export function extractMedicationName(text: string): string | undefined {
  // 첫 줄 추출
  const firstLine = text.split('\n')[0]?.trim();
  
  // 숫자/특수문자 제거
  const cleaned = firstLine?.replace(/[0-9.,\-()]/g, '').trim();
  
  // 2~40자 사이면 약 이름으로 간주
  if (cleaned && cleaned.length >= 2 && cleaned.length <= 40) {
    return cleaned;
  }
  
  return undefined;
}
