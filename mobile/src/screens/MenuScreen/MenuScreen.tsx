import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { colors } from '../../themes/tokens';
import placeholderAvatar from '../../../assets/images/placeholderAvatar.jpg';

// Szolgáltatások importálása a meglévő logika újrahasznosításához
import {
  getTodaySteps,
  checkPedometerAvailability,
  requestPedometerPermission,
} from '../../services/stepService';
import { getWaterData } from '../../services/waterService';
import { getTodayConsumedCalories } from '../../services/dietService';
import { getWorkoutPlans, WorkoutPlan } from '../../services/workoutService';
import { QuickMealModal } from '../../components/menu/QuickMealModal';
import { QuickWaterModal } from '../../components/menu/QuickWaterModal';
import { QuickWorkoutModal } from '../../components/menu/QuickWorkoutModal';
import { QuickLogBar } from '../../components/menu/QuickLogBar';
import { DailyFocusCard } from '../../components/menu/DailyFocusCard';
import { HubNavigationGrid } from '../../components/menu/HubNavigationGrid';
import { DashboardStats } from '../../components/menu/DashboardStats';

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

  // Időszaknak megfelelő köszöntés kalkulálása
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Jó reggelt! ☀️',
        subtext: 'Induljon energikusan a mai nap!',
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: 'Szép napot! 🌤️',
        subtext: 'Tarts ki a mai egészségcéljaid mellett!',
      };
    } else {
      return {
        greeting: 'Jó estét! 🌙',
        subtext: 'Nézd meg a mai napod eredményeit!',
      };
    }
  };

  // Dátum formázása
  const getFormattedDate = () => {
    const now = new Date();
    const days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    const months = [
      'január', 'február', 'március', 'április', 'május', 'június',
      'július', 'augusztus', 'szeptember', 'október', 'november', 'december'
    ];
    return `${now.getFullYear()}. ${months[now.getMonth()]} ${now.getDate()}., ${days[now.getDay()]}`;
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

  const { greeting, subtext } = getGreeting();

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profil')}
          >
            <Image source={placeholderAvatar} style={styles.avatarImage} />
            <View style={styles.onlineStatusBadge} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.dateSubtitle}>{getFormattedDate()}</Text>
          </View>

          <TouchableOpacity
            style={styles.profileActionBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profil')}
          >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                stroke={colors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
                stroke={colors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Köszöntő mottó szalag */}
        <View style={styles.motivationBanner}>
          <Text style={styles.motivationText}>✨ {subtext}</Text>
        </View>

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

        <View style= {{ height: 32  }}/>
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

  // 1. FEJLÉC
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTouchable: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  onlineStatusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.neutral[900],
    marginTop: 1,
  },
  dateSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  profileActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  motivationBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  motivationText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
});
