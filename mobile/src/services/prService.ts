import { db, auth } from '../../firebaseConfig';
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  unit: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  notes?: string;
}

// Elérhető alapértelmezett gyakorlatok (később az Edzés oldalról is bővíthető)
export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'squats', name: 'Guggolás (Squat)', category: 'Láb', unit: 'kg' },
  { id: 'benchpress', name: 'Fekvenyomás (Bench Press)', category: 'Mellkas', unit: 'kg' },
  { id: 'deadlifts', name: 'Felhúzás (Deadlift)', category: 'Hát / Láb', unit: 'kg' },
];

// Kezdeti helyőrző PR adatok
export const DEFAULT_PRS: Record<string, PersonalRecord> = {
  squats: {
    exerciseId: 'squats',
    exerciseName: 'Guggolás (Squat)',
    weight: 120,
    reps: 1,
    date: '2026-10-01',
  },
  benchpress: {
    exerciseId: 'benchpress',
    exerciseName: 'Fekvenyomás (Bench Press)',
    weight: 100,
    reps: 1,
    date: '2026-09-28',
  },
  deadlifts: {
    exerciseId: 'deadlifts',
    exerciseName: 'Felhúzás (Deadlift)',
    weight: 140,
    reps: 1,
    date: '2026-10-05',
  },
};

// Helyi gyorsítótár a gyors és offline eléréshez
let prCache: Record<string, PersonalRecord> = { ...DEFAULT_PRS };

/**
 * Lekéri az elérhető gyakorlatokat
 */
export const getAvailableExercises = async (): Promise<Exercise[]> => {
  return DEFAULT_EXERCISES;
};

/**
 * Lekéri a felhasználó egyéni rekordjait (PR)
 * Ha be van jelentkezve, Firestore-ból olvassa, egyébként a cache-ből vagy alapértelmezett értékekkel tér vissza.
 */
export const getPersonalRecords = async (): Promise<Record<string, PersonalRecord>> => {
  const user = auth.currentUser;
  if (!user) {
    return { ...prCache };
  }

  try {
    const prsRef = collection(db, 'personalRecords');
    const q = query(prsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const records: Record<string, PersonalRecord> = { ...DEFAULT_PRS };
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Partial<PersonalRecord> & { userId?: string };
      if (data && data.exerciseId) {
        records[data.exerciseId] = {
          exerciseId: data.exerciseId,
          exerciseName: data.exerciseName || records[data.exerciseId]?.exerciseName || data.exerciseId,
          weight: Number(data.weight) || 0,
          reps: Number(data.reps) || 1,
          date: data.date || new Date().toISOString().split('T')[0],
          notes: data.notes || '',
        };
      }
    });

    prCache = { ...records };
    return records;
  } catch (error) {
    console.warn('Nem sikerült lekérni a PR-eket a Firestore-ból, helyi adatok használata:', error);
    return { ...prCache };
  }
};

/**
 * Elment egy új vagy frissített egyéni rekordot
 */
export const savePersonalRecord = async (
  exerciseId: string,
  weight: number,
  reps: number = 1,
  notes: string = ''
): Promise<PersonalRecord> => {
  const exercise = DEFAULT_EXERCISES.find((e) => e.id === exerciseId);
  const exerciseName = exercise ? exercise.name : exerciseId;
  const dateStr = new Date().toISOString().split('T')[0];

  const updatedRecord: PersonalRecord = {
    exerciseId,
    exerciseName,
    weight,
    reps,
    date: dateStr,
    notes,
  };

  prCache[exerciseId] = updatedRecord;

  const user = auth.currentUser;
  if (user) {
    try {
      const docId = `${user.uid}_${exerciseId}`;
      await setDoc(
        doc(db, 'personalRecords', docId),
        {
          userId: user.uid,
          ...updatedRecord,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Hiba a PR Firestore mentésekor:', error);
    }
  }

  return updatedRecord;
};

/**
 * Kiszámolja a három fő gyakorlat összesített rekordját (Powerlifting Total)
 */
export const calculateTotalPr = (records: Record<string, PersonalRecord>): number => {
  return Object.values(records).reduce((sum, item) => sum + (item.weight || 0), 0);
};



