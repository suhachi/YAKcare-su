/**
 * Supabase 인증 헬퍼 함수
 * 
 * 시나리오 2 (실사용 배포)에서 사용
 * RLS가 활성화된 상태에서 사용자 인증 관리
 */

import { supabase } from './client';

/**
 * 현재 로그인된 사용자 가져오기
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ [Auth] Get user error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('❌ [Auth] Get user exception:', error);
    return null;
  }
}

/**
 * 익명 로그인
 * 
 * 사용자가 별도 계정 생성 없이 바로 사용할 수 있도록
 * 자동으로 익명 계정 생성
 */
export async function signInAnonymously() {
  try {
    console.log('🔐 [Auth] Anonymous sign-in started...');
    
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('❌ [Auth] Anonymous sign-in error:', error);
      throw error;
    }
    
    console.log('✅ [Auth] Anonymous sign-in success:', data.user?.id);
    return data.user;
  } catch (error) {
    console.error('❌ [Auth] Anonymous sign-in exception:', error);
    throw error;
  }
}

/**
 * 앱 시작 시 자동 인증 확인 및 로그인
 * 
 * - 이미 로그인되어 있으면 현재 사용자 반환
 * - 로그인되어 있지 않으면 익명 로그인 수행
 */
export async function ensureAuthenticated() {
  try {
    // 1. 현재 사용자 확인
    let user = await getCurrentUser();
    
    // 2. 로그인되어 있지 않으면 익명 로그인
    if (!user) {
      console.log('🔓 [Auth] No user found, signing in anonymously...');
      user = await signInAnonymously();
    } else {
      console.log('✅ [Auth] User already signed in:', user.id);
    }
    
    return user;
  } catch (error) {
    console.error('❌ [Auth] Ensure authenticated error:', error);
    throw error;
  }
}

/**
 * 로그아웃
 */
export async function signOut() {
  try {
    console.log('🚪 [Auth] Signing out...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ [Auth] Sign out error:', error);
      throw error;
    }
    
    console.log('✅ [Auth] Sign out success');
    
    // localStorage 정리
    localStorage.clear();
  } catch (error) {
    console.error('❌ [Auth] Sign out exception:', error);
    throw error;
  }
}

/**
 * 사용자 ID 가져오기
 * 
 * localStorage 대신 Supabase Auth에서 가져옴
 */
export async function getUserId(): Promise<string> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return user.id;
}

/**
 * 인증 상태 변경 리스너
 * 
 * React에서 사용 예:
 * useEffect(() => {
 *   const { data: { subscription } } = onAuthStateChange((event, session) => {
 *     console.log('Auth state changed:', event, session);
 *   });
 *   return () => subscription.unsubscribe();
 * }, []);
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
