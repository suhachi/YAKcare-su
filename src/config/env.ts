/**
 * 환경 설정 및 기능 플래그
 * Phase 3: Progressive Rollout을 위한 플래그 시스템
 */

// 환경 타입
export type Environment = 'development' | 'staging' | 'production';

// 환경 변수 안전하게 접근하기 위한 헬퍼
const getEnv = (key: string, defaultValue: string = ''): string => {
  try {
    return (import.meta?.env?.[key] as string) || defaultValue;
  } catch {
    return defaultValue;
  }
};

// 플래그 헬퍼 함수 (먼저 선언)
function getFlag(envKey: string, defaultValue: boolean): boolean {
  try {
    const value = import.meta?.env?.[envKey];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1' || value === 'yes';
  } catch {
    return defaultValue;
  }
}

// 현재 환경 (환경변수에서 읽기)
export const ENV: Environment = 
  (getEnv('VITE_ENV') as Environment) || 'development';

// Firebase 설정
export const FIREBASE_CONFIG = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

// GA4 설정
export const GA_CONFIG = {
  measurementId: getEnv('VITE_GA_MEASUREMENT_ID'),
  enabled: ENV === 'production',
  debugMode: ENV === 'development',
  samplingRate: ENV === 'production' ? 0.3 : 1.0, // 프로덕션 30%, 개발 100%
};

// Sentry 설정
export const SENTRY_CONFIG = {
  dsn: getEnv('VITE_SENTRY_DSN'),
  environment: ENV,
  enabled: ENV === 'production' || ENV === 'staging',
  tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
};

// Figma 설정
export const FIGMA_CONFIG = {
  fileKey: getEnv('VITE_FIGMA_FILE_KEY', 'FyR0lrMwAY5MHLj77UXOmv'), // 파일 ID (URL에서 추출)
  accessToken: getEnv('VITE_FIGMA_ACCESS_TOKEN', ''), // Figma Personal Access Token
  apiBase: 'https://api.figma.com/v1',
  enabled: getFlag('VITE_FIGMA_ENABLED', false), // Figma API 활성화 여부
};

// ===== 백엔드 설정 =====

/**
 * 백엔드 타입 및 Supabase 설정
 */
export const config = {
  backendType: getEnv('VITE_BACKEND_TYPE', 'supabase'),
  supabaseUrl: getEnv('VITE_SUPABASE_URL', ''),
  supabaseAnonKey: getEnv('VITE_SUPABASE_ANON_KEY', ''),
};

// ===== 기능 플래그 (Progressive Rollout) =====

/**
 * Phase 3: 점진적 롤아웃 플래그
 * 각 기능을 독립적으로 활성화/비활성화 가능
 */
export const FEATURE_FLAGS = {
  // 알림 기능
  ALERT_PRE_ENABLED: getFlag('VITE_ALERT_PRE_ENABLED', true),          // T-15 예고 알림
  ALERT_MAIN_ENABLED: getFlag('VITE_ALERT_MAIN_ENABLED', true),        // T 정시 알림
  ALERT_SNOOZE_ENABLED: getFlag('VITE_ALERT_SNOOZE_ENABLED', true),    // 스누즈
  ALERT_CONFIRM_ENABLED: getFlag('VITE_ALERT_CONFIRM_ENABLED', true),  // T+15 확인 알림
  
  // 보호자 기능
  CAREGIVER_ALL_VISIBLE: getFlag('VITE_CAREGIVER_ALL_VISIBLE', true),  // 전체 카드 보기
  CAREGIVER_NOTIFY_ENABLED: getFlag('VITE_CAREGIVER_NOTIFY_ENABLED', true), // 보호자 통지
  REMIND_COOLDOWN_ENABLED: getFlag('VITE_REMIND_COOLDOWN_ENABLED', true),   // 20분 쿨다운
  
  // 건강 기록
  HEALTH_REMIND_ENABLED: getFlag('VITE_HEALTH_REMIND_ENABLED', true),  // 건강 기록 리마인드
  HEALTH_BP_ENABLED: getFlag('VITE_HEALTH_BP_ENABLED', true),          // 혈압 기록
  HEALTH_BG_ENABLED: getFlag('VITE_HEALTH_BG_ENABLED', true),          // 혈당 기록
  
  // QR/OCR
  QR_SCAN_ENABLED: getFlag('VITE_QR_SCAN_ENABLED', true),              // QR 스캔
  OCR_SCAN_ENABLED: getFlag('VITE_OCR_SCAN_ENABLED', true),            // OCR 스캔
  
  // 백엔드 전환
  USE_FIRESTORE_MEDS: getFlag('VITE_USE_FIRESTORE_MEDS', false),       // Firestore 약 저장
  USE_FIRESTORE_DOSE: getFlag('VITE_USE_FIRESTORE_DOSE', false),       // Firestore 복용 인스턴스
  USE_FIRESTORE_LINK: getFlag('VITE_USE_FIRESTORE_LINK', false),       // Firestore 연결
  USE_FIRESTORE_HEALTH: getFlag('VITE_USE_FIRESTORE_HEALTH', false),   // Firestore 건강 기록
  
  // Supabase 전환
  USE_SUPABASE_MEDS: getFlag('VITE_USE_SUPABASE_MEDS', true),          // Supabase 약 저장
  USE_SUPABASE_DOSE: getFlag('VITE_USE_SUPABASE_DOSE', true),          // Supabase 복용 인스턴스
  USE_SUPABASE_LINK: getFlag('VITE_USE_SUPABASE_LINK', true),          // Supabase 연결
  USE_SUPABASE_HEALTH: getFlag('VITE_USE_SUPABASE_HEALTH', true),      // Supabase 건강 기록
  
  // FCM
  FCM_ENABLED: getFlag('VITE_FCM_ENABLED', false),                      // FCM 푸시 알림
  
  // PWA
  PWA_ENABLED: getFlag('VITE_PWA_ENABLED', true),                       // PWA 기능
};

