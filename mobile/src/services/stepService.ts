import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { db, auth } from '../../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

export interface StepData {
  steps: number;
  goal: number;
  distanceKm: number;
  caloriesKcal: number;
  activeMinutes: number;
  isAvailable: boolean;
  hasPermission: boolean;
  statusMessage: string;
}

export interface WeeklyStepDay {
  day: string;
  date: string;
  dateKey: string;
  steps: number;
  reached: boolean;
  isToday: boolean;
}

export interface HourlyStepItem {
  hour: string;
  steps: number;
}

export const DAILY_STEP_GOAL = 10000;

// Helyi futásidejű cache
let cachedSteps = 0;

export const updateCachedSteps = (steps: number) => {
  if (steps >= 0) {
    cachedSteps = steps;
  }
};

export const getCachedSteps = (): number => {
  return cachedSteps;
};

/**
 * Mai dátum kulcs lekérése 'YYYY-MM-DD' formátumban
 */
export const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Determinisztikus dokumentum ID az idempotens mentéshez
 */
export const getDailyStepDocId = (userId: string, dateKey: string): string => {
  return `${userId}_${dateKey}`;
};

/**
 * Ellenőrzi a hardveres lépésszámláló elérhetőségét a készüléken
 */
export const checkPedometerAvailability = async (): Promise<boolean> => {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
};

/**
 * Jogosultság kérése a mozgásérzékelőhöz
 */
export const requestPedometerPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Pedometer.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

/**
 * Lekéri a mai nap rögzített lépésszámát Firestore-ból
 */
export const getTodayStepDocFromFirestore = async (userId?: string): Promise<number> => {
  const user = auth.currentUser;
  const uid = userId || user?.uid;
  if (!uid) {
    return cachedSteps;
  }

  try {
    const todayKey = getTodayDateKey();
    const docRef = doc(db, 'dailySteps', getDailyStepDocId(uid, todayKey));
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const steps = typeof data.steps === 'number' ? data.steps : 0;
      cachedSteps = Math.max(cachedSteps, steps);
      return cachedSteps;
    }
    return cachedSteps;
  } catch (error) {
    console.warn('Nem sikerült beolvasni a mai lépéseket Firestore-ból:', error);
    return cachedSteps;
  }
};

/**
 * Idempotens Firestore lépésszinkronizáció
 * A determinisztikus azonosító (userId_date) és a merge opció garantálja,
 * hogy ismételt küldés vagy hálózati újraküldés esetén sincs duplikáció.
 */
