import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

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

export const DAILY_STEP_GOAL = 10000;

// Helyi gyorsítótár a mért lépésekhez
let cachedSteps = 0;

export const updateCachedSteps = (steps: number) => {
  if (steps > 0) {
    cachedSteps = steps;
  }
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
 * Lekéri a mai napon rögzített lépéseket.
 */
export const getTodaySteps = async (): Promise<number> => {
  try {
    const isAvailable = await checkPedometerAvailability();
    if (!isAvailable) {
      return cachedSteps;
    }

    // Android platformon a getStepCountAsync csak Google Fit/Health Connect mellett támogatott
    if (Platform.OS === 'android') {
      return cachedSteps;
    }

    // iOS CoreMotion esetén közvetlenül elérhető a napi archívum
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    if (result && typeof result.steps === 'number') {
      cachedSteps = result.steps;
      return result.steps;
    }
    return cachedSteps;
  } catch {
    // Csendes fallback szimulátor vagy hiányzó engedély esetén
    return cachedSteps;
  }
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
