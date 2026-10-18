import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../themes/tokens';
import {
  WorkoutSession,
  WeeklyStats,
  getWorkoutSessions,
  getWeeklyWorkoutStats,
} from '../../services/workoutService';

const WorkoutProgressScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'volume' | 'history'>('calendar');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const loadedSessions = await getWorkoutSessions();
      setSessions(loadedSessions);
      const computedStats = getWeeklyWorkoutStats(loadedSessions);
      setStats(computedStats);
    } catch (e) {
      console.warn('Hiba az edzés statisztikák betöltésekor:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const formatHoursMinutes = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} perc`;
    return `${h} óra ${m > 0 ? `${m} p` : ''}`;
  };

  if (loading || !stats) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Edzésadatok betöltése...</Text>
      </View>
    );
  }

  const weekDays = stats.weekDays;
  const completedGoalPercent = Math.min(100, Math.round((stats.completedCount / 5) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Edzések & Terhelés</Text>
      <Text style={styles.subtitle}>Valós heti konzisztencia, izomcsoport-megoszlás és napló</Text>

      {/* Gyors Edzés Indítás gomb */}
      <TouchableOpacity
        style={styles.startWorkoutBanner}
        onPress={() => navigation.navigate('Exercise')}
      >
        <View style={styles.startBannerLeft}>
          <Text style={styles.startBannerEmoji}>🏋️‍♂️</Text>
          <View>
            <Text style={styles.startBannerTitle}>Új edzés rögzítése</Text>
            <Text style={styles.startBannerSubtitle}>Válassz edzéstervet és indítsd el</Text>
          </View>
        </View>
        <Text style={styles.startBannerBtnText}>Indítás →</Text>
      </TouchableOpacity>

      {/* Részletes szegmensválasztó */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'calendar' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'calendar' && styles.segmentBtnTextActive]}>
            Heti Naptár
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'volume' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('volume')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'volume' && styles.segmentBtnTextActive]}>
            Izomterhelés
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'history' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'history' && styles.segmentBtnTextActive]}>
            Edzésnapló ({sessions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. Heti Naptár fül */}
      {activeTab === 'calendar' && (
        <View style={styles.tabContent}>
          {/* Heti teljesítmény kártya */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryCardTitle}>HETI CÉL TELJESÜLÉSE</Text>
                <Text style={styles.summaryCardHighlight}>
                  {stats.completedCount} / 5 edzés teljesítve
                </Text>
              </View>
              <View style={styles.percentBadge}>
                <Text style={styles.percentBadgeText}>{completedGoalPercent}%</Text>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completedGoalPercent}%` }]} />
            </View>

            {/* Heti napok rácsa */}
            <View style={styles.daysRow}>
              {weekDays.map((day, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dayBox,
                    day.isToday && styles.dayBoxToday,
                    day.status === 'completed' && styles.dayBoxCompleted,
                  ]}
                >
                  <Text style={[styles.dayTextName, day.isToday && styles.dayTextToday]}>
                    {day.dayName}
                  </Text>
                  <Text style={[styles.dayTextNumber, day.isToday && styles.dayTextToday]}>
                    {day.dayNumber}
                  </Text>
                  <Text style={styles.dayStatusIcon}>
                    {day.status === 'completed' ? '✓' : day.status === 'planned' ? '⏳' : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Heti statisztikai összegző */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statColValue}>{formatHoursMinutes(stats.totalTimeMinutes)}</Text>
              <Text style={styles.statColLabel}>Összes edzésidő</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statColValue}>{stats.avgDurationMinutes} perc</Text>
              <Text style={styles.statColLabel}>Átlagos időtartam</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statColValue}>
                {stats.totalVolumeKg.toLocaleString('hu-HU')} kg
              </Text>
              <Text style={styles.statColLabel}>Heti összvolumen</Text>
            </View>
          </View>

          {/* A hét edzései időrendben */}
          <Text style={styles.sectionHeader}>A hét részletes beosztása</Text>
          {weekDays.map((day, idx) => (
            <View key={idx} style={styles.scheduleItem}>
              <View style={styles.scheduleDotWrapper}>
                <View
                  style={[
                    styles.scheduleDot,
                    day.status === 'completed'
                      ? styles.scheduleDotCompleted
                      : day.status === 'planned'
                      ? styles.scheduleDotPlanned
                      : styles.scheduleDotRest,
                  ]}
                />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>
                  {day.dayName} • {day.title || 'Pihenőnap'}
                </Text>
                <Text style={styles.scheduleSubtext}>
                  {day.status === 'completed'
                    ? `Teljesítve (${day.duration})`
                    : day.status === 'planned'
                    ? 'Mai nap - készen állsz az edzésre?'
                    : 'Regenerációs pihenőnap'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 2. Izomterhelés fül */}
      {activeTab === 'volume' && (
        <View style={styles.tabContent}>
          <View style={styles.volumeCard}>
            <Text style={styles.volumeCardTitle}>Heti izomcsoport-megoszlás</Text>
            <Text style={styles.volumeCardSubtitle}>
              Valós sorozatok száma és aránya az elvégzett edzések alapján
            </Text>

            {stats.muscleVolumes.map((item, idx) => (
              <View key={idx} style={styles.volumeItem}>
                <View style={styles.volumeItemHeader}>
                  <Text style={styles.volumeGroupName}>{item.group}</Text>
                  <Text style={styles.volumeSetsText}>
                    {item.sets} sorozat ({item.percentage}%)
                  </Text>
                </View>
                <View style={styles.volumeBarBg}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      { width: `${Math.max(5, item.percentage)}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>💡 Terhelés Elemzés</Text>
            <Text style={styles.recommendationText}>
              A rögzített edzéseid alapján a terhelésed kiegyensúlyozott. Új edzés befejezésekor a sorozatok
              automatikusan újraosztják a heti arányokat.
            </Text>
          </View>
        </View>
      )}

      {/* 3. Edzésnapló fül */}
      {activeTab === 'history' && (
        <View style={styles.tabContent}>
          {sessions.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  <Text style={styles.logDate}>{log.date}</Text>
                </View>
                <View style={styles.logBadge}>
                  <Text style={styles.logBadgeText}>{log.durationMinutes} perc</Text>
                </View>
              </View>

              <Text style={styles.logVolumeText}>
                Összvolumen: {log.totalVolumeKg.toLocaleString('hu-HU')} kg • {log.totalSets} sorozat
              </Text>

              {log.notes ? (
                <Text style={styles.logNoteText}>💬 "{log.notes}"</Text>
              ) : null}

              <View style={styles.exerciseList}>
                {log.exercises.map((ex, exIdx) => {
                  const completedCount = ex.sets.filter((s) => s.completed).length;
                  const maxW = Math.max(0, ...ex.sets.map((s) => s.weightKg || 0));
                  return (
                    <View key={exIdx} style={styles.exerciseListItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.exerciseListText}>
                        {ex.name}: {completedCount} széria{maxW > 0 ? ` (max ${maxW} kg)` : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Vissza gomb */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Vissza az áttekintéshez</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default WorkoutProgressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.neutral[600],
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
    marginBottom: 16,
  },
  startWorkoutBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EBF3FF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  startBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startBannerEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  startBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  startBannerSubtitle: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 1,
  },
  startBannerBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
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
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryCardTitle: {
    fontSize: 11,
    letterSpacing: 1.1,
    color: '#94A3B8',
    fontWeight: '700',
  },
  summaryCardHighlight: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  percentBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentBadgeText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  dayBoxToday: {
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  dayBoxCompleted: {
    backgroundColor: '#1E3A8A',
  },
  dayTextName: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dayTextNumber: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  dayTextToday: {
    color: '#38BDF8',
  },
  dayStatusIcon: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statColValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  statColLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.neutral[300],
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  scheduleDotWrapper: {
    marginRight: 12,
  },
  scheduleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scheduleDotCompleted: {
    backgroundColor: colors.secondary,
  },
  scheduleDotPlanned: {
    backgroundColor: colors.primary,
  },
  scheduleDotRest: {
    backgroundColor: colors.neutral[400],
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  scheduleSubtext: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  volumeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  volumeCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
  },
  volumeCardSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
    marginBottom: 16,
  },
  volumeItem: {
    marginBottom: 14,
  },
  volumeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  volumeGroupName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  volumeSetsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.neutral[600],
  },
  volumeBarBg: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#15803D',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  logDate: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },
  logBadge: {
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: 'bold',
  },
  logVolumeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  logNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.neutral[600],
    marginBottom: 8,
  },
  exerciseList: {
    marginTop: 4,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.neutral[500],
    marginRight: 6,
  },
  exerciseListText: {
    fontSize: 13,
    color: colors.neutral[700],
  },
  backButton: {
    backgroundColor: colors.neutral[200],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButtonText: {
    color: colors.neutral[800],
    fontSize: 15,
    fontWeight: 'bold',
  },
});
