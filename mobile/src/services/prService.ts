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
  estimated1Rm?: number;
  totalVolumeKg?: number;
  date: string;
  notes?: string;
}

// Epley formula alapján becsült 1RM 
 
export const calculateEpley1Rm = (weight: number, reps: number = 1): number => {
  const safeWeight = Math.max(0, weight);
  const safeReps = Math.max(1, reps);
  if (safeWeight === 0) return 0;
  if (safeReps === 1) return Math.round(safeWeight);
  return Math.round(safeWeight * (1 + safeReps / 30));
};

export interface OneRmPercentage {
  percent: number;
  weight: number;
  estimatedReps: number;
}

// 1RM intenzitási zónák (100% - 60%)
export const calculate1RmPercentages = (oneRmKg: number): OneRmPercentage[] => {
  const safe1Rm = Math.max(0, oneRmKg);
  const percentBreakdowns = [
    { percent: 100, estimatedReps: 1 },
    { percent: 95, estimatedReps: 2 },
    { percent: 90, estimatedReps: 4 },
    { percent: 85, estimatedReps: 6 },
    { percent: 80, estimatedReps: 8 },
    { percent: 75, estimatedReps: 10 },
    { percent: 70, estimatedReps: 12 },
    { percent: 65, estimatedReps: 15 },
    { percent: 60, estimatedReps: 20 },
  ];

  return percentBreakdowns.map((p) => ({
    percent: p.percent,
    weight: Math.round((safe1Rm * p.percent) / 100),
    estimatedReps: p.estimatedReps,
  }));
};

// Elérhető alapértelmezett gyakorlatok 
export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'squats', name: 'Guggolás (Squat)', category: 'Láb', unit: 'kg' },
  { id: 'benchpress', name: 'Fekvenyomás (Bench Press)', category: 'Mellkas', unit: 'kg' },
  { id: 'deadlifts', name: 'Felhúzás (Deadlift)', category: 'Hát / Láb', unit: 'kg' },
];

export const DEFAULT_PRS: Record<string, PersonalRecord> = {};

let prCache: Record<string, PersonalRecord> = {};

export const getAvailableExercises = async (): Promise<Exercise[]> => {
  return DEFAULT_EXERCISES;
};

export const getPersonalRecords = async (): Promise<Record<string, PersonalRecord>> => {
  const user = auth.currentUser;
  if (!user) {
    return { ...prCache };
  }

  try {
    const prsRef = collection(db, 'personalRecords');
    const q = query(prsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const records: Record<string, PersonalRecord> = {};
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Partial<PersonalRecord> & { userId?: string };
      if (data && data.exerciseId) {
        const weightVal = Number(data.weight) || 0;
        const repsVal = Number(data.reps) || 1;
        const e1Rm = Number(data.estimated1Rm) || calculateEpley1Rm(weightVal, repsVal);
        const vol = Number(data.totalVolumeKg) || Math.round(weightVal * repsVal);

        records[data.exerciseId] = {
          exerciseId: data.exerciseId,
          exerciseName: data.exerciseName || records[data.exerciseId]?.exerciseName || data.exerciseId,
          weight: weightVal,
          reps: repsVal,
          estimated1Rm: e1Rm,
          totalVolumeKg: vol,
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

// egyéni rekord mentése
export const savePersonalRecord = async (
  exerciseId: string,
  weight: number,
  reps: number = 1,
  notes: string = ''
): Promise<PersonalRecord> => {
  const exercise = DEFAULT_EXERCISES.find((e) => e.id === exerciseId);
  const exerciseName = exercise ? exercise.name : exerciseId;
  const dateStr = new Date().toISOString().split('T')[0];

  const safeWeight = Math.max(0, weight);
  const safeReps = Math.max(1, reps);
  const estimated1Rm = calculateEpley1Rm(safeWeight, safeReps);
  const totalVolumeKg = Math.round(safeWeight * safeReps);

  const updatedRecord: PersonalRecord = {
    exerciseId,
    exerciseName,
    weight: safeWeight,
    reps: safeReps,
    estimated1Rm,
    totalVolumeKg,
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

// összesített PR súly
export const calculateTotalPr = (records: Record<string, PersonalRecord>): number => {
  return Object.values(records).reduce((sum, item) => sum + (item.weight || 0), 0);
};



