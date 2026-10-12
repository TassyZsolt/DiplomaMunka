import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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

// Helyi gyorsítótár a napi étkezésekhez
let cachedMeals: MealEntry[] = [];

/**
 * Új étkezés mentése a Firestore-ba és a helyi cache-be
 */
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

/**
 * Lekéri a mai nap rögzített étkezéseit
 */
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

/**
 * Lekéri a mai nap összesített elfogyasztott kalóriáját
 */
export const getTodayConsumedCalories = async (): Promise<number> => {
  try {
    const meals = await getTodayMeals();
    return meals.reduce((sum, item) => sum + (item.calories || 0), 0);
  } catch {
    return cachedMeals.reduce((sum, item) => sum + (item.calories || 0), 0);
  }
};
