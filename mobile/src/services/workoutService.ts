import { db, auth } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { colors } from '../themes/tokens';
import { TrackingType, MuscleGroup, ExerciseDoc, getExercises } from './exerciseService';

export interface ExerciseSet {
  setNumber: number;
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string; // Hivatkozás a /exercises/{id} dokumentumra
  name: string; // Tárolt megjelenítendő név
  trackingType: TrackingType; // 'reps_only' | 'reps_and_weight' | 'time_hold'
  muscleGroup: MuscleGroup | string;
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  id?: string;
  userId: string; // Felhasználó azonosító a gyökérben
  planId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  exercises: WorkoutExercise[];
  notes?: string;
  createdAt?: string;
}

export interface WorkoutPlanExercise {
  exerciseId: string;
  name: string;
  trackingType: TrackingType;
  muscleGroup: MuscleGroup | string;
  defaultSets: number;
  defaultReps?: number;
  defaultWeight?: number;
  defaultDurationSeconds?: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  category: string;
  frequency?: string; // pl. "3 nap / hét"
  durationEst: string;
  description: string;
  isCustom?: boolean;
  userId?: string;
  exercises: WorkoutPlanExercise[];
  createdAt?: string;
}

// Predefiniált edzéstervek
export const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'ppl',
    name: 'PPL - Push Pull Legs',
    category: 'Izomtömeg-növelés',
    frequency: '3 nap / hét',
    durationEst: '60 perc',
    description: 'A legnépszerűbb osztott edzésterv: Nyomó, Húzó és Láb napok az optimális izomfejlődéshez.',
    isCustom: false,
    exercises: [
      { exerciseId: 'bench_press', name: 'Fekvenyomás', trackingType: 'reps_and_weight', muscleGroup: 'mellkas', defaultSets: 4, defaultReps: 8, defaultWeight: 75 },
      { exerciseId: 'overhead_press', name: 'Vállból nyomás', trackingType: 'reps_and_weight', muscleGroup: 'vall', defaultSets: 3, defaultReps: 10, defaultWeight: 45 },
      { exerciseId: 'dips', name: 'Tolódzkodás', trackingType: 'reps_only', muscleGroup: 'mellkas', defaultSets: 3, defaultReps: 12 },
      { exerciseId: 'pull_up', name: 'Húzódzkodás', trackingType: 'reps_only', muscleGroup: 'hat', defaultSets: 4, defaultReps: 8 },
      { exerciseId: 'barbell_squat', name: 'Guggolás rúddal', trackingType: 'reps_and_weight', muscleGroup: 'lab', defaultSets: 4, defaultReps: 8, defaultWeight: 90 },
    ],
  },
  {
    id: 'beginner_full_body',
    name: 'Kezdő Teljes Test',
    category: 'Erőnlét',
    frequency: '2 nap / hét',
    durationEst: '45 perc',
    description: 'Alapgyakorlatok az egész test átmozgatására és az alapvető funkcionális erőnlét felépítésére.',
    isCustom: false,
    exercises: [
      { exerciseId: 'bodyweight_squat', name: 'Testsúlyos guggolás', trackingType: 'reps_only', muscleGroup: 'lab', defaultSets: 3, defaultReps: 15 },
      { exerciseId: 'push_up', name: 'Fekvőtámasz', trackingType: 'reps_only', muscleGroup: 'mellkas', defaultSets: 3, defaultReps: 10 },
      { exerciseId: 'ring_rows', name: 'Vízszintes húzás gyűrűn', trackingType: 'reps_only', muscleGroup: 'hat', defaultSets: 3, defaultReps: 10 },
      { exerciseId: 'plank', name: 'Plank tartás', trackingType: 'time_hold', muscleGroup: 'torzs', defaultSets: 3, defaultDurationSeconds: 45 },
    ],
  },
  {
    id: 'upper_body',
    name: 'Felsőtest (Upper Body)',
    category: 'Izomtömeg-növelés',
    frequency: '3 nap / hét',
    durationEst: '55 perc',
    description: 'Fókuszban a mellkas, hát és váll izomzata intenzív összetett és izolációs gyakorlatokkal.',
    isCustom: false,
    exercises: [
      { exerciseId: 'bench_press', name: 'Fekvenyomás', trackingType: 'reps_and_weight', muscleGroup: 'mellkas', defaultSets: 4, defaultReps: 8, defaultWeight: 80 },
      { exerciseId: 'bent_over_row', name: 'Döntött törzsű evezés', trackingType: 'reps_and_weight', muscleGroup: 'hat', defaultSets: 4, defaultReps: 10, defaultWeight: 60 },
      { exerciseId: 'incline_dumbbell_press', name: 'Döntött pados nyomás', trackingType: 'reps_and_weight', muscleGroup: 'mellkas', defaultSets: 3, defaultReps: 10, defaultWeight: 26 },
      { exerciseId: 'lat_pulldown', name: 'Széles lehúzás mellhez', trackingType: 'reps_and_weight', muscleGroup: 'hat', defaultSets: 3, defaultReps: 10, defaultWeight: 65 },
      { exerciseId: 'dumbbell_bicep_curl', name: 'Bicepsz hajlítás kézisúlyzóval', trackingType: 'reps_and_weight', muscleGroup: 'kar', defaultSets: 3, defaultReps: 12, defaultWeight: 14 },
    ],
  },
  {
    id: 'leg_day',
    name: 'Lábnap (Leg Day)',
    category: 'Alsótest erő',
    frequency: '2 nap / hét',
    durationEst: '60 perc',
    description: 'Comb, vádli és farizom fókuszú edzés nehéz alap- és gépes gyakorlatokkal.',
    isCustom: false,
    exercises: [
      { exerciseId: 'barbell_squat', name: 'Guggolás rúddal', trackingType: 'reps_and_weight', muscleGroup: 'lab', defaultSets: 4, defaultReps: 6, defaultWeight: 100 },
      { exerciseId: 'leg_press', name: 'Lábtoló gép', trackingType: 'reps_and_weight', muscleGroup: 'lab', defaultSets: 4, defaultReps: 10, defaultWeight: 160 },
      { exerciseId: 'leg_curl', name: 'Combhajlító fekve', trackingType: 'reps_and_weight', muscleGroup: 'lab', defaultSets: 3, defaultReps: 12, defaultWeight: 45 },
      { exerciseId: 'calf_raise', name: 'Álló vádliemelés', trackingType: 'reps_and_weight', muscleGroup: 'lab', defaultSets: 4, defaultReps: 15, defaultWeight: 70 },
    ],
  },
  {
    id: 'cardio_core',
    name: 'Kardió & Törzserő (Cardio & Core)',
    category: 'Zsírégetés & Állóképesség',
    frequency: '3 nap / hét',
    durationEst: '45 perc',
    description: 'Pulzusfokozó intervallumok és mély törzsizmokat erősítő blokk.',
    isCustom: false,
    exercises: [
      { exerciseId: 'treadmill_interval', name: 'Futópad intervall futás', trackingType: 'time_hold', muscleGroup: 'torzs', defaultSets: 4, defaultDurationSeconds: 300 },
      { exerciseId: 'plank', name: 'Plank tartás', trackingType: 'time_hold', muscleGroup: 'torzs', defaultSets: 4, defaultDurationSeconds: 60 },
      { exerciseId: 'leg_raises_hanging', name: 'Függeszkedő lábemelés', trackingType: 'reps_only', muscleGroup: 'torzs', defaultSets: 3, defaultReps: 15 },
      { exerciseId: 'handstand_hold', name: 'Kézállás tartás (falnál)', trackingType: 'time_hold', muscleGroup: 'vall', defaultSets: 3, defaultDurationSeconds: 30 },
    ],
  },
];

