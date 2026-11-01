import React from 'react';                                                                                              
    import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';                                                
    import { WorkoutPlan } from '../../services/workoutService';                                                            
    import { colors } from '../../themes/tokens';                                                                           
                                                                                                                            
    interface WorkoutPlanCardProps {                                                                                        
      plan: WorkoutPlan;                                                                                                    
      onStartWorkout: (plan: WorkoutPlan) => void;                                                                          
      onDeletePlan?: (plan: WorkoutPlan) => void;                                                                           
    }                                                                                                                       
                                                                                                                            
    export const WorkoutPlanCard: React.FC<WorkoutPlanCardProps> = ({                                                       
      plan,                                                                                                                 
      onStartWorkout,                                                                                                       
      onDeletePlan,                                                                                                         
    }) => {                                                                                                                 
      const getEmoji = () => {                                                                                              
        if (plan.id === 'ppl') return '🏋️';                                                                                 
        if (plan.id === 'beginner_full_body') return '🏃';                                                                  
        if (!plan.isCustom) return '⚡';                                                                                    
        return '🏋️';                                                                                                        
      };                                                                                                                    
                                                                                                                            
      const isCustom = Boolean(plan.isCustom);                                                                              
                                                                                                                            
      return (                                                                                                              
        <View style={styles.planCard}>                                                                                      
                                                                                                              
          <View style={styles.planCardHeader}>                                                                              
            <View style={{ flex: 1 }}>                                                                                      
              <View style={styles.titleRow}>                                                                                
                <Text style={styles.planCardEmoji}>{getEmoji()}</Text>                                                      
                <Text style={styles.planCardTitle}>{plan.name}</Text>                                                       
              </View>                                                                                                       
              <Text style={styles.planCardMeta}>                                                                            
                {plan.frequency || '3 nap / hét'} • {plan.category} • {plan.durationEst}                                    
              </Text>                                                                                                       
            </View>                                                                                                         
                                                                                                                            
            {isCustom && onDeletePlan ? (                                                                                   
              <TouchableOpacity onPress={() => onDeletePlan(plan)} style={styles.deletePlanBtn}>                            
                <Text style={styles.deletePlanBtnText}>🗑️</Text>                                                            
              </TouchableOpacity>                                                                                           
            ) : !isCustom ? (                                                                                               
              <View style={styles.templateBadge}>                                                                           
                <Text style={styles.templateBadgeText}>SABLON</Text>                                                        
              </View>                                                                                                       
            ) : null}                                                                                                       
          </View>                                                                                                           
                                                                                                                            
                                                                                                         
          <Text style={styles.planCardDesc} numberOfLines={2}>                                                              
            {plan.description}                                                                                              
          </Text>                                                                                                           
                                                                                                                            
                                                                                                      
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
            onPress={() => onStartWorkout(plan)}                                                                            
          >                                                                                                                 
            <Text style={styles.openPlanBtnText}>Megnyitás & Edzés Indítása ▶</Text>                                        
          </TouchableOpacity>                                                                                               
        </View>                                                                                                             
      );                                                                                                                    
    };                                                                                                                      
                                                                                                                            
    const styles = StyleSheet.create({                                                                                      
      planCard: {                                                                                                           
        backgroundColor: '#FFFFFF',                                                                                         
        borderRadius: 18,                                                                                                   
        padding: 18,                                                                                                        
        marginBottom: 16,                                                                                                   
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
        marginBottom: 8,                                                                                                    
      },                                                                                                                    
      titleRow: {                                                                                                           
        flexDirection: 'row',                                                                                               
        alignItems: 'center',                                                                                               
        gap: 6,                                                                                                             
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
        color: '#64748B',                                                                                                   
        marginTop: 2,                                                                                                       
      },                                                                                                                    
      deletePlanBtn: {                                                                                                      
        padding: 6,                                                                                                         
        borderRadius: 8,                                                                                                    
        backgroundColor: '#FEE2E2',                                                                                         
      },                                                                                                                    
      deletePlanBtnText: {                                                                                                  
        fontSize: 14,                                                                                                       
      },                                                                                                                    
      templateBadge: {                                                                                                      
        backgroundColor: '#FEF3C7',                                                                                         
        paddingHorizontal: 8,                                                                                               
        paddingVertical: 3,                                                                                                 
        borderRadius: 6,                                                                                                    
      },                                                                                                                    
      templateBadgeText: {                                                                                                  
        fontSize: 10,                                                                                                       
        fontWeight: '800',                                                                                                  
        color: '#B45309',                                                                                                   
        letterSpacing: 0.5,                                                                                                 
      },                                                                                                                    
      planCardDesc: {                                                                                                       
        fontSize: 13,                                                                                                       
        color: '#475569',                                                                                                   
        lineHeight: 18,                                                                                                     
        marginBottom: 12,                                                                                                   
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
        borderRadius: 6,                                                                                                    
      },                                                                                                                    
      miniExChipText: {                                                                                                     
        fontSize: 11,                                                                                                       
        color: '#475569',                                                                                                   
        fontWeight: '600',                                                                                                  
      },                                                                                                                    
      openPlanBtn: {                                                                                                        
        backgroundColor: '#F8FAFC',                                                                                         
        borderRadius: 12,                                                                                                   
        paddingVertical: 12,                                                                                                
        alignItems: 'center',                                                                                               
        borderWidth: 1.5,                                                                                                   
        borderColor: '#E2E8F0',                                                                                             
      },                                                                                                                    
      openPlanBtnText: {                                                                                                    
        fontSize: 14,                                                                                                       
        fontWeight: '700',                                                                                                  
        color: colors.primary,                                                                                              
      },                                                                                                                    
    });