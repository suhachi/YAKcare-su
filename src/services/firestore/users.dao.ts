/**
 * Users Collection DAO
 * Phase 2: Firestore 사용자 관리
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getFirestoreInstance } from '../firebase.config';

export type UserRole = 'patient' | 'caregiver';

export interface UserProfile {
  uid: string;
  name: string;
  phoneHash: string;        // SHA-256 해시 (개인정보 보호)
  role: UserRole;
  createdAt: any;           // Firestore Timestamp
  updatedAt: any;
  tz: string;               // 타임존 (기본: Asia/Seoul)
  fcmTokens?: string[];     // FCM 디바이스 토큰 목록
}

const USERS_COLLECTION = 'users';

/**
 * 사용자 프로필 생성
 */
export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = getFirestoreInstance();
  const userRef = doc(db, USERS_COLLECTION, uid);

  await setDoc(userRef, {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log('[UsersDAO] Profile created:', uid);
}

/**
 * 사용자 프로필 조회
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirestoreInstance();
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = getFirestoreInstance();
  const userRef = doc(db, USERS_COLLECTION, uid);

  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  console.log('[UsersDAO] Profile updated:', uid);
}

/**
 * FCM 토큰 추가
 */
export async function addFCMToken(uid: string, token: string): Promise<void> {
  const db = getFirestoreInstance();
  const userRef = doc(db, USERS_COLLECTION, uid);

  await updateDoc(userRef, {
    fcmTokens: arrayUnion(token),
    updatedAt: serverTimestamp(),
  });

  console.log('[UsersDAO] FCM token added:', uid);
}

/**
 * FCM 토큰 제거
 */
export async function removeFCMToken(uid: string, token: string): Promise<void> {
  const db = getFirestoreInstance();
  const userRef = doc(db, USERS_COLLECTION, uid);

  await updateDoc(userRef, {
    fcmTokens: arrayRemove(token),
    updatedAt: serverTimestamp(),
  });

  console.log('[UsersDAO] FCM token removed:', uid);
}

/**
 * 전화번호 해시 생성 (SHA-256)
 */
export async function hashPhone(phone: string): Promise<string> {
  // 전화번호 정규화 (숫자만)
  const normalized = phone.replace(/\D/g, '');
  
  // SHA-256 해시
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
