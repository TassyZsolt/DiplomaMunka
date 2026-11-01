import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  getTodaySteps,
  checkPedometerAvailability,
  requestPedometerPermission,
} from '../services/stepService';
import { getWaterData } from '../services/waterService';
import { getTodayConsumedCalories } from '../services/dietService';
import { getWorkoutPlans, WorkoutPlan } from '../services/workoutService';

export const useMenuData = () => {
  // 1. Felhasználói adatok
  const [userData, setUserData] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Sportoló');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 2. Napi aktivitás és haladás
  const [todaySteps, setTodaySteps] = useState<number>(6420);
  const [consumedCalories, setConsumedCalories] = useState<number>(0);
  const [todayWater, setTodayWater] = useState<number>(0);

  // 3. Mai fókusz edzéstervek
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);

  // 4. Gyors rögzítés modal állapotok
  const [mealModalVisible, setMealModalVisible] = useState<boolean>(false);
  const [waterModalVisible, setWaterModalVisible] = useState<boolean>(false);
  const [workoutModalVisible, setWorkoutModalVisible] = useState<boolean>(false);

  // Edzéstervek betöltése és a napi ajánlott terv kiválasztása
  useEffect(() => {
    const plans = getWorkoutPlans();
    setWorkoutPlans(plans);

    // Mai nap alapján ajánlott edzésterv (Hétfő = 0, Kedd = 1, stb.)
    const day = new Date().getDay(); // 0: Vasárnap, 1: Hétfő ...
    const planIdx = (day === 0 ? 6 : day - 1) % (plans.length || 1);
    setSelectedPlanIndex(planIdx);
  }, []);

  // Adatok frissítése és betöltése
  const loadDashboardData = async () => {
    try {
      // Felhasználói adatok lekérése Firestore-ból
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            setUserName(fullName || data.firstName || user.email?.split('@')[0] || 'Sportoló');
          } else {
            setUserName(user.email?.split('@')[0] || 'Sportoló');
          }
        } catch (err) {
          console.warn('Profil adatok lekérése helyi módban:', err);
          if (user.email) {
            setUserName(user.email.split('@')[0]);
          }
        }
      }

      // Lépések lekérése a stepService-ből
      try {
        const available = await checkPedometerAvailability();
        if (available) {
          const hasPerm = await requestPedometerPermission();
          if (hasPerm) {
            const steps = await getTodaySteps();
            if (steps > 0) {
              setTodaySteps(steps);
            }
          }
        }
      } catch (err) {
        console.warn('Lépésszámláló nem elérhető:', err);
      }

      // Vízfogyasztás lekérése a waterService-ből
      try {
        const waterLogs = await getWaterData();
        const sumWater = waterLogs.reduce((sum: number, log: any) => sum + (log.amountMl || 0), 0);
        setTodayWater(sumWater);
      } catch (err) {
        // vendég / offline mód
      }

      // Elfogasztott kalóriák lekérése a dietService-ből
      try {
        const cals = await getTodayConsumedCalories();
        setConsumedCalories(cals);
      } catch (err) {
        console.warn('Kalória lekérési hiba:', err);
      }
    } catch (error) {
      console.error('Hiba a főmenü adatok frissítésekor:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Automatikus frissítés a képernyő fókuszba kerülésekor
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Kijelentkezés
  const handleLogout = (navigation: any) => {
    Alert.alert('Kijelentkezés', 'Biztosan ki szeretnél lépni a fiókodból?', [
      { text: 'Mégse', style: 'cancel' },
      {
        text: 'Kijelentkezés',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.navigate('Login');
          } catch (e) {
            navigation.navigate('Login');
          }
        },
      },
    ]);
  };

  return {
    userData,
    userName,
    loading,
    refreshing,
    todaySteps,
    consumedCalories,
    setConsumedCalories,
    todayWater,
    setTodayWater,
    workoutPlans,
    selectedPlanIndex,
    setSelectedPlanIndex,
    mealModalVisible,
    setMealModalVisible,
    waterModalVisible,
    setWaterModalVisible,
    workoutModalVisible,
    setWorkoutModalVisible,
    onRefresh,
    loadDashboardData,
    handleLogout,
  };
};
