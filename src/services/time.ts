// 시간 관련 유틸리티

import { SlotType } from '../types/meds';
import type { SlotBucket } from '../types/dose';

/**
 * 15분 단위 시간 배열 생성
 * @param start - 시작 시간 (예: "00:00")
 * @param end - 종료 시간 (예: "23:59")
 * @returns 15분 단위 시간 배열
 */
export function generate15mTimes(start = '00:00', end = '23:59'): string[] {
  const times: string[] = [];
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  for (let h = startHour; h <= endHour; h++) {
    const startM = h === startHour ? Math.floor(startMin / 15) * 15 : 0;
    const endM = h === endHour ? Math.ceil(endMin / 15) * 15 : 60;

    for (let m = startM; m < endM; m += 15) {
      if (h === 24) break; // 24:00 방지
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }

  return times;
}

/**
 * 시간 형식 검증
 * @param time - "HH:MM" 형식 시간 문자열
 * @returns 유효 여부
 */
export function isValidTime(time: string): boolean {
  // HH:MM 형식, 15분 단위 (00, 15, 30, 45)
  return /^([01]\d|2[0-3]):(00|15|30|45)$/.test(time);
}

/**
 * 시간 배열 중복 제거 및 정렬
 * @param times - 시간 배열
 * @returns 중복 제거 및 정렬된 시간 배열
 */
export function uniqueTimes(times: string[]): string[] {
  return Array.from(new Set(times)).sort((a, b) => {
    const [aH, aM] = a.split(':').map(Number);
    const [bH, bM] = b.split(':').map(Number);
    return aH * 60 + aM - (bH * 60 + bM);
  });
}

/**
 * 슬롯별 기본 시간 반환
 * @param slots - 슬롯 배열
 * @returns 기본 시간 배열
 */
export function defaultTimesForSlots(slots: SlotType[]): string[] {
  const slotTimeMap: Record<SlotType, string> = {
    MORNING: '08:00',
    NOON: '12:00',
    EVENING: '18:00',
    BEDTIME: '22:00',
  };

  const times = slots.map((slot) => slotTimeMap[slot]).filter(Boolean);
  return uniqueTimes(times);
}

/**
 * 시간을 "오전/오후 HH:MM" 형식으로 변환
 * @param time - "HH:MM" 형식 시간
 * @returns 읽기 쉬운 형식
 */
export function formatTimeReadable(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${displayHour}:${minute.toString().padStart(2, '0')}`;
}

/**
 * 현재 시간에 가장 가까운 15분 단위 시간 반환
 * @returns "HH:MM" 형식 시간
 */
export function getCurrentRounded15m(): string {
  const now = new Date();
  const minutes = Math.round(now.getMinutes() / 15) * 15;
  const hours = minutes === 60 ? now.getHours() + 1 : now.getHours();
  const finalMinutes = minutes === 60 ? 0 : minutes;

  return `${hours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
}

/**
 * 날짜와 시간을 조합하여 timestamp 생성
 * @param date - 날짜 객체
 * @param time - "HH:MM" 형식 시간
 * @returns epoch millis
 */
export function combineDateAndTime(date: Date, time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hour, minute, 0, 0);
  return combined.getTime();
}

/**
 * 오늘 날짜의 시작 시간 (00:00:00)
 * @returns Date 객체
 */
export function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 오늘 날짜의 종료 시간 (23:59:59)
 * @returns Date 객체
 */
export function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

/**
 * 시간을 슬롯 버킷으로 매핑
 * @param date - 날짜 객체 또는 timestamp
 * @returns 슬롯 버킷 ('MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'OTHER')
 * 
 * 버킷 정의:
 * - MORNING: 05:00 ~ 11:29
 * - NOON: 11:30 ~ 16:29
 * - EVENING: 16:30 ~ 21:29
 * - BEDTIME: 21:30 ~ 02:29 (다음날)
 * - OTHER: 02:30 ~ 04:59 (새벽 특수 시간)
 */
export function getSlotBucket(date: Date | number): SlotBucket {
  const d = typeof date === 'number' ? new Date(date) : date;
  const h = d.getHours();
  const m = d.getMinutes();
  const totalMinutes = h * 60 + m;

  // 05:00 ~ 11:29 (300 ~ 689)
  if (totalMinutes >= 300 && totalMinutes < 690) {
    return 'MORNING';
  }
  
  // 11:30 ~ 16:29 (690 ~ 989)
  if (totalMinutes >= 690 && totalMinutes < 990) {
    return 'NOON';
  }
  
  // 16:30 ~ 21:29 (990 ~ 1289)
  if (totalMinutes >= 990 && totalMinutes < 1290) {
    return 'EVENING';
  }
  
  // 21:30 ~ 02:29 (1290 ~ 1439 or 0 ~ 149)
  if (totalMinutes >= 1290 || totalMinutes < 150) {
    return 'BEDTIME';
  }
  
  // 02:30 ~ 04:59 (150 ~ 299)
  return 'OTHER';
}

/**
 * HH:MM 문자열을 슬롯 버킷으로 매핑
 * @param time - "HH:MM" 형식 시간
 * @returns 슬롯 버킷
 */
export function timeToSlotBucket(time: string): SlotBucket {
  const [hour, minute] = time.split(':').map(Number);
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 300 && totalMinutes < 690) return 'MORNING';
  if (totalMinutes >= 690 && totalMinutes < 990) return 'NOON';
  if (totalMinutes >= 990 && totalMinutes < 1290) return 'EVENING';
  if (totalMinutes >= 1290 || totalMinutes < 150) return 'BEDTIME';
  return 'OTHER';
}

/**
 * 만성질환 타입별 권장 복용 시간 반환
 * @param chronicType - 만성질환 타입
 * @returns 권장 시간 배열 (HH:MM 형식)
 * 
 * 권장 시간:
 * - 고혈압(HYPERTENSION): 08:00, 20:00 (아침/저녁 식후)
 * - 당뇨(DIABETES): 08:00, 20:00 (아침 식전/저녁 식후)
 * - 고지혈증(HYPERLIPIDEMIA): 22:00 (취침 전)
 * - 기타(OTHER): [] (사용자가 직접 설정)
 */
export function getChronicDefaultTimes(chronicType: string): string[] {
  switch (chronicType) {
    case 'HYPERTENSION':
      return ['08:00', '20:00']; // 고혈압: 아침/저녁
    case 'DIABETES':
      return ['08:00', '20:00']; // 당뇨: 아침/저녁
    case 'HYPERLIPIDEMIA':
      return ['22:00']; // 고지혈증: 취침 전
    case 'OTHER':
      return []; // 기타: 사용자 지정
    default:
      return [];
  }
}