export const syncDailyStepsToFirestore = async (
  steps: number,
  userId?: string
): Promise<void> => {
  const user = auth.currentUser;
  const uid = userId || user?.uid;
  const safeSteps = Math.max(0, Math.round(steps));
  updateCachedSteps(safeSteps);

  if (!uid) {
    return;
  }

  try {
    const todayKey = getTodayDateKey();
    const docId = getDailyStepDocId(uid, todayKey);
    const docRef = doc(db, 'dailySteps', docId);

    await setDoc(
      docRef,
      {
        userId: uid,
        date: todayKey,
        steps: safeSteps,
        distanceKm: calculateDistanceKm(safeSteps),
        caloriesKcal: calculateCaloriesKcal(safeSteps),
        activeMinutes: calculateActiveMinutes(safeSteps),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Idempotens Firestore szinkronizációs hiba (helyi állapot megtartva):', error);
  }
};

/**
 * Lekéri a mai napon rögzített lépéseket (kompatibilitási réteg a hookokhoz)
 */
export const getTodaySteps = async (): Promise<number> => {
  // Ha van bejelentkezett felhasználó, megnézzük a Firestore-t
  const user = auth.currentUser;
  if (user) {
    const firestoreSteps = await getTodayStepDocFromFirestore(user.uid);
    if (firestoreSteps > 0) {
      return firestoreSteps;
    }
  }

  // iOS CoreMotion esetén közvetlenül elérhető a napi archívum
  if (Platform.OS === 'ios') {
    try {
      const isAvailable = await checkPedometerAvailability();
      if (isAvailable) {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const result = await Pedometer.getStepCountAsync(start, end);
        if (result && typeof result.steps === 'number') {
          updateCachedSteps(result.steps);
          return result.steps;
        }
      }
    } catch {
      // Fallback a gyorsítótárra
    }
  }

  return cachedSteps;
};

/**
 * 7 napos valós lépéstörténet lekérdezése Firestore-ból
 */
export const getWeeklyStepHistory = async (
  userId?: string,
  todayLiveSteps?: number
): Promise<WeeklyStepDay[]> => {
  const user = auth.currentUser;
  const uid = userId || user?.uid;
  const dayLabels = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];
  const monthLabels = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

  // Az elmúlt 7 nap keretének felépítése (6 nap visszamenőleg + a mai nap)
  const days: WeeklyStepDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isToday = i === 0;
    const initialSteps = isToday && typeof todayLiveSteps === 'number' ? todayLiveSteps : 0;

    days.push({
      day: dayLabels[d.getDay()],
      date: `${monthLabels[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`,
      dateKey,
      steps: initialSteps,
      reached: initialSteps >= DAILY_STEP_GOAL,
      isToday,
    });
  }

  if (!uid) {
    return days;
  }

  try {
    const stepsCollection = collection(db, 'dailySteps');
    const q = query(stepsCollection, where('userId', '==', uid));
    const snap = await getDocs(q);

    const stepsMap = new Map<string, number>();
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.date && typeof data.steps === 'number') {
        stepsMap.set(data.date, data.steps);
      }
    });

    return days.map((dayItem) => {
      let count = dayItem.steps;
      if (dayItem.isToday && typeof todayLiveSteps === 'number' && todayLiveSteps > 0) {
        count = Math.max(todayLiveSteps, stepsMap.get(dayItem.dateKey) || 0);
      } else if (stepsMap.has(dayItem.dateKey)) {
        count = stepsMap.get(dayItem.dateKey) || 0;
      }

      return {
        ...dayItem,
        steps: count,
        reached: count >= DAILY_STEP_GOAL,
      };
    });
  } catch (error) {
    console.warn('Heti lépéstörténet lekérési hiba Firestore-ból:', error);
    return days;
  }
};

/**
 * Napi óránkénti lépéseloszlás dinamikus becslése az aktuális napszak és lépések alapján
 */
export const getHourlyStepBreakdown = (totalSteps: number): HourlyStepItem[] => {
  const currentHour = new Date().getHours();
  const slots = [
    { hour: '08h', hourNum: 8, weight: 0.12 },
    { hour: '10h', hourNum: 10, weight: 0.20 },
    { hour: '12h', hourNum: 12, weight: 0.18 },
    { hour: '14h', hourNum: 14, weight: 0.15 },
    { hour: '16h', hourNum: 16, weight: 0.20 },
    { hour: '18h', hourNum: 18, weight: 0.10 },
    { hour: '20h', hourNum: 20, weight: 0.05 },
  ];

  const activeSlots = slots.filter((s) => currentHour >= s.hourNum);
  const totalWeight = activeSlots.reduce((sum, s) => sum + s.weight, 0);

  return slots.map((s) => {
    if (currentHour < s.hourNum || totalWeight <= 0 || totalSteps <= 0) {
      return { hour: s.hour, steps: 0 };
    }
    const proportionalSteps = Math.round((s.weight / totalWeight) * totalSteps);
    return { hour: s.hour, steps: proportionalSteps };
  });
};

/**
 * Lépésszám alapján számított távolság becslése (km-ben, átlagos 0.75m lépéshosszal)
 */
export const calculateDistanceKm = (steps: number): number => {
  const km = (steps * 0.75) / 1000;
  return parseFloat(km.toFixed(2));
};

/**
 * Lépésszám alapján égetett kalória becslése (~0.04 kcal / lépés)
 */
export const calculateCaloriesKcal = (steps: number): number => {
  return Math.round(steps * 0.04);
};

/**
 * Aktív sétaidő becslése percekben (~100 lépés / perc)
 */
export const calculateActiveMinutes = (steps: number): number => {
  return Math.round(steps / 100);
};
