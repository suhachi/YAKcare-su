/**
 * Firebase 초기화 및 인스턴스
 * Phase 2: Firestore/Functions/FCM 연동
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { FIREBASE_CONFIG, ENV } from '../config/env';

// Firebase 앱 인스턴스
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let messaging: Messaging | null = null;

/**
 * Firebase 초기화
 */
export function initializeFirebase(): FirebaseApp {
  if (app) return app;

  // Firebase 앱 초기화
  app = initializeApp(FIREBASE_CONFIG);
  
  console.log('[Firebase] Initialized for environment:', ENV);
  
  return app;
}

/**
 * Auth 인스턴스 가져오기
 */
export function getAuthInstance(): Auth {
  if (!auth) {
    if (!app) initializeFirebase();
    auth = getAuth(app!);
  }
  return auth;
}

/**
 * Firestore 인스턴스 가져오기
 */
export function getFirestoreInstance(): Firestore {
  if (!db) {
    if (!app) initializeFirebase();
    db = getFirestore(app!);
    
    // 개발 환경에서 에뮬레이터 사용 (선택)
    if (ENV === 'development' && import.meta.env.VITE_USE_EMULATOR === 'true') {
      import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
        connectFirestoreEmulator(db!, 'localhost', 8080);
        console.log('[Firebase] Using Firestore Emulator');
      });
    }
  }
  return db;
}

/**
 * Functions 인스턴스 가져오기
 */
export function getFunctionsInstance(): Functions {
  if (!functions) {
    if (!app) initializeFirebase();
    functions = getFunctions(app!, 'asia-northeast3'); // 서울 리전
    
    // 개발 환경에서 에뮬레이터 사용 (선택)
    if (ENV === 'development' && import.meta.env.VITE_USE_EMULATOR === 'true') {
      import('firebase/functions').then(({ connectFunctionsEmulator }) => {
        connectFunctionsEmulator(functions!, 'localhost', 5001);
        console.log('[Firebase] Using Functions Emulator');
      });
    }
  }
  return functions;
}

/**
 * Messaging 인스턴스 가져오기 (FCM)
 */
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (messaging) return messaging;
  
  // FCM 지원 확인
  const supported = await isSupported();
  if (!supported) {
    console.warn('[Firebase] FCM is not supported in this browser');
    return null;
  }
  
  if (!app) initializeFirebase();
  messaging = getMessaging(app!);
  
  console.log('[Firebase] Messaging initialized');
  return messaging;
}

/**
 * Firebase 앱 인스턴스 가져오기
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) initializeFirebase();
  return app!;
}

// 초기화 (앱 시작 시) - Firebase API 키가 있을 때만
if (typeof window !== 'undefined' && FIREBASE_CONFIG.apiKey) {
  try {
    initializeFirebase();
  } catch (error) {
    console.warn('[Firebase] Initialization skipped:', error);
  }
}
