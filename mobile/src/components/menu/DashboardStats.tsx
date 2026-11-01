import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../themes/tokens';
import {
  DAILY_STEP_GOAL,
  calculateDistanceKm,
  calculateCaloriesKcal,
} from '../../services/stepService';
import { DEFAULT_DAILY_CALORIE_GOAL } from '../../services/dietService';

interface DashboardStatsProps {
  todaySteps: number;
  consumedCalories: number;
  todayWater: number;
  dailyStepGoal?: number;
  dailyCalorieGoal?: number;
  dailyWaterGoal?: number;
  onNavigateSteps: () => void;
  onNavigateStats: () => void;
  onOpenMealModal: () => void;
  onOpenWaterModal: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  todaySteps,
  consumedCalories,
  todayWater,
  dailyStepGoal = DAILY_STEP_GOAL,
  dailyCalorieGoal = DEFAULT_DAILY_CALORIE_GOAL,
  dailyWaterGoal = 2000,
  onNavigateSteps,
  onNavigateStats,
  onOpenMealModal,
  onOpenWaterModal,
}) => {
  const stepPercent = Math.min(100, Math.round((todaySteps / dailyStepGoal) * 100));
  const caloriePercent = Math.min(100, Math.round((consumedCalories / dailyCalorieGoal) * 100));
  const waterPercent = Math.min(100, Math.round((todayWater / dailyWaterGoal) * 100));

  // SVG kördiagram geometria számítások
  const ringSize = 74;
  const strokeWidth = 7;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const stepDashOffset = circumference - (stepPercent / 100) * circumference;

  return (
    <View style={styles.container}>
      {/* Szekció fejléc */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Napi haladás</Text>
          <Text style={styles.sectionSub}>Aktivitás és tápanyag áttekintés</Text>
        </View>
        <TouchableOpacity onPress={onNavigateStats}>
          <Text style={styles.viewAllLink}>Részletek ›</Text>
        </TouchableOpacity>
      </View>

      {/* Kiemelt Lépésszámláló Kártya */}
      <TouchableOpacity
        style={styles.stepProgressCard}
        activeOpacity={0.85}
        onPress={onNavigateSteps}
      >
        <View style={styles.stepCardLeft}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>👟 LÉPÉSSZÁMLÁLÓ</Text>
          </View>
          <View style={styles.stepNumbersRow}>
            <Text style={styles.stepValue}>{todaySteps.toLocaleString()}</Text>
            <Text style={styles.stepGoal}> / {dailyStepGoal.toLocaleString()} lépés</Text>
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

      {/* Két oszlopos kártyák: Kalória és Vízbevitel */}
      <View style={styles.dualStatsRow}>
        {/* Elfogasztott Kalória Kártya */}
        <TouchableOpacity
          style={[styles.smallStatCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}
          activeOpacity={0.85}
          onPress={onOpenMealModal}
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
            <Text style={styles.smallStatGoal}> / {dailyCalorieGoal} kcal</Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${caloriePercent}%`, backgroundColor: '#10B981' }]} />
          </View>
          <Text style={styles.smallStatFooter}>
            {Math.max(0, dailyCalorieGoal - consumedCalories)} kcal még elérhető
          </Text>
        </TouchableOpacity>

        {/* Vízfogyasztás Kártya */}
        <TouchableOpacity
          style={[styles.smallStatCard, { borderLeftColor: '#0284C7', borderLeftWidth: 4 }]}
          activeOpacity={0.85}
          onPress={onOpenWaterModal}
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
            <Text style={styles.smallStatGoal}> / {dailyWaterGoal} ml</Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${waterPercent}%`, backgroundColor: '#0284C7' }]} />
          </View>
          <Text style={styles.smallStatFooter}>Kattints a gyors naplózáshoz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral[900],
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
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
