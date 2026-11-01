import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { colors } from '../../themes/tokens';
import { useMenuData } from '../../hooks/useMenuData';
import { getTodayConsumedCalories } from '../../services/dietService';
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
  const {
    userName,
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
    handleLogout,
  } = useMenuData();

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
          onLogout={() => handleLogout(navigation)}
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
