import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import {
  DAILY_STEP_GOAL,
  checkPedometerAvailability,
  requestPedometerPermission,
  getTodayStepDocFromFirestore,
  syncDailyStepsToFirestore,
  getWeeklyStepHistory,
  getHourlyStepBreakdown,
  calculateDistanceKm,
  calculateCaloriesKcal,
  calculateActiveMinutes,
  updateCachedSteps,
  WeeklyStepDay,
  HourlyStepItem,
} from '../services/stepService';

export interface StepTrackerContextType {
  todaySteps: number;
  dailyGoal: number;
  distanceKm: number;
  caloriesKcal: number;
  activeMinutes: number;
  cadence: number;
  isAvailable: boolean | null;
  hasPermission: boolean | null;
  statusNote: string;
  weeklyHistory: WeeklyStepDay[];
  hourlyBreakdown: HourlyStepItem[];
  isLoading: boolean;
  addSimulatedSteps: (amount: number) => Promise<void>;
  resetSimulatedSteps: () => Promise<void>;
  refreshStepData: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const StepTrackerContext = createContext<StepTrackerContextType | undefined>(undefined);

export const StepTrackerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [statusNote, setStatusNote] = useState<string>('Érzékelő inicializálása...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lépésszám komponensek
  const [baselineSteps, setBaselineSteps] = useState<number>(0);
  const [sessionSensorSteps, setSessionSensorSteps] = useState<number>(0);
  const [simulatedSteps, setSimulatedSteps] = useState<number>(0);

  // Előzmények és lebontások
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyStepDay[]>([]);

  // Referenciák a debounced mentéshez és az aktuális értékekhez
  const baselineRef = useRef<number>(0);
  const sessionSensorRef = useRef<number>(0);
  const simulatedRef = useRef<number>(0);
  const syncTimeoutRef = useRef<any>(null);
  const currentUserRef = useRef<User | null>(auth.currentUser);

  baselineRef.current = baselineSteps;
  sessionSensorRef.current = sessionSensorSteps;
  simulatedRef.current = simulatedSteps;
  currentUserRef.current = currentUser;

  const totalSteps = baselineSteps + sessionSensorSteps + simulatedSteps;
  const distanceKm = calculateDistanceKm(totalSteps);
  const caloriesKcal = calculateCaloriesKcal(totalSteps);
  const activeMinutes = calculateActiveMinutes(totalSteps);
  const cadence = activeMinutes > 0 ? Math.round(totalSteps / activeMinutes) : 95;
  const hourlyBreakdown = getHourlyStepBreakdown(totalSteps);

  // Szinkronizáció Firestore-ba
  const syncNow = useCallback(async () => {
    const currentTotal =
      baselineRef.current + sessionSensorRef.current + simulatedRef.current;
    updateCachedSteps(currentTotal);
    if (currentUserRef.current) {
      await syncDailyStepsToFirestore(currentTotal, currentUserRef.current.uid);
    }
  }, []);

  // szinkronizáció 4mp-enként
  const triggerDebouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncNow();
    }, 4000);
  }, [syncNow]);

  // adatfrissítés
  const refreshStepData = useCallback(async () => {
    const uid = currentUserRef.current?.uid;
    const currentLive =
      baselineRef.current + sessionSensorRef.current + simulatedRef.current;

    if (uid) {
      const history = await getWeeklyStepHistory(uid, currentLive);
      setWeeklyHistory(history);
    } else {
      const history = await getWeeklyStepHistory(undefined, currentLive);
      setWeeklyHistory(history);
    }
  }, []);

  // teszt
  const addSimulatedSteps = useCallback(
    async (amount: number) => {
      const newSim = simulatedRef.current + amount;
      setSimulatedSteps(newSim);
      simulatedRef.current = newSim;

      const newTotal = baselineRef.current + sessionSensorRef.current + newSim;
      updateCachedSteps(newTotal);

      if (currentUserRef.current) {
        await syncDailyStepsToFirestore(newTotal, currentUserRef.current.uid);
        const history = await getWeeklyStepHistory(currentUserRef.current.uid, newTotal);
        setWeeklyHistory(history);
      }
    },
    []
  );

  // Törlés
  const resetSimulatedSteps = useCallback(async () => {
    setSimulatedSteps(0);
    simulatedRef.current = 0;
    const newTotal = baselineRef.current + sessionSensorRef.current;
    updateCachedSteps(newTotal);

    if (currentUserRef.current) {
      await syncDailyStepsToFirestore(newTotal, currentUserRef.current.uid);
      const history = await getWeeklyStepHistory(currentUserRef.current.uid, newTotal);
      setWeeklyHistory(history);
    }
  }, []);

  // user auth check
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      currentUserRef.current = user;
    });

    return () => unsubscribeAuth();
  }, []);

  // Adatok inicializálása
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let isCancelled = false;

    const initTracker = async () => {
      setIsLoading(true);

      // Mai mentett lépések
      let loadedBaseline = 0;
      if (currentUserRef.current) {
        loadedBaseline = await getTodayStepDocFromFirestore(currentUserRef.current.uid);
      }
      if (!isCancelled) {
        setBaselineSteps(loadedBaseline);
        baselineRef.current = loadedBaseline;
        updateCachedSteps(loadedBaseline);
      }

      // 1 hetes előzmény betöltése
      const history = await getWeeklyStepHistory(
        currentUserRef.current?.uid,
        loadedBaseline
      );
      if (!isCancelled) {
        setWeeklyHistory(history);
      }

      // Szenzor check
      const available = await checkPedometerAvailability();
      if (!isCancelled) {
        setIsAvailable(available);
      }

      if (!available) {
        if (!isCancelled) {
          setStatusNote('A készüléken nem található lépésszámláló hardver (szimulátor mód).');
          setIsLoading(false);
        }
        return;
      }

      const permissionGranted = await requestPedometerPermission();
      if (!isCancelled) {
        setHasPermission(permissionGranted);
      }

      if (!permissionGranted) {
        if (!isCancelled) {
          setStatusNote('A lépésszámlálóhoz szükséges engedély megtagadva.');
          setIsLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setStatusNote('🟢 Beépített alacsony fogyasztású érzékelő aktív');
      }

      // Hardveres figyelés
      subscription = Pedometer.watchStepCount((result) => {
        if (isCancelled) return;
        setSessionSensorSteps(result.steps);
        sessionSensorRef.current = result.steps;

        const currentTotal = baselineRef.current + result.steps + simulatedRef.current;
        updateCachedSteps(currentTotal);
        triggerDebouncedSync();
      });

      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    initTracker();

    // AppState figyelő
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background' || nextState === 'inactive') {
          syncNow();
        }
      }
    );

    return () => {
      isCancelled = true;
      if (subscription) {
        subscription.remove();
      }
      appStateSubscription.remove();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [currentUser, syncNow, triggerDebouncedSync]);

  return (
    <StepTrackerContext.Provider
      value={{
        todaySteps: totalSteps,
        dailyGoal: DAILY_STEP_GOAL,
        distanceKm,
        caloriesKcal,
        activeMinutes,
        cadence,
        isAvailable,
        hasPermission,
        statusNote,
        weeklyHistory,
        hourlyBreakdown,
        isLoading,
        addSimulatedSteps,
        resetSimulatedSteps,
        refreshStepData,
        syncNow,
      }}
    >
      {children}
    </StepTrackerContext.Provider>
  );
};

export const useStepTracker = (): StepTrackerContextType => {
  const context = useContext(StepTrackerContext);
  if (!context) {
    throw new Error('useStepTracker must be used within a StepTrackerProvider');
  }
  return context;
};
