import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Pedometer } from 'expo-sensors';
import { colors } from '../../themes/tokens';
import {
  DAILY_STEP_GOAL,
  checkPedometerAvailability,
  requestPedometerPermission,
  getTodaySteps,
  calculateDistanceKm,
  calculateCaloriesKcal,
  calculateActiveMinutes,
} from '../../services/stepService';

// 7 napos előzmény adatok (szemléltetéshez / drill-down elemzéshez)
const WEEKLY_STEP_DATA = [
  { day: 'H', date: 'Okt 05', steps: 8940, reached: false },
  { day: 'K', date: 'Okt 06', steps: 11250, reached: true },
  { day: 'Sze', date: 'Okt 07', steps: 10420, reached: true },
  { day: 'Cs', date: 'Okt 08', steps: 7890, reached: false },
  { day: 'P', date: 'Okt 09', steps: 12400, reached: true },
  { day: 'Szo', date: 'Okt 10', steps: 6420, reached: false, isToday: true },
  { day: 'V', date: 'Okt 11', steps: 0, reached: false },
];

// Óránkénti aktivitás minta (Mai nap bontása)
const HOURLY_STEPS = [
  { hour: '08h', steps: 950 },
  { hour: '10h', steps: 1400 },
  { hour: '12h', steps: 1100 },
  { hour: '14h', steps: 850 },
  { hour: '16h', steps: 1620 },
  { hour: '18h', steps: 500 },
];

const StepCounterScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'cadence'>('today');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pastSteps, setPastSteps] = useState<number>(0);
  const [liveSteps, setLiveSteps] = useState<number>(0);
  const [simulatedSteps, setSimulatedSteps] = useState<number>(0);
  const [statusNote, setStatusNote] = useState<string>('Érzékelő keresése...');

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setupPedometer = async () => {
      const available = await checkPedometerAvailability();
      setIsAvailable(available);

      if (!available) {
        setStatusNote('A készüléken nem található lépésszámláló hardver (szimulátor mód).');
        setSimulatedSteps(6420);
        return;
      }

      const permissionGranted = await requestPedometerPermission();
      setHasPermission(permissionGranted);

      if (!permissionGranted) {
        setStatusNote('A lépésszámlálóhoz szükséges engedély megtagadva.');
        return;
      }

      setStatusNote('🟢 Beépített alacsony fogyasztású érzékelő aktív');

      const todayCount = await getTodaySteps();
      setPastSteps(todayCount);

      subscription = Pedometer.watchStepCount((result) => {
        setLiveSteps(result.steps);
      });
    };

    setupPedometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const totalSteps = pastSteps + liveSteps + simulatedSteps;
  const progressPercent = Math.min(Math.round((totalSteps / DAILY_STEP_GOAL) * 100), 100);

  // SVG kördiagram
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const distance = calculateDistanceKm(totalSteps);
  const calories = calculateCaloriesKcal(totalSteps);
  const activeMinutes = calculateActiveMinutes(totalSteps);
  const cadence = activeMinutes > 0 ? Math.round(totalSteps / activeMinutes) : 95; // lépés / perc

  // 7 napos számítások
  const past6DaysSum = WEEKLY_STEP_DATA.slice(0, 5).reduce((s, d) => s + d.steps, 0) + totalSteps;
  const weeklyAverage = Math.round(past6DaysSum / 6);

  const handleAddTestSteps = (amount: number) => {
    setSimulatedSteps((prev) => prev + amount);
  };

  const handleResetTestSteps = () => {
    setSimulatedSteps(0);
    setLiveSteps(0);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Lépésszámláló</Text>
      <Text style={styles.subtitle}>Napi aktivitás, óránkénti bontás és 7 napos előzmény</Text>

      {/* Állapot jelvény */}
      <View
        style={[
          styles.statusBadge,
          isAvailable && hasPermission ? styles.badgeSuccess : styles.badgeWarning,
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            isAvailable && hasPermission ? styles.badgeSuccessText : styles.badgeWarningText,
          ]}
        >
          {statusNote}
        </Text>
      </View>

      {/* Szegmensválasztó (Daily vs Historical View in Drill-down) */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'today' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'today' && styles.segmentBtnTextActive]}>
            Mai Nap
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'weekly' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'weekly' && styles.segmentBtnTextActive]}>
            7 Napos Előzmény
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'cadence' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('cadence')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'cadence' && styles.segmentBtnTextActive]}>
            Részletes Metrikák
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. Mai Nap fül */}
      {activeTab === 'today' && (
        <View style={styles.tabContent}>
          {/* Fő Kördiagram kártya */}
          <View style={styles.mainCard}>
            <View style={styles.ringContainer}>
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={colors.neutral[200]}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={progressPercent >= 100 ? colors.secondary : colors.primary}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              </Svg>

              <View style={styles.centerTextContainer}>
                <Text style={styles.stepIcon}>👟</Text>
                <Text style={styles.totalStepsText}>{totalSteps.toLocaleString('hu-HU')}</Text>
                <View style={styles.divider} />
                <Text style={styles.goalText}>Cél: {DAILY_STEP_GOAL.toLocaleString('hu-HU')}</Text>
                <Text style={styles.percentText}>{progressPercent}%</Text>
              </View>
            </View>

            {progressPercent >= 100 ? (
              <View style={styles.celebrationBox}>
                <Text style={styles.celebrationText}>🎉 Gratulálunk! Elérted a mai kitűzött célt!</Text>
              </View>
            ) : (
              <Text style={styles.remainingText}>
                Még {(DAILY_STEP_GOAL - totalSteps > 0 ? DAILY_STEP_GOAL - totalSteps : 0).toLocaleString('hu-HU')} lépés a célhoz
              </Text>
            )}
          </View>

          {/* Óránkénti aktivitás diagram kártya */}
          <View style={styles.hourlyCard}>
            <Text style={styles.hourlyCardTitle}>Óránkénti lépéseloszlás ma</Text>
            <View style={styles.hourlyChartRow}>
              {HOURLY_STEPS.map((h, i) => {
                const maxH = 1800;
                const barHeight = Math.max(12, Math.min(100, (h.steps / maxH) * 100));
                return (
                  <View key={i} style={styles.hourlyBarCol}>
                    <Text style={styles.hourlyStepsCount}>{h.steps}</Text>
                    <View style={styles.hourlyBarTrack}>
                      <View style={[styles.hourlyBarFill, { height: `${barHeight}%` }]} />
                    </View>
                    <Text style={styles.hourlyLabel}>{h.hour}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* 2. 7 Napos Előzmény fül */}
      {activeTab === 'weekly' && (
        <View style={styles.tabContent}>
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyCardHeader}>
              <View>
                <Text style={styles.weeklyCardTitle}>7 napos átlag</Text>
                <Text style={styles.weeklyAverageNumber}>
                  {weeklyAverage.toLocaleString('hu-HU')} lépés / nap
                </Text>
              </View>
              <View style={styles.weeklyBadge}>
                <Text style={styles.weeklyBadgeText}>3/6 Cél elérve</Text>
              </View>
            </View>

            <View style={styles.goalLineRow}>
              <View style={styles.goalLine} />
              <Text style={styles.goalLineText}>10k Napi cél</Text>
            </View>

            {/* 7 napos oszlopdiagram */}
            <View style={styles.barsContainer}>
              {WEEKLY_STEP_DATA.map((item, idx) => {
                const heightPercent = Math.min(100, Math.max(10, (item.steps / 13000) * 100));
                return (
                  <View key={idx} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: item.isToday
                              ? colors.primary
                              : item.reached
                              ? colors.secondary
                              : '#CBD5E1',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barDayText, item.isToday && styles.barDayTextToday]}>
                      {item.day}
                    </Text>
                    <Text style={styles.barNumberText}>
                      {item.steps > 0 ? `${Math.round(item.steps / 1000)}k` : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.trendCard}>
            <Text style={styles.trendTitle}>📈 Heti trend elemzés</Text>
            <Text style={styles.trendText}>
              Az elmúlt 7 napban összesen {past6DaysSum.toLocaleString('hu-HU')} lépést tettél meg,
              amely kb. {((past6DaysSum * 0.75) / 1000).toFixed(1)} km távolságnak felel meg!
              A legaktívabb napod a péntek volt (12 400 lépés).
            </Text>
          </View>
        </View>
      )}

      {/* 3. Részletes Metrikák fül (Kadencia, távolság, kalória) */}
      {activeTab === 'cadence' && (
        <View style={styles.tabContent}>
          <View style={styles.cadenceGrid}>
            <View style={styles.cadenceCard}>
              <Text style={styles.cadenceIcon}>⚡</Text>
              <Text style={styles.cadenceValue}>{cadence}</Text>
              <Text style={styles.cadenceUnit}>lépés / perc</Text>
              <Text style={styles.cadenceSubtext}>Átlagos lépésfrekvencia</Text>
            </View>

            <View style={styles.cadenceCard}>
              <Text style={styles.cadenceIcon}>📏</Text>
              <Text style={styles.cadenceValue}>0.75 m</Text>
              <Text style={styles.cadenceUnit}>átlagos lépéshossz</Text>
              <Text style={styles.cadenceSubtext}>Személyre szabott becslés</Text>
            </View>

            <View style={styles.cadenceCard}>
              <Text style={styles.cadenceIcon}>⏱️</Text>
              <Text style={styles.cadenceValue}>{activeMinutes}</Text>
              <Text style={styles.cadenceUnit}>aktív perc ma</Text>
              <Text style={styles.cadenceSubtext}>Cél: 60 perc séta</Text>
            </View>

            <View style={styles.cadenceCard}>
              <Text style={styles.cadenceIcon}>🔥</Text>
              <Text style={styles.cadenceValue}>{calories}</Text>
              <Text style={styles.cadenceUnit}>aktív kcal ma</Text>
              <Text style={styles.cadenceSubtext}>Természetes mozgásból</Text>
            </View>
          </View>
        </View>
      )}

      {/* Általános metrikák rács */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>📍</Text>
          <Text style={styles.metricValue}>{distance}</Text>
          <Text style={styles.metricUnit}>kilométer</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>🔥</Text>
          <Text style={styles.metricValue}>{calories}</Text>
          <Text style={styles.metricUnit}>kcal elégetve</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>⏱️</Text>
          <Text style={styles.metricValue}>{activeMinutes}</Text>
          <Text style={styles.metricUnit}>aktív perc</Text>
        </View>
      </View>

    

      {/* Tesztvezérlő */}
      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Tesztvezérlő (Szimulátor / Asztali teszt)</Text>
        <View style={styles.testButtonsRow}>
          <TouchableOpacity style={styles.testButton} onPress={() => handleAddTestSteps(500)}>
            <Text style={styles.testButtonText}>+500 lépés</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={() => handleAddTestSteps(1000)}>
            <Text style={styles.testButtonText}>+1000 lépés</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.testButton, styles.testResetButton]} onPress={handleResetTestSteps}>
            <Text style={styles.testResetButtonText}>Alaphelyzet</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vissza gomb */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Vissza az áttekintéshez</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default StepCounterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 4,
    marginBottom: 14,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSuccess: {
    backgroundColor: '#E8F8F0',
  },
  badgeSuccessText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  badgeWarning: {
    backgroundColor: '#FFF4E5',
  },
  badgeWarningText: {
    color: '#D97706',
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    width: '100%',
  },
  mainCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 18,
  },
  ringContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  totalStepsText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: colors.neutral[300],
    marginVertical: 4,
  },
  goalText: {
    fontSize: 13,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  celebrationBox: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  celebrationText: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  remainingText: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 12,
  },
  hourlyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  hourlyCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 14,
  },
  hourlyChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 4,
  },
  hourlyBarCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  hourlyStepsCount: {
    fontSize: 10,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  hourlyBarTrack: {
    width: 14,
    height: 70,
    backgroundColor: colors.neutral[200],
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  hourlyBarFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 7,
  },
  hourlyLabel: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 6,
    fontWeight: '500',
  },
  weeklyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  weeklyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  weeklyCardTitle: {
    fontSize: 13,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  weeklyAverageNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  weeklyBadge: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weeklyBadgeText: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  goalLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  goalLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  goalLineText: {
    fontSize: 11,
    color: colors.neutral[400],
    marginLeft: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginTop: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 18,
    height: 95,
    backgroundColor: colors.neutral[200],
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 9,
  },
  barDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
    marginTop: 6,
  },
  barDayTextToday: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  barNumberText: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
  },
  trendCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 18,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284C7',
    marginBottom: 4,
  },
  trendText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
  },
  cadenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  cadenceCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  cadenceIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  cadenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  cadenceUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  cadenceSubtext: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },
  metricCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  metricUnit: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D0E4FF',
    marginBottom: 18,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 12,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  testSection: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  testTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
    marginBottom: 10,
    textAlign: 'center',
  },
  testButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  testButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  testResetButton: {
    backgroundColor: colors.neutral[300],
  },
  testResetButtonText: {
    color: colors.neutral[800],
  },
  backButton: {
    width: '100%',
    backgroundColor: colors.neutral[200],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  backButtonText: {
    color: colors.neutral[800],
    fontSize: 15,
    fontWeight: 'bold',
  },
});
