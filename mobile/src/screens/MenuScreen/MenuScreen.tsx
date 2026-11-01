import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  KeyboardAvoidingView,
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
import { getWaterData, addWaterData } from '../../services/waterService';
import {
  getTodayConsumedCalories,
  DEFAULT_DAILY_CALORIE_GOAL,
} from '../../services/dietService';
import { getWorkoutPlans, WorkoutPlan } from '../../services/workoutService';
import { QuickMealModal } from '../../components/menu/QuickMealModal';

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

  // Form állapotok
  const [waterInput, setWaterInput] = useState<string>('250');
  const [isSavingWater, setIsSavingWater] = useState<boolean>(false);

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

  // Gyors vízbevitel rögzítése
  const handleAddWaterQuick = async (amount: number) => {
    try {
      setIsSavingWater(true);
      await addWaterData(amount);
      const waterLogs = await getWaterData();
      const sumWater = waterLogs.reduce((sum: number, log: any) => sum + (log.amountMl || 0), 0);
      setTodayWater(sumWater);
      Alert.alert('Folyadékbevitel 💧', `+${amount} ml sikeresen hozzáadva!`);
      setWaterModalVisible(false);
    } catch (error: any) {
      Alert.alert('Hiba', error.message || 'Nem sikerült hozzáadni a vizet.');
    } finally {
      setIsSavingWater(false);
    }
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

  const currentFocusPlan = workoutPlans[selectedPlanIndex] || workoutPlans[0];

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
        {/* ========================================================================= */}
        {/* 1. FEJLÉC (USER AVATAR, NÉV, KÖSZÖNTŐ ÜZENET) */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* 2. NAPI AKTIVITÁS ÉS HALADÁS (LÉPÉSEK 10K CÉL, ELFOGYASZTOTT KALÓRIA, VÍZ) */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* 3. GYORS RÖGZÍTÉS (QUICK LOG) SZEKCIÓ */}
        {/* ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Gyors rögzítés</Text>
            <Text style={styles.sectionSub}>Azonnali bevitel és naplózás</Text>
          </View>
        </View>

        <View style={styles.quickLogGrid}>
          {/* Étkezés Rögzítése Gomb */}
          <TouchableOpacity
            style={[styles.quickLogButton, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            activeOpacity={0.75}
            onPress={() => setMealModalVisible(true)}
          >
            <View style={[styles.quickLogIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.quickLogEmoji}>🥗</Text>
            </View>
            <Text style={styles.quickLogTitle}>Étkezés</Text>
            <Text style={styles.quickLogSubtitle}>Kalóriák & ételek</Text>
          </TouchableOpacity>

          {/* Vízbevitel Gomb */}
          <TouchableOpacity
            style={[styles.quickLogButton, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
            activeOpacity={0.75}
            onPress={() => setWaterModalVisible(true)}
          >
            <View style={[styles.quickLogIconContainer, { backgroundColor: '#E0F2FE' }]}>
              <Text style={styles.quickLogEmoji}>💧</Text>
            </View>
            <Text style={styles.quickLogTitle}>Vízbevitel</Text>
            <Text style={styles.quickLogSubtitle}>Pohár / kulacs</Text>
          </TouchableOpacity>

          {/* Edzés Indítás / Rögzítés Gomb */}
          <TouchableOpacity
            style={[styles.quickLogButton, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}
            activeOpacity={0.75}
            onPress={() => setWorkoutModalVisible(true)}
          >
            <View style={[styles.quickLogIconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Text style={styles.quickLogEmoji}>🏋️</Text>
            </View>
            <Text style={styles.quickLogTitle}>Edzés</Text>
            <Text style={styles.quickLogSubtitle}>Terv vagy széria</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* 4. MAI FÓKUSZ (PREDEFINED EXERCISES WORKOUT PLANS) */}
        {/* ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Mai fókusz</Text>
            <Text style={styles.sectionSub}>Előre definiált edzéstervek a fitnesz céljaidhoz</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Exercise')}>
            <Text style={styles.viewAllLink}>Mind ({workoutPlans.length}) ›</Text>
          </TouchableOpacity>
        </View>

        {/* Terv választó horizontális sáv */}
        {workoutPlans.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.planSelectorRow}
          >
            {workoutPlans.map((plan, index) => {
              const isSelected = index === selectedPlanIndex;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planPill, isSelected && styles.planPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPlanIndex(index)}
                >
                  <Text style={[styles.planPillText, isSelected && styles.planPillTextActive]}>
                    {plan.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Kiemelt Mai Edzésterv Kártya */}
        {currentFocusPlan && (
          <View style={styles.focusWorkoutCard}>
            <View style={styles.focusWorkoutTop}>
              <View>
                <View style={styles.focusPlanBadge}>
                  <Text style={styles.focusPlanBadgeText}>MAI AJÁNLÁS</Text>
                </View>
                <Text style={styles.focusWorkoutName}>{currentFocusPlan.name}</Text>
                <Text style={styles.focusWorkoutCategory}>{currentFocusPlan.category}</Text>
              </View>

              <View style={styles.focusDurationBadge}>
                <Text style={styles.focusDurationText}>⏱️ {currentFocusPlan.durationEst}</Text>
              </View>
            </View>

            <Text style={styles.focusWorkoutDesc} numberOfLines={2}>
              {currentFocusPlan.description}
            </Text>

            {/* Gyakorlat előnézet chipek */}
            <View style={styles.exercisesPreviewWrapper}>
              <Text style={styles.exercisesPreviewHeading}>
                Tartalmazott gyakorlatok ({currentFocusPlan.exercises.length}):
              </Text>
              <View style={styles.exerciseChipsRow}>
                {currentFocusPlan.exercises.slice(0, 4).map((ex, idx) => (
                  <View key={idx} style={styles.singleExChip}>
                    <Text style={styles.singleExChipText}>• {ex.name}</Text>
                  </View>
                ))}
                {currentFocusPlan.exercises.length > 4 && (
                  <View style={[styles.singleExChip, { backgroundColor: '#E2E8F0' }]}>
                    <Text style={[styles.singleExChipText, { color: colors.neutral[700] }]}>
                      +{currentFocusPlan.exercises.length - 4} további
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Műveleti gombok */}
            <View style={styles.focusActionRow}>
              <TouchableOpacity
                style={styles.startWorkoutPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Exercise')}
              >
                <Text style={styles.startWorkoutBtnText}>Edzés megtekintése & Indítás ▶</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewProgressBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('WorkoutProgress')}
              >
                <Text style={styles.viewProgressBtnText}>Előzmények</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 5. FŐ MODULOK / GYORS NAVIGÁCIÓ (A KORÁBBI 4 GOMB MODERN MEGVALÓSÍTÁSA) */}
        {/* ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Alkalmazás menü</Text>
            <Text style={styles.sectionSub}>Főbb funkciók és részletes felületek</Text>
          </View>
        </View>

        <View style={styles.hubGrid}>
          {/* 1. Edzéstervek (korábbi 'Edzéstervek' gomb) */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Exercise')}
          >
            <View style={[styles.hubIconBg, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.hubEmoji}>🏋️‍♂️</Text>
            </View>
            <View style={styles.hubTextCol}>
              <Text style={styles.hubTitle}>Edzéstervek</Text>
              <Text style={styles.hubDesc}>Predefiniált tervek & szériák</Text>
            </View>
            <Text style={styles.hubArrow}>›</Text>
          </TouchableOpacity>

          {/* 2. Étrend (korábbi 'Étrend' gomb) */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Diet')}
          >
            <View style={[styles.hubIconBg, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.hubEmoji}>🥗</Text>
            </View>
            <View style={styles.hubTextCol}>
              <Text style={styles.hubTitle}>Étrend & Diéta</Text>
              <Text style={styles.hubDesc}>Étrend típusok & kalóriák</Text>
            </View>
            <Text style={styles.hubArrow}>›</Text>
          </TouchableOpacity>

          {/* 3. Statisztikák (korábbi 'Statisztikák' gomb) */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Stats')}
          >
            <View style={[styles.hubIconBg, { backgroundColor: '#FAF5FF' }]}>
              <Text style={styles.hubEmoji}>📊</Text>
            </View>
            <View style={styles.hubTextCol}>
              <Text style={styles.hubTitle}>Statisztikák</Text>
              <Text style={styles.hubDesc}>Víz, lépés és volumen grafikonok</Text>
            </View>
            <Text style={styles.hubArrow}>›</Text>
          </TouchableOpacity>

          {/* 4. Profil (korábbi 'Profil' gomb) */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profil')}
          >
            <View style={[styles.hubIconBg, { backgroundColor: '#FFFBEB' }]}>
              <Text style={styles.hubEmoji}>👤</Text>
            </View>
            <View style={styles.hubTextCol}>
              <Text style={styles.hubTitle}>Profilom</Text>
              <Text style={styles.hubDesc}>Személyes adatok kezelése</Text>
            </View>
            <Text style={styles.hubArrow}>›</Text>
          </TouchableOpacity>

          {/* 5. Edzés Haladás & PR-ek */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('WorkoutProgress')}
          >
            <View style={[styles.hubIconBg, { backgroundColor: '#FEF2F2' }]}>
              <Text style={styles.hubEmoji}>🏆</Text>
            </View>
            <View style={styles.hubTextCol}>
              <Text style={styles.hubTitle}>Haladás & PR-ek</Text>
              <Text style={styles.hubDesc}>Egyéni csúcsok és súlyrekordok</Text>
            </View>
            <Text style={styles.hubArrow}>›</Text>
          </TouchableOpacity>

          {/* 6. Lépésszámláló részletesen */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StepCounter')}
          >
            <View style={[styles.hubIconBg, { backgroundColor: '#F0F9FF' }]}>
              <Text style={styles.hubEmoji}>👟</Text>
            </View>
            <View style={styles.hubTextCol}>
              <Text style={styles.hubTitle}>Lépésszámláló</Text>
              <Text style={styles.hubDesc}>Napi célok & kadencia bontás</Text>
            </View>
            <Text style={styles.hubArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Kijelentkezés szekció */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>🚪 Kijelentkezés a fiókból</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: ÉTKEZÉS RÖGZÍTÉSE (QUICK LOG MEAL) */}
      {/* ========================================================================= */}
      <QuickMealModal
        visible={mealModalVisible}
        onClose={() => setMealModalVisible(false)}
        onSuccess={async () => {
          const updatedCals = await getTodayConsumedCalories();
          setConsumedCalories(updatedCals);
        }}
        onNavigateDiet={() => navigation.navigate('Diet')}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: VÍZBEVITEL RÖGZÍTÉSE (QUICK LOG WATER) */}
      {/* ========================================================================= */}
      <Modal
        visible={waterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWaterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>💧</Text>
                <Text style={styles.modalTitle}>Vízbevitel rögzítése</Text>
              </View>
              <TouchableOpacity onPress={() => setWaterModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Mai eddigi fogyasztásod: <Text style={{ fontWeight: 'bold', color: '#0284C7' }}>{todayWater} ml</Text> a célként kitűzött 2000 ml-ből.
            </Text>

            <Text style={styles.inputLabel}>Válassz gyors adagot vagy adj meg egyedit:</Text>
            <View style={styles.waterQuickPresetsGrid}>
              <TouchableOpacity
                style={styles.waterPresetBtn}
                onPress={() => handleAddWaterQuick(250)}
                disabled={isSavingWater}
              >
                <Text style={styles.waterPresetEmoji}>🥛</Text>
                <Text style={styles.waterPresetText}>+250 ml</Text>
                <Text style={styles.waterPresetSub}>1 pohár</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.waterPresetBtn}
                onPress={() => handleAddWaterQuick(500)}
                disabled={isSavingWater}
              >
                <Text style={styles.waterPresetEmoji}>🍶</Text>
                <Text style={styles.waterPresetText}>+500 ml</Text>
                <Text style={styles.waterPresetSub}>1 kulacs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.waterPresetBtn}
                onPress={() => handleAddWaterQuick(750)}
                disabled={isSavingWater}
              >
                <Text style={styles.waterPresetEmoji}>💧</Text>
                <Text style={styles.waterPresetText}>+750 ml</Text>
                <Text style={styles.waterPresetSub}>Nagy palack</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.waterPresetBtn}
                onPress={() => handleAddWaterQuick(1000)}
                disabled={isSavingWater}
              >
                <Text style={styles.waterPresetEmoji}>🚰</Text>
                <Text style={styles.waterPresetText}>+1000 ml</Text>
                <Text style={styles.waterPresetSub}>1 liter</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Egyedi mennyiség (ml):</Text>
            <View style={styles.customWaterRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                placeholder="pl. 330"
                keyboardType="numeric"
                value={waterInput}
                onChangeText={setWaterInput}
              />
              <TouchableOpacity
                style={styles.customWaterAddBtn}
                onPress={() => {
                  const amt = parseInt(waterInput, 10);
                  if (amt > 0) {
                    handleAddWaterQuick(amt);
                  }
                }}
                disabled={isSavingWater}
              >
                <Text style={styles.customWaterAddBtnText}>Hozzáadás</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.cancelModalBtn, { marginTop: 16, width: '100%' }]}
              onPress={() => setWaterModalVisible(false)}
            >
              <Text style={styles.cancelModalBtnText}>Bezárás</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: EDZÉS NAPLÓZÁS (QUICK LOG WORKOUT) */}
      {/* ========================================================================= */}
      <Modal
        visible={workoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWorkoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>🏋️</Text>
                <Text style={styles.modalTitle}>Edzés gyorsindítás</Text>
              </View>
              <TouchableOpacity onPress={() => setWorkoutModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Válassz az alábbi lehetőségek közül az edzés és rekordok naplózásához:
            </Text>

            <TouchableOpacity
              style={styles.workoutOptionTile}
              onPress={() => {
                setWorkoutModalVisible(false);
                navigation.navigate('Exercise');
              }}
            >
              <Text style={styles.workoutOptionEmoji}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutOptionTitle}>Predefiniált Edzés Indítása</Text>
                <Text style={styles.workoutOptionSub}>
                  Interaktív sorozatkövető, időzítő és pipálható ismétlések
                </Text>
              </View>
              <Text style={styles.hubArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.workoutOptionTile}
              onPress={() => {
                setWorkoutModalVisible(false);
                navigation.navigate('WorkoutProgress');
              }}
            >
              <Text style={styles.workoutOptionEmoji}>📈</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutOptionTitle}>Edzéselőzmények & Elemzés</Text>
                <Text style={styles.workoutOptionSub}>
                  Korábbi edzések megtekintése, heti volumenek
                </Text>
              </View>
              <Text style={styles.hubArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.workoutOptionTile}
              onPress={() => {
                setWorkoutModalVisible(false);
                navigation.navigate('PersonalStats');
              }}
            >
              <Text style={styles.workoutOptionEmoji}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutOptionTitle}>Egyéni Csúcs (PR) Rögzítése</Text>
                <Text style={styles.workoutOptionSub}>
                  Guggolás, fekvenyomás, felhúzás 1RM és új rekordok
                </Text>
              </View>
              <Text style={styles.hubArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelModalBtn, { marginTop: 12, width: '100%' }]}
              onPress={() => setWorkoutModalVisible(false)}
            >
              <Text style={styles.cancelModalBtnText}>Mégse</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // 3. GYORS RÖGZÍTÉS (QUICK LOG) GOMBOK
  quickLogGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickLogButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLogIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLogEmoji: {
    fontSize: 22,
  },
  quickLogTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  quickLogSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.neutral[500],
    textAlign: 'center',
  },

  // 4. MAI FÓKUSZ (WORKOUT PLANS)
  planSelectorRow: {
    paddingVertical: 4,
    marginBottom: 10,
  },
  planPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  planPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  planPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  focusWorkoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  focusWorkoutTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  focusPlanBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  focusPlanBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  focusWorkoutName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  focusWorkoutCategory: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },
  focusDurationBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  focusDurationText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  focusWorkoutDesc: {
    fontSize: 13,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 12,
  },

  exercisesPreviewWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  exercisesPreviewHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  exerciseChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  singleExChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  singleExChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },

  focusActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  startWorkoutPrimaryBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  viewProgressBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProgressBtnText: {
    color: colors.neutral[800],
    fontWeight: '600',
    fontSize: 13,
  },

  // 5. FŐ MODULOK / HUB
  hubGrid: {
    gap: 10,
    marginBottom: 20,
  },
  hubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  hubIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  hubEmoji: {
    fontSize: 22,
  },
  hubTextCol: {
    flex: 1,
  },
  hubTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  hubDesc: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },
  hubArrow: {
    fontSize: 20,
    color: colors.neutral[400],
    fontWeight: '300',
    paddingHorizontal: 4,
  },

  // KIJELENTKEZÉS
  logoutSection: {
    marginTop: 4,
    marginBottom: 10,
  },
  logoutBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  // MODALOK
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  modalDescription: {
    fontSize: 13,
    color: colors.neutral[600],
    marginBottom: 16,
    lineHeight: 18,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.neutral[900],
    marginBottom: 14,
  },

  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mealTypeChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  mealTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  mealTypeChipTextActive: {
    color: '#047857',
    fontWeight: '700',
  },

  quickCalPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  quickCalPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  quickCalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },

  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  submitModalBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  modalDietScreenLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  modalDietScreenLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // Vízbevitel modal elemek
  waterQuickPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  waterPresetBtn: {
    width: '48%',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  waterPresetEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  waterPresetText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369A1',
  },
  waterPresetSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  customWaterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customWaterAddBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  customWaterAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Edzés opció csempék modalban
  workoutOptionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workoutOptionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  workoutOptionSub: {
    fontSize: 11,
    color: colors.neutral[500],
    lineHeight: 15,
  },
});
