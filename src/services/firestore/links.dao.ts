/**
 * Care Links Collection DAO
 * Phase 2: Firestore 보호자-복용자 연결 관리
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
  or,
} from 'firebase/firestore';
import { getFirestoreInstance } from '../firebase.config';
import { LinkStatus, RelationType } from '../../types/link';

export interface CareLinkDoc {
  id: string;
  caregiverId: string;
  patientId: string;
  status: LinkStatus;
  relation: RelationType;
  nickname?: string;
  createdAt: any;
  updatedAt: any;
}

const LINKS_COLLECTION = 'care_links';

/**
 * 연결 생성
 */
export async function createCareLink(
  data: Omit<CareLinkDoc, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getFirestoreInstance();
  const linkRef = doc(collection(db, LINKS_COLLECTION));

  const linkData: Omit<CareLinkDoc, 'id'> = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(linkRef, linkData);

  console.log('[LinksDAO] Created:', linkRef.id);
  return linkRef.id;
}

/**
 * 연결 조회
 */
export async function getCareLink(linkId: string): Promise<CareLinkDoc | null> {
  const db = getFirestoreInstance();
  const linkRef = doc(db, LINKS_COLLECTION, linkId);
  const snapshot = await getDoc(linkRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as CareLinkDoc;
}

/**
 * 사용자의 연결 목록 조회
 */
export async function listLinksByUser(
  userId: string,
  asCaregiver: boolean
): Promise<CareLinkDoc[]> {
  const db = getFirestoreInstance();
  
  const fieldName = asCaregiver ? 'caregiverId' : 'patientId';
  const q = query(
    collection(db, LINKS_COLLECTION),
    where(fieldName, '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CareLinkDoc[];
}

/**
 * ACTIVE 연결만 조회
 */
export async function listActiveLinks(
  userId: string,
  asCaregiver: boolean
): Promise<CareLinkDoc[]> {
  const links = await listLinksByUser(userId, asCaregiver);
  return links.filter(link => link.status === 'ACTIVE');
}

/**
 * 연결 상태 업데이트
 */
export async function updateLinkStatus(
  linkId: string,
  status: LinkStatus
): Promise<void> {
  const db = getFirestoreInstance();
  const linkRef = doc(db, LINKS_COLLECTION, linkId);

  await updateDoc(linkRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  console.log('[LinksDAO] Status updated:', linkId, status);
}

/**
 * 연결 삭제
 */
export async function deleteCareLink(linkId: string): Promise<void> {
  const db = getFirestoreInstance();
  const linkRef = doc(db, LINKS_COLLECTION, linkId);

  await deleteDoc(linkRef);

  console.log('[LinksDAO] Deleted:', linkId);
}

/**
 * 연결 수 확인 (상한 체크)
 */
export async function countLinksByUser(
  userId: string,
  asCaregiver: boolean
): Promise<number> {
  const links = await listActiveLinks(userId, asCaregiver);
  return links.length;
}
