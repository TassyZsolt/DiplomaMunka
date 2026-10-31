import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../themes/tokens';
import { auth } from '../../../firebaseConfig';
import {
  WorkoutPlan,
  WorkoutExercise,
  ExerciseSet,
  getWorkoutPlans,
  getCustomWorkoutPlans,
  deleteCustomWorkoutPlan,
  saveWorkoutSession,
} from '../../services/workoutService';
import {
  ExerciseDoc,
  fetchAvailableExercises,
  deleteCustomExercise,
} from '../../services/exerciseService';
import {CustomExerciseModal} from '../../components/exercise/CustomExerciseModal';
import {ExercisePickerModal} from '../../components/exercise/ExercisePickerModal';
import {PlanCreatorModal} from '../../components/exercise/PlanCreatorModal';
import {ActiveWorkoutModal} from '../../components/exercise/ActiveWorkoutModal';

const ExerciseScreen = ({ navigation }: any) => {
  // 1. Fő nézet tab: 'custom' (Saját Terveim) | 'templates' (Sablonok)
  const [activeTab, setActiveTab] = useState<'custom' | 'templates'>('custom');

  // 2. Edzéstervek állapota
  const [templatePlans, setTemplatePlans] = useState<WorkoutPlan[]>([]);
  const [customPlans, setCustomPlans] = useState<WorkoutPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);

  // 3. Gyakorlat adatbázis (/exercises)
  const [exercisesDb, setExercisesDb] = useState<ExerciseDoc[]>([]);

  // 4. Aktív edzés folyamat (Workout Session modal)
  const [activeSessionVisible, setActiveSessionVisible] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);

  // 5. Új Egyéni Edzésterv Létrehozása Modal
  const [planModalVisible, setPlanModalVisible] = useState<boolean>(false);
 

  // 6. Gyakorlat választó (Exercise Picker Modal)
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'plan_creator' | 'active_workout'>('plan_creator');


  // 7. Új Egyéni Gyakorlat Modal
  const [customExModalVisible, setCustomExModalVisible] = useState<boolean>(false);

  // Adatok betöltése
  const loadAllData = async () => {
    try {
      setLoadingPlans(true);

      // Sablonok betöltése
      setTemplatePlans(getWorkoutPlans());

      // adatbázis betöltése
      const [userPlans, allExs] = await Promise.all([
        getCustomWorkoutPlans(),
        fetchAvailableExercises(auth.currentUser?.uid),
      ]);

      setCustomPlans(userPlans);
      setExercisesDb(allExs);
    } catch (err) {
      console.warn('Hiba az edzésadatok betöltésekor:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );


 //edzés indítása terv alapján
 const handleStartWorkout = (plan: WorkoutPlan) => {                                                                     
      setCurrentPlan(plan);
      setActiveSessionVisible(true);
    };                                                                                                                      

  // =========================================================================
  // GYAKORLAT VÁLASZTÓ ÉS HOZZÁADÁS (Exercise Picker)
  // =========================================================================
  const openExercisePicker = (mode: 'plan_creator' | 'active_workout') => {
    setPickerMode(mode);
    setPickerModalVisible(true);
  };

  const handleSelectExercise = (ex: ExerciseDoc) => {
     {
      const newWorkoutEx: WorkoutExercise = {
        exerciseId: ex.id,
        name: ex.name,
        trackingType: ex.trackingType,
        muscleGroup: ex.muscleGroup,
        sets: [
          {
            setNumber: 1,
            reps: ex.trackingType !== 'time_hold' ? 10 : undefined,
            weightKg: ex.trackingType === 'reps_and_weight' ? 60 : undefined,
            durationSeconds: ex.trackingType === 'time_hold' ? 45 : undefined,
            completed: false,
          },
        ],
      };
      setPickerModalVisible(false);
    }

    setPickerModalVisible(false);
  };


  // Egyéni gyakorlat törlése (csak a saját készítésű gyakorlatokra)
  const handleDeleteCustomExercise = (ex: ExerciseDoc) => {
    Alert.alert(
      'Gyakorlat törlése',
      `Biztosan törölni szeretnéd a(z) "${ex.name}" egyéni gyakorlatot?`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomExercise(ex.id);
              setExercisesDb((prev) => prev.filter((item) => item.id !== ex.id));
              Alert.alert('Sikeres törlés', `A(z) "${ex.name}" gyakorlat sikeresen törölve.`);
            } catch (err: any) {
              Alert.alert('Hiba', err.message || 'Nem sikerült törölni a gyakorlatot.');
            }
          },
        },
      ]
    );
  };

  // =========================================================================
  // EGYÉNI EDZÉSTERV LÉTREHOZÁSA ÉS TÖRLÉSE
  // =========================================================================
  

  const handleDeletePlan = (plan: WorkoutPlan) => {
    Alert.alert(
      'Edzésterv törlése',
      `Biztosan törölni szeretnéd a(z) "${plan.name}" saját edzéstervedet?`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomWorkoutPlan(plan.id);
            setCustomPlans((prev) => prev.filter((p) => p.id !== plan.id));
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      {/* ========================================================================= */}
      {/* 1. SEGMENTED CONTROL (Saját Terveim vs Sablonok) */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 2. LISTA NÉZET: SAJÁT TERVEK VAGY SABLONOK */}
      {/* ========================================================================= */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'custom' ? (
          /* --- SAJÁT TERVEIM TAB --- */
          <View>
            {/* Elsődleges CTA Gomb */}
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
                  Készíts egyedi edzéstervet a kedvenc gyakorlataiddal a fenti gombra kattintva, vagy válassz egyet az 5 beépített sablon közül!
                </Text>
              </View>
            ) : (
              customPlans.map((plan) => (
                <View key={plan.id} style={styles.planCard}>
                  <View style={styles.planCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.planCardEmoji}>🏋️</Text>
                        <Text style={styles.planCardTitle}>{plan.name}</Text>
                      </View>
                      <Text style={styles.planCardMeta}>
                        {plan.frequency || '3 nap / hét'} • {plan.category} • {plan.durationEst}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeletePlan(plan)}
                      style={styles.deletePlanBtn}
                    >
                      <Text style={styles.deletePlanBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.planCardDesc} numberOfLines={2}>
                    {plan.description}
                  </Text>

                  {/* Gyakorlatok összefoglaló chipek */}
                  <View style={styles.planChipsRow}>
                    {plan.exercises.slice(0, 4).map((ex, idx) => (
                      <View key={idx} style={styles.miniExChip}>
                        <Text style={styles.miniExChipText}>• {ex.name}</Text>
                      </View>
                    ))}
                    {plan.exercises.length > 4 && (
                      <View style={[styles.miniExChip, { backgroundColor: '#E2E8F0' }]}>
                        <Text style={[styles.miniExChipText, { color: colors.neutral[700] }]}>
                          +{plan.exercises.length - 4}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.openPlanBtn}
                    activeOpacity={0.85}
                    onPress={() => handleStartWorkout(plan)}
                  >
                    <Text style={styles.openPlanBtnText}>Megnyitás & Edzés Indítása ▶</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          /* --- SABLONOK TAB (5 Predefiniált edzésterv) --- */
          <View>
            <Text style={styles.templateHeaderNote}>
              Válassz egyet a fitnesz szakértők által összeállított, beépített edzéstervekből:
            </Text>

            {templatePlans.map((plan) => (
              <View key={plan.id} style={styles.planCard}>
                <View style={styles.planCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.planCardEmoji}>
                        {plan.id === 'ppl' ? '🏋️' : plan.id === 'beginner_full_body' ? '🏃' : '⚡'}
                      </Text>
                      <Text style={styles.planCardTitle}>{plan.name}</Text>
                    </View>
                    <Text style={styles.planCardMeta}>
                      {plan.frequency || '3 nap / hét'} • {plan.category} • {plan.durationEst}
                    </Text>
                  </View>
                  <View style={styles.templateBadge}>
                    <Text style={styles.templateBadgeText}>SABLON</Text>
                  </View>
                </View>

                <Text style={styles.planCardDesc}>{plan.description}</Text>

                {/* Gyakorlat chipek */}
                <View style={styles.planChipsRow}>
                  {plan.exercises.map((ex, idx) => (
                    <View key={idx} style={styles.miniExChip}>
                      <Text style={styles.miniExChipText}>
                        • {ex.name}{' '}
                        <Text style={{ fontSize: 10, color: colors.neutral[500] }}>
                          ({ex.defaultSets}x)
                        </Text>
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.openPlanBtn}
                  activeOpacity={0.85}
                  onPress={() => handleStartWorkout(plan)}
                >
                  <Text style={styles.openPlanBtnText}>Megnyitás & Edzés Indítása ▶</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>


      <ActiveWorkoutModal
        visible={activeSessionVisible}
        plan={currentPlan}
        availableExercises={exercisesDb}
        onClose={() => setActiveSessionVisible(false)}
        onWorkoutFinished={() => setActiveSessionVisible(false)}
        onOpenCreateCustomExercise={() => setCustomExModalVisible(true)}
        onDeleteCustomExercise={handleDeleteCustomExercise}
      />
      <PlanCreatorModal
        visible={planModalVisible}                                                                                            
      onClose={() => setPlanModalVisible(false)}                                                                            
      onPlanCreated={(newPlan) => setCustomPlans((prev) => [newPlan, ...prev])}                                             
      availableExercises={exercisesDb}                                                                                      
      onOpenCreateCustomExercise={() => setCustomExModalVisible(true)}                                                      
      onDeleteCustomExercise={handleDeleteCustomExercise}                                                                   
    />

      <ExercisePickerModal
        visible={pickerModalVisible}
        exercises={exercisesDb}
        onClose={() => setPickerModalVisible(false)}
        onSelectExercise={handleSelectExercise}
        onDeleteExercise={handleDeleteCustomExercise}
        onOpenCreateCustom={() => setCustomExModalVisible(true)}
      />

      <CustomExerciseModal
        visible={customExModalVisible}
        onClose={() => setCustomExModalVisible(false)}
        onExerciseCreated={(newEx) => setExercisesDb((prev) => [newEx, ...prev])}
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

  // 1. SEGMENTED CONTROL
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

  // PRIMARY CTA: Új Edzésterv
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

  // EDZÉSTERV KÁRTYA
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  planCardEmoji: {
    fontSize: 20,
  },
  planCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  planCardMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 3,
  },
  deletePlanBtn: {
    padding: 6,
  },
  deletePlanBtnText: {
    fontSize: 16,
  },
  templateBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  templateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  planCardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
    marginTop: 2,
  },
  planChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  miniExChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniExChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  openPlanBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPlanBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  templateHeaderNote: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
  },

  // EMPTY STATE
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

  // ==========================================
  // AKTÍV EDZÉS MODAL STÍLUSOK
  // ==========================================
  activeModalWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  activeWorkoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeWorkoutTimer: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '700',
    marginTop: 2,
  },
  closeActiveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActiveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  activeExercisesScroll: {
    flex: 1,
  },
  activeExCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  activeExHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeExTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  trackingTypeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trackingTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },

  // Sorozatok táblázata
  setHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  setHeaderCell: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  setRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginVertical: 2,
  },
  setRowItemCompleted: {
    backgroundColor: '#DCFCE7',
  },
  setIndexText: {
    width: 36,
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  setInputField: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginRight: 8,
  },
  checkSetBtn: {
    width: 44,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSetBtnDone: {
    backgroundColor: '#10B981',
  },
  checkSetText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '800',
  },
  checkSetTextDone: {
    color: '#FFFFFF',
  },
  exActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  addSetActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addSetActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  addMoreExLiveBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addMoreExLiveBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    height: 60,
  },
  finishWorkoutPrimaryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  finishWorkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ==========================================
  // PLAN CREATOR MODAL STÍLUSOK
  // ==========================================
  creatorModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  creatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  creatorHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  creatorCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  planExercisesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addExToPlanBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addExToPlanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyExBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyExText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  emptyExSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  addedExItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addedExName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  addedExMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  removeExBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeExBtnText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  savePlanPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  savePlanPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // ==========================================
  // EXERCISE PICKER MODAL STÍLUSOK
  // ==========================================
  pickerModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  pickerHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBarInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryFilterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: colors.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  createCustomExRowBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 8,
  },
  createCustomExRowText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  exListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  exListEnglishName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  exBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  exBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  exBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  exSelectArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  exActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  exDeleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ==========================================
  // CUSTOM EXERCISE DEFINITION MODAL
  // ==========================================
  customExOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  customExCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  customExHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customExTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  customExCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customExCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveCustomExBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveCustomExBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
