import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: 'Férfi' | 'Nő' | string | null;
  activityLevel?: string | null;
  fitnessGoal?: string;
  createdAt?: any;
}

export interface BmiResult {
  value: number;
  label: string;
  textColor: string;
  bgColor: string;
}

export interface BiometricsResult {
  bmr: number; // alapanyagcsere (kcal)
  tdee: number; // napi kalóriaigény
  targetCalories: number; // cél kalória
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
}

// profil lekérése firestore-ból
export const getUserProfile = async (userId?: string): Promise<UserProfile | null> => {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Hiba a felhasználói profil lekérésekor:', error);
    throw error;
  }
};

// profil frissítése
export const updateUserProfile = async (data: Partial<UserProfile>): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Nincs bejelentkezett felhasználó.');

  try {
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Hiba a felhasználói profil frissítésekor:', error);
    throw error;
  }
};

// bmi számítás
export const calculateBmi = (weightKg?: number | null, heightCm?: number | null): BmiResult | null => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmiVal = weightKg / (heightM * heightM);
  const rounded = parseFloat(bmiVal.toFixed(1));

  let label = 'Normál';
  let textColor = '#059669';
  let bgColor = '#D1FAE5';

  if (rounded < 18.5) {
    label = 'Sovány';
    textColor = '#2563EB';
    bgColor = '#DBEAFE';
  } else if (rounded >= 25 && rounded < 30) {
    label = 'Túlsúly';
    textColor = '#D97706';
    bgColor = '#FEF3C7';
  } else if (rounded >= 30) {
    label = 'Elhízott';
    textColor = '#DC2626';
    bgColor = '#FEE2E2';
  }

  return { value: rounded, label, textColor, bgColor };
};

// regisztráció dátumának formázása
export const formatMemberSince = (createdAt: any): string => {
  if (!createdAt) return 'Aktív tag';
  try {
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short' });
  } catch {
    return 'Aktív tag';
  }
};

// BMR számítás (Mifflin-St Jeor)
export const calculateMifflinStJeorBmr = (
  weightKg?: number | null,
  heightCm?: number | null,
  age?: number | null,
  gender?: string | null
): number => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return 1650; // default becsült érték
  }

  const safeAge = age && age > 0 ? age : 25;
  const isFemale = gender === 'female' || gender === 'Nő' || gender === 'no';

  const baseBmr = 10 * weightKg + 6.25 * heightCm - 5 * safeAge;
  const genderAdjustment = isFemale ? -161 : 5;

  return Math.round(baseBmr + genderAdjustment);
};

// TDEE kalkuláció aktivitás alapján
export const calculateTdee = (
  bmr: number,
  activityLevel?: string | null
): number => {
  let multiplier = 1.55; // heti 3-5 edzés alapértelmezetten

  switch (activityLevel) {
    case 'sedentary':
    case 'Ülőmunka':
      multiplier = 1.2;
      break;
    case 'light':
    case 'Könnyű aktivitás':
      multiplier = 1.375;
      break;
    case 'moderate':
    case 'Közepes aktivitás':
      multiplier = 1.55;
      break;
    case 'very_active':
    case 'Nagyon aktív':
      multiplier = 1.725;
      break;
    case 'extra_active':
    case 'Extrém terhelés':
      multiplier = 1.9;
      break;
    default:
      multiplier = 1.55;
  }

  return Math.round(bmr * multiplier);
};

// napi cél kalória és makrók számítása
export const calculateBiometrics = (
  profile?: Partial<UserProfile> | null,
  dietType: string = 'Regular'
): BiometricsResult => {
  const weight = profile?.weight;
  const height = profile?.height;
  const age = profile?.age;
  const gender = profile?.gender;
  const activityLevel = profile?.activityLevel;
  const fitnessGoal = profile?.fitnessGoal;

  const hasMetrics = !!(weight && height && weight > 0 && height > 0);
  const bmr = calculateMifflinStJeorBmr(weight, height, age, gender);
  const tdee = calculateTdee(bmr, activityLevel);

  let targetCalories = tdee;
  if (fitnessGoal === 'Szálkásítás / Fogyás') {
    targetCalories = Math.max(1200, tdee - 500);
  } else if (fitnessGoal === 'Izomtömeg-növelés') {
    targetCalories = tdee + 350;
  } else if (fitnessGoal === 'Erőnlét növelése') {
    targetCalories = tdee + 150;
  } else if (fitnessGoal === 'Állóképesség') {
    targetCalories = tdee + 100;
  }

  // fallback ha még nincsenek profiladatok
  if (!hasMetrics) {
    targetCalories = 2200;
  }

  // makrók aránya
  let carbsRatio = 0.50;
  let proteinRatio = 0.25;
  let fatRatio = 0.25;

  if (dietType === 'Ketogenic') {
    carbsRatio = 0.05;
    proteinRatio = 0.25;
    fatRatio = 0.70;
  } else if (dietType === 'Vegan') {
    carbsRatio = 0.55;
    proteinRatio = 0.25;
    fatRatio = 0.20;
  }

  const carbsGrams = Math.round((targetCalories * carbsRatio) / 4);
  const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const fatGrams = Math.round((targetCalories * fatRatio) / 9);

  return {
    bmr,
    tdee,
    targetCalories,
    macros: {
      carbsGrams,
      proteinGrams,
      fatGrams,
    },
  };
};
