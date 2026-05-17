import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

export function nowIso(): string {
  return new Date().toISOString().slice(0, 19);
}

export function docToData<T extends Record<string, unknown>>(
  snapshot: DocumentSnapshot<DocumentData>
): (T & { id: string }) | null {
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...snapshot.data() } as T & { id: string };
}

export function docData<T extends Record<string, unknown>>(
  snapshot: QueryDocumentSnapshot<DocumentData>
): T & { id: string } {
  return { id: snapshot.id, ...snapshot.data() } as T & { id: string };
}

export async function deleteQueryBatch(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<number> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, collectionName, d.id))));
  return snapshot.size;
}

export async function queryByField<T extends Record<string, unknown>>(
  collectionName: string,
  field: string,
  value: unknown,
  extraConstraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  const q = query(collection(db, collectionName), where(field, '==', value), ...extraConstraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docData<T>(d));
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return fallback;
}

/** Firestore rejects `undefined` field values — strip them before writes. */
export function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