// Minta előzmények fallbackhez
const INITIAL_DEMO_SESSIONS: WorkoutSession[] = [
  {
    id: 'demo-1',
    userId: 'demo',
    title: 'Hát & Kar hipertrófia',
    date: '2026-10-05',
    durationMinutes: 65,
    totalVolumeKg: 4600,
    totalSets: 14,
    exercises: [
      {
        exerciseId: 'deadlift',
        name: 'Felhúzás',
        trackingType: 'reps_and_weight',
        muscleGroup: 'hat',
        sets: [
          { setNumber: 1, weightKg: 100, reps: 10, completed: true },
          { setNumber: 2, weightKg: 120, reps: 8, completed: true },
          { setNumber: 3, weightKg: 140, reps: 5, completed: true },
        ],
      },
      {
        exerciseId: 'pull_up',
        name: 'Húzódzkodás',
        trackingType: 'reps_only',
        muscleGroup: 'hat',
        sets: [
          { setNumber: 1, reps: 10, completed: true },
          { setNumber: 2, reps: 8, completed: true },
        ],
      },
    ],
    notes: 'Jó tempó és bemelegítés',
    createdAt: '2026-10-05T18:00:00Z',
  },
  {
    id: 'demo-2',
    userId: 'demo',
    title: 'Mellkas & Elülső Váll',
    date: '2026-10-07',
    durationMinutes: 60,
    totalVolumeKg: 4200,
    totalSets: 14,
    exercises: [
      {
        exerciseId: 'bench_press',
        name: 'Fekvenyomás',
        trackingType: 'reps_and_weight',
        muscleGroup: 'mellkas',
        sets: [
          { setNumber: 1, weightKg: 80, reps: 8, completed: true },
          { setNumber: 2, weightKg: 95, reps: 6, completed: true },
        ],
      },
    ],
    notes: 'Kiváló mellkas pumpa',
    createdAt: '2026-10-07T17:30:00Z',
  },
];

