import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, borderRadius, shadows } from '../../themes/tokens';
import {
  DAILY_STEP_GOAL,
  calculateDistanceKm,
} from '../../services/stepService';
import { useStepTracker } from '../../context/StepTrackerContext';

const StepCounterScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'cadence'>('today');

  // Globális, idempotensen lépéskövető adatok
  const {
    todaySteps,
    dailyGoal,
    distanceKm,
    caloriesKcal,
    activeMinutes,
    cadence,
    isAvailable,
    hasPermission,
    statusNote,
    weeklyHistory,
    hourlyBreakdown,
    addSimulatedSteps,
    resetSimulatedSteps,
  } = useStepTracker();

  const totalSteps = todaySteps;
  const progressPercent = Math.min(Math.round((totalSteps / dailyGoal) * 100), 100);

  // SVG kördiagram
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // 7 napos statiszika
  const totalWeeklySteps = weeklyHistory.reduce((s, d) => s + d.steps, 0);
  const weeklyAverage = weeklyHistory.length > 0 ? Math.round(totalWeeklySteps / weeklyHistory.length) : 0;
  const reachedGoalsCount = weeklyHistory.filter((d) => d.reached).length;
  const maxWeeklySteps = Math.max(...weeklyHistory.map((d) => d.steps), 10000);
  const mostActiveDay = weeklyHistory.reduce(
    (max, d) => (d.steps > max.steps ? d : max),
    weeklyHistory[0] || { day: 'Ma', steps: 0 }
  );
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Lépésszámláló</Text>
      <Text style={styles.subtitle}>Napi aktivitás, óránkénti bontás és 7 napos előzmény</Text>

      
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

      
      {activeTab === 'today' && (
        <View style={styles.tabContent}>
          
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

          
          <View style={styles.hourlyCard}>
            <Text style={styles.hourlyCardTitle}>Óránkénti lépéseloszlás ma</Text>
            <View style={styles.hourlyChartRow}>
              {hourlyBreakdown.map((h, i) => {
                const maxH = Math.max(...hourlyBreakdown.map((item) => item.steps), 1000);
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
                <Text style={styles.weeklyBadgeText}>
                  {reachedGoalsCount}/{weeklyHistory.length} Cél elérve
                </Text>
              </View>
            </View>

            <View style={styles.goalLineRow}>
              <View style={styles.goalLine} />
              <Text style={styles.goalLineText}>10k Napi cél</Text>
            </View>

            
            <View style={styles.barsContainer}>
              {weeklyHistory.map((item, idx) => {
                const heightPercent = Math.min(
                  100,
                  Math.max(10, (item.steps / (maxWeeklySteps * 1.15)) * 100)
                );
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
                              : colors.slate[300],
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
              Az elmúlt 7 napban összesen {totalWeeklySteps.toLocaleString('hu-HU')} lépést tettél meg,
              amely kb. {calculateDistanceKm(totalWeeklySteps)} km távolságnak felel meg!
              {mostActiveDay.steps > 0
                ? ` A legaktívabb napod: ${mostActiveDay.day} (${mostActiveDay.steps.toLocaleString('hu-HU')} lépés).`
                : ''}
            </Text>
          </View>
        </View>
      )}

      
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
              <Text style={styles.cadenceValue}>{caloriesKcal}</Text>
              <Text style={styles.cadenceUnit}>aktív kcal ma</Text>
              <Text style={styles.cadenceSubtext}>Természetes mozgásból</Text>
            </View>
          </View>
        </View>
      )}

      
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>📍</Text>
          <Text style={styles.metricValue}>{distanceKm}</Text>
          <Text style={styles.metricUnit}>kilométer</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>🔥</Text>
          <Text style={styles.metricValue}>{caloriesKcal}</Text>
          <Text style={styles.metricUnit}>kcal elégetve</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>⏱️</Text>
          <Text style={styles.metricValue}>{activeMinutes}</Text>
          <Text style={styles.metricUnit}>aktív perc</Text>
        </View>
      </View>

    

      
      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Tesztvezérlő (Szimulátor / Védési bemutató)</Text>
        <View style={styles.testButtonsRow}>
          <TouchableOpacity style={styles.testButton} onPress={() => addSimulatedSteps(500)}>
            <Text style={styles.testButtonText}>+500 lépés</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={() => addSimulatedSteps(1000)}>
            <Text style={styles.testButtonText}>+1000 lépés</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.testButton, styles.testResetButton]} onPress={resetSimulatedSteps}>
            <Text style={styles.testResetButtonText}>Alaphelyzet</Text>
          </TouchableOpacity>
        </View>
      </View>

      
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
    backgroundColor: colors.successLight,
  },
  badgeSuccessText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  badgeWarning: {
    backgroundColor: colors.slate[100],
  },
  badgeWarningText: {
    color: colors.warning,
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
    color: colors.white,
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
    ...shadows.card,
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
    backgroundColor: colors.successLight,
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
    backgroundColor: colors.successLight,
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
    backgroundColor: colors.slate[300],
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
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 18,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  trendText: {
    fontSize: 12,
    color: colors.primaryDark,
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
    ...shadows.sm,
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
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorderLight,
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
    color: colors.white,
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
