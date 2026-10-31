import { db, auth } from '../../firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  or,
} from 'firebase/firestore';

export type ExerciseCategory = 'calisthenics' | 'gym' | 'mobility';
export type MuscleGroup = 'mellkas' | 'hat' | 'vall' | 'lab' | 'kar' | 'torzs';
export type TrackingType = 'reps_only' | 'reps_and_weight' | 'time_hold';
export type EquipmentType =
  | 'none'
  | 'pull_up_bar'
  | 'dip_bars'
  | 'barbell'
  | 'dumbbell'
  | 'rings'
  | 'machine'
  | string;

export interface ExerciseDoc {
  id: string;
  name: string;
  englishName: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  trackingType: TrackingType;
  equipment: EquipmentType;
  isCustom: boolean;
  userId?: string;
  createdAt?: string;
}

export const SEED_EXERCISES: ExerciseDoc[] = [
  // --- Calisthenics (Saját testsúly) ---
  {
    id: 'pull_up',
    name: 'Húzódzkodás',
    englishName: 'Pull-up',
    category: 'calisthenics',
    muscleGroup: 'hat',
    trackingType: 'reps_only',
    equipment: 'pull_up_bar',
    isCustom: false,
  },
  {
    id: 'chin_up',
    name: 'Alsó madárfogású húzódzkodás',
    englishName: 'Chin-up',
    category: 'calisthenics',
    muscleGroup: 'kar',
    trackingType: 'reps_only',
    equipment: 'pull_up_bar',
    isCustom: false,
  },
  {
    id: 'dips',
    name: 'Tolódzkodás',
    englishName: 'Dips',
    category: 'calisthenics',
    muscleGroup: 'mellkas',
    trackingType: 'reps_only',
    equipment: 'dip_bars',
    isCustom: false,
  },
  {
    id: 'push_up',
    name: 'Fekvőtámasz',
    englishName: 'Push-up',
    category: 'calisthenics',
    muscleGroup: 'mellkas',
    trackingType: 'reps_only',
    equipment: 'none',
    isCustom: false,
  },
  {
    id: 'pike_push_up',
    name: 'Pike fekvőtámasz',
    englishName: 'Pike Push-up',
    category: 'calisthenics',
    muscleGroup: 'vall',
    trackingType: 'reps_only',
    equipment: 'none',
    isCustom: false,
  },
  {
    id: 'handstand_hold',
    name: 'Kézállás tartás (falnál)',
    englishName: 'Handstand Hold',
    category: 'calisthenics',
    muscleGroup: 'vall',
    trackingType: 'time_hold',
    equipment: 'none',
    isCustom: false,
  },
  {
    id: 'plank',
    name: 'Plank tartás',
    englishName: 'Plank',
    category: 'calisthenics',
    muscleGroup: 'torzs',
    trackingType: 'time_hold',
    equipment: 'none',
    isCustom: false,
  },
  {
    id: 'leg_raises_hanging',
    name: 'Függeszkedő lábemelés',
    englishName: 'Hanging Leg Raise',
    category: 'calisthenics',
    muscleGroup: 'torzs',
    trackingType: 'reps_only',
    equipment: 'pull_up_bar',
    isCustom: false,
  },
  {
    id: 'ring_rows',
    name: 'Vízszintes húzás gyűrűn',
    englishName: 'Ring Inverted Rows',
    category: 'calisthenics',
    muscleGroup: 'hat',
    trackingType: 'reps_only',
    equipment: 'rings',
    isCustom: false,
  },
  {
    id: 'bodyweight_squat',
    name: 'Testsúlyos guggolás',
    englishName: 'Air Squat',
    category: 'calisthenics',
    muscleGroup: 'lab',
    trackingType: 'reps_only',
    equipment: 'none',
    isCustom: false,
  },

  // --- Gym (Súlyzós alapgyakorlatok) ---
  {
    id: 'bench_press',
    name: 'Fekvenyomás',
    englishName: 'Barbell Bench Press',
    category: 'gym',
    muscleGroup: 'mellkas',
    trackingType: 'reps_and_weight',
    equipment: 'barbell',
    isCustom: false,
  },
  {
    id: 'barbell_squat',
    name: 'Guggolás rúddal',
    englishName: 'Barbell Back Squat',
    category: 'gym',
    muscleGroup: 'lab',
    trackingType: 'reps_and_weight',
    equipment: 'barbell',
    isCustom: false,
  },
  {
    id: 'deadlift',
    name: 'Felhúzás',
    englishName: 'Deadlift',
    category: 'gym',
    muscleGroup: 'hat',
    trackingType: 'reps_and_weight',
    equipment: 'barbell',
    isCustom: false,
  },
  {
    id: 'overhead_press',
    name: 'Vállból nyomás',
    englishName: 'Overhead Press (OHP)',
    category: 'gym',
    muscleGroup: 'vall',
    trackingType: 'reps_and_weight',
    equipment: 'barbell',
    isCustom: false,
  },
  {
    id: 'bent_over_row',
    name: 'Döntött törzsű evezés',
    englishName: 'Barbell Bent Over Row',
    category: 'gym',
    muscleGroup: 'hat',
    trackingType: 'reps_and_weight',
    equipment: 'barbell',
    isCustom: false,
  },
  {
    id: 'incline_dumbbell_press',
    name: 'Döntött pados nyomás',
    englishName: 'Incline Dumbbell Press',
    category: 'gym',
    muscleGroup: 'mellkas',
    trackingType: 'reps_and_weight',
    equipment: 'dumbbell',
    isCustom: false,
  },
  {
    id: 'lat_pulldown',
    name: 'Széles lehúzás mellhez',
    englishName: 'Lat Pulldown',
    category: 'gym',
    muscleGroup: 'hat',
    trackingType: 'reps_and_weight',
    equipment: 'machine',
    isCustom: false,
  },
  {
    id: 'dumbbell_bicep_curl',
    name: 'Bicepsz hajlítás kézisúlyzóval',
    englishName: 'Dumbbell Bicep Curl',
    category: 'gym',
    muscleGroup: 'kar',
    trackingType: 'reps_and_weight',
    equipment: 'dumbbell',
    isCustom: false,
  },
  {
    id: 'tricep_pushdown',
    name: 'Csigás tricepsz letolás',
    englishName: 'Tricep Pushdown',
    category: 'gym',
    muscleGroup: 'kar',
    trackingType: 'reps_and_weight',
    equipment: 'machine',
    isCustom: false,
  },
  {
    id: 'leg_press',
    name: 'Lábtoló gép',
    englishName: 'Leg Press',
    category: 'gym',
    muscleGroup: 'lab',
    trackingType: 'reps_and_weight',
    equipment: 'machine',
    isCustom: false,
  },
  {
    id: 'leg_curl',
    name: 'Combhajlító fekve',
    englishName: 'Lying Leg Curl',
    category: 'gym',
    muscleGroup: 'lab',
    trackingType: 'reps_and_weight',
    equipment: 'machine',
    isCustom: false,
  },
  {
    id: 'calf_raise',
    name: 'Álló vádliemelés',
    englishName: 'Standing Calf Raise',
    category: 'gym',
    muscleGroup: 'lab',
    trackingType: 'reps_and_weight',
    equipment: 'machine',
    isCustom: false,
  },

  // --- Mobility / Kardió ---
  {
    id: 'treadmill_interval',
    name: 'Futópad intervall futás',
    englishName: 'Treadmill Interval',
    category: 'mobility',
    muscleGroup: 'torzs',
    trackingType: 'time_hold',
    equipment: 'machine',
    isCustom: false,
  },
  {
    id: 'hanging_passive_stretch',
    name: 'Passzív lógás nyújtás',
    englishName: 'Dead Hang Stretch',
    category: 'mobility',
    muscleGroup: 'hat',
    trackingType: 'time_hold',
    equipment: 'pull_up_bar',
    isCustom: false,
  },
];

