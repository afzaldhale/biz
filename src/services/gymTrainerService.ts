import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { GymTrainerRecord } from '@/types';
import { removeUndefinedFields } from '@/utils/removeUndefinedFields';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.'
    );
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

export async function addGymTrainer(businessId: string, trainer: GymTrainerRecord) {
  const now = new Date().toISOString();
  const docRef = await addDoc(
    collection(getFirestoreDb(), `businesses/${businessId}/gymTrainers`),
    removeUndefinedFields({
      ...trainer,
      createdAt: trainer.createdAt ?? now,
      updatedAt: now,
    })
  );
  return docRef.id;
}

export async function updateGymTrainer(
  businessId: string,
  trainerId: string,
  trainer: GymTrainerRecord
) {
  await updateDoc(
    doc(getFirestoreDb(), `businesses/${businessId}/gymTrainers`, trainerId),
    removeUndefinedFields({
      ...trainer,
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function deleteGymTrainer(businessId: string, trainerId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/gymTrainers`, trainerId));
}

export async function getGymTrainers(businessId: string): Promise<GymTrainerRecord[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirestoreDb(), `businesses/${businessId}/gymTrainers`),
      orderBy('createdAt', 'desc'),
      orderBy('__name__', 'desc')
    )
  );

  return snapshot.docs.map((trainerDoc) => ({
    id: trainerDoc.id,
    ...(trainerDoc.data() as Omit<GymTrainerRecord, 'id'>),
  }));
}
