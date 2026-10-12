import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { getWaterData, addWaterData } from '../../services/waterService';
import { 
  Exercise, 
  PersonalRecord, 
  DEFAULT_EXERCISES, 
  getAvailableExercises, 
  getPersonalRecords, 
  savePersonalRecord,
  calculateTotalPr,
} from '../../services/prService';
import {
  DAILY_STEP_GOAL,
  getTodaySteps,
  calculateDistanceKm,
  calculateCaloriesKcal,
} from '../../services/stepService';
import {
  getWorkoutSessions,
  getWeeklyWorkoutStats,
  WeeklyStats,
} from '../../services/workoutService';
import { colors } from '../../themes/tokens';

const DAILY_WATER_TARGET = 2000; // ml

const StatScreen = ({ navigation }: any) => {
  // 1. Vízfogyasztás állapot
  const [totalWater, setTotalWater] = useState<number>(0);
  const [waterModalVisible, setWaterModalVisible] = useState<boolean>(false);
  const [customWaterAmount, setCustomWaterAmount] = useState<string>('');

  // 2. Napi lépések állapot
  const [todaySteps, setTodaySteps] = useState<number>(6420);

  // 3. Heti edzés statisztikák
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);

  // 4. PR adatok
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [records, setRecords] = useState<Record<string, PersonalRecord>>({});
  const [prModalVisible, setPrModalVisible] = useState<boolean>(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('squats');
  const [inputWeight, setInputWeight] = useState<string>('');
  const [inputReps, setInputReps] = useState<string>('1');
  const [isSavingPr, setIsSavingPr] = useState<boolean>(false);

  // Adatok betöltése képernyőre lépéskor
  const loadDashboardData = async () => {
    try {
      // Víz
      try {
        const logs = await getWaterData();
        const total = logs.reduce((sum: number, log: any) => sum + (log.amountMl || 0), 0);
        setTotalWater(total);
      } catch (e) {
        // vendég / offline esetén
      }

      // Lépések a beépített hardverből
      try {
        const stepsFromHw = await getTodaySteps();
        if (stepsFromHw > 0) {
          setTodaySteps(stepsFromHw);
        }
      } catch (e) {
        // megtartja az alapértelmezett értéket
      }

      // PR-ek
      const [availExercises, prs] = await Promise.all([
        getAvailableExercises(),
        getPersonalRecords(),
      ]);
      setExercises(availExercises);
      setRecords(prs);

      // Edzés statisztikák
      try {
        const workoutSessions = await getWorkoutSessions();
        const computedWeekly = getWeeklyWorkoutStats(workoutSessions);
        setWeeklyStats(computedWeekly);
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Hiba az áttekintő adatok betöltésekor:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const handleAddWater = async (amount: number) => {
    try {
      await addWaterData(amount);
      loadDashboardData();
    } catch (error) {
      console.error('Hiba víz hozzáadásakor:', error);
    }
  };

  const handleAddCustomWater = async () => {
    const amount = parseInt(customWaterAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hiba', 'Kérlek érvényes számot adj meg!');
      return;
    }
    await handleAddWater(amount);
    setCustomWaterAmount('');
    setWaterModalVisible(false);
  };

  const handleOpenPrModal = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    const existing = records[exerciseId];
    if (existing) {
      setInputWeight(existing.weight.toString());
      setInputReps(existing.reps?.toString() || '1');
    } else {
      setInputWeight('');
      setInputReps('1');
    }
    setPrModalVisible(true);
  };

  const handleSavePr = async () => {
    const weightNum = parseFloat(inputWeight);
    const repsNum = parseInt(inputReps, 10);

    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Figyelmeztetés', 'Kérlek érvényes pozitív súlyt adj meg (kg)!');
      return;
    }

    if (isNaN(repsNum) || repsNum <= 0) {
      Alert.alert('Figyelmeztetés', 'Kérlek érvényes ismétlésszámot adj meg!');
      return;
    }

    try {
      setIsSavingPr(true);
      await savePersonalRecord(selectedExerciseId, weightNum, repsNum);
      await loadDashboardData();
      setPrModalVisible(false);
    } catch (error) {
      Alert.alert('Hiba', 'Nem sikerült menteni a rekordot');
    } finally {
      setIsSavingPr(false);
    }
  };

  // Víz SVG kördiagram
  const waterSize = 140;
  const waterStroke = 12;
  const waterRadius = (waterSize - waterStroke) / 2;
  const waterCircumference = 2 * Math.PI * waterRadius;
  const waterProgress = Math.min((totalWater / DAILY_WATER_TARGET) * 100, 100);
  const waterOffset = waterCircumference - (waterProgress / 100) * waterCircumference;

  // Lépés SVG mini kördiagram
  const stepSize = 64;
  const stepStroke = 6;
  const stepRadius = (stepSize - stepStroke) / 2;
  const stepCircumference = 2 * Math.PI * stepRadius;
  const stepProgress = Math.min((todaySteps / DAILY_STEP_GOAL) * 100, 100);
  const stepOffset = stepCircumference - (stepProgress / 100) * stepCircumference;

  const stepDistance = calculateDistanceKm(todaySteps);
  const stepCalories = calculateCaloriesKcal(todaySteps);
  const totalPrWeight = calculateTotalPr(records);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Fejléc */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Statisztikák</Text>
          <Text style={styles.screenSubtitle}>Napi összefoglaló és egyéni mérföldkövek</Text>
        </View>
        <View style={styles.todayDateBadge}>
          <Text style={styles.todayDateBadgeText}>Ma</Text>
        </View>
      </View>

      {/* ========================================================
          1. SZEKCIÓ (HIGH FREQUENCY): NAPI LÉPÉSEK & AKTIVITÁS
          Tapping bridges directly to StepCounter drill-down
      ======================================================== */}
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('StepCounter')}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWithIcon}>
            <View style={[styles.cardIconBox, { backgroundColor: '#EBF3FF' }]}>
              <Text style={styles.cardEmoji}>👟</Text>
            </View>
            <View>
              <Text style={styles.cardHeaderTitle}>Napi Lépések & Aktivitás</Text>
              <Text style={styles.cardHeaderSubtitle}>Beépített mozgásérzékelő</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </View>

        <View style={styles.activityBodyRow}>
          <View style={styles.activityNumberCol}>
            <View style={styles.valueRow}>
              <Text style={styles.largeValueText}>{todaySteps.toLocaleString('hu-HU')}</Text>
              <Text style={styles.goalValueText}> / {DAILY_STEP_GOAL.toLocaleString('hu-HU')} cél</Text>
            </View>
            <View style={styles.subStatsRow}>
              <Text style={styles.subStatItem}>📍 {stepDistance} km</Text>
              <Text style={styles.subStatDot}>•</Text>
              <Text style={styles.subStatItem}>🔥 {stepCalories} kcal</Text>
              <Text style={styles.subStatDot}>•</Text>
              <Text style={styles.subStatItem}>⚡ {Math.round(stepProgress)}%</Text>
            </View>
          </View>

          {/* Micro-visual: Mini kördiagram */}
          <View style={styles.miniRingWrapper}>
            <Svg width={stepSize} height={stepSize}>
              <Circle
                cx={stepSize / 2}
                cy={stepSize / 2}
                r={stepRadius}
                stroke={colors.neutral[200]}
                strokeWidth={stepStroke}
                fill="transparent"
              />
              <Circle
                cx={stepSize / 2}
                cy={stepSize / 2}
                r={stepRadius}
                stroke={colors.primary}
                strokeWidth={stepStroke}
                strokeDasharray={stepCircumference}
                strokeDashoffset={stepOffset}
                strokeLinecap="round"
                fill="transparent"
                rotation="-90"
                origin={`${stepSize / 2}, ${stepSize / 2}`}
              />
            </Svg>
            <View style={styles.miniRingTextContainer}>
              <Text style={styles.miniRingPercentText}>{Math.round(stepProgress)}%</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* ========================================================
          2. SZEKCIÓ (HIGH FREQUENCY): NAPI VÍZFOGYASZTÁS
          Compact card with circular progress and quick log pills
      ======================================================== */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWithIcon}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Text style={styles.cardEmoji}>💧</Text>
            </View>
            <View>
              <Text style={styles.cardHeaderTitle}>Napi Vízfogyasztás</Text>
              <Text style={styles.cardHeaderSubtitle}>Napi hidratációs cél</Text>
            </View>
          </View>
          <View style={styles.waterPercentBadge}>
            <Text style={styles.waterPercentBadgeText}>{Math.round(waterProgress)}%</Text>
          </View>
        </View>

        <View style={styles.waterContentRow}>
          {/* Kördiagram */}
          <View style={styles.waterRingContainer}>
            <Svg width={waterSize} height={waterSize}>
              <Circle
                cx={waterSize / 2}
                cy={waterSize / 2}
                r={waterRadius}
                stroke={colors.neutral[200]}
                strokeWidth={waterStroke}
                fill="transparent"
              />
              <Circle
                cx={waterSize / 2}
                cy={waterSize / 2}
                r={waterRadius}
                stroke="#0284C7"
                strokeWidth={waterStroke}
                strokeDasharray={waterCircumference}
                strokeDashoffset={waterOffset}
                strokeLinecap="round"
                fill="transparent"
                rotation="-90"
                origin={`${waterSize / 2}, ${waterSize / 2}`}
              />
            </Svg>
            <View style={styles.waterCenterText}>
              <Text style={styles.waterCurrentAmount}>{totalWater}</Text>
              <View style={styles.waterDivider} />
              <Text style={styles.waterTargetText}>{DAILY_WATER_TARGET} ml</Text>
            </View>
          </View>

          {/* Gyors rögzítési gombok */}
          <View style={styles.waterPillsCol}>
            <TouchableOpacity style={styles.waterPill} onPress={() => handleAddWater(250)}>
              <Text style={styles.waterPillText}>+250 ml</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.waterPill} onPress={() => handleAddWater(500)}>
              <Text style={styles.waterPillText}>+500 ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.waterPill, styles.waterPillCustom]}
              onPress={() => setWaterModalVisible(true)}
            >
              <Text style={[styles.waterPillText, styles.waterPillCustomText]}>Egyéni ml</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ========================================================
          3. SZEKCIÓ (MEDIUM FREQUENCY): WORKOUTS & VOLUME
          Tapping bridges directly to WorkoutProgress drill-down
      ======================================================== */}
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('WorkoutProgress')}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWithIcon}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E8F8F0' }]}>
              <Text style={styles.cardEmoji}>📊</Text>
            </View>
            <View>
              <Text style={styles.cardHeaderTitle}>Heti Edzések & Konzisztencia</Text>
              <Text style={styles.cardHeaderSubtitle}>Terhelés & heti naptár</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </View>

        {/* Heti teljesítmény összefoglaló */}
        <View style={styles.workoutStatsRow}>
          <View>
            <Text style={styles.workoutMainValue}>
              {weeklyStats ? `${weeklyStats.completedCount} / 5 edzés` : '— / 5 edzés'}
            </Text>
            <Text style={styles.workoutSubLabel}>
              {weeklyStats
                ? `Heti cél ${Math.min(100, Math.round((weeklyStats.completedCount / 5) * 100))}%-a elérve`
                : 'Heti cél betöltése...'}
            </Text>
          </View>

          {/* Heti napok mikro-indikátorok (H, K, Sze, Cs, P, Szo, V) */}
          <View style={styles.weekDotsRow}>
            {(weeklyStats?.weekDays || [
              { dayName: 'H', status: 'rest', isToday: false },
              { dayName: 'K', status: 'rest', isToday: false },
              { dayName: 'Sze', status: 'rest', isToday: false },
              { dayName: 'Cs', status: 'rest', isToday: false },
              { dayName: 'P', status: 'rest', isToday: false },
              { dayName: 'Szo', status: 'planned', isToday: true },
              { dayName: 'V', status: 'rest', isToday: false },
            ]).map((dot: any, idx: number) => {
              const isDone = dot.status === 'completed';
              return (
                <View key={idx} style={styles.dayDotCol}>
                  <View
                    style={[
                      styles.dayDotCircle,
                      isDone && styles.dayDotCircleDone,
                      dot.isToday && styles.dayDotCircleToday,
                    ]}
                  >
                    <Text style={[styles.dayDotText, isDone && styles.dayDotTextDone]}>
                      {isDone ? '✓' : dot.dayName}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.workoutFooterBar}>
          <Text style={styles.workoutFooterText}>
            ⏱️ {weeklyStats ? `${Math.round(weeklyStats.totalTimeMinutes / 60)} óra edzésidő • ${weeklyStats.totalVolumeKg.toLocaleString('hu-HU')} kg volumen` : 'Edzésadatok betöltése...'}
          </Text>
          <Text style={styles.cardLinkText}>Részletes naptár & volumen →</Text>
        </View>
      </TouchableOpacity>

      {/* ========================================================
          4. SZEKCIÓ (SLOW-CHANGING MILESTONES): SZEMÉLYES REKORDOK (PRs)
          Tapping bridges directly to PersonalStats drill-down
      ======================================================== */}
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('PersonalStats')}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWithIcon}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.cardEmoji}>🏆</Text>
            </View>
            <View>
              <Text style={styles.cardHeaderTitle}>Egyéni Rekordok (PRs)</Text>
              <Text style={styles.cardHeaderSubtitle}>Főbb alapgyakorlatok</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </View>

        {/* Összesített súly banner */}
        <View style={styles.totalPrRow}>
          <Text style={styles.totalPrLabel}>Összesített rekord (Total):</Text>
          <Text style={styles.totalPrWeight}>{totalPrWeight} kg</Text>
        </View>

        {/* A 3 legfőbb gyakorlat előnézete */}
        <View style={styles.prPreviewList}>
          {exercises.map((exercise) => {
            const pr = records[exercise.id];
            const weightVal = pr?.weight || 0;
            const repsVal = pr?.reps || 1;

            return (
              <View key={exercise.id} style={styles.prPreviewRow}>
                <View style={styles.prPreviewLeft}>
                  <Text style={styles.prExerciseTitle}>{exercise.name}</Text>
                  <Text style={styles.prCategoryText}>
                    {exercise.category} • {repsVal} ism.
                  </Text>
                </View>

                <View style={styles.prPreviewRight}>
                  <Text style={styles.prWeightNumber}>{weightVal} kg</Text>
                  <TouchableOpacity
                    style={styles.prQuickEditBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenPrModal(exercise.id);
                    }}
                  >
                    <Text style={styles.prQuickEditBtnText}>Módosítás</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.prFooterBar}>
          <Text style={styles.cardLinkText}>1RM kalkulátor & teljes történet megnyitása →</Text>
        </View>
      </TouchableOpacity>

      {/* ========================================================
          MODALOK
      ======================================================== */}
      {/* Egyéni vízmennyiség Modal */}
      <Modal
        visible={waterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setWaterModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setWaterModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Egyéni vízmennyiség (ml)</Text>
            <TextInput
              style={styles.input}
              placeholder="Pl. 350"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="number-pad"
              value={customWaterAmount}
              onChangeText={setCustomWaterAmount}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setCustomWaterAmount('');
                  setWaterModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Mégse</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleAddCustomWater}
              >
                <Text style={styles.saveButtonText}>Hozzáadás</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Gyors PR szerkesztés Modal */}
      <Modal
        visible={prModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPrModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPrModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Egyéni rekord módosítása</Text>

            <View style={styles.pickerTabs}>
              {exercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[
                    styles.tabChip,
                    selectedExerciseId === ex.id && styles.tabChipActive,
                  ]}
                  onPress={() => {
                    setSelectedExerciseId(ex.id);
                    const existing = records[ex.id];
                    if (existing) {
                      setInputWeight(existing.weight.toString());
                      setInputReps(existing.reps?.toString() || '1');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.tabChipText,
                      selectedExerciseId === ex.id && styles.tabChipTextActive,
                    ]}
                  >
                    {ex.id === 'squats' ? 'Guggolás' : ex.id === 'benchpress' ? 'Fekvenyomás' : 'Felhúzás'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputFieldLabel}>Új rekord súly (kg):</Text>
            <TextInput
              style={styles.input}
              placeholder="Pl. 120"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="numeric"
              value={inputWeight}
              onChangeText={setInputWeight}
            />

            <Text style={styles.inputFieldLabel}>Ismétlésszám (ism.):</Text>
            <TextInput
              style={styles.input}
              placeholder="Pl. 1"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="number-pad"
              value={inputReps}
              onChangeText={setInputReps}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPrModalVisible(false)}
                disabled={isSavingPr}
              >
                <Text style={styles.cancelButtonText}>Mégse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePr}
                disabled={isSavingPr}
              >
                {isSavingPr ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Mentés</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default StatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    marginTop: 6,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  todayDateBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  todayDateBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardHeaderSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  chevronBox: {
    paddingLeft: 8,
  },
  chevronText: {
    fontSize: 22,
    color: colors.neutral[400],
    fontWeight: '300',
  },
  activityBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityNumberCol: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  largeValueText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  goalValueText: {
    fontSize: 13,
    color: colors.neutral[500],
    fontWeight: '600',
    marginLeft: 4,
  },
  subStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  subStatItem: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  subStatDot: {
    marginHorizontal: 6,
    color: colors.neutral[400],
    fontSize: 10,
  },
  miniRingWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  miniRingTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniRingPercentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  waterPercentBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  waterPercentBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  waterContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waterRingContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterCenterText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterCurrentAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  waterDivider: {
    width: 44,
    height: 1.5,
    backgroundColor: colors.neutral[300],
    marginVertical: 2,
  },
  waterTargetText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  waterPillsCol: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  waterPill: {
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 8,
  },
  waterPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waterPillCustom: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: '#0284C7',
    marginBottom: 0,
  },
  waterPillCustomText: {
    color: '#0284C7',
  },
  workoutStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutMainValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  workoutSubLabel: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  weekDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayDotCol: {
    alignItems: 'center',
    marginLeft: 4,
  },
  dayDotCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotCircleDone: {
    backgroundColor: colors.secondary,
  },
  dayDotCircleToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayDotText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.neutral[600],
  },
  dayDotTextDone: {
    color: '#FFFFFF',
  },
  workoutFooterBar: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutFooterText: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  cardLinkText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  totalPrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  totalPrLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  totalPrWeight: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  prPreviewList: {
    marginBottom: 10,
  },
  prPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  prPreviewLeft: {
    flex: 1,
  },
  prExerciseTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  prCategoryText: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  prPreviewRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  prWeightNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  prQuickEditBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EEF2F6',
    marginTop: 2,
  },
  prQuickEditBtnText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  prFooterBar: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  pickerTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: colors.neutral[200],
  },
  cancelButtonText: {
    color: colors.neutral[700],
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});
