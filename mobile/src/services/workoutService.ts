import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { savePersonalRecord, getPersonalRecords } from './prService';
import { colors } from '../themes/tokens';

export type MuscleGroup = 'Láb' | 'Mellkas' | 'Hát' | 'Váll & Kar' | 'Törzs / Has' | 'Kardió';

export interface ExerciseSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  name: string;
  muscleGroup: MuscleGroup;
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  id?: string;
  userId?: string;
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

export interface WorkoutPlan {
  id: string;
  name: string;
  category: string;
  durationEst: string;
  description: string;
  exercises: {
    name: string;
    muscleGroup: MuscleGroup;
    defaultSets: number;
    defaultReps: number;
    defaultWeight: number;
  }[];
}

export const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: '1',
    name: 'Teljes test edzés (Full Body)',
    category: 'Erő & Állóképesség',
    durationEst: '60 perc',
    description: 'Összetett alapgyakorlatok az egész test átmozgatására és fejlesztésére.',
    exercises: [
      { name: 'Guggolás (Squat)', muscleGroup: 'Láb', defaultSets: 4, defaultReps: 8, defaultWeight: 80 },
      { name: 'Fekvenyomás (Bench Press)', muscleGroup: 'Mellkas', defaultSets: 4, defaultReps: 8, defaultWeight: 70 },
      { name: 'Döntött törzsű evezés', muscleGroup: 'Hát', defaultSets: 3, defaultReps: 10, defaultWeight: 60 },
      { name: 'Vállból nyomás kézisúlyzóval', muscleGroup: 'Váll & Kar', defaultSets: 3, defaultReps: 10, defaultWeight: 20 },
      { name: 'Bicepsz állva rúddal', muscleGroup: 'Váll & Kar', defaultSets: 3, defaultReps: 12, defaultWeight: 30 },
    ],
  },
  {
    id: '2',
    name: 'Felsőtest (Upper Body)',
    category: 'Izomtömeg növelés',
    durationEst: '55 perc',
    description: 'Fókuszban a mellkas, a hát és a kar izomzata intenzív szuperszettekkel.',
    exercises: [
      { name: 'Fekvenyomás (Bench Press)', muscleGroup: 'Mellkas', defaultSets: 4, defaultReps: 6, defaultWeight: 85 },
      { name: 'Döntött pados nyomás', muscleGroup: 'Mellkas', defaultSets: 3, defaultReps: 10, defaultWeight: 26 },
      { name: 'Húzódzkodás / Széles lehúzás', muscleGroup: 'Hát', defaultSets: 4, defaultReps: 8, defaultWeight: 65 },
      { name: 'Evezés T-rúddal', muscleGroup: 'Hát', defaultSets: 3, defaultReps: 10, defaultWeight: 55 },
      { name: 'Tolódzkodás', muscleGroup: 'Váll & Kar', defaultSets: 3, defaultReps: 10, defaultWeight: 0 },
    ],
  },
  {
    id: '3',
    name: 'Lábnap (Leg Day)',
    category: 'Alsótest erő',
    durationEst: '65 perc',
    description: 'Nehéz összetett gyakorlatok a comb és a vádli maximális terhelésére.',
    exercises: [
      { name: 'Guggolás (Squat)', muscleGroup: 'Láb', defaultSets: 4, defaultReps: 8, defaultWeight: 100 },
      { name: 'Lábtoló gép', muscleGroup: 'Láb', defaultSets: 4, defaultReps: 10, defaultWeight: 160 },
      { name: 'Combhajlító fekve', muscleGroup: 'Láb', defaultSets: 3, defaultReps: 12, defaultWeight: 45 },
      { name: 'Álló vádliemelés', muscleGroup: 'Láb', defaultSets: 4, defaultReps: 15, defaultWeight: 70 },
    ],
  },
  {
    id: '4',
    name: 'Hát & Kar (Back & Arms)',
    category: 'Húzó mozdulatok',
    durationEst: '60 perc',
    description: 'Hátvastagítás és karfejlesztés felhúzással és izolációs gyakorlatokkal.',
    exercises: [
      { name: 'Felhúzás (Deadlift)', muscleGroup: 'Hát', defaultSets: 4, defaultReps: 5, defaultWeight: 120 },
      { name: 'Széles lehúzás mellhez', muscleGroup: 'Hát', defaultSets: 4, defaultReps: 10, defaultWeight: 60 },
      { name: 'Bicepsz franciarúddal', muscleGroup: 'Váll & Kar', defaultSets: 3, defaultReps: 10, defaultWeight: 32 },
      { name: 'Csigás tricepsz letolás', muscleGroup: 'Váll & Kar', defaultSets: 3, defaultReps: 12, defaultWeight: 25 },
    ],
  },
  {
    id: '5',
    name: 'Kardió & Törzserő (Cardio & Core)',
    category: 'Zsírégetés & Állóképesség',
    durationEst: '45 perc',
    description: 'Pulzusfokozó intervallumok és mély törzsizmokat erősítő blokk.',
    exercises: [
      { name: 'Futópad intervall futás', muscleGroup: 'Kardió', defaultSets: 4, defaultReps: 5, defaultWeight: 0 },
      { name: 'Plank statikus tartás', muscleGroup: 'Törzs / Has', defaultSets: 4, defaultReps: 60, defaultWeight: 0 },
      { name: 'Függeszkedve lábemelés', muscleGroup: 'Törzs / Has', defaultSets: 3, defaultReps: 15, defaultWeight: 0 },
      { name: 'Harangozás csigán', muscleGroup: 'Törzs / Has', defaultSets: 3, defaultReps: 15, defaultWeight: 35 },
    ],
  },
];

