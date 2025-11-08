/**
 * 약물 DAO 샘플 구현
 * Phase 1 Step 1: Supabase 환경 세팅
 * 
 * 백엔드 스위치 연결 예시 및 에러 처리 포함
 */

import { supabase } from '../supabase.client';
import { config } from '../../config/env';

/**
 * 약물 목록 조회 (샘플)
 * 테이블 미구성 시에도 크래시하지 않도록 try/catch 처리
 */
export async function listMeds() {
  // 백엔드 타입 확인
  if (config.backendType !== 'supabase') {
    console.warn('[Meds Repo] Backend type is not supabase:', config.backendType);
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .limit(1);

    if (error) {
      // 테이블이 없거나 권한 오류인 경우 graceful fallback
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.warn('[Meds Repo] Table not found or access denied, returning empty array');
        return [];
      }
      throw error;
    }

    return data ?? [];
  } catch (error) {
    // 네트워크 오류나 기타 예외 처리
    console.error('[Meds Repo] Failed to list medications:', error);
    // 앱이 크래시하지 않도록 빈 배열 반환
    return [];
  }
}

