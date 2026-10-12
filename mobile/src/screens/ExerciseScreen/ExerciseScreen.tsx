import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { colors } from '../../themes/tokens';
import {
  WorkoutPlan,
  WorkoutExercise,
  ExerciseSet,
  getWorkoutPlans,
  saveWorkoutSession,
} from '../../services/workoutService';

const ExerciseScreen = ({ navigation }: any) => {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Aktív edzés állapot
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [workoutTimerSeconds, setWorkoutTimerSeconds] = useState<number>(0);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setPlans(getWorkoutPlans());
  }, []);

  // Időzítő az aktív edzés alatt
  useEffect(() => {
    let interval: any = null;
    if (modalVisible) {
      interval = setInterval(() => {
        setWorkoutTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
      setWorkoutTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [modalVisible]);

  // Edzés indítása egy kiválasztott tervből
  const handleStartWorkout = (plan: WorkoutPlan) => {
    setActivePlan(plan);
    const initialExercises: WorkoutExercise[] = plan.exercises.map((ex) => {
      const sets: ExerciseSet[] = [];
      for (let i = 1; i <= ex.defaultSets; i++) {
        sets.push({
          setNumber: i,
          weightKg: ex.defaultWeight,
          reps: ex.defaultReps,
          completed: false,
        });
      }
      return {
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets,
      };
    });

    setWorkoutExercises(initialExercises);
    setWorkoutNotes('');
    setWorkoutTimerSeconds(0);
    setModalVisible(true);
  };

  // Sorozat állapotának váltása (pipálás)
  const handleToggleSetComplete = (exIndex: number, setIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const targetSet = updated[exIndex].sets[setIndex];
      targetSet.completed = !targetSet.completed;
      return updated;
    });
  };

  // Súly / Ismétlés módosítása
  const handleUpdateSetValue = (
    exIndex: number,
    setIndex: number,
    field: 'weightKg' | 'reps',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exIndex].sets[setIndex][field] = num;
      return updated;
    });
  };

  // Új sorozat hozzáadása a gyakorlathoz
  const handleAddSet = (exIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const ex = updated[exIndex];
      const lastSet = ex.sets[ex.sets.length - 1];
      ex.sets.push({
        setNumber: ex.sets.length + 1,
        weightKg: lastSet ? lastSet.weightKg : 60,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      });
      return updated;
    });
  };

  // Edzés befejezése és mentése
  const handleFinishWorkout = async () => {
    const completedSetsCount = workoutExercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );

    if (completedSetsCount === 0) {
      Alert.alert(
        'Figyelmeztetés',
        'Még egyetlen sorozatot sem jelöltél be teljesítettként (zöld pipa). Biztosan befejezed?',
        [
          { text: 'Még folytatom', style: 'cancel' },
          { text: 'Befejezés', onPress: () => doSaveWorkout() },
        ]
      );
      return;
    }

    doSaveWorkout();
  };

  const doSaveWorkout = async () => {
    try {
      setIsSaving(true);
      const durationMin = Math.max(1, Math.round(workoutTimerSeconds / 60));
      const savedSession = await saveWorkoutSession({
        title: activePlan ? activePlan.name : 'Egyéni edzés',
        planId: activePlan?.id,
        date: new Date().toISOString().split('T')[0],
        durationMinutes: durationMin,
        exercises: workoutExercises,
        notes: workoutNotes,
      });

      setModalVisible(false);
      Alert.alert(
        '🎉 Edzés Sikeresen Rögzítve!',
        `Időtartam: ${savedSession.durationMinutes} perc\nMegmozgatott súly: ${savedSession.totalVolumeKg.toLocaleString('hu-HU')} kg\nElvégzett sorozatok: ${savedSession.totalSets}`,
        [
          { text: 'Rendben' },
          {
            text: 'Statisztika megtekintése',
            onPress: () => navigation.navigate('WorkoutProgress'),
          },
        ]
      );
    } catch (e) {
      Alert.alert('Hiba', 'Nem sikerült menteni az edzést.');
    } finally {
      setIsSaving(false);
    }
  };

  // Idő formázása mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Edzéstervek & Tréning</Text>
      <Text style={styles.subtitle}>
        Válassz egy edzéstervet, kövesd a sorozatokat és rögzítsd a valós edzéseidet!
      </Text>

      {/* Gyors ugrás a haladási statisztikákhoz */}
      <TouchableOpacity
        style={styles.statsBanner}
        onPress={() => navigation.navigate('WorkoutProgress')}
      >
        <View style={styles.statsBannerLeft}>
          <Text style={styles.statsBannerEmoji}>📊</Text>
          <View>
            <Text style={styles.statsBannerTitle}>Heti Edzésnapló & Terhelés</Text>
            <Text style={styles.statsBannerSubtitle}>Naptár és izomcsoport statisztikák</Text>
          </View>
        </View>
        <Text style={styles.statsBannerArrow}>›</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Elérhető edzéstervek:</Text>

      {/* Edzéstervek kártyái */}
      {plans.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <View style={styles.planCardHeader}>
            <View style={styles.planTitleCol}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planCategory}>{plan.category}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationBadgeText}>⏱️ {plan.durationEst}</Text>
            </View>
          </View>

          <Text style={styles.planDescription}>{plan.description}</Text>

          {/* Gyakorlatok miniatűr listája */}
          <View style={styles.exercisePreviewBox}>
            <Text style={styles.exercisePreviewHeader}>Gyakorlatok:</Text>
            {plan.exercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.exercisePreviewRow}>
                <Text style={styles.exerciseDot}>•</Text>
                <Text style={styles.exerciseNameText}>{ex.name}</Text>
                <Text style={styles.exerciseSetsText}>
                  {ex.defaultSets}x{ex.defaultReps} ({ex.defaultWeight} kg)
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.startWorkoutButton}
            onPress={() => handleStartWorkout(plan)}
          >
            <Text style={styles.startWorkoutButtonText}>▶ Edzés Indítása</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* ========================================================
          AKTÍV EDZÉS MODAL
      ======================================================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          Alert.alert('Kilépés', 'Biztosan megszakítod az edzést mentés nélkül?', [
            { text: 'Folytatás', style: 'cancel' },
            { text: 'Kilépés', onPress: () => setModalVisible(false) },
          ]);
        }}
      >
        <View style={styles.activeWorkoutContainer}>
          {/* Aktív edzés fejléc */}
          <View style={styles.activeHeader}>
            <View>
              <Text style={styles.activeWorkoutTitle}>{activePlan?.name || 'Edzés'}</Text>
              <Text style={styles.activeWorkoutTimer}>⏱️ {formatTime(workoutTimerSeconds)}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeWorkoutBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeWorkoutBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.activeScrollView} contentContainerStyle={styles.activeScrollContent}>
            {workoutExercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.activeExCard}>
                <View style={styles.activeExHeader}>
                  <Text style={styles.activeExName}>{ex.name}</Text>
                  <View style={styles.activeMuscleTag}>
                    <Text style={styles.activeMuscleTagText}>{ex.muscleGroup}</Text>
                  </View>
                </View>

                {/* Sorozatok fejléc */}
                <View style={styles.setsTableHeader}>
                  <Text style={[styles.setsHeaderCell, { width: 40 }]}>SZÉRIA</Text>
                  <Text style={[styles.setsHeaderCell, { flex: 1 }]}>SÚLY (KG)</Text>
                  <Text style={[styles.setsHeaderCell, { flex: 1 }]}>ISMÉTLÉS</Text>
                  <Text style={[styles.setsHeaderCell, { width: 50, textAlign: 'center' }]}>KÉSZ</Text>
                </View>

                {/* Sorozatok listája */}
                {ex.sets.map((set, sIdx) => (
                  <View
                    key={sIdx}
                    style={[
                      styles.setRow,
                      set.completed && styles.setRowCompleted,
                    ]}
                  >
                    <Text style={styles.setNumberText}>{set.setNumber}</Text>

                    <TextInput
                      style={styles.setInput}
                      keyboardType="numeric"
                      value={set.weightKg.toString()}
                      onChangeText={(val) =>
                        handleUpdateSetValue(exIdx, sIdx, 'weightKg', val)
                      }
                    />

                    <TextInput
                      style={styles.setInput}
                      keyboardType="number-pad"
                      value={set.reps.toString()}
                      onChangeText={(val) =>
                        handleUpdateSetValue(exIdx, sIdx, 'reps', val)
                      }
                    />

                    <TouchableOpacity
                      style={[
                        styles.checkSetBtn,
                        set.completed && styles.checkSetBtnDone,
                      ]}
                      onPress={() => handleToggleSetComplete(exIdx, sIdx)}
                    >
                      <Text style={[styles.checkSetText, set.completed && styles.checkSetTextDone]}>
                        {set.completed ? '✓' : '○'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addSetBtn}
                  onPress={() => handleAddSet(exIdx)}
                >
                  <Text style={styles.addSetBtnText}>+ Sorozat hozzáadása</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Megjegyzések mező */}
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Edzés megjegyzés (opcionális):</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Pl. Kiváló energia, guggolás könnyen ment"
                placeholderTextColor={colors.neutral[400]}
                value={workoutNotes}
                onChangeText={setWorkoutNotes}
              />
            </View>

            {/* Befejezés gomb */}
            <TouchableOpacity
              style={styles.finishWorkoutButton}
              onPress={handleFinishWorkout}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.finishWorkoutButtonText}>✓ Edzés Befejezése & Mentés</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ExerciseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 4,
    marginBottom: 16,
  },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsBannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  statsBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  statsBannerSubtitle: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 1,
  },
  statsBannerArrow: {
    fontSize: 22,
    color: colors.secondary,
    fontWeight: '300',
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitleCol: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  planCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  planDescription: {
    fontSize: 13,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 12,
  },
  exercisePreviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  exercisePreviewHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[500],
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  exercisePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  exerciseDot: {
    fontSize: 12,
    color: colors.primary,
    marginRight: 6,
  },
  exerciseNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  exerciseSetsText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  startWorkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  activeWorkoutContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1E293B',
    paddingTop: 45,
  },
  activeWorkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeWorkoutTimer: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '700',
    marginTop: 2,
  },
  closeWorkoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeWorkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeScrollView: {
    flex: 1,
  },
  activeScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  activeExCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  activeExHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeExName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  activeMuscleTag: {
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeMuscleTagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: 'bold',
  },
  setsTableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[300],
    marginBottom: 6,
  },
  setsHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.neutral[500],
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  setRowCompleted: {
    backgroundColor: '#E8F8F0',
  },
  setNumberText: {
    width: 34,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[600],
  },
  setInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  checkSetBtn: {
    width: 44,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkSetBtnDone: {
    backgroundColor: colors.secondary,
  },
  checkSetText: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  checkSetTextDone: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addSetBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  addSetBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  notesBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  finishWorkoutButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  finishWorkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
