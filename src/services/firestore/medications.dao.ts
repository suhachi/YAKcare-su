/**
 * Medications Collection DAO
 * Phase 2: Firestore 약 관리
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreInstance } from '../firebase.config';
import { MedCategory, ChronicType, SlotType, SourceType } from '../../types/meds';
import { IntakeContext } from '../../types/dose';

export interface MedicationDoc {
  id: string;
  ownerId: string;          // 복용자 UID
  category: MedCategory;
  chronicType?: ChronicType;
  name: string;
  intakeContext?: IntakeContext;
  times: string[];          // ["08:00", "18:00"]
  slots: SlotType[];
  durationDays?: number;
  isContinuous?: boolean;
  source: SourceType;
  sourceHash?: string;      // 원본 URL/텍스트의 SHA-256 해시 (개인정보 보호)
  createdAt: any;           // Firestore Timestamp
  updatedAt: any;
}

const MEDICATIONS_COLLECTION = 'medications';

/**
 * 약 등록
 */
export async function createMedication(
  data: Omit<MedicationDoc, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getFirestoreInstance();
  const medRef = doc(collection(db, MEDICATIONS_COLLECTION));

  const medData: Omit<MedicationDoc, 'id'> = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(medRef, medData);

  console.log('[MedicationsDAO] Created:', medRef.id);
  return medRef.id;
}

/**
 * 약 조회
 */
export async function getMedication(medId: string): Promise<MedicationDoc | null> {
  const db = getFirestoreInstance();
  const medRef = doc(db, MEDICATIONS_COLLECTION, medId);
  const snapshot = await getDoc(medRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as MedicationDoc;
}

/**
 * 사용자의 약 목록 조회
 */
export async function listMedicationsByOwner(ownerId: string): Promise<MedicationDoc[]> {
  const db = getFirestoreInstance();
  const q = query(
    collection(db, MEDICATIONS_COLLECTION),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as MedicationDoc[];
}

/**
 * 약 업데이트
 */
export async function updateMedication(
  medId: string,
  data: Partial<Omit<MedicationDoc, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = getFirestoreInstance();
  const medRef = doc(db, MEDICATIONS_COLLECTION, medId);

  await updateDoc(medRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  console.log('[MedicationsDAO] Updated:', medId);
}

/**
 * 약 삭제
 */
export async function deleteMedication(medId: string): Promise<void> {
  const db = getFirestoreInstance();
  const medRef = doc(db, MEDICATIONS_COLLECTION, medId);

  await deleteDoc(medRef);

  console.log('[MedicationsDAO] Deleted:', medId);
}

/**
 * 원본 텍스트 해시 생성 (개인정보 보호)
 */
export async function hashSourceText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
