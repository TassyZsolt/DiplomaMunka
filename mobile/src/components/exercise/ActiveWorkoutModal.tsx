import React, { useState, useEffect } from 'react';                                                                     
    import {                                                                                                                
      View,                                                                                                                 
      Text,                                                                                                                 
      TextInput,                                                                                                            
      TouchableOpacity,                                                                                                     
      Modal,                                                                                                                
      ScrollView,                                                                                                           
      StyleSheet,                                                                                                           
      ActivityIndicator,                                                                                                    
      Alert,                                                                                                                
    } from 'react-native';                                                                                                  
    import {                                                                                                                
      WorkoutPlan,                                                                                                          
      WorkoutExercise,                                                                                                      
      saveWorkoutSession,                                                                                                   
    } from '../../services/workoutService';                                                                                 
    import { ExerciseDoc } from '../../services/exerciseService';                                                           
    import { ExercisePickerModal } from './ExercisePickerModal';                                                            
    import { colors } from '../../themes/tokens';                                                                           
                                                                                                                            
    interface ActiveWorkoutModalProps {                                                                                     
      visible: boolean;                                                                                                     
      plan: WorkoutPlan | null;                                                                                             
      availableExercises: ExerciseDoc[];                                                                                    
      onClose: () => void;                                                                                                  
      onWorkoutFinished: () => void;                                                                                        
      onOpenCreateCustomExercise: () => void;                                                                               
      onDeleteCustomExercise: (exercise: ExerciseDoc) => void;                                                              
    }                                                                                                                       
                                                                                                                            
    export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({                                                 
      visible,                                                                                                              
      plan,                                                                                                                 
      availableExercises,                                                                                                   
      onClose,                                                                                                              
      onWorkoutFinished,                                                                                                    
      onOpenCreateCustomExercise,                                                                                           
      onDeleteCustomExercise,                                                                                               
    }) => {                                                                                                                 
      const [exercises, setExercises] = useState<WorkoutExercise[]>([]);                                                    
      const [timerSeconds, setTimerSeconds] = useState(0);                                                                  
      const [notes, setNotes] = useState('');                                                                               
      const [isSaving, setIsSaving] = useState(false);                                                                      
      const [isPickerVisible, setIsPickerVisible] = useState(false);                                                        
                                                                                                                            
      // Initialize workout when modal opens                                                                                
      useEffect(() => {                                                                                                     
        if (visible) {                                                                                                      
          setTimerSeconds(0);                                                                                               
          setNotes('');                                                                                                     
          if (plan) {                                                                                                       
            const initialized: WorkoutExercise[] = plan.exercises.map((pEx) => ({                                           
              exerciseId: pEx.exerciseId,                                                                                   
              name: pEx.name,                                                                                               
              trackingType: pEx.trackingType,                                                                               
              muscleGroup: pEx.muscleGroup,                                                                                 
              sets: Array.from({ length: pEx.defaultSets }, (_, i) => ({                                                    
                setNumber: i + 1,                                                                                           
                reps: pEx.defaultReps,                                                                                      
                weightKg: pEx.defaultWeight,                                                                                
                durationSeconds: pEx.defaultDurationSeconds,                                                                
                completed: false,                                                                                           
              })),                                                                                                          
            }));                                                                                                            
            setExercises(initialized);                                                                                      
          } else {                                                                                                          
            setExercises([]);                                                                                               
          }                                                                                                                 
        }                                                                                                                   
      }, [visible, plan]);                                                                                                  
                                                                                                                            
      // Timer interval                                                                                                     
      useEffect(() => {                                                                                                     
        let interval: any = null;                                                                                           
        if (visible) {                                                                                                      
          interval = setInterval(() => {                                                                                    
            setTimerSeconds((prev) => prev + 1);                                                                            
          }, 1000);                                                                                                         
        }                                                                                                                   
        return () => {                                                                                                      
          if (interval) clearInterval(interval);                                                                            
        };                                                                                                                  
      }, [visible]);                                                                                                        
                                                                                                                            
      const formatTimer = (totalSeconds: number) => {                                                                       
        const mins = Math.floor(totalSeconds / 60);                                                                         
        const secs = totalSeconds % 60;                                                                                     
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;                                   
      };                                                                                                                    
                                                                                                                            
      const handleToggleSetComplete = (exIdx: number, setIdx: number) => {                                                  
        setExercises((prev) => {                                                                                            
          const updated = [...prev];                                                                                        
          updated[exIdx].sets[setIdx].completed = !updated[exIdx].sets[setIdx].completed;                                   
          return updated;                                                                                                   
        });                                                                                                                 
      };                                                                                                                    
                                                                                                                            
      const handleUpdateSetField = (                                                                                        
        exIdx: number,                                                                                                      
        setIdx: number,                                                                                                     
        field: 'weightKg' | 'reps' | 'durationSeconds',                                                                     
        val: string                                                                                                         
      ) => {                                                                                                                
        const num = parseFloat(val) || 0;                                                                                   
        setExercises((prev) => {                                                                                            
          const updated = [...prev];                                                                                        
          updated[exIdx].sets[setIdx][field] = num;                                                                         
          return updated;                                                                                                   
        });                                                                                                                 
      };                                                                                                                    
                                                                                                                            
      const handleAddSet = (exIdx: number) => {                                                                             
        setExercises((prev) => {                                                                                            
          const updated = [...prev];                                                                                        
          const ex = updated[exIdx];                                                                                        
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
                                                                                                                            
      const handleRemoveSet = (exIdx: number, setIdx: number) => {                                                          
        setExercises((prev) => {                                                                                            
          const updated = [...prev];                                                                                        
          if (updated[exIdx].sets.length > 1) {                                                                             
            updated[exIdx].sets.splice(setIdx, 1);                                                                          
            updated[exIdx].sets.forEach((s, i) => (s.setNumber = i + 1));                                                   
          }                                                                                                                 
          return updated;                                                                                                   
        });                                                                                                                 
      };                                                                                                                    
                                                                                                                            
      const handleAddExerciseFromPicker = (ex: ExerciseDoc) => {                                                            
        const newEx: WorkoutExercise = {                                                                                    
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
        setExercises((prev) => [...prev, newEx]);                                                                           
        setIsPickerVisible(false);                                                                                          
      };                                                                                                                    
                                                                                                                            
      const handleFinish = async () => {                                                                                    
        const totalSetsCompleted = exercises.reduce(                                                                        
          (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,                                                     
          0                                                                                                                 
        );                                                                                                                  
                                                                                                                            
        if (totalSetsCompleted === 0) {                                                                                     
          Alert.alert(                                                                                                      
            'Nincs kész sorozat',                                                                                           
            'Legalább 1 sorozatot jelölj meg befejezettként (pipa) a mentés előtt!'                                         
          );                                                                                                                
          return;                                                                                                           
        }                                                                                                                   
                                                                                                                            
        try {                                                                                                               
          setIsSaving(true);                                                                                                
          const durationMin = Math.max(1, Math.round(timerSeconds / 60));                                                   
                                                                                                                            
          const saved = await saveWorkoutSession({                                                                          
            title: plan ? plan.name : 'Egyéni Edzés',                                                                       
            planId: plan?.id,                                                                                               
            date: new Date().toISOString().split('T')[0],                                                                   
            durationMinutes: durationMin,                                                                                   
            exercises,                                                                                                      
            notes,                                                                                                          
          });                                                                                                               
                                                                                                                            
          Alert.alert(                                                                                                      
            'Edzés sikeresen elmentve! 🏆',                                                                                 
            `Időtartam: ${durationMin} perc\nÖsszes teljesített sorozat: ${saved.totalSets}\nÖsszvolumen:                   
            ${saved.totalVolumeKg} kg\n\nAz új rekordjaid (PR) automatikusan frissültek!`                                   
          );                                                                                                                
          onWorkoutFinished();                                                                                              
        } catch (err: any) {                                                                                                
          Alert.alert('Hiba', err.message || 'Nem sikerült elmenteni az edzést.');                                          
        } finally {                                                                                                         
          setIsSaving(false);                                                                                               
        }                                                                                                                   
      };                                                                                                                    
                                                                                                                            
      const handleConfirmClose = () => {                                                                                    
        Alert.alert('Edzés megszakítása', 'Biztosan kilépsz? A nem mentett adatok elvesznek.', [                            
          { text: 'Még folytatom', style: 'cancel' },                                                                       
          { text: 'Kilépés', style: 'destructive', onPress: onClose },                                                      
        ]);                                                                                                                 
      };                                                                                                                    
                                                                                                                            
      return (                                                                                                              
        <Modal visible={visible} animationType="slide" onRequestClose={handleConfirmClose}>                                 
          <View style={styles.container}>                                                                                   
                                                                                                              
            <View style={styles.header}>                                                                                    
              <View>                                                                                                        
                <Text style={styles.title}>{plan?.name || 'Aktív Edzés'}</Text>                                             
                <Text style={styles.timer}>⏱️ {formatTimer(timerSeconds)}</Text>                                            
              </View>                                                                                                       
              <TouchableOpacity style={styles.closeBtn} onPress={handleConfirmClose}>                                       
                <Text style={styles.closeBtnText}>✕</Text>                                                                  
              </TouchableOpacity>                                                                                           
            </View>                                                                                                         
                                                                                                                            
                                                                                                      
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>                                        
              {exercises.map((ex, exIdx) => (                                                                               
                <View key={exIdx} style={styles.exerciseCard}>                                                              
                  <View style={styles.exCardHeader}>                                                                        
                    <Text style={styles.exName}>{ex.name}</Text>                                                            
                    <Text style={styles.exMuscleBadge}>{ex.muscleGroup.toUpperCase()}</Text>                                
                  </View>                                                                                                   
                                                                                                                            
                                                                                                         
                  <View style={styles.setRowHeader}>                                                                        
                    <Text style={[styles.setColHeader, { width: 36 }]}>#</Text>                                             
                    {ex.trackingType !== 'time_hold' && (                                                                   
                      <Text style={[styles.setColHeader, { flex: 1 }]}>                                                     
                        {ex.trackingType === 'reps_and_weight' ? 'Súly (kg)' : 'Típus'}                                     
                      </Text>                                                                                               
                    )}                                                                                                      
                    {ex.trackingType !== 'time_hold' ? (                                                                    
                      <Text style={[styles.setColHeader, { flex: 1 }]}>Ismétlés</Text>                                      
                    ) : (                                                                                                   
                      <Text style={[styles.setColHeader, { flex: 2 }]}>Időtartam (mp)</Text>                                
                    )}                                                                                                      
                    <Text style={[styles.setColHeader, { width: 44, textAlign: 'center' }]}>Kész</Text>                     
                    <Text style={{ width: 24 }} />                                                                          
                  </View>                                                                                                   
                                                                                                                            
                                                                                                                
                  {ex.sets.map((set, setIdx) => (                                                                           
                    <View                                                                                                   
                      key={setIdx}                                                                                          
                      style={[styles.setRow, set.completed && styles.setRowCompleted]}                                      
                    >                                                                                                       
                      <Text style={[styles.setNumberText, { width: 36 }]}>{set.setNumber}</Text>                            
                                                                                                                            
                      {ex.trackingType === 'reps_and_weight' ? (                                                            
                        <TextInput                                                                                          
                          style={styles.setInput}                                                                           
                          keyboardType="numeric"                                                                            
                          value={set.weightKg ? String(set.weightKg) : ''}                                                  
                          placeholder="kg"                                                                                  
                          placeholderTextColor="#94A3B8"                                                                    
                          onChangeText={(val) =>                                                                            
                            handleUpdateSetField(exIdx, setIdx, 'weightKg', val)                                            
                          }                                                                                                 
                        />                                                                                                  
                      ) : ex.trackingType === 'reps_only' ? (                                                               
                        <Text style={[styles.bodyweightLabel, { flex: 1 }]}>Testsúly</Text>                                 
                      ) : null}                                                                                             
                                                                                                                            
                      {ex.trackingType !== 'time_hold' ? (                                                                  
                        <TextInput                                                                                          
                          style={styles.setInput}                                                                           
                          keyboardType="numeric"                                                                            
                          value={set.reps ? String(set.reps) : ''}                                                          
                          placeholder="ism"                                                                                 
                          placeholderTextColor="#94A3B8"                                                                    
                          onChangeText={(val) => handleUpdateSetField(exIdx, setIdx, 'reps', val)}                          
                        />                                                                                                  
                      ) : (                                                                                                 
                        <TextInput                                                                                          
                          style={styles.setInput}                                                                           
                          keyboardType="numeric"                                                                            
                          value={set.durationSeconds ? String(set.durationSeconds) : ''}                                    
                          placeholder="mp"                                                                                  
                          placeholderTextColor="#94A3B8"                                                                    
                          onChangeText={(val) =>                                                                            
                            handleUpdateSetField(exIdx, setIdx, 'durationSeconds', val)                                     
                          }                                                                                                 
                        />                                                                                                  
                      )}                                                                                                    
                                                                                                                            
                      <TouchableOpacity                                                                                     
                        style={[styles.checkBtn, set.completed && styles.checkBtnCompleted]}                                
                        onPress={() => handleToggleSetComplete(exIdx, setIdx)}                                              
                      >                                                                                                     
                        <Text style={styles.checkBtnText}>{set.completed ? '✓' : ''}</Text>                                 
                      </TouchableOpacity>                                                                                   
                                                                                                                            
                      {ex.sets.length > 1 ? (                                                                               
                        <TouchableOpacity                                                                                   
                          onPress={() => handleRemoveSet(exIdx, setIdx)}                                                    
                          style={styles.removeSetBtn}                                                                       
                        >                                                                                                   
                          <Text style={styles.removeSetText}>✕</Text>                                                       
                        </TouchableOpacity>                                                                                 
                      ) : (                                                                                                 
                        <View style={{ width: 24 }} />                                                                      
                      )}                                                                                                    
                    </View>                                                                                                 
                  ))}                                                                                                       
                                                                                                                            
                  <TouchableOpacity style={styles.addSetBtn} onPress={() => handleAddSet(exIdx)}>                           
                    <Text style={styles.addSetBtnText}>+ Sorozat hozzáadása</Text>                                          
                  </TouchableOpacity>                                                                                       
                </View>                                                                                                     
              ))}                                                                                                           
                                                                                                                            
                                                                                
              <TouchableOpacity                                                                                             
                style={styles.addMoreExBtn}                                                                                 
                onPress={() => setIsPickerVisible(true)}                                                                    
              >                                                                                                             
                <Text style={styles.addMoreExBtnText}>+ További Gyakorlat Hozzáadása</Text>                                 
              </TouchableOpacity>                                                                                           
                                                                                                                            
                                                                                                               
              <Text style={styles.notesLabel}>Edzés jegyzetek (opcionális)</Text>                                           
              <TextInput                                                                                                    
                style={styles.notesInput}                                                                                   
                placeholder="Milyen volt az edzés? pl. Jó energiaszint, fekvenyomás könnyen ment..."                        
                placeholderTextColor="#94A3B8"                                                                              
                value={notes}                                                                                               
                onChangeText={setNotes}                                                                                     
                multiline                                                                                                   
              />                                                                                                            
                                                                                                                            
                                                                                                       
              <TouchableOpacity                                                                                             
                style={styles.finishBtn}                                                                                    
                onPress={handleFinish}                                                                                      
                disabled={isSaving}                                                                                         
              >                                                                                                             
                {isSaving ? (                                                                                               
                  <ActivityIndicator color="#FFFFFF" size="small" />                                                        
                ) : (                                                                                                       
                  <Text style={styles.finishBtnText}>Edzés Befejezése és Mentése 🏆</Text>                                  
                )}                                                                                                          
              </TouchableOpacity>                                                                                           
                                                                                                                            
              <View style={{ height: 40 }} />                                                                               
            </ScrollView>                                                                                                   
          </View>                                                                                                           
                                                                                                                            
                                                                                               
          <ExercisePickerModal                                                                                              
            visible={isPickerVisible}                                                                                       
            exercises={availableExercises}                                                                                  
            onClose={() => setIsPickerVisible(false)}                                                                       
            onSelectExercise={handleAddExerciseFromPicker}                                                                  
            onDeleteExercise={onDeleteCustomExercise}                                                                       
            onOpenCreateCustom={onOpenCreateCustomExercise}                                                                 
          />                                                                                                                
        </Modal>                                                                                                            
      );                                                                                                                    
    };                                                                                                                      
                                                                                                                            
    const styles = StyleSheet.create({                                                                                      
      container: {                                                                                                          
        flex: 1,                                                                                                            
        backgroundColor: '#F8FAFC',                                                                                         
        paddingTop: 45,                                                                                                     
      },                                                                                                                    
      header: {                                                                                                             
        flexDirection: 'row',                                                                                               
        justifyContent: 'space-between',                                                                                    
        alignItems: 'center',                                                                                               
        paddingHorizontal: 20,                                                                                              
        paddingVertical: 14,                                                                                                
        backgroundColor: '#FFFFFF',                                                                                         
        borderBottomWidth: 1,                                                                                               
        borderBottomColor: '#E2E8F0',                                                                                       
      },                                                                                                                    
      title: {                                                                                                              
        fontSize: 18,                                                                                                       
        fontWeight: '800',                                                                                                  
        color: '#0F172A',                                                                                                   
      },                                                                                                                    
      timer: {                                                                                                              
        fontSize: 14,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: '#0EA5E9',                                                                                                   
        marginTop: 2,                                                                                                       
      },                                                                                                                    
      closeBtn: {                                                                                                           
        width: 32,                                                                                                          
        height: 32,                                                                                                         
        borderRadius: 16,                                                                                                   
        backgroundColor: '#F1F5F9',                                                                                         
        justifyContent: 'center',                                                                                           
        alignItems: 'center',                                                                                               
      },                                                                                                                    
      closeBtnText: {                                                                                                       
        fontSize: 14,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: '#64748B',                                                                                                   
      },                                                                                                                    
      exerciseCard: {                                                                                                       
        backgroundColor: '#FFFFFF',                                                                                         
        borderRadius: 16,                                                                                                   
        padding: 16,                                                                                                        
        marginBottom: 16,                                                                                                   
        borderWidth: 1,                                                                                                     
        borderColor: '#E2E8F0',                                                                                             
      },                                                                                                                    
      exCardHeader: {                                                                                                       
        flexDirection: 'row',                                                                                               
        justifyContent: 'space-between',                                                                                    
        alignItems: 'center',                                                                                               
        marginBottom: 12,                                                                                                   
      },                                                                                                                    
      exName: {                                                                                                             
        fontSize: 16,                                                                                                       
        fontWeight: '800',                                                                                                  
        color: '#0F172A',                                                                                                   
        flex: 1,                                                                                                            
      },                                                                                                                    
      exMuscleBadge: {                                                                                                      
        fontSize: 10,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: '#64748B',                                                                                                   
        backgroundColor: '#F1F5F9',                                                                                         
        paddingHorizontal: 8,                                                                                               
        paddingVertical: 4,                                                                                                 
        borderRadius: 6,                                                                                                    
      },                                                                                                                    
      setRowHeader: {                                                                                                       
        flexDirection: 'row',                                                                                               
        alignItems: 'center',                                                                                               
        paddingBottom: 6,                                                                                                   
        borderBottomWidth: 1,                                                                                               
        borderBottomColor: '#F1F5F9',                                                                                       
        marginBottom: 8,                                                                                                    
        gap: 8,                                                                                                             
      },                                                                                                                    
      setColHeader: {                                                                                                       
        fontSize: 11,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: '#94A3B8',                                                                                                   
        textTransform: 'uppercase',                                                                                         
      },                                                                                                                    
      setRow: {                                                                                                             
        flexDirection: 'row',                                                                                               
        alignItems: 'center',                                                                                               
        paddingVertical: 6,                                                                                                 
        gap: 8,                                                                                                             
      },                                                                                                                    
      setRowCompleted: {                                                                                                    
        opacity: 0.6,                                                                                                       
      },                                                                                                                    
      setNumberText: {                                                                                                      
        fontSize: 13,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: '#64748B',                                                                                                   
      },                                                                                                                    
      setInput: {                                                                                                           
        flex: 1,                                                                                                            
        backgroundColor: '#F8FAFC',                                                                                         
        borderWidth: 1,                                                                                                     
        borderColor: '#CBD5E1',                                                                                             
        borderRadius: 8,                                                                                                    
        paddingVertical: 6,                                                                                                 
        paddingHorizontal: 8,                                                                                               
        fontSize: 13,                                                                                                       
        color: '#0F172A',                                                                                                   
        textAlign: 'center',                                                                                                
      },                                                                                                                    
      bodyweightLabel: {                                                                                                    
        fontSize: 12,                                                                                                       
        color: '#64748B',                                                                                                   
        fontStyle: 'italic',                                                                                                
        textAlign: 'center',                                                                                                
      },                                                                                                                    
      checkBtn: {                                                                                                           
        width: 34,                                                                                                          
        height: 34,                                                                                                         
        borderRadius: 10,                                                                                                   
        borderWidth: 2,                                                                                                     
        borderColor: '#CBD5E1',                                                                                             
        backgroundColor: '#FFFFFF',                                                                                         
        justifyContent: 'center',                                                                                           
        alignItems: 'center',                                                                                               
      },                                                                                                                    
      checkBtnCompleted: {                                                                                                  
        backgroundColor: '#10B981',                                                                                         
        borderColor: '#10B981',                                                                                             
      },                                                                                                                    
      checkBtnText: {                                                                                                       
        color: '#FFFFFF',                                                                                                   
        fontSize: 16,                                                                                                       
        fontWeight: '800',                                                                                                  
      },                                                                                                                    
      removeSetBtn: {                                                                                                       
        width: 24,                                                                                                          
        alignItems: 'center',                                                                                               
        justifyContent: 'center',                                                                                           
      },                                                                                                                    
      removeSetText: {                                                                                                      
        fontSize: 12,                                                                                                       
        color: '#DC2626',                                                                                                   
        fontWeight: '700',                                                                                                  
      },                                                                                                                    
      addSetBtn: {                                                                                                          
        marginTop: 10,                                                                                                      
        paddingVertical: 8,                                                                                                 
        alignItems: 'center',                                                                                               
        backgroundColor: '#F0F9FF',                                                                                         
        borderRadius: 10,                                                                                                   
        borderWidth: 1,                                                                                                     
        borderColor: '#BAE6FD',                                                                                             
      },                                                                                                                    
      addSetBtnText: {                                                                                                      
        fontSize: 12,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: '#0284C7',                                                                                                   
      },                                                                                                                    
      addMoreExBtn: {                                                                                                       
        paddingVertical: 12,                                                                                                
        alignItems: 'center',                                                                                               
        backgroundColor: '#FFFFFF',                                                                                         
        borderRadius: 14,                                                                                                   
        borderWidth: 1.5,                                                                                                   
        borderStyle: 'dashed',                                                                                              
        borderColor: '#0EA5E9',                                                                                             
        marginBottom: 20,                                                                                                   
      },                                                                                                                    
      addMoreExBtnText: {                                                                                                   
        fontSize: 14,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: '#0EA5E9',                                                                                                   
      },                                                                                                                    
      notesLabel: {                                                                                                         
        fontSize: 13,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: '#334155',                                                                                                   
        marginBottom: 6,                                                                                                    
      },                                                                                                                    
      notesInput: {                                                                                                         
        backgroundColor: '#FFFFFF',                                                                                         
        borderWidth: 1.5,                                                                                                   
        borderColor: '#E2E8F0',                                                                                             
        borderRadius: 12,                                                                                                   
        paddingHorizontal: 14,                                                                                              
        paddingVertical: 10,                                                                                                
        fontSize: 14,                                                                                                       
        color: '#0F172A',                                                                                                   
        height: 80,                                                                                                         
        marginBottom: 20,                                                                                                   
      },                                                                                                                    
      finishBtn: {                                                                                                          
        backgroundColor: '#10B981',                                                                                         
        borderRadius: 14,                                                                                                   
        paddingVertical: 14,                                                                                                
        alignItems: 'center',                                                                                               
        shadowColor: '#10B981',                                                                                             
        shadowOffset: { width: 0, height: 4 },                                                                              
        shadowOpacity: 0.25,                                                                                                
        shadowRadius: 8,                                                                                                    
        elevation: 4,                                                                                                       
      },                                                                                                                    
      finishBtnText: {                                                                                                      
        color: '#FFFFFF',                                                                                                   
        fontSize: 16,                                                                                                       
        fontWeight: '800',                                                                                                  
      },                                                                                                                    
    });