// Helyi gyorsítótár
let exerciseCache: ExerciseDoc[] = [...SEED_EXERCISES];
let hasSeeded = false;

/**
 * Predefiniált gyakorlatok feltöltése Firestore-ba (Seed)
 */
export const seedPredefinedExercises = async (): Promise<void> => {
  if (hasSeeded) return;
  try {
    for (const item of SEED_EXERCISES) {
      const exerciseRef = doc(db, 'exercises', item.id);
      await setDoc(exerciseRef, item, { merge: true });
    }
    hasSeeded = true;
    console.log('✅ Firestore /exercises sikeresen feltöltve.');
  } catch (error) {
    console.warn('Nem sikerült a gyakorlatokat Firestore-ba feltölteni (offline vagy korlátozott jogosultság):', error);
  }
};

/**
 * Lekéri az elérhető gyakorlatokat:
 * isCustom == false VAGY userId == currentUserId (Firestore or() lekérdezéssel)
 */
export async function fetchAvailableExercises(currentUserId?: string): Promise<ExerciseDoc[]> {
  const exercisesRef = collection(db, 'exercises');
  const userId = currentUserId || auth.currentUser?.uid;

  try {
    let snapshot;
    if (userId) {
      const q = query(
        exercisesRef,
        or(
          where('isCustom', '==', false),
          where('userId', '==', userId)
        )
      );
      snapshot = await getDocs(q);
    } else {
      const q = query(exercisesRef, where('isCustom', '==', false));
      snapshot = await getDocs(q);
    }

    const loadedMap = new Map<string, ExerciseDoc>();

    // Először a helyi SEED_EXERCISES-t tesszük be garantált fallbackként
    SEED_EXERCISES.forEach((ex) => loadedMap.set(ex.id, ex));

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as ExerciseDoc;
      loadedMap.set(docSnap.id, { ...data, id: docSnap.id });
    });

    const result = Array.from(loadedMap.values());
    exerciseCache = result;
    return result;
  } catch (error) {
    console.warn('Hiba a gyakorlatok lekérésekor Firestore-ból, helyi cache használata:', error);
    return [...exerciseCache];
  }
}

