import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { colors } from '../../themes/tokens';

// Szolgáltatások importálása a meglévő logika újrahasznosításához
import {
  getTodaySteps,
  checkPedometerAvailability,
  requestPedometerPermission,
} from '../../services/stepService';
import { getWaterData } from '../../services/waterService';
import { getTodayConsumedCalories } from '../../services/dietService';
import { getWorkoutPlans, WorkoutPlan } from '../../services/workoutService';
import { MenuHeader } from '../../components/menu/MenuHeader';
import { DashboardStats } from '../../components/menu/DashboardStats';
import { QuickLogBar } from '../../components/menu/QuickLogBar';
import { DailyFocusCard } from '../../components/menu/DailyFocusCard';
import { HubNavigationGrid } from '../../components/menu/HubNavigationGrid';
import { QuickMealModal } from '../../components/menu/QuickMealModal';
import { QuickWaterModal } from '../../components/menu/QuickWaterModal';
import { QuickWorkoutModal } from '../../components/menu/QuickWorkoutModal';

// Napi folyadék célkitűzés
const DAILY_WATER_GOAL = 2000; // ml

const MenuScreen = ({ navigation }: any) => {
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

  // 4. Gyors rögzítés (Quick Log) modal állapotok
  const [mealModalVisible, setMealModalVisible] = useState<boolean>(false);
  const [waterModalVisible, setWaterModalVisible] = useState<boolean>(false);
  const [workoutModalVisible, setWorkoutModalVisible] = useState<boolean>(false);

  // Edzéstervek betöltése
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
      // Felhasználói adatok lekérése
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

      // Lépések lekérése a meglévő stepService-ből
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

      // Vízfogyasztás lekérése a meglévő waterService-ből
      try {
        const waterLogs = await getWaterData();
        const sumWater = waterLogs.reduce((sum: number, log: any) => sum + (log.amountMl || 0), 0);
        setTodayWater(sumWater);
      } catch (err) {
        // vendég / offline
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

  // Automatikus frissítés, amikor a felhasználó visszatér a Menu oldalra
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
  const handleLogout = async () => {
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

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* 1. FEJLÉC (USER AVATAR, NÉV, KÖSZÖNTŐ ÜZENET) */}
        <MenuHeader
          userName={userName}
          onNavigateProfile={() => navigation.navigate('Profil')}
        />

        {/* daily log modal */}
        {/* ========================================================================= */}
        {/* 2. NAPI AKTIVITÁS ÉS HALADÁS (LÉPÉSEK, KALÓRIA, VÍZ) */}
        {/* ========================================================================= */}
        <DashboardStats
          todaySteps={todaySteps}
          consumedCalories={consumedCalories}
          todayWater={todayWater}
          onNavigateSteps={() => navigation.navigate('StepCounter')}
          onNavigateStats={() => navigation.navigate('Stats')}
          onOpenMealModal={() => setMealModalVisible(true)}
          onOpenWaterModal={() => setWaterModalVisible(true)}
        />

        <QuickLogBar
          onOpenMealModal={() => setMealModalVisible(true)}
          onOpenWaterModal={() => setWaterModalVisible(true)}
          onOpenWorkoutModal={() => setWorkoutModalVisible(true)}
        />

        <DailyFocusCard
          workoutPlans={workoutPlans}
          selectedPlanIndex={selectedPlanIndex}
          onSelectPlan={setSelectedPlanIndex}
          onStartWorkout={() => navigation.navigate('Exercise')}
          onViewProgress={() => navigation.navigate('WorkoutProgress')}
          onViewAllPlans={() => navigation.navigate('Exercise')}
        />

        <HubNavigationGrid
          navigation={navigation}
          onLogout={handleLogout}
        />

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Quick log meal modal */}
      <QuickMealModal
        visible={mealModalVisible}
        onClose={() => setMealModalVisible(false)}
        onSuccess={async () => {
          const updatedCals = await getTodayConsumedCalories();
          setConsumedCalories(updatedCals);
        }}
        onNavigateDiet={() => navigation.navigate('Diet')}
      />

      {/* Quick log water modal */}
      <QuickWaterModal
        visible={waterModalVisible}
        todayWater={todayWater}
        dailyGoal={DAILY_WATER_GOAL}
        onClose={() => setWaterModalVisible(false)}
        onSuccess={(updatedWater) => setTodayWater(updatedWater)}
      />

      {/* Quick log workout modal */}
      <QuickWorkoutModal
        visible={workoutModalVisible}
        onClose={() => setWorkoutModalVisible(false)}
        navigation={navigation}
      />
    </View>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
});
