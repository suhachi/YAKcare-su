# types/health.ts

**파일 경로**: `src/types/health.ts`  
**타입**: 건강 기록 타입 정의

---

\`\`\`typescript
// 건강 기록 타입 정의

export type HealthRecordType = 'BP' | 'BG';
export type HealthTag = 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'OTHER';
export type BGMeasurementType = 'FASTING' | 'POST_2H'; // 공복 / 식후 2시간

export interface HealthRecord {
  id: string;
  userId: string;
  type: HealthRecordType;
  
  // 혈압 (BP)
  systolic?: number;   // 수축기 혈압
  diastolic?: number;  // 이완기 혈압
  pulse?: number;      // 맥박
  
  // 혈당 (BG)
  glucose?: number;    // 혈당 mg/dL
  measurementType?: BGMeasurementType; // 측정 구분
  
  tag: HealthTag;
  time: number;        // epoch ms
  memo?: string;       // 메모 (옵션)
}

export interface HealthStats {
  avgSystolic?: number;
  avgDiastolic?: number;
  avgPulse?: number;
  avgGlucose?: number;
  recentCount: number;
  recent: HealthRecord[];
}

// 검증 규칙
export const HEALTH_VALIDATION = {
  BP: {
    SYSTOLIC_MIN: 60,
    SYSTOLIC_MAX: 240,
    DIASTOLIC_MIN: 40,
    DIASTOLIC_MAX: 140,
    PULSE_MIN: 30,
    PULSE_MAX: 180,
    MIN_DIFF: 10, // 수축기 >= 이완기 + 10
  },
  BG: {
    MIN: 30,
    MAX: 600,
  },
} as const;

// 태그 라벨
export const HEALTH_TAG_LABELS: Record<HealthTag, string> = {
  MORNING: '아침',
  NOON: '점심',
  EVENING: '저녁',
  BEDTIME: '취침 전',
  OTHER: '기타',
};

// 측정 구분 라벨
export const BG_MEASUREMENT_LABELS: Record<BGMeasurementType, string> = {
  FASTING: '공복',
  POST_2H: '식후 2시간',
};

// 혈압 검증
export function validateBP(systolic?: number, diastolic?: number, pulse?: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const v = HEALTH_VALIDATION.BP;

  if (!systolic || !diastolic) {
    errors.push('혈압 값을 모두 입력해주세요');
    return { valid: false, errors };
  }

  if (systolic < v.SYSTOLIC_MIN || systolic > v.SYSTOLIC_MAX) {
    errors.push(`수축기 혈압은 ${v.SYSTOLIC_MIN}-${v.SYSTOLIC_MAX} 범위여야 합니다`);
  }

  if (diastolic < v.DIASTOLIC_MIN || diastolic > v.DIASTOLIC_MAX) {
    errors.push(`이완기 혈압은 ${v.DIASTOLIC_MIN}-${v.DIASTOLIC_MAX} 범위여야 합니다`);
  }

  if (systolic - diastolic < v.MIN_DIFF) {
    errors.push(`수축기 혈압이 이완기보다 최소 ${v.MIN_DIFF} 이상 커야 합니다`);
  }

  if (pulse !== undefined) {
    if (pulse < v.PULSE_MIN || pulse > v.PULSE_MAX) {
      errors.push(`맥박은 ${v.PULSE_MIN}-${v.PULSE_MAX} 범위여야 합니다`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// 혈당 검증
export function validateBG(glucose?: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const v = HEALTH_VALIDATION.BG;

  if (!glucose) {
    errors.push('혈당 값을 입력해주세요');
    return { valid: false, errors };
  }

  if (glucose < v.MIN || glucose > v.MAX) {
    errors.push(`혈당은 ${v.MIN}-${v.MAX} mg/dL 범위여야 합니다`);
  }

  return { valid: errors.length === 0, errors };
}

// 혈압 상태 판정
export function getBPStatus(systolic: number, diastolic: number): 'NORMAL' | 'ELEVATED' | 'HIGH' | 'VERY_HIGH' {
  if (systolic >= 180 || diastolic >= 120) return 'VERY_HIGH';
  if (systolic >= 140 || diastolic >= 90) return 'HIGH';
  if (systolic >= 130 || diastolic >= 80) return 'ELEVATED';
  return 'NORMAL';
}

// 혈당 상태 판정
export function getBGStatus(glucose: number, isFasting: boolean): 'NORMAL' | 'ELEVATED' | 'HIGH' {
  if (isFasting) {
    if (glucose >= 126) return 'HIGH';
    if (glucose >= 100) return 'ELEVATED';
    return 'NORMAL';
  } else {
    if (glucose >= 200) return 'HIGH';
    if (glucose >= 140) return 'ELEVATED';
    return 'NORMAL';
  }
}

// 상태 라벨 및 색상
export const BP_STATUS_CONFIG = {
  NORMAL: { label: '정상', color: '#12B886' },
  ELEVATED: { label: '주의', color: '#F08C00' },
  HIGH: { label: '높음', color: '#E03131' },
  VERY_HIGH: { label: '매우 높음', color: '#C92A2A' },
};

export const BG_STATUS_CONFIG = {
  NORMAL: { label: '정상', color: '#12B886' },
  ELEVATED: { label: '주의', color: '#F08C00' },
  HIGH: { label: '높음', color: '#E03131' },
};
\`\`\`

---

## 설명

건강 기록(혈압/혈당)의 타입 정의와 검증/판정 함수를 담고 있습니다.

### 주요 타입

- `HealthRecordType`: 건강 기록 타입 (BP/BG)
- `HealthRecord`: 건강 기록 인터페이스
- `HealthStats`: 건강 통계

### 주요 함수

- `validateBP()`: 혈압 검증
- `validateBG()`: 혈당 검증
- `getBPStatus()`: 혈압 상태 판정
- `getBGStatus()`: 혈당 상태 판정