// Kezdeti minta előzmény edzések a héten
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
        name: 'Felhúzás (Deadlift)',
        muscleGroup: 'Hát',
        sets: [
          { setNumber: 1, weightKg: 100, reps: 8, completed: true },
          { setNumber: 2, weightKg: 120, reps: 5, completed: true },
          { setNumber: 3, weightKg: 135, reps: 5, completed: true },
        ],
      },
      {
        name: 'Bicepsz állva',
        muscleGroup: 'Váll & Kar',
        sets: [
          { setNumber: 1, weightKg: 30, reps: 10, completed: true },
          { setNumber: 2, weightKg: 30, reps: 10, completed: true },
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
        name: 'Fekvenyomás (Bench Press)',
        muscleGroup: 'Mellkas',
        sets: [
          { setNumber: 1, weightKg: 80, reps: 8, completed: true },
          { setNumber: 2, weightKg: 95, reps: 6, completed: true },
        ],
      },
    ],
    notes: 'Kiváló mellkas pumpa',
    createdAt: '2026-10-07T17:30:00Z',
  },
  {
    id: 'demo-3',
    userId: 'demo',
    title: 'Kardió & Törzserő',
    date: '2026-10-08',
    durationMinutes: 45,
    totalVolumeKg: 800,
    totalSets: 10,
    exercises: [
      {
        name: 'Futópad intervall',
        muscleGroup: 'Kardió',
        sets: [{ setNumber: 1, weightKg: 0, reps: 25, completed: true }],
      },
    ],
    notes: 'Erős kardió',
    createdAt: '2026-10-08T19:00:00Z',
  },
  {
    id: 'demo-4',
    userId: 'demo',
    title: 'Kemény Lábnap',
    date: '2026-10-09',
    durationMinutes: 70,
    totalVolumeKg: 5400,
    totalSets: 15,
    exercises: [
      {
        name: 'Guggolás (Squat)',
        muscleGroup: 'Láb',
        sets: [
          { setNumber: 1, weightKg: 90, reps: 8, completed: true },
          { setNumber: 2, weightKg: 110, reps: 8, completed: true },
          { setNumber: 3, weightKg: 120, reps: 6, completed: true },
        ],
      },
    ],
    notes: 'Új lábnap volumen rekord',
    createdAt: '2026-10-09T18:15:00Z',
  },
];

let sessionCache: WorkoutSession[] = [...INITIAL_DEMO_SESSIONS];

/**
 * Lekéri az elérhető edzésterveket
 */
