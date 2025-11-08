/**
 * Dose Instances Collection DAO
 * Phase 2: Firestore 복용 인스턴스 관리
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreInstance } from '../firebase.config';
import { DoseStatus, SlotBucket, IntakeContext } from '../../types/dose';

export interface DoseInstanceDoc {
  id: string;
  ownerId: string;          // 복용자 UID
  medId: string;            // 약 ID (참조)
  medCategory: string;      // 약 카테고리
  cardKey: string;
  cardTitle: string;
  slotBucket: SlotBucket;
  scheduledAt: any;         // Firestore Timestamp
  status: DoseStatus;
  intakeContext?: IntakeContext;
  retries: number;
  hasPreAlert: boolean;
  hasConfirmAlert: boolean;
  nextAlertAt?: any;        // Firestore Timestamp
  createdAt: any;
  updatedAt: any;
}

const DOSES_COLLECTION = 'dose_instances';

/**
 * 복용 인스턴스 생성
 */
export async function createDoseInstance(
  data: Omit<DoseInstanceDoc, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getFirestoreInstance();
  const doseRef = doc(collection(db, DOSES_COLLECTION));

  const doseData: Omit<DoseInstanceDoc, 'id'> = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doseRef, doseData);

  console.log('[DosesDAO] Created:', doseRef.id);
  return doseRef.id;
}

/**
 * 복용 인스턴스 조회
 */
export async function getDoseInstance(doseId: string): Promise<DoseInstanceDoc | null> {
  const db = getFirestoreInstance();
  const doseRef = doc(db, DOSES_COLLECTION, doseId);
  const snapshot = await getDoc(doseRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as DoseInstanceDoc;
}

/**
 * 특정 날짜의 복용 인스턴스 목록 조회
 */
export async function listDosesByOwnerAndDate(
  ownerId: string,
  startDate: Date,
  endDate: Date
): Promise<DoseInstanceDoc[]> {
  const db = getFirestoreInstance();
  
  const q = query(
    collection(db, DOSES_COLLECTION),
    where('ownerId', '==', ownerId),
    where('scheduledAt', '>=', Timestamp.fromDate(startDate)),
    where('scheduledAt', '<', Timestamp.fromDate(endDate)),
    orderBy('scheduledAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as DoseInstanceDoc[];
}

/**
 * 복용 인스턴스 상태 업데이트
 */
export async function updateDoseStatus(
  doseId: string,
  status: DoseStatus,
  additionalData?: Partial<Pick<DoseInstanceDoc, 'retries' | 'hasPreAlert' | 'hasConfirmAlert' | 'nextAlertAt'>>
): Promise<void> {
  const db = getFirestoreInstance();
  const doseRef = doc(db, DOSES_COLLECTION, doseId);

  await updateDoc(doseRef, {
    status,
    ...additionalData,
    updatedAt: serverTimestamp(),
  });

  console.log('[DosesDAO] Status updated:', doseId, status);
}

/**
 * 배치로 복용 인스턴스 생성 (일일 롤오버 시)
 */
export async function batchCreateDoseInstances(
  instances: Omit<DoseInstanceDoc, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<void> {
  const db = getFirestoreInstance();
  const batch = writeBatch(db);

  instances.forEach(instance => {
    const doseRef = doc(collection(db, DOSES_COLLECTION));
    batch.set(doseRef, {
      ...instance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  console.log('[DosesDAO] Batch created:', instances.length, 'instances');
}

/**
 * 오래된 인스턴스 삭제 (30일 이상)
 */
export async function deleteOldDoseInstances(beforeDate: Date): Promise<number> {
  const db = getFirestoreInstance();
  
  const q = query(
    collection(db, DOSES_COLLECTION),
    where('scheduledAt', '<', Timestamp.fromDate(beforeDate))
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  console.log('[DosesDAO] Deleted old instances:', snapshot.size);
  return snapshot.size;
}
