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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../themes/tokens';
import { auth } from '../../../firebaseConfig';
import {
  WorkoutPlan,
  WorkoutPlanExercise,
  WorkoutExercise,
  ExerciseSet,
  getWorkoutPlans,
  getCustomWorkoutPlans,
  saveCustomWorkoutPlan,
  deleteCustomWorkoutPlan,
  saveWorkoutSession,
} from '../../services/workoutService';
import {
  ExerciseDoc,
  TrackingType,
  ExerciseCategory,
  MuscleGroup,
  fetchAvailableExercises,
  createCustomExercise,
  deleteCustomExercise,
  seedPredefinedExercises,
} from '../../services/exerciseService';

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
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [workoutTimerSeconds, setWorkoutTimerSeconds] = useState<number>(0);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);

  // 5. Új Egyéni Edzésterv Létrehozása Modal
  const [planModalVisible, setPlanModalVisible] = useState<boolean>(false);
  const [newPlanName, setNewPlanName] = useState<string>('');
  const [newPlanCategory, setNewPlanCategory] = useState<string>('Izomtömeg-növelés');
  const [newPlanFrequency, setNewPlanFrequency] = useState<string>('3 nap / hét');
  const [newPlanDuration, setNewPlanDuration] = useState<string>('60 perc');
  const [newPlanDescription, setNewPlanDescription] = useState<string>('');
  const [newPlanExercises, setNewPlanExercises] = useState<WorkoutPlanExercise[]>([]);
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);

  // 6. Gyakorlat választó (Exercise Picker Modal)
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'plan_creator' | 'active_workout'>('plan_creator');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Összes');

  // 7. Új Egyéni Gyakorlat definiálása Modal
  const [customExModalVisible, setCustomExModalVisible] = useState<boolean>(false);
  const [customExName, setCustomExName] = useState<string>('');
  const [customExEnglishName, setCustomExEnglishName] = useState<string>('');
  const [customExCategory, setCustomExCategory] = useState<ExerciseCategory>('gym');
  const [customExMuscle, setCustomExMuscle] = useState<MuscleGroup>('mellkas');
  const [customExTracking, setCustomExTracking] = useState<TrackingType>('reps_and_weight');
  const [isCreatingEx, setIsCreatingEx] = useState<boolean>(false);

  // Adatok betöltése
  const loadAllData = async () => {
    try {
      setLoadingPlans(true);
      // Auto-seed predefiniált gyakorlatok
      seedPredefinedExercises().catch(() => {});

      // Sablonok betöltése
      setTemplatePlans(getWorkoutPlans());

      // Saját tervek és gyakorlat adatbázis betöltése
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

  // Aktív edzés időzítő
  useEffect(() => {
    let interval: any = null;
    if (activeSessionVisible) {
      interval = setInterval(() => {
        setWorkoutTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
      setWorkoutTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeSessionVisible]);

  // Idő formázása mm:ss formátumban
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // EDZÉS INDÍTÁSA EGY TERVBŐL (Sablon vagy Saját)
  // =========================================================================
  const handleStartWorkout = (plan: WorkoutPlan) => {
    setCurrentPlan(plan);

    const initialExercises: WorkoutExercise[] = plan.exercises.map((ex) => {
      const sets: ExerciseSet[] = [];
      const count = ex.defaultSets || 3;
      for (let i = 1; i <= count; i++) {
        sets.push({
          setNumber: i,
          weightKg: ex.defaultWeight || (ex.trackingType === 'reps_and_weight' ? 60 : 0),
          reps: ex.defaultReps || (ex.trackingType !== 'time_hold' ? 10 : undefined),
          durationSeconds: ex.defaultDurationSeconds || (ex.trackingType === 'time_hold' ? 45 : undefined),
          completed: false,
        });
      }

      return {
        exerciseId: ex.exerciseId,
        name: ex.name,
        trackingType: ex.trackingType,
        muscleGroup: ex.muscleGroup,
        sets,
      };
    });

    setWorkoutExercises(initialExercises);
    setWorkoutNotes('');
    setWorkoutTimerSeconds(0);
    setActiveSessionVisible(true);
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

  // Sorozat értékének dinamikus frissítése
  const handleUpdateSetValue = (
    exIndex: number,
    setIndex: number,
    field: 'weightKg' | 'reps' | 'durationSeconds',
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
  const handleAddSetToExercise = (exIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const ex = updated[exIndex];
      const lastSet = ex.sets[ex.sets.length - 1];

      ex.sets.push({
        setNumber: ex.sets.length + 1,
        weightKg: lastSet?.weightKg ?? (ex.trackingType === 'reps_and_weight' ? 60 : 0),
        reps: lastSet?.reps ?? (ex.trackingType !== 'time_hold' ? 10 : undefined),
        durationSeconds: lastSet?.durationSeconds ?? (ex.trackingType === 'time_hold' ? 45 : undefined),
        completed: false,
      });

      return updated;
    });
  };

  // Sorozat törlése
  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      if (updated[exIndex].sets.length > 1) {
        updated[exIndex].sets.splice(setIndex, 1);
        // Újraszámozás
        updated[exIndex].sets.forEach((s, idx) => (s.setNumber = idx + 1));
      }
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
        'Még egyetlen sorozatot sem jelöltél be teljesítettként (zöld pipa). Biztosan befejezed és mented?',
        [
          { text: 'Még folytatom', style: 'cancel' },
          { text: 'Befejezés', onPress: () => doSaveSession() },
        ]
      );
      return;
    }

    doSaveSession();
  };

  const doSaveSession = async () => {
    try {
      setIsSavingSession(true);
      const durationMin = Math.max(1, Math.round(workoutTimerSeconds / 60));

      const saved = await saveWorkoutSession({
        title: currentPlan ? currentPlan.name : 'Egyéni Edzés',
        planId: currentPlan?.id,
        date: new Date().toISOString().split('T')[0],
        durationMinutes: durationMin,
        exercises: workoutExercises,
        notes: workoutNotes,
      });

      setActiveSessionVisible(false);
      Alert.alert(
        'Edzés sikeresen elmentve! 🏆',
        `Időtartam: ${durationMin} perc\nÖsszes teljesített sorozat: ${saved.totalSets}\nÖsszvolumen: ${saved.totalVolumeKg} kg\n\nAz új rekordjaid (PR) automatikusan frissültek!`
      );
    } catch (err: any) {
      Alert.alert('Hiba', err.message || 'Nem sikerült elmenteni az edzést.');
    } finally {
      setIsSavingSession(false);
    }
  };

  // =========================================================================
  // GYAKORLAT VÁLASZTÓ ÉS HOZZÁADÁS (Exercise Picker)
  // =========================================================================
  const openExercisePicker = (mode: 'plan_creator' | 'active_workout') => {
    setPickerMode(mode);
    setSearchQuery('');
    setSelectedCategoryFilter('Összes');
    setPickerModalVisible(true);
  };

  const handleSelectExercise = (ex: ExerciseDoc) => {
    if (pickerMode === 'plan_creator') {
      // Hozzáadás az új tervhez
      const newPlanEx: WorkoutPlanExercise = {
        exerciseId: ex.id,
        name: ex.name,
        trackingType: ex.trackingType,
        muscleGroup: ex.muscleGroup,
        defaultSets: 3,
        defaultReps: ex.trackingType !== 'time_hold' ? 10 : undefined,
        defaultWeight: ex.trackingType === 'reps_and_weight' ? 60 : undefined,
        defaultDurationSeconds: ex.trackingType === 'time_hold' ? 45 : undefined,
      };
      setNewPlanExercises((prev) => [...prev, newPlanEx]);
    } else {
      // Hozzáadás az aktív edzéshez közvetlenül
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
      setWorkoutExercises((prev) => [...prev, newWorkoutEx]);
    }

    setPickerModalVisible(false);
  };

  // Új egyéni gyakorlat mentése
  const handleSaveCustomExercise = async () => {
    if (!customExName.trim()) {
      Alert.alert('Hiba', 'Kérlek add meg a gyakorlat nevét!');
      return;
    }

    try {
      setIsCreatingEx(true);
      const created = await createCustomExercise({
        name: customExName.trim(),
        englishName: customExEnglishName.trim() || customExName.trim(),
        category: customExCategory,
        muscleGroup: customExMuscle,
        trackingType: customExTracking,
        equipment: 'none',
      });

      // Frissítés a lokális listában
      setExercisesDb((prev) => [created, ...prev]);
      setCustomExName('');
      setCustomExEnglishName('');
      setCustomExModalVisible(false);
      Alert.alert('Sikeres létrehozás 🎉', `A(z) "${created.name}" gyakorlat bekerült a listába!`);
    } catch (e: any) {
      Alert.alert('Hiba', e.message || 'Nem sikerült létrehozni a gyakorlatot.');
    } finally {
      setIsCreatingEx(false);
    }
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
  const handleSaveNewPlan = async () => {
    if (!newPlanName.trim()) {
      Alert.alert('Hiányzó adat', 'Kérlek adj meg egy nevet az edzéstervnek!');
      return;
    }
    if (newPlanExercises.length === 0) {
      Alert.alert('Hiányzó gyakorlatok', 'Kérlek adj hozzá legalább 1 gyakorlatot a tervhez!');
      return;
    }

    try {
      setIsSavingPlan(true);
      const saved = await saveCustomWorkoutPlan({
        name: newPlanName.trim(),
        category: newPlanCategory,
        frequency: newPlanFrequency,
        durationEst: newPlanDuration,
        description: newPlanDescription.trim() || 'Egyéni edzésterv céljaid eléréséhez.',
        exercises: newPlanExercises,
      });

      setCustomPlans((prev) => [saved, ...prev]);
      setPlanModalVisible(false);
      // Reset form
      setNewPlanName('');
      setNewPlanDescription('');
      setNewPlanExercises([]);
      Alert.alert('Sikeres mentés 🎉', `A(z) "${saved.name}" edzésterv sikeresen elkészült!`);
    } catch (e: any) {
      Alert.alert('Hiba', e.message || 'Nem sikerült elmenteni az edzéstervet.');
    } finally {
      setIsSavingPlan(false);
    }
  };

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

  // Szűrt gyakorlatok keresés és kategória alapján
  const filteredExercises = exercisesDb.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.englishName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategoryFilter === 'Összes') return true;
    if (selectedCategoryFilter === 'Saját testsúly') return ex.category === 'calisthenics';
    if (selectedCategoryFilter === 'Súlyzós') return ex.category === 'gym';
    if (selectedCategoryFilter === 'Mobilitás') return ex.category === 'mobility';

    return true;
  });

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
              onPress={() => {
                setNewPlanName('');
                setNewPlanExercises([]);
                setPlanModalVisible(true);
              }}
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

      {/* ========================================================================= */}
      {/* MODAL 1: AKTÍV EDZÉS FOLYAMAT (WORKOUT SESSION) DINAMIKUS TRACKINGTÍPUSOKKAL */}
      {/* ========================================================================= */}
      <Modal visible={activeSessionVisible} animationType="slide">
        <View style={styles.activeModalWrapper}>
          {/* Felső vezérlősáv: Cím, Időzítő, Bezárás */}
          <View style={styles.activeHeader}>
            <View>
              <Text style={styles.activeWorkoutTitle}>{currentPlan?.name || 'Aktív Edzés'}</Text>
              <Text style={styles.activeWorkoutTimer}>⏱️ {formatTimer(workoutTimerSeconds)}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeActiveBtn}
              onPress={() => {
                Alert.alert('Edzés megszakítása', 'Biztosan kilépsz? A nem mentett adatok elvesznek.', [
                  { text: 'Még folytatom', style: 'cancel' },
                  { text: 'Kilépés', style: 'destructive', onPress: () => setActiveSessionVisible(false) },
                ]);
              }}
            >
              <Text style={styles.closeActiveBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.activeExercisesScroll} contentContainerStyle={{ padding: 16 }}>
            {workoutExercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.activeExCard}>
                <View style={styles.activeExHeader}>
                  <Text style={styles.activeExTitle}>{ex.name}</Text>
                  <View style={styles.trackingTypeBadge}>
                    <Text style={styles.trackingTypeBadgeText}>
                      {ex.trackingType === 'reps_and_weight'
                        ? 'Súly & Ism'
                        : ex.trackingType === 'reps_only'
                        ? 'Csak ismétlés'
                        : 'Időtartam'}
                    </Text>
                  </View>
                </View>

                {/* Dinamikus Sorozat Fejléc a trackingType alapján */}
                <View style={styles.setHeaderRow}>
                  <Text style={[styles.setHeaderCell, { width: 36 }]}>SZÉR.</Text>
                  {ex.trackingType === 'reps_and_weight' && (
                    <>
                      <Text style={[styles.setHeaderCell, { flex: 1 }]}>SÚLY (KG)</Text>
                      <Text style={[styles.setHeaderCell, { flex: 1 }]}>ISM (DB)</Text>
                    </>
                  )}
                  {ex.trackingType === 'reps_only' && (
                    <Text style={[styles.setHeaderCell, { flex: 2 }]}>ISMÉTLÉS (DB)</Text>
                  )}
                  {ex.trackingType === 'time_hold' && (
                    <Text style={[styles.setHeaderCell, { flex: 2 }]}>IDŐTARTAM (MP)</Text>
                  )}
                  <Text style={[styles.setHeaderCell, { width: 44, textAlign: 'center' }]}>PIPÁLÁS</Text>
                </View>

                {/* Dinamikus Sorozatok bevitele */}
                {ex.sets.map((set, setIdx) => (
                  <View
                    key={setIdx}
                    style={[styles.setRowItem, set.completed && styles.setRowItemCompleted]}
                  >
                    <Text style={styles.setIndexText}>{set.setNumber}</Text>

                    {/* Súly & Ismétlés mezők */}
                    {ex.trackingType === 'reps_and_weight' && (
                      <>
                        <TextInput
                          style={styles.setInputField}
                          keyboardType="numeric"
                          value={set.weightKg !== undefined ? String(set.weightKg) : ''}
                          onChangeText={(val) => handleUpdateSetValue(exIdx, setIdx, 'weightKg', val)}
                          placeholder="0"
                        />
                        <TextInput
                          style={styles.setInputField}
                          keyboardType="numeric"
                          value={set.reps !== undefined ? String(set.reps) : ''}
                          onChangeText={(val) => handleUpdateSetValue(exIdx, setIdx, 'reps', val)}
                          placeholder="0"
                        />
                      </>
                    )}

                    {/* Csak ismétlés mező */}
                    {ex.trackingType === 'reps_only' && (
                      <TextInput
                        style={[styles.setInputField, { flex: 2 }]}
                        keyboardType="numeric"
                        value={set.reps !== undefined ? String(set.reps) : ''}
                        onChangeText={(val) => handleUpdateSetValue(exIdx, setIdx, 'reps', val)}
                        placeholder="10"
                      />
                    )}

                    {/* Időtartam mező */}
                    {ex.trackingType === 'time_hold' && (
                      <TextInput
                        style={[styles.setInputField, { flex: 2 }]}
                        keyboardType="numeric"
                        value={set.durationSeconds !== undefined ? String(set.durationSeconds) : ''}
                        onChangeText={(val) => handleUpdateSetValue(exIdx, setIdx, 'durationSeconds', val)}
                        placeholder="45"
                      />
                    )}

                    {/* Pipálás gomb */}
                    <TouchableOpacity
                      style={[styles.checkSetBtn, set.completed && styles.checkSetBtnDone]}
                      onPress={() => handleToggleSetComplete(exIdx, setIdx)}
                    >
                      <Text style={[styles.checkSetText, set.completed && styles.checkSetTextDone]}>
                        {set.completed ? '✓' : '○'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Műveletek: Sorozat hozzáadása / Sorozat törlése */}
                <View style={styles.exActionsRow}>
                  <TouchableOpacity
                    style={styles.addSetActionBtn}
                    onPress={() => handleAddSetToExercise(exIdx)}
                  >
                    <Text style={styles.addSetActionText}>+ Sorozat hozzáadása</Text>
                  </TouchableOpacity>

                  {ex.sets.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveSet(exIdx, ex.sets.length - 1)}
                      style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                    >
                      <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>
                        - Utolsó törlése
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* További gyakorlat felvétele élő edzés közben */}
            <TouchableOpacity
              style={styles.addMoreExLiveBtn}
              onPress={() => openExercisePicker('active_workout')}
            >
              <Text style={styles.addMoreExLiveBtnText}>+ Gyakorlat hozzáadása az edzéshez</Text>
            </TouchableOpacity>

            {/* Edzésjegyzetek */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Edzés jegyzetek (opcionális):</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Hogy érezted magad? Sikerült új súlyt kipróbálni?"
                placeholderTextColor="#94A3B8"
                value={workoutNotes}
                onChangeText={setWorkoutNotes}
                multiline
              />
            </View>

            {/* Edzés befejezése gomb */}
            <TouchableOpacity
              style={styles.finishWorkoutPrimaryBtn}
              onPress={handleFinishWorkout}
              disabled={isSavingSession}
            >
              {isSavingSession ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.finishWorkoutBtnText}>Edzés Befejezése & Mentés ✓</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ÚJ EGYÉNI EDZÉSTERV LÉTREHOZÁSA (PLAN CREATOR) */}
      {/* ========================================================================= */}
      <Modal
        visible={planModalVisible}
        animationType="slide"
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.creatorModalContainer}
        >
          <View style={styles.creatorHeader}>
            <Text style={styles.creatorHeaderTitle}>Új Edzésterv Tervezése</Text>
            <TouchableOpacity
              onPress={() => setPlanModalVisible(false)}
              style={styles.creatorCloseBtn}
            >
              <Text style={styles.creatorCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18 }}>
            <Text style={styles.formLabel}>Edzésterv neve *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="pl. PPL - Push Pull Legs, Saját Lábnap"
              placeholderTextColor="#94A3B8"
              value={newPlanName}
              onChangeText={setNewPlanName}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Gyakoriság</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="pl. 3 nap / hét"
                  placeholderTextColor="#94A3B8"
                  value={newPlanFrequency}
                  onChangeText={setNewPlanFrequency}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Becsült idő</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="pl. 60 perc"
                  placeholderTextColor="#94A3B8"
                  value={newPlanDuration}
                  onChangeText={setNewPlanDuration}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Kategória / Fókusz</Text>
            <View style={styles.categoryPillsRow}>
              {['Izomtömeg-növelés', 'Erőnlét', 'Szálkásítás', 'Állóképesség'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    newPlanCategory === cat && styles.categoryPillActive,
                  ]}
                  onPress={() => setNewPlanCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      newPlanCategory === cat && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Leírás (opcionális)</Text>
            <TextInput
              style={[styles.formInput, { height: 60 }]}
              placeholder="Rövid leírás a terv céljairól..."
              placeholderTextColor="#94A3B8"
              value={newPlanDescription}
              onChangeText={setNewPlanDescription}
              multiline
            />

            {/* Tervben lévő gyakorlatok */}
            <View style={styles.planExercisesHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>
                Gyakorlatok ({newPlanExercises.length})
              </Text>
              <TouchableOpacity
                style={styles.addExToPlanBtn}
                onPress={() => openExercisePicker('plan_creator')}
              >
                <Text style={styles.addExToPlanBtnText}>+ Gyakorlat hozzáadása</Text>
              </TouchableOpacity>
            </View>

            {newPlanExercises.length === 0 ? (
              <View style={styles.emptyExBox}>
                <Text style={styles.emptyExText}>Még nem adtál hozzá gyakorlatot a tervhez.</Text>
                <Text style={styles.emptyExSub}>Kattints a fenti "+ Gyakorlat hozzáadása" gombra!</Text>
              </View>
            ) : (
              newPlanExercises.map((ex, idx) => (
                <View key={idx} style={styles.addedExItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addedExName}>{ex.name}</Text>
                    <Text style={styles.addedExMeta}>
                      Alapértelmezett: {ex.defaultSets} sorozat{' '}
                      {ex.trackingType === 'reps_and_weight'
                        ? `• ${ex.defaultWeight || 60} kg x ${ex.defaultReps || 10} ism`
                        : ex.trackingType === 'reps_only'
                        ? `• ${ex.defaultReps || 10} ism`
                        : `• ${ex.defaultDurationSeconds || 45} mp`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setNewPlanExercises((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    style={styles.removeExBtn}
                  >
                    <Text style={styles.removeExBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <TouchableOpacity
              style={styles.savePlanPrimaryBtn}
              onPress={handleSaveNewPlan}
              disabled={isSavingPlan}
            >
              {isSavingPlan ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.savePlanPrimaryBtnText}>Edzésterv Mentése 💾</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: GYAKORLAT VÁLASZTÓ (EXERCISE PICKER MODAL) KERESŐVEL ÉS SZŰRŐKKEL */}
      {/* ========================================================================= */}
      <Modal
        visible={pickerModalVisible}
        animationType="slide"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerHeaderTitle}>Gyakorlat Kiválasztása</Text>
            <TouchableOpacity
              onPress={() => setPickerModalVisible(false)}
              style={styles.pickerCloseBtn}
            >
              <Text style={styles.pickerCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Keresőmező */}
          <View style={styles.searchBarWrapper}>
            <TextInput
              style={styles.searchBarInput}
              placeholder="Keresés név szerint (pl. Fekvenyomás, Húzódzkodás)..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Kategória szűrő chipek */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterRow}
          >
            {['Összes', 'Saját testsúly', 'Súlyzós', 'Mobilitás'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  selectedCategoryFilter === cat && styles.catChipActive,
                ]}
                onPress={() => setSelectedCategoryFilter(cat)}
              >
                <Text
                  style={[
                    styles.catChipText,
                    selectedCategoryFilter === cat && styles.catChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Új egyéni gyakorlat létrehozása gomb */}
          <TouchableOpacity
            style={styles.createCustomExRowBtn}
            onPress={() => setCustomExModalVisible(true)}
          >
            <Text style={styles.createCustomExRowText}>
              + Nem találod? Hozz létre új egyéni gyakorlatot!
            </Text>
          </TouchableOpacity>

          {/* Gyakorlatok listája */}
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
            {filteredExercises.map((ex) => {
              const currentUserId = auth.currentUser?.uid;
              const canDelete = Boolean(
                ex.isCustom &&
                ((currentUserId && ex.userId === currentUserId) || (!currentUserId && ex.userId === 'guest'))
              );

              return (
                <View key={ex.id} style={styles.exerciseListItem}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => handleSelectExercise(ex)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.exListTitle}>{ex.name}</Text>
                      {ex.isCustom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>[Saját]</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.exListEnglishName}>{ex.englishName}</Text>
                    <View style={styles.exBadgesRow}>
                      <View style={styles.exBadge}>
                        <Text style={styles.exBadgeText}>
                          {ex.category === 'calisthenics'
                            ? 'Saját testsúly'
                            : ex.category === 'gym'
                            ? 'Súlyzós'
                            : 'Mobilitás'}
                        </Text>
                      </View>
                      <View style={[styles.exBadge, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.exBadgeText, { color: '#B45309' }]}>
                          {ex.muscleGroup.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.exBadge, { backgroundColor: '#F3E8FF' }]}>
                        <Text style={[styles.exBadgeText, { color: '#7E22CE' }]}>
                          {ex.trackingType === 'reps_and_weight'
                            ? 'Súly & Ism'
                            : ex.trackingType === 'reps_only'
                            ? 'Ismétlés'
                            : 'Időtartam'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.exActionButtons}>
                    {canDelete && (
                      <TouchableOpacity
                        style={styles.exDeleteIconBtn}
                        onPress={() => handleDeleteCustomExercise(ex)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Gyakorlat törlése"
                      >
                        <Text style={{ fontSize: 15 }}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.exSelectArrow}
                      onPress={() => handleSelectExercise(ex)}
                    >
                      <Text style={{ fontSize: 18, color: colors.primary, fontWeight: '700' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: ÚJ EGYÉNI GYAKORLAT DEFINIÁLÁSA */}
      {/* ========================================================================= */}
      <Modal
        visible={customExModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomExModalVisible(false)}
      >
        <View style={styles.customExOverlay}>
          <View style={styles.customExCard}>
            <View style={styles.customExHeaderRow}>
              <Text style={styles.customExTitle}>Új Gyakorlat Hozzáadása</Text>
              <TouchableOpacity
                onPress={() => setCustomExModalVisible(false)}
                style={styles.customExCloseBtn}
              >
                <Text style={styles.customExCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Gyakorlat magyar neve *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="pl. Oldalemelés kézisúlyzóval"
              placeholderTextColor="#94A3B8"
              value={customExName}
              onChangeText={setCustomExName}
            />

            <Text style={styles.formLabel}>Angol elnevezés (opcionális)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="pl. Lateral Raise"
              placeholderTextColor="#94A3B8"
              value={customExEnglishName}
              onChangeText={setCustomExEnglishName}
            />

            <Text style={styles.formLabel}>Kategória</Text>
            <View style={styles.categoryPillsRow}>
              {(['gym', 'calisthenics', 'mobility'] as ExerciseCategory[]).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoryPill, customExCategory === c && styles.categoryPillActive]}
                  onPress={() => setCustomExCategory(c)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      customExCategory === c && styles.categoryPillTextActive,
                    ]}
                  >
                    {c === 'gym' ? 'Súlyzós' : c === 'calisthenics' ? 'Saját testsúly' : 'Mobilitás'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Cél izomcsoport</Text>
            <View style={styles.categoryPillsRow}>
              {(['mellkas', 'hat', 'vall', 'lab', 'kar', 'torzs'] as MuscleGroup[]).map((mg) => (
                <TouchableOpacity
                  key={mg}
                  style={[styles.categoryPill, customExMuscle === mg && styles.categoryPillActive]}
                  onPress={() => setCustomExMuscle(mg)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      customExMuscle === mg && styles.categoryPillTextActive,
                    ]}
                  >
                    {mg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Mérés módja (Tracking Type)</Text>
            <View style={styles.categoryPillsRow}>
              {(['reps_and_weight', 'reps_only', 'time_hold'] as TrackingType[]).map((tt) => (
                <TouchableOpacity
                  key={tt}
                  style={[styles.categoryPill, customExTracking === tt && styles.categoryPillActive]}
                  onPress={() => setCustomExTracking(tt)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      customExTracking === tt && styles.categoryPillTextActive,
                    ]}
                  >
                    {tt === 'reps_and_weight'
                      ? 'Súly & Ismétlés'
                      : tt === 'reps_only'
                      ? 'Csak Ismétlés'
                      : 'Időtartam (mp)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveCustomExBtn}
              onPress={handleSaveCustomExercise}
              disabled={isCreatingEx}
            >
              {isCreatingEx ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveCustomExBtnText}>Mentés az Adatbázisba ✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
