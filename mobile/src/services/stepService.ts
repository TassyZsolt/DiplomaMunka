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

/**
 * Ellenőrzi a hardveres lépésszámláló elérhetőségét a készüléken
 */
export const checkPedometerAvailability = async (): Promise<boolean> => {
  try {
    return await Pedometer.isAvailableAsync();
  } catch (error) {
    console.warn('Hiba az érzékelő ellenőrzésekor:', error);
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
  } catch (error) {
    console.warn('Hiba a jogosultság kérésekor:', error);
    return false;
  }
};

/**
 * Lekéri a mai napon eddig megtett lépéseket (éjféltől mostanáig)
 */
export const getTodaySteps = async (): Promise<number> => {
  try {
    const isAvailable = await checkPedometerAvailability();
    if (!isAvailable) return 0;

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    return result ? result.steps : 0;
  } catch (error) {
    console.warn('Nem sikerült lekérni a mai lépéseket a hardverből:', error);
    return 0;
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