let sessionCache: WorkoutSession[] = [...INITIAL_DEMO_SESSIONS];
let customPlansCache: WorkoutPlan[] = [];

/**
 * Lekéri az elérhető előre definiált edzésterveket (Sablonok)
 */
export const getWorkoutPlans = (): WorkoutPlan[] => {
  return WORKOUT_PLANS;
};

/**
 * Lekéri a felhasználó saját egyéni edzésterveit (Saját Terveim)
 */
export const getCustomWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
  const user = auth.currentUser;
  if (!user) {
    return [...customPlansCache];
  }

  try {
    const plansRef = collection(db, 'workoutPlans');
    const q = query(plansRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    const loaded: WorkoutPlan[] = [];
    snapshot.forEach((docSnap) => {
      loaded.push({ id: docSnap.id, ...(docSnap.data() as any), isCustom: true });
    });

    customPlansCache = loaded;
    return loaded;
  } catch (error) {
    console.warn('Nem sikerült lekérni a saját edzésterveket Firestore-ból, helyi cache használata:', error);
    return [...customPlansCache];
  }
};

/**
 * Új egyéni edzésterv mentése Firestore-ba
 */
export const saveCustomWorkoutPlan = async (
  planData: Omit<WorkoutPlan, 'id' | 'userId' | 'isCustom' | 'createdAt'>
): Promise<WorkoutPlan> => {
  const user = auth.currentUser;
  const tempId = 'plan_' + Date.now();
  const nowIso = new Date().toISOString();

  const newPlan: WorkoutPlan = {
    ...planData,
    id: tempId,
    userId: user?.uid || 'guest',
    isCustom: true,
    createdAt: nowIso,
  };

  customPlansCache = [newPlan, ...customPlansCache];

  if (user) {
    try {
      const { id, ...dataToSave } = newPlan;
      const cleanPayload = JSON.parse(
        JSON.stringify({
          ...dataToSave,
          userId: user.uid,
        })
      );
      const docRef = await addDoc(collection(db, 'workoutPlans'), cleanPayload);
      newPlan.id = docRef.id;
    } catch (error) {
      console.warn('Nem sikerült elmenteni az edzéstervet Firestore-ba:', error);
      throw error;
    }
  }

  customPlansCache = [newPlan, ...customPlansCache.filter((p) => p.id !== newPlan.id)];
  return newPlan;
};

/**
 * Egyéni edzésterv törlése
 */
export const deleteCustomWorkoutPlan = async (planId: string): Promise<void> => {
  customPlansCache = customPlansCache.filter((p) => p.id !== planId);
  const user = auth.currentUser;
  if (user) {
    try {
      await deleteDoc(doc(db, 'workoutPlans', planId));
    } catch (error) {
      console.warn('Nem sikerült törölni az edzéstervet Firestore-ból:', error);
    }
  }
};