/**
 * Visszafelé kompatibilis alias a getExercises hívásokhoz
 */
export const getExercises = async (currentUserId?: string): Promise<ExerciseDoc[]> => {
  return fetchAvailableExercises(currentUserId);
};

/**
 * Új egyéni gyakorlat létrehozása a Firestore /exercises kollekcióban
 */
export const createCustomExercise = async (
  exerciseData: Omit<ExerciseDoc, 'id' | 'isCustom' | 'userId' | 'createdAt'>
): Promise<ExerciseDoc> => {
  const user = auth.currentUser;
  const newId = 'custom_' + Date.now();
  const nowIso = new Date().toISOString();

  const newExercise: ExerciseDoc = {
    ...exerciseData,
    id: newId,
    isCustom: true,
    userId: user?.uid || 'guest',
    createdAt: nowIso,
  };

  exerciseCache = [newExercise, ...exerciseCache];

  if (user) {
    try {
      const cleanData = JSON.parse(JSON.stringify(newExercise));
      await setDoc(doc(db, 'exercises', newId), cleanData);
    } catch (error) {
      console.warn('Nem sikerült elmenteni az egyéni gyakorlatot Firestore-ba:', error);
      throw error;
    }
  }

  return newExercise;
};

/**
 * Egyéni gyakorlat törlése Firestore-ból és a helyi cache-ből
 */
export const deleteCustomExercise = async (exerciseId: string): Promise<void> => {
  exerciseCache = exerciseCache.filter((ex) => ex.id !== exerciseId);
  try {
    await deleteDoc(doc(db, 'exercises', exerciseId));
  } catch (error) {
    console.warn('Hiba az egyéni gyakorlat törlésekor Firestore-ból:', error);
  }
};

/**
 * Gyakorlat keresése ID alapján
 */
export const getExerciseById = (id: string): ExerciseDoc | undefined => {
  return exerciseCache.find((e) => e.id === id);
};