export const getWorkoutPlans = (): WorkoutPlan[] => {
  return WORKOUT_PLANS;
};

/**
 * Lekéri a felhasználó korábbi edzéseit
 */
export const getWorkoutSessions = async (): Promise<WorkoutSession[]> => {
  const user = auth.currentUser;
  if (!user) {
    return [...sessionCache];
  }

  try {
    const workoutsRef = collection(db, 'workoutSessions');
    const q = query(workoutsRef, where('userId', '==', user.uid), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    const loaded: WorkoutSession[] = [];
    querySnapshot.forEach((docSnap) => {
      loaded.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });

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
 * Elmenti a befejezett edzést a Firestore-ba és frissíti a statisztikákat
 */
export const saveWorkoutSession = async (
  sessionData: Omit<WorkoutSession, 'id' | 'userId' | 'createdAt' | 'totalVolumeKg' | 'totalSets'>
): Promise<WorkoutSession> => {
  // Összvolumen és összes sorozat kiszámítása
  let volume = 0;
  let setsCount = 0;

  sessionData.exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      if (set.completed) {
        setsCount++;
        volume += (set.weightKg || 0) * (set.reps || 0);
      }
    });
  });

  const nowIso = new Date().toISOString();
  const newSession: WorkoutSession = {
    id: 'local-' + Date.now(),
    userId: auth.currentUser?.uid || 'guest',
    title: sessionData.title,
    planId: sessionData.planId,
    date: sessionData.date || nowIso.split('T')[0],
    durationMinutes: sessionData.durationMinutes || 45,
    totalVolumeKg: volume,
    totalSets: setsCount,
    exercises: sessionData.exercises,
    notes: sessionData.notes || '',
    createdAt: nowIso,
  };

  // Behelyezés a helyi cache elejére
  sessionCache = [newSession, ...sessionCache];

  // Automatikus PR ellenőrzés és frissítés
  try {
    const currentPrs = await getPersonalRecords();
    for (const ex of sessionData.exercises) {
      const lowerName = ex.name.toLowerCase();
      let targetPrId: string | null = null;
      if (lowerName.includes('guggol') || lowerName.includes('squat')) targetPrId = 'squats';
      else if (lowerName.includes('fekvenyom') || lowerName.includes('bench')) targetPrId = 'benchpress';
      else if (lowerName.includes('felhúz') || lowerName.includes('deadlift')) targetPrId = 'deadlifts';

      if (targetPrId) {
        const maxCompletedWeight = Math.max(
          0,
          ...ex.sets.filter((s) => s.completed).map((s) => s.weightKg)
        );
        const existingPr = currentPrs[targetPrId]?.weight || 0;
        if (maxCompletedWeight > existingPr) {
          await savePersonalRecord(targetPrId, maxCompletedWeight, 1, `Edzésből elért új PR (${sessionData.title})`);
        }
      }
    }
  } catch (e) {
    console.warn('PR auto-update hiba:', e);
  }

  // Firestore mentés
  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = await addDoc(collection(db, 'workoutSessions'), {
        ...newSession,
        userId: user.uid,
      });
      newSession.id = docRef.id;
    } catch (error) {
      console.warn('Nem sikerült elmenteni az edzést a Firestore-ba:', error);
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
  // A hét hétfőjének és vasárnapjának meghatározása
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0: Vasárnap, 1: Hétfő ...
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dayNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  const weekDays = [];
  let completedCount = 0;
  let totalTime = 0;
  let totalVolume = 0;

  // Izomcsoport számláló
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

    // Találat a korábbi edzések között ezen a napon
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

      // Izomcsoportok összeszámlálása
      matchingSession.exercises.forEach((ex) => {
        const completedSets = ex.sets.filter((s) => s.completed).length;
        if (ex.muscleGroup.includes('Láb')) groupCounts['Láb'] += completedSets;
        else if (ex.muscleGroup.includes('Mell')) groupCounts['Mellkas'] += completedSets;
        else if (ex.muscleGroup.includes('Hát')) groupCounts['Hát'] += completedSets;
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
