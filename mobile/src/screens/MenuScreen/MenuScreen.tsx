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
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { colors } from '../../themes/tokens';
import placeholderAvatar from '../../../assets/images/placeholderAvatar.jpg';

// Szolgáltatások importálása a meglévő logika újrahasznosításához
import {
  DAILY_STEP_GOAL,
  getTodaySteps,
  calculateDistanceKm,
  calculateCaloriesKcal,
  checkPedometerAvailability,
  requestPedometerPermission,
} from '../../services/stepService';
import { getWaterData } from '../../services/waterService';
import {
  getTodayConsumedCalories,
  DEFAULT_DAILY_CALORIE_GOAL,
} from '../../services/dietService';
import { getWorkoutPlans, WorkoutPlan } from '../../services/workoutService';
import { QuickMealModal } from '../../components/menu/QuickMealModal';
import { QuickWaterModal } from '../../components/menu/QuickWaterModal';
import { QuickWorkoutModal } from '../../components/menu/QuickWorkoutModal';
import { QuickLogBar } from '../../components/menu/QuickLogBar';
import { DailyFocusCard } from '../../components/menu/DailyFocusCard';
import { HubNavigationGrid } from '../../components/menu/HubNavigationGrid';

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
  const stepPercent = Math.min(100, Math.round((todaySteps / DAILY_STEP_GOAL) * 100));
  const caloriePercent = Math.min(100, Math.round((consumedCalories / DEFAULT_DAILY_CALORIE_GOAL) * 100));
  const waterPercent = Math.min(100, Math.round((todayWater / DAILY_WATER_GOAL) * 100));

  // SVG kördiagram segédszámítások lépésekhez
  const ringSize = 74;
  const strokeWidth = 7;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const stepDashOffset = circumference - (stepPercent / 100) * circumference;

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
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Napi haladás</Text>
            <Text style={styles.sectionSub}>Aktivitás és tápanyag áttekintés</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
            <Text style={styles.viewAllLink}>Részletek ›</Text>
          </TouchableOpacity>
        </View>

        {/* Kiemelt Lépésszámláló Kártya (10k Predefined Cél) */}
        <TouchableOpacity
          style={styles.stepProgressCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('StepCounter')}
        >
          <View style={styles.stepCardLeft}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>👟 LÉPÉSSZÁMLÁLÓ</Text>
            </View>
            <View style={styles.stepNumbersRow}>
              <Text style={styles.stepValue}>{todaySteps.toLocaleString()}</Text>
              <Text style={styles.stepGoal}> / {DAILY_STEP_GOAL.toLocaleString()} lépés</Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemVal}>{calculateDistanceKm(todaySteps)} km</Text>
                <Text style={styles.metricItemLbl}>Távolság</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricItemVal}>{calculateCaloriesKcal(todaySteps)} kcal</Text>
                <Text style={styles.metricItemLbl}>Égetve</Text>
              </View>
            </View>
          </View>

          {/* Kör alakú SVG haladásjelző */}
          <View style={styles.stepRingWrapper}>
            <Svg width={ringSize} height={ringSize}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#E2E8F0"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={colors.primary}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={stepDashOffset}
                strokeLinecap="round"
                fill="none"
                rotation="-90"
                origin={`${ringSize / 2}, ${ringSize / 2}`}
              />
            </Svg>
            <View style={styles.stepRingInner}>
              <Text style={styles.stepRingPercent}>{stepPercent}%</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Két oszlopos kártyák: Kalória (Étrend szinkronra kész) és Vízbevitel */}
        <View style={styles.dualStatsRow}>
          {/* Elfogasztott Kalória Kártya */}
          <TouchableOpacity
            style={[styles.smallStatCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}
            activeOpacity={0.85}
            onPress={() => setMealModalVisible(true)}
          >
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={{ fontSize: 16 }}>🔥</Text>
              </View>
              <View style={styles.statusLivePill}>
                <Text style={styles.statusLiveText}>Étrend</Text>
              </View>
            </View>

            <Text style={styles.smallStatTitle}>Elfogasztott kalória</Text>
            <View style={styles.smallStatValueRow}>
              <Text style={styles.smallStatBigVal}>{consumedCalories}</Text>
              <Text style={styles.smallStatGoal}> / {DEFAULT_DAILY_CALORIE_GOAL} kcal</Text>
            </View>

            {/* Vízszintes folyamatjelző sáv */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${caloriePercent}%`, backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.smallStatFooter}>
              {Math.max(0, DEFAULT_DAILY_CALORIE_GOAL - consumedCalories)} kcal még elérhető
            </Text>
          </TouchableOpacity>

          {/* Vízfogyasztás Kártya */}
          <TouchableOpacity
            style={[styles.smallStatCard, { borderLeftColor: '#0284C7', borderLeftWidth: 4 }]}
            activeOpacity={0.85}
            onPress={() => setWaterModalVisible(true)}
          >
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconBadge, { backgroundColor: '#F0F9FF' }]}>
                <Text style={{ fontSize: 16 }}>💧</Text>
              </View>
              <View style={[styles.statusLivePill, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.statusLiveText, { color: '#0369A1' }]}>{waterPercent}%</Text>
              </View>
            </View>

            <Text style={styles.smallStatTitle}>Vízbevitel</Text>
            <View style={styles.smallStatValueRow}>
              <Text style={styles.smallStatBigVal}>{todayWater}</Text>
              <Text style={styles.smallStatGoal}> / {DAILY_WATER_GOAL} ml</Text>
            </View>

            {/* Víz folyamatjelző sáv */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${waterPercent}%`, backgroundColor: '#0284C7' }]} />
            </View>
            <Text style={styles.smallStatFooter}>Kattints a gyors naplózáshoz</Text>
          </TouchableOpacity>
        </View>

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

  // SZEKCIÓ FEJLÉCEK
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  sectionSub: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // 2. NAPI HALADÁS (LÉPÉSEK & KALÓRIA & VÍZ)
  stepProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepCardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  stepNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  stepValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  stepGoal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    marginRight: 14,
  },
  metricItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  metricItemLbl: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  metricDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginRight: 14,
  },

  stepRingWrapper: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stepRingInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRingPercent: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },

  // Két oszlopos kártyák
  dualStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  smallStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLivePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  smallStatTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
    marginBottom: 2,
  },
  smallStatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  smallStatBigVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  smallStatGoal: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[400],
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  smallStatFooter: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '500',
  },

});
