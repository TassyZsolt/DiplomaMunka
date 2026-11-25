import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import {
  UserProfile,
  getUserProfile,
  calculateBiometrics,
  BiometricsResult,
} from './userService';

export interface MealEntry {
  id?: string;
  userId: string;
  name: string;
  calories: number;
  mealType: 'Reggeli' | 'Ebéd' | 'Vacsora' | 'Snack' | string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export const DEFAULT_DAILY_CALORIE_GOAL = 2200;

export { calculateBiometrics };
export type { BiometricsResult };

// napi kalóriacél a profil adatokból
export const getUserDailyCalorieGoal = async (userId?: string): Promise<number> => {
  try {
    const profile = await getUserProfile(userId);
    if (profile) {
      const { targetCalories } = calculateBiometrics(profile);
      return targetCalories;
    }
  } catch (e) {
    console.warn('Nem sikerült betölteni a profil alapú kalóriacélt:', e);
  }
  return DEFAULT_DAILY_CALORIE_GOAL;
};

// Helyi gyorsítótár napi étkezéshez
let cachedMeals: MealEntry[] = [];

// új étkezés mentése
export const addMealData = async (
  name: string,
  calories: number,
  mealType: string = 'Ebéd'
): Promise<string> => {
  const user = auth.currentUser;
  const today = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  const newEntry: Omit<MealEntry, 'id'> = {
    userId: user ? user.uid : 'guest',
    name: name.trim() || 'Étkezés',
    calories: Math.max(0, Math.round(calories)),
    mealType,
    date: today,
    createdAt: nowIso,
  };

  // Helyi cache frissítése azonnal
  const tempId = 'meal-' + Date.now();
  cachedMeals.unshift({ id: tempId, ...newEntry });

  if (!user) {
    return tempId;
  }

  try {
    const mealsCollection = collection(db, 'meals');
    const docRef = await addDoc(mealsCollection, newEntry);
    return docRef.id;
  } catch (error) {
    console.warn('Nem sikerült az étkezést Firestore-ba menteni, helyi cache használatban:', error);
    return tempId;
  }
};

// (Meal Log CRUD)
export const deleteMealData = async (mealId: string): Promise<void> => {
  const user = auth.currentUser;
  cachedMeals = cachedMeals.filter((m) => m.id !== mealId);

  if (user && mealId && !mealId.startsWith('meal-')) {
    try {
      const mealDocRef = doc(db, 'meals', mealId);
      await deleteDoc(mealDocRef);
    } catch (error) {
      console.warn('Hiba az étkezés törlésekor Firestore-ból:', error);
      throw error;
    }
  }
};

// mai étkezések lekérése
export const getTodayMeals = async (): Promise<MealEntry[]> => {
  const user = auth.currentUser;
  const today = new Date().toISOString().split('T')[0];

  if (!user) {
    return cachedMeals.filter((m) => m.date === today);
  }

  try {
    const mealsCollection = collection(db, 'meals');
    const q = query(
      mealsCollection,
      where('userId', '==', user.uid),
      where('date', '==', today)
    );

    const querySnapshot = await getDocs(q);
    const loadedMeals: MealEntry[] = [];

    querySnapshot.forEach((docSnap) => {
      loadedMeals.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });

    if (loadedMeals.length > 0) {
      cachedMeals = loadedMeals;
      return loadedMeals;
    }

    return cachedMeals.filter((m) => m.date === today);
  } catch (error) {
    console.warn('Hiba a mai étkezések lekérésekor Firestore-ból, helyi cache használatban:', error);
    return cachedMeals.filter((m) => m.date === today);
  }
};

// mai kalóriabevitel összege
export const getTodayConsumedCalories = async (): Promise<number> => {
  try {
    const meals = await getTodayMeals();
    return meals.reduce((sum, item) => sum + (item.calories || 0), 0);
  } catch {
    return cachedMeals.reduce((sum, item) => sum + (item.calories || 0), 0);
  }
};
