import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  weight?: number | null;
  height?: number | null;
  fitnessGoal?: string;
  createdAt?: any;
}

export interface BmiResult {
  value: number;
  label: string;
  textColor: string;
  bgColor: string;
}

/**
 * Lekéri a bejelentkezett felhasználó profil adatait a Firestore 'users' gyűjteményből.
 */
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

/**
 * Frissíti a bejelentkezett felhasználó adatait a Firestore-ban.
 */
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

/**
 * Kiszámolja a BMI értéket és a kategória címkét / színt.
 */
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

/**
 * Szépen formázza a regisztráció dátumát.
 */
export const formatMemberSince = (createdAt: any): string => {
  if (!createdAt) return 'Aktív tag';
  try {
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short' });
  } catch {
    return 'Aktív tag';
  }
};