/**
 * Lekéri a felhasználó korábbi edzéseit a Firestore-ból
 */
export const getWorkoutSessions = async (): Promise<WorkoutSession[]> => {
  const user = auth.currentUser;
  if (!user) {
    return [...sessionCache];
  }

  try {
    const workoutsRef = collection(db, 'workoutSessions');
    const q = query(workoutsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const loaded: WorkoutSession[] = [];
    querySnapshot.forEach((docSnap) => {
      loaded.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });

    loaded.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (loaded.length > 0) {
      sessionCache = loaded;
      return loaded;
    }

    return [...sessionCache];
  } catch (error) {
    console.warn('Nem sikerült betölteni az edzéseket a Firestore-ból, helyi cache használata:', error);
    return [...sessionCache];
  }
};

/**
 * Elmenti a befejezett edzést és frissíti a rekordokat.
 */
export const saveWorkoutSession = async (
  sessionData: Omit<WorkoutSession, 'id' | 'userId' | 'createdAt' | 'totalVolumeKg' | 'totalSets'>
): Promise<WorkoutSession> => {
  let volume = 0;
  let setsCount = 0;

  sessionData.exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      if (set.completed) {
        setsCount++;
        if (ex.trackingType === 'reps_and_weight') {
          volume += (set.weightKg || 0) * (set.reps || 0);
        }
      }
    });
  });

  const user = auth.currentUser;
  const currentUserId = user?.uid || 'guest';
  const nowIso = new Date().toISOString();
  const sessionDate = sessionData.date || nowIso.split('T')[0];

  const newSession: WorkoutSession = {
    id: 'local-' + Date.now(),
    userId: currentUserId,
    title: sessionData.title,
    planId: sessionData.planId,
    date: sessionDate,
    durationMinutes: sessionData.durationMinutes || 45,
    totalVolumeKg: volume,
    totalSets: setsCount,
    exercises: sessionData.exercises,
    notes: sessionData.notes || '',
    createdAt: nowIso,
  };

  sessionCache = [newSession, ...sessionCache];

  // Mentés a workoutSessions kollekcióba
  if (user) {
    try {
      const { id, ...sessionToSave } = newSession;
      const cleanPayload = JSON.parse(
        JSON.stringify({
          ...sessionToSave,
          userId: user.uid,
        })
      );
      const docRef = await addDoc(collection(db, 'workoutSessions'), cleanPayload);
      newSession.id = docRef.id;
    } catch (error) {
      console.warn('Nem sikerült elmenteni az edzést a Firestore-ba:', error);
      throw error;
    }
  }

  // PR rekordok frissítése szükség esetén
  if (user) {
    try {
      for (const ex of sessionData.exercises) {
        const completedSets = ex.sets.filter((s) => s.completed);
        if (completedSets.length === 0) continue;

        const docId = `${user.uid}_${ex.exerciseId}`;
        const prDocRef = doc(db, 'personalRecords', docId);
        const prSnap = await getDoc(prDocRef);
        const existingData = prSnap.exists() ? prSnap.data() : null;

        let isNewPr = false;
        let prPayload: any = {
          userId: user.uid,
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          trackingType: ex.trackingType,
          date: sessionDate,
          updatedAt: nowIso,
          notes: `Edzésből elért PR (${sessionData.title})`,
        };

        if (ex.trackingType === 'reps_and_weight') {
          const maxWeight = Math.max(0, ...completedSets.map((s) => s.weightKg || 0));
          const setWithMaxWeight = completedSets.find((s) => (s.weightKg || 0) === maxWeight);
          const currentWeight = Number(existingData?.weight) || 0;

          if (maxWeight > currentWeight) {
            isNewPr = true;
            prPayload.weight = maxWeight;
            prPayload.reps = setWithMaxWeight?.reps || 1;
          }
        } else if (ex.trackingType === 'reps_only') {
          const maxReps = Math.max(0, ...completedSets.map((s) => s.reps || 0));
          const currentReps = Number(existingData?.reps) || 0;

          if (maxReps > currentReps) {
            isNewPr = true;
            prPayload.reps = maxReps;
            prPayload.weight = 0;
          }
        } else if (ex.trackingType === 'time_hold') {
          const maxSeconds = Math.max(0, ...completedSets.map((s) => s.durationSeconds || 0));
          const currentSeconds = Number(existingData?.durationSeconds) || 0;

          if (maxSeconds > currentSeconds) {
            isNewPr = true;
            prPayload.durationSeconds = maxSeconds;
            prPayload.reps = 0;
            prPayload.weight = 0;
          }
        }

        if (isNewPr) {
          const cleanPrPayload = JSON.parse(JSON.stringify(prPayload));
          await setDoc(prDocRef, cleanPrPayload, { merge: true });
          console.log(`🏆 Új PR elmentve a Firestore-ba: ${ex.name} (${docId})`);
        }
      }
    } catch (prError) {
      console.warn('Hiba a Personal Records Firestore frissítésekor:', prError);
    }
  }

  return newSession;
};

