import React, { useState } from 'react';                                                                                
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
      KeyboardAvoidingView,                                                                                                 
      Platform,                                                                                                             
    } from 'react-native';                                                                                                  
    import {                                                                                                                
      WorkoutPlan,                                                                                                          
      WorkoutPlanExercise,                                                                                                  
      saveCustomWorkoutPlan,                                                                                                
    } from '../../services/workoutService';                                                                                 
    import { ExerciseDoc } from '../../services/exerciseService';                                                           
    import { ExercisePickerModal } from './ExercisePickerModal';                                                            
    import { colors } from '../../themes/tokens';                                                                           
                                                                                                                            
    interface PlanCreatorModalProps {                                                                                       
      visible: boolean;                                                                                                     
      onClose: () => void;                                                                                                  
      onPlanCreated: (newPlan: WorkoutPlan) => void;                                                                        
      availableExercises: ExerciseDoc[];                                                                                    
      onOpenCreateCustomExercise: () => void;                                                                               
      onDeleteCustomExercise: (exercise: ExerciseDoc) => void;                                                              
    }                                                                                                                       
                                                                                                                            
    export const PlanCreatorModal: React.FC<PlanCreatorModalProps> = ({                                                     
      visible,                                                                                                              
      onClose,                                                                                                              
      onPlanCreated,                                                                                                        
      availableExercises,                                                                                                   
      onOpenCreateCustomExercise,                                                                                           
      onDeleteCustomExercise,                                                                                               
    }) => {                                                                                                                 
      const [name, setName] = useState('');                                                                                 
      const [description, setDescription] = useState('');                                                                   
      const [category, setCategory] = useState('Izomtömeg-növelés');                                                        
      const [frequency, setFrequency] = useState('3 nap / hét');                                                            
      const [duration, setDuration] = useState('60 perc');                                                                  
      const [exercises, setExercises] = useState<WorkoutPlanExercise[]>([]);                                                
      const [isSaving, setIsSaving] = useState(false);                                                                      
      const [isPickerVisible, setIsPickerVisible] = useState(false);                                                        
                                                                                                                            
      const resetForm = () => {                                                                                             
        setName('');                                                                                                        
        setDescription('');                                                                                                 
        setCategory('Izomtömeg-növelés');                                                                                   
        setFrequency('3 nap / hét');                                                                                        
        setDuration('60 perc');                                                                                             
        setExercises([]);                                                                                                   
      };                                                                                                                    
                                                                                                                            
      const handleClose = () => {                                                                                           
        resetForm();                                                                                                        
        onClose();                                                                                                          
      };                                                                                                                    
                                                                                                                            
      const handleAddExerciseFromPicker = (ex: ExerciseDoc) => {                                                            
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
        setExercises((prev) => [...prev, newPlanEx]);                                                                       
        setIsPickerVisible(false);                                                                                          
      };                                                                                                                    
                                                                                                                            
      const handleSave = async () => {                                                                                      
        if (!name.trim()) {                                                                                                 
          Alert.alert('Hiányzó adat', 'Kérlek adj meg egy nevet az edzéstervnek!');                                         
          return;                                                                                                           
        }                                                                                                                   
        if (exercises.length === 0) {                                                                                       
          Alert.alert('Hiányzó gyakorlatok', 'Kérlek adj hozzá legalább 1 gyakorlatot a tervhez!');                         
          return;                                                                                                           
        }                                                                                                                   
                                                                                                                            
        try {                                                                                                               
          setIsSaving(true);                                                                                                
          const saved = await saveCustomWorkoutPlan({                                                                       
            name: name.trim(),                                                                                              
            category,                                                                                                       
            frequency,                                                                                                      
            durationEst: duration,                                                                                          
            description: description.trim() || 'Egyéni edzésterv céljaid eléréséhez.',                                      
            exercises,                                                                                                      
          });                                                                                                               
                                                                                                                            
          onPlanCreated(saved);                                                                                             
          Alert.alert('Sikeres mentés 🎉', `A(z) "${saved.name}" edzésterv sikeresen elkészült!`);                          
          handleClose();                                                                                                    
        } catch (e: any) {                                                                                                  
          Alert.alert('Hiba', e.message || 'Nem sikerült elmenteni az edzéstervet.');                                       
        } finally {                                                                                                         
          setIsSaving(false);                                                                                               
        }                                                                                                                   
      };                                                                                                                    
                                                                                                                            
      return (                                                                                                              
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>                                        
          <KeyboardAvoidingView                                                                                             
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}                                                        
            style={styles.container}                                                                                        
          >                                                                                                                 
            <View style={styles.header}>                                                                                    
              <Text style={styles.headerTitle}>Új Edzésterv Tervezése</Text>                                                
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>                                              
                <Text style={styles.closeBtnText}>✕</Text>                                                                  
              </TouchableOpacity>                                                                                           
            </View>                                                                                                         
                                                                                                                            
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18 }}>                                        
              <Text style={styles.formLabel}>Edzésterv neve *</Text>                                                        
              <TextInput                                                                                                    
                style={styles.formInput}                                                                                    
                placeholder="pl. PPL - Push Pull Legs, Saját Lábnap"                                                        
                placeholderTextColor="#94A3B8"                                                                              
                value={name}                                                                                                
                onChangeText={setName}                                                                                      
              />                                                                                                            
                                                                                                                            
              <View style={{ flexDirection: 'row', gap: 10 }}>                                                              
                <View style={{ flex: 1 }}>                                                                                  
                  <Text style={styles.formLabel}>Gyakoriság</Text>                                                          
                  <TextInput                                                                                                
                    style={styles.formInput}                                                                                
                    placeholder="pl. 3 nap / hét"                                                                           
                    placeholderTextColor="#94A3B8"                                                                          
                    value={frequency}                                                                                       
                    onChangeText={setFrequency}                                                                             
                  />                                                                                                        
                </View>                                                                                                     
                                                                                                                            
                <View style={{ flex: 1 }}>                                                                                  
                  <Text style={styles.formLabel}>Becsült idő</Text>                                                         
                  <TextInput                                                                                                
                    style={styles.formInput}                                                                                
                    placeholder="pl. 60 perc"                                                                               
                    placeholderTextColor="#94A3B8"                                                                          
                    value={duration}                                                                                        
                    onChangeText={setDuration}                                                                              
                  />                                                                                                        
                </View>                                                                                                     
              </View>                                                                                                       
                                                                                                                            
              <Text style={styles.formLabel}>Kategória / Fókusz</Text>                                                      
              <View style={styles.categoryPillsRow}>                                                                        
                {['Izomtömeg-növelés', 'Erőnlét', 'Szálkásítás', 'Állóképesség'].map((cat) => (                             
                  <TouchableOpacity                                                                                         
                    key={cat}                                                                                               
                    style={[styles.categoryPill, category === cat && styles.categoryPillActive]}                            
                    onPress={() => setCategory(cat)}                                                                        
                  >                                                                                                         
                    <Text style={[styles.categoryPillText, category === cat && styles.categoryPillTextActive]}>             
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
                value={description}                                                                                         
                onChangeText={setDescription}                                                                               
                multiline                                                                                                   
              />                                                                                                            
                                                                                                                            
                                                                                            
              <View style={styles.planExercisesHeaderRow}>                                                                  
                <Text style={styles.sectionHeaderTitle}>Gyakorlatok ({exercises.length})</Text>                             
                <TouchableOpacity                                                                                           
                  style={styles.addExToPlanBtn}                                                                             
                  onPress={() => setIsPickerVisible(true)}                                                                  
                >                                                                                                           
                  <Text style={styles.addExToPlanBtnText}>+ Gyakorlat hozzáadása</Text>                                     
                </TouchableOpacity>                                                                                         
              </View>                                                                                                       
                                                                                                                            
              {exercises.length === 0 ? (                                                                                   
                <View style={styles.emptyExBox}>                                                                            
                  <Text style={styles.emptyExText}>Még nem adtál hozzá gyakorlatot a tervhez.</Text>                        
                  <Text style={styles.emptyExSub}>Kattints a fenti "+ Gyakorlat hozzáadása" gombra!</Text>                  
                </View>                                                                                                     
              ) : (                                                                                                         
                exercises.map((ex, idx) => (                                                                                
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
                      onPress={() => setExercises((prev) => prev.filter((_, i) => i !== idx))}                              
                      style={styles.removeExBtn}                                                                            
                    >                                                                                                       
                      <Text style={styles.removeExBtnText}>✕</Text>                                                         
                    </TouchableOpacity>                                                                                     
                  </View>                                                                                                   
                ))                                                                                                          
              )}                                                                                                            
                                                                                                                            
              <TouchableOpacity                                                                                             
                style={styles.savePlanPrimaryBtn}                                                                           
                onPress={handleSave}                                                                                        
                disabled={isSaving}                                                                                         
              >                                                                                                             
                {isSaving ? (                                                                                               
                  <ActivityIndicator color="#FFFFFF" size="small" />                                                        
                ) : (                                                                                                       
                  <Text style={styles.savePlanPrimaryBtnText}>Edzésterv Mentése 💾</Text>                                   
                )}                                                                                                          
              </TouchableOpacity>                                                                                           
                                                                                                                            
              <View style={{ height: 40 }} />                                                                               
            </ScrollView>                                                                                                   
          </KeyboardAvoidingView>                                                                                           
                                                                                                                            
                                                                                
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
        backgroundColor: '#FFFFFF',                                                                                         
      },                                                                                                                    
      header: {                                                                                                             
        flexDirection: 'row',                                                                                               
        justifyContent: 'space-between',                                                                                    
        alignItems: 'center',                                                                                               
        paddingHorizontal: 20,                                                                                              
        paddingVertical: 16,                                                                                                
        borderBottomWidth: 1,                                                                                               
        borderBottomColor: '#F1F5F9',                                                                                       
        paddingTop: Platform.OS === 'ios' ? 50 : 20,                                                                        
      },                                                                                                                    
      headerTitle: {                                                                                                        
        fontSize: 18,                                                                                                       
        fontWeight: '800',                                                                                                  
        color: '#0F172A',                                                                                                   
      },                                                                                                                    
      closeBtn: {                                                                                                           
        width: 32,                                                                                                          
        height: 32,                                                                                                         
        borderRadius: 16,                                                                                                   
        backgroundColor: '#F1F5F9',                                                                                         
        alignItems: 'center',                                                                                               
        justifyContent: 'center',                                                                                           
      },                                                                                                                    
      closeBtnText: {                                                                                                       
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
    });  