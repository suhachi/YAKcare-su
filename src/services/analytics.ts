/**
 * 분석 이벤트 추적 시스템
 * Step 4.7: GA4 이벤트 전송
 * 
 * MVP: console.log로 로깅
 * 프로덕션: gtag() 또는 analytics SDK 사용
 */

// 이벤트 카테고리
export type EventCategory = 
  | 'med'           // 약 등록/관리
  | 'dose'          // 복용 알림/완료
  | 'caregiver'     // 보호자 기능
  | 'health'        // 건강 기록
  | 'home'          // 홈 화면
  | 'link'          // 연결 관리
  | 'auth';         // 인증

// 이벤트 파라미터
export interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * GA4 이벤트 전송
 * @param eventName - 이벤트 이름 (snake_case)
 * @param params - 이벤트 파라미터
 */
export function trackEvent(eventName: string, params?: EventParams): void {
  // MVP: console.log로 로깅
  console.log(`[GA4] ${eventName}`, params || {});

  // 프로덕션 환경에서는 gtag 또는 analytics SDK 사용
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
}

/**
 * 페이지뷰 추적
 * @param pagePath - 페이지 경로
 * @param pageTitle - 페이지 제목
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  console.log(`[GA4] page_view`, { page_path: pagePath, page_title: pageTitle });

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
}

/**
 * 사용자 속성 설정
 * @param userId - 사용자 ID (해시)
 * @param properties - 사용자 속성
 */
export function setUserProperties(userId: string, properties?: Record<string, any>): void {
  console.log(`[GA4] set_user_properties`, { user_id: userId, ...properties });

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      user_id: userId,
      ...properties,
    });
  }
}

// ===== 약 등록 이벤트 =====

export function trackMedAddOpen(source: 'qr' | 'ocr' | 'manual'): void {
  trackEvent('med_add_open', { source });
}

export function trackMedSource(source: 'qr' | 'ocr' | 'manual'): void {
  trackEvent('med_source', { source });
}

export function trackScanConfidence(confidence: 'full' | 'partial' | 'none'): void {
  trackEvent('scan_confidence', { confidence });
}

export function trackMedSaveSuccess(params: {
  medId: string;
  category: string;
  source: string;
  timesCount: number;
  durationDays?: number | string;
}): void {
  trackEvent('med_save_success', params);
}

export function trackMedSaveError(error: string): void {
  trackEvent('med_save_error', { error });
}

// ===== 복용 알림 이벤트 =====

export function trackDoseAlert(type: 'pre' | 'main' | 'snooze' | 'confirm'): void {
  trackEvent(`dose_${type}`, {});
}

export function trackDoseAction(action: 'done' | 'snooze' | 'notyet' | 'missed'): void {
  trackEvent(`dose_${action}`, {});
}

// ===== 보호자 이벤트 =====

export function trackCaregiverNotify(type: 'done' | 'missed'): void {
  trackEvent(`caregiver_notify_${type}`, {});
}

export function trackCaregiverRemind(status: 'send' | 'cooldown'): void {
  trackEvent(`caregiver_remind_${status}`, {});
}

export function trackCaregiverViewCard(): void {
  trackEvent('caregiver_view_card', {});
}

// ===== 건강 기록 이벤트 =====

export function trackHealthRecord(type: 'bp' | 'bg'): void {
  trackEvent(`health_${type}_save`, {});
}

export function trackHealthRemind(action: 'fire' | 'done'): void {
  trackEvent(`health_remind_${action}`, {});
}

// ===== 홈 섹션 이벤트 =====

export function trackHomeSectionVisible(section: 'chronic' | 'supplement' | 'prescription'): void {
  trackEvent('home_section_visible', { section });
}

// ===== 연결 이벤트 =====

export function trackLinkInviteCreate(caregiverId: string): void {
  trackEvent('link_invite_create', { caregiver_id_hash: hashUserId(caregiverId) });
}

export function trackLinkInviteAccept(linkId: string): void {
  trackEvent('link_invite_accept', { link_id_hash: hashUserId(linkId) });
}

export function trackLinkStatusChange(linkId: string, status: string): void {
  trackEvent('link_status_change', { link_id_hash: hashUserId(linkId), status });
}

// ===== 유틸리티 =====

/**
 * 사용자 ID 해싱 (개인정보 보호)
 * @param id - 원본 ID
 * @returns 해시된 ID
 */
function hashUserId(id: string): string {
  // 간단한 해시 (프로덕션에서는 crypto.subtle.digest 사용)
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