/**
 * Kiszámolja a heti statisztikákat az edzések alapján
 */
export interface WeeklyStats {
  weekDays: {
    dayName: string;
    dayNumber: string;
    dateStr: string;
    isToday: boolean;
    status: 'completed' | 'rest' | 'planned';
    title?: string;
    duration?: string;
  }[];
  completedCount: number;
  totalTimeMinutes: number;
  avgDurationMinutes: number;
  totalVolumeKg: number;
  muscleVolumes: {
    group: string;
    sets: number;
    percentage: number;
    color: string;
  }[];
}

export const getWeeklyWorkoutStats = (sessions: WorkoutSession[]): WeeklyStats => {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dayNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  const weekDays = [];
  let completedCount = 0;
  let totalTime = 0;
  let totalVolume = 0;

  const groupCounts: Record<string, number> = {
    'Láb': 0,
    'Mellkas': 0,
    'Hát': 0,
    'Váll & Kar': 0,
  };

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    const dayNumStr = String(dayDate.getDate()).padStart(2, '0');
    const isToday = dayDate.toDateString() === today.toDateString();

    const matchingSession = sessions.find((s) => s.date === dateStr);

    let status: 'completed' | 'rest' | 'planned' = 'rest';
    let title: string | undefined;
    let duration: string | undefined;

    if (matchingSession) {
      status = 'completed';
      title = matchingSession.title;
      duration = `${matchingSession.durationMinutes} perc`;
      completedCount++;
      totalTime += matchingSession.durationMinutes;
      totalVolume += matchingSession.totalVolumeKg;

      matchingSession.exercises.forEach((ex) => {
        const completedSets = ex.sets.filter((s) => s.completed).length;
        const mg = (ex.muscleGroup || '').toLowerCase();
        if (mg.includes('lab')) groupCounts['Láb'] += completedSets;
        else if (mg.includes('mell')) groupCounts['Mellkas'] += completedSets;
        else if (mg.includes('hat')) groupCounts['Hát'] += completedSets;
        else groupCounts['Váll & Kar'] += completedSets;
      });
    } else if (isToday) {
      status = 'planned';
      title = 'Tervezett edzés';
    }

    weekDays.push({
      dayName: dayNames[i],
      dayNumber: dayNumStr,
      dateStr,
      isToday,
      status,
      title,
      duration,
    });
  }

  const totalMuscleSets = Object.values(groupCounts).reduce((a, b) => a + b, 0) || 1;
  const muscleColors: Record<string, string> = {
    'Láb': '#0069FF',
    'Mellkas': '#3AC786',
    'Hát': '#F59E0B',
    'Váll & Kar': '#8B5CF6',
  };

  const muscleVolumes = Object.entries(groupCounts).map(([group, sets]) => ({
    group,
    sets,
    percentage: Math.round((sets / totalMuscleSets) * 100),
    color: muscleColors[group] || colors.primary,
  }));

  return {
    weekDays,
    completedCount,
    totalTimeMinutes: totalTime,
    avgDurationMinutes: completedCount > 0 ? Math.round(totalTime / completedCount) : 0,
    totalVolumeKg: totalVolume,
    muscleVolumes,
  };
};