// ===== 상수 설정 =====

// 타임존
export const TIMEZONE = 'Asia/Seoul';

// 알림 시간 설정 (분)
export const ALERT_TIMING = {
  PRE_MINUTES: 15,      // T-15
  SNOOZE_MINUTES: 10,   // T+10
  CONFIRM_STEP: 15,     // T+15, T+30, ...
  HARD_LIMIT: 90,       // T+90 자동 MISSED
  MAX_RETRIES: 6,
};

// 쿨다운 설정 (밀리초)
export const COOLDOWN = {
  REMIND_MS: 20 * 60 * 1000,  // 20분
};

// 연결 제한
export const LINK_LIMITS = {
  MAX_CAREGIVERS_PER_PATIENT: 5,
  MAX_PATIENTS_PER_CAREGIVER: 10,
  INVITE_EXPIRY_HOURS: 24,
};

// 검증 규칙
export const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 40,
  MAX_TIMES: 6,
  MIN_TIMES: 1,
  DURATION_PRESETS: [3, 5, 7, 30],
  BP_SYS_RANGE: [60, 250],     // 수축기 혈압 범위
  BP_DIA_RANGE: [40, 150],     // 이완기 혈압 범위
  BG_RANGE: [30, 600],         // 혈당 범위
};

// API 엔드포인트
export const API_ENDPOINTS = {
  FUNCTIONS_BASE: getEnv('VITE_FUNCTIONS_BASE_URL') || 
    `https://asia-northeast3-${FIREBASE_CONFIG.projectId}.cloudfunctions.net`,
};

// 로깅 설정
export const LOGGING = {
  CONSOLE_ENABLED: ENV !== 'production',
  GA_ENABLED: GA_CONFIG.enabled,
  SENTRY_ENABLED: SENTRY_CONFIG.enabled,
};

/**
 * 환경별 설정 오버라이드
 */
export function getEnvConfig() {
  switch (ENV) {
    case 'production':
      return {
        ...FEATURE_FLAGS,
        USE_FIRESTORE_MEDS: true,
        USE_FIRESTORE_DOSE: true,
        USE_FIRESTORE_LINK: true,
        USE_FIRESTORE_HEALTH: true,
        FCM_ENABLED: true,
      };
    
    case 'staging':
      return {
        ...FEATURE_FLAGS,
        USE_FIRESTORE_MEDS: true,
        USE_FIRESTORE_DOSE: true,
        USE_FIRESTORE_LINK: true,
        USE_FIRESTORE_HEALTH: true,
        FCM_ENABLED: true,
      };
    
    case 'development':
    default:
      return FEATURE_FLAGS;
  }
}

// 현재 활성 플래그 (환경별 오버라이드 적용)
export const ACTIVE_FLAGS = getEnvConfig();

// 플래그 상태 로깅
try {
  if (LOGGING.CONSOLE_ENABLED) {
    console.log('[Config] Environment:', ENV);
    console.log('[Config] Active Flags:', ACTIVE_FLAGS);
  }
} catch (error) {
  // 로깅 실패 시 무시
}
