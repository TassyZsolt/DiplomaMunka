import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../themes/tokens';
import { WorkoutPlan } from '../../services/workoutService';
import { useExerciseData } from '../../hooks/useExerciseData';
import { WorkoutPlanCard } from '../../components/exercise/WorkoutPlanCard';
import { ActiveWorkoutModal } from '../../components/exercise/ActiveWorkoutModal';
import { PlanCreatorModal } from '../../components/exercise/PlanCreatorModal';
import { CustomExerciseModal } from '../../components/exercise/CustomExerciseModal';

const ExerciseScreen = () => {
  const [activeTab, setActiveTab] = useState<'custom' | 'templates'>('custom');
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [activeSessionVisible, setActiveSessionVisible] = useState<boolean>(false);
  const [planModalVisible, setPlanModalVisible] = useState<boolean>(false);
  const [customExModalVisible, setCustomExModalVisible] = useState<boolean>(false);

  const {
    templatePlans,
    customPlans,
    loadingPlans,
    exercisesDb,
    addCustomPlan,
    addCustomExercise,
    handleDeletePlan,
    handleDeleteCustomExercise,
  } = useExerciseData();

  const handleStartWorkout = (plan: WorkoutPlan) => {
    setSelectedPlan(plan);
    setActiveSessionVisible(true);
  };

  return (
    <View style={styles.container}>

      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'custom' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('custom')}
        >
          <Text style={[styles.segmentText, activeTab === 'custom' && styles.segmentTextActive]}>
            Saját Terveim ({customPlans.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'templates' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.segmentText, activeTab === 'templates' && styles.segmentTextActive]}>
            Sablonok ({templatePlans.length})
          </Text>
        </TouchableOpacity>
      </View>


      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {activeTab === 'custom' ? (
          <View>
            <TouchableOpacity
              style={styles.createPlanPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => setPlanModalVisible(true)}
            >
              <Text style={styles.createPlanPrimaryBtnText}>+ Új Edzésterv Létrehozása</Text>
            </TouchableOpacity>

            {loadingPlans ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
            ) : customPlans.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>Még nincsenek saját edzésterveid</Text>
                <Text style={styles.emptySubtitle}>
                  Készíts egyedi edzéstervet a kedvenc gyakorlataiddal a fenti gombra kattintva, vagy válassz egyet a
                  beépített sablonok közül!
                </Text>
              </View>
            ) : (
              customPlans.map((plan) => (
                <WorkoutPlanCard
                  key={plan.id}
                  plan={plan}
                  onStartWorkout={handleStartWorkout}
                  onDeletePlan={handleDeletePlan}
                />
              ))
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.templateHeaderNote}>
              Válassz egyet a fitnesz szakértők által összeállított, beépített edzéstervekből:
            </Text>

            {templatePlans.map((plan) => (
              <WorkoutPlanCard
                key={plan.id}
                plan={plan}
                onStartWorkout={handleStartWorkout}
              />
            ))}
          </View>
        )}
      </ScrollView>


      <ActiveWorkoutModal
        visible={activeSessionVisible}
        plan={selectedPlan}
        availableExercises={exercisesDb}
        onClose={() => setActiveSessionVisible(false)}
        onWorkoutFinished={() => setActiveSessionVisible(false)}
        onOpenCreateCustomExercise={() => setCustomExModalVisible(true)}
        onDeleteCustomExercise={handleDeleteCustomExercise}
      />

      <PlanCreatorModal
        visible={planModalVisible}
        onClose={() => setPlanModalVisible(false)}
        onPlanCreated={addCustomPlan}
        availableExercises={exercisesDb}
        onOpenCreateCustomExercise={() => setCustomExModalVisible(true)}
        onDeleteCustomExercise={handleDeleteCustomExercise}
      />

      <CustomExerciseModal
        visible={customExModalVisible}
        onClose={() => setCustomExModalVisible(false)}
        onExerciseCreated={addCustomExercise}
      />
    </View>
  );
};

export default ExerciseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginTop: 14,
    marginBottom: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  scrollList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  createPlanPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.button,
  },
  createPlanPrimaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  templateHeaderNote: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
}); 