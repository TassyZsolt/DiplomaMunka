import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../themes/tokens';
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
      {/* 1. SEGMENTED CONTROL (Saját Terveim vs Sablonok) */}
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

      {/* 2. LISTA NÉZET */}
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

      {/* MODALS */}
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
    backgroundColor: '#F8FAFC',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: colors.neutral[900],
    fontWeight: '800',
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  createPlanPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  createPlanPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  templateHeaderNote: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
}); 