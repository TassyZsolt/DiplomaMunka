import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { colors } from '../../themes/tokens';
import {
  Exercise,
  PersonalRecord,
  DEFAULT_EXERCISES,
  getAvailableExercises,
  getPersonalRecords,
  savePersonalRecord,
  calculateTotalPr,
} from '../../services/prService';
import { getWaterData } from '../../services/waterService';

const PersonalStatsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'records' | 'calculator' | 'categories'>('records');
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [records, setRecords] = useState<Record<string, PersonalRecord>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('');
  const [todayWater, setTodayWater] = useState<number>(0);

  // 1RM Számológép állapot
  const [calcWeight, setCalcWeight] = useState<string>('100');
  const [calcReps, setCalcReps] = useState<string>('5');

  // Modal állapot
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('squats');
  const [inputWeight, setInputWeight] = useState<string>('');
  const [inputReps, setInputReps] = useState<string>('1');
  const [inputNotes, setInputNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Kategória szűrő
  const [selectedCategory, setSelectedCategory] = useState<string>('Összes');

  const loadAllData = async () => {
    try {
      const [availExercises, prData] = await Promise.all([
        getAvailableExercises(),
        getPersonalRecords(),
      ]);
      setExercises(availExercises);
      setRecords(prData);

      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            setUserName(fullName || user.email?.split('@')[0] || 'Sportoló');
          } else if (user.displayName) {
            setUserName(user.displayName);
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          }
        } catch (e) {
          console.warn('Nem sikerült betölteni a profil adatait:', e);
        }

        try {
          const waterLogs = await getWaterData();
          const total = waterLogs.reduce((sum: number, log: any) => sum + (log.amountMl || 0), 0);
          setTodayWater(total);
        } catch (e) {
          
        }
      } else {
        setUserName('Sportoló');
      }
    } catch (error) {
      console.error('Hiba a személyes statisztikák betöltésekor:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const handleOpenEditModal = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    const existing = records[exerciseId];
    if (existing) {
      setInputWeight(existing.weight.toString());
      setInputReps(existing.reps?.toString() || '1');
      setInputNotes(existing.notes || '');
    } else {
      setInputWeight('');
      setInputReps('1');
      setInputNotes('');
    }
    setModalVisible(true);
  };

  const handleSavePr = async () => {
    const weightNum = parseFloat(inputWeight);
    const repsNum = parseInt(inputReps, 10);

    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Figyelmeztetés', 'Kérlek érvényes pozitív súlyt adj meg (kg)!');
      return;
    }

    if (isNaN(repsNum) || repsNum <= 0) {
      Alert.alert('Figyelmeztetés', 'Kérlek érvényes ismétlésszámot adj meg!');
      return;
    }

    try {
      setIsSaving(true);
      await savePersonalRecord(selectedExerciseId, weightNum, repsNum, inputNotes);
      await loadAllData();
      setModalVisible(false);
      Alert.alert('Siker', 'Egyéni rekord sikeresen elmentve!');
    } catch (err) {
      Alert.alert('Hiba', 'Nem sikerült menteni a rekordot');
    } finally {
      setIsSaving(false);
    }
  };

  
  const maxPrExercise = Object.values(records).reduce<PersonalRecord | null>((max, current) => {
    if (!max || current.weight > max.weight) return current;
    return max;
  }, null);

  // 1RM Számítás (Epley formula: Súly * (1 + Ismétlés / 30))
  const cW = parseFloat(calcWeight) || 0;
  const cR = parseInt(calcReps, 10) || 1;
  const estimated1RM = cR === 1 ? cW : Math.round(cW * (1 + cR / 30));

  const filteredExercises = selectedCategory === 'Összes'
    ? exercises
    : exercises.filter(e => e.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Személyes statisztikák betöltése...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase() || 'S'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.greetingText}>Szia, {userName}!</Text>
          <Text style={styles.subGreetingText}>Személyes csúcsok, idővonal & 1RM kalkulátor</Text>
        </View>
      </View>

      
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'records' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('records')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'records' && styles.segmentBtnTextActive]}>
            Rekordok (PRs)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'calculator' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('calculator')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'calculator' && styles.segmentBtnTextActive]}>
            1RM Kalkulátor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'categories' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'categories' && styles.segmentBtnTextActive]}>
            Izomcsoportok
          </Text>
        </TouchableOpacity>
      </View>

      
      {activeTab === 'records' && (
        <View style={styles.tabContent}>
          
          <View style={styles.totalCard}>
            <View style={styles.totalCardHeader}>
              <Text style={styles.totalCardTitle}>ÖSSZESÍTETT REKORD (TOTAL)</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3 Fő Gyakorlat</Text>
              </View>
            </View>

            

            <View style={styles.quickStatsRow}>
              <View style={styles.quickStatCol}>
                <Text style={styles.quickStatLabel}>Legnagyobb PR</Text>
                <Text style={styles.quickStatValue}>
                  {maxPrExercise ? `${maxPrExercise.weight} kg` : '-'}
                </Text>
                <Text style={styles.quickStatExercise}>
                  {maxPrExercise ? maxPrExercise.exerciseName.split(' ')[0] : ''}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.quickStatCol}>
                <Text style={styles.quickStatLabel}>Átlagos súly</Text>
                <Text style={styles.quickStatValue}>
                
                </Text>
                <Text style={styles.quickStatExercise}>Gyakorlatonként</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.quickStatCol}>
                <Text style={styles.quickStatLabel}>Forma állapot</Text>
                <Text style={styles.quickStatValue}>🔥 Aktív</Text>
                <Text style={styles.quickStatExercise}>Kiváló széria</Text>
              </View>
            </View>
          </View>

          
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Egyéni rekordok listája</Text>
              <Text style={styles.sectionSubtitle}>
                A főbb gyakorlatok aktuális csúcsai és időpontjai
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addPrButton}
              onPress={() => handleOpenEditModal('squats')}
            >
              <Text style={styles.addPrButtonText}>+ Új PR</Text>
            </TouchableOpacity>
          </View>

          
          <View style={styles.prList}>
            {filteredExercises.map((exercise) => {
              const pr = records[exercise.id];
              const hasRecord = !!pr && pr.weight > 0;

              return (
                <View key={exercise.id} style={styles.prCard}>
                  <View style={styles.prCardLeft}>
                    <View style={styles.exerciseIconWrapper}>
                      <Text style={styles.exerciseIcon}>🏋️</Text>
                    </View>
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.tagRow}>
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>{exercise.category}</Text>
                        </View>
                        {hasRecord && (
                          <Text style={styles.recordDateText}>📅 {pr.date}</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.prCardRight}>
                    <View style={styles.weightContainer}>
                      <Text style={styles.weightNumber}>
                        {hasRecord ? pr.weight : '0'}
                      </Text>
                      <Text style={styles.weightUnit}>kg</Text>
                    </View>
                    {hasRecord && (
                      <Text style={styles.repsText}>{pr.reps} ism.</Text>
                    )}
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleOpenEditModal(exercise.id)}
                    >
                      <Text style={styles.editButtonText}>Módosítás</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      
      {activeTab === 'calculator' && (
        <View style={styles.tabContent}>
          <View style={styles.calcCard}>
            <Text style={styles.calcTitle}>1RM (Egy Ismétléses Maximum) Kalkulátor</Text>
            <Text style={styles.calcSubtitle}>
              Számold ki az elméleti maximális súlyodat az elvégzett szériák alapján (Epley-formula).
            </Text>

            <View style={styles.calcInputsRow}>
              <View style={styles.calcInputCol}>
                <Text style={styles.calcInputLabel}>Súly (kg)</Text>
                <TextInput
                  style={styles.calcInput}
                  value={calcWeight}
                  onChangeText={setCalcWeight}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>

              <View style={styles.calcInputCol}>
                <Text style={styles.calcInputLabel}>Ismétlés</Text>
                <TextInput
                  style={styles.calcInput}
                  value={calcReps}
                  onChangeText={setCalcReps}
                  keyboardType="number-pad"
                  placeholder="5"
                />
              </View>
            </View>

            <View style={styles.resultBanner}>
              <Text style={styles.resultLabel}>BECSÜLT 1RM TELJESÍTMÉNY</Text>
              <Text style={styles.resultValue}>{estimated1RM} kg</Text>
              <Text style={styles.resultSubtext}>
                {cW} kg x {cR} ismétlés alapján
              </Text>
            </View>

            
            <Text style={styles.tableHeader}>Edzési intenzitási zónák (1RM arányában):</Text>
            <View style={styles.tableGrid}>
              <View style={styles.tableRow}>
                <Text style={styles.tablePercent}>95% (2 ism.)</Text>
                <Text style={styles.tableWeight}>{Math.round(estimated1RM * 0.95)} kg</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tablePercent}>90% (4 ism.)</Text>
                <Text style={styles.tableWeight}>{Math.round(estimated1RM * 0.90)} kg</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tablePercent}>85% (6 ism.)</Text>
                <Text style={styles.tableWeight}>{Math.round(estimated1RM * 0.85)} kg</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tablePercent}>80% (8 ism.)</Text>
                <Text style={styles.tableWeight}>{Math.round(estimated1RM * 0.80)} kg</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tablePercent}>75% (10 ism.)</Text>
                <Text style={styles.tableWeight}>{Math.round(estimated1RM * 0.75)} kg</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      
      {activeTab === 'categories' && (
        <View style={styles.tabContent}>
          <Text style={styles.filterTitle}>Szűrés célzott izomcsoport szerint:</Text>
          <View style={styles.categoryChipsRow}>
            {['Összes', 'Láb', 'Mellkas', 'Hát'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  selectedCategory === cat && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredExercises.map((exercise) => {
            const pr = records[exercise.id];
            return (
              <View key={exercise.id} style={styles.prCard}>
                <View style={styles.prCardLeft}>
                  <View style={styles.exerciseIconWrapper}>
                    <Text style={styles.exerciseIcon}>💪</Text>
                  </View>
                  <View style={styles.exerciseDetails}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.categoryTagText}>{exercise.category}</Text>
                  </View>
                </View>
                <View style={styles.prCardRight}>
                  <Text style={styles.weightNumber}>{pr?.weight || 0} kg</Text>
                  <Text style={styles.repsText}>{pr?.reps || 1} ism.</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Vissza az áttekintéshez</Text>
      </TouchableOpacity>

      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Egyéni rekord (PR) rögzítése</Text>

            <Text style={styles.inputLabel}>Válassz gyakorlatot:</Text>
            <View style={styles.exercisePickerContainer}>
              {exercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[
                    styles.pickerChip,
                    selectedExerciseId === ex.id && styles.pickerChipActive,
                  ]}
                  onPress={() => {
                    setSelectedExerciseId(ex.id);
                    const existing = records[ex.id];
                    if (existing) {
                      setInputWeight(existing.weight.toString());
                      setInputReps(existing.reps?.toString() || '1');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      selectedExerciseId === ex.id && styles.pickerChipTextActive,
                    ]}
                  >
                    {ex.id === 'squats' ? 'Guggolás' : ex.id === 'benchpress' ? 'Fekvenyomás' : 'Felhúzás'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Súly (kg):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Pl. 120"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="numeric"
              value={inputWeight}
              onChangeText={setInputWeight}
            />

            <Text style={styles.inputLabel}>Ismétlésszám (ism.):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Pl. 1"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="number-pad"
              value={inputReps}
              onChangeText={setInputReps}
            />

            <Text style={styles.inputLabel}>Megjegyzés (opcionális):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Pl. Új személyes csúcs"
              placeholderTextColor={colors.neutral[400]}
              value={inputNotes}
              onChangeText={setInputNotes}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelButtonText}>Mégse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSavePr}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Mentés</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default PersonalStatsScreen;

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
    fontSize: 16,
    color: colors.neutral[600],
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.text,
  },
  subGreetingText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
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
  totalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  totalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCardTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#94A3B8',
  },
  badge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  totalWeightNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
  },
  totalSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 18,
  },
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#334155',
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  quickStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickStatExercise: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  addPrButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPrButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  prList: {
    marginBottom: 20,
  },
  prCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  prCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseIcon: {
    fontSize: 22,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: colors.neutral[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryTagText: {
    fontSize: 11,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  recordDateText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  prCardRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  weightUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[600],
    marginLeft: 2,
  },
  repsText: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  editButton: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EEF2F6',
  },
  editButtonText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  calcCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  calcTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
  },
  calcSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
    marginBottom: 16,
  },
  calcInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calcInputCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  calcInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 4,
  },
  calcInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.text,
  },
  resultBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    color: '#94A3B8',
    fontWeight: '700',
  },
  resultValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#38BDF8',
    marginVertical: 4,
  },
  resultSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tableHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  tableGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  tablePercent: {
    fontSize: 13,
    color: colors.neutral[600],
  },
  tableWeight: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  backButton: {
    backgroundColor: colors.neutral[200],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backButtonText: {
    color: colors.neutral[800],
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  exercisePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pickerChip: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  pickerChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  modalCancelButton: {
    backgroundColor: colors.neutral[200],
  },
  modalCancelButtonText: {
    color: colors.neutral[700],
    fontWeight: '600',
    fontSize: 15,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
