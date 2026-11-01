 import React from 'react';                                                                          
    import {                                                                                            
      View,                                                                                             
      Text,                                                                                             
      StyleSheet,                                                                                       
      TouchableOpacity,                                                                                 
    } from 'react-native';                                                                              
    import { colors } from '../../themes/tokens';                                                       
                                                                                                        
    interface QuickLogBarProps {                                                                        
      onOpenMealModal: () => void;                                                                      
      onOpenWaterModal: () => void;                                                                     
      onOpenWorkoutModal: () => void;                                                                   
    }                                                                                                   
                                                                                                        
    export const QuickLogBar: React.FC<QuickLogBarProps> = ({                                           
      onOpenMealModal,                                                                                  
      onOpenWaterModal,                                                                                 
      onOpenWorkoutModal,                                                                               
    }) => {                                                                                             
      return (                                                                                          
        <View style={styles.container}>                                                                 
          {/* Szekció fejléc */}                                                                        
          <View style={styles.sectionHeaderRow}>                                                        
            <View>                                                                                      
              <Text style={styles.sectionTitle}>Gyors rögzítés</Text>                                   
              <Text style={styles.sectionSub}>Azonnali bevitel és naplózás</Text>                       
            </View>                                                                                     
          </View>                                                                                       
                                                                                                        
          {/* 3 gombos rács */}                                                                         
          <View style={styles.quickLogGrid}>                                                            
            {/* 1. Étkezés Rögzítése */}                                                                
            <TouchableOpacity                                                                           
              style={[styles.quickLogButton, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}   
              activeOpacity={0.75}                                                                      
              onPress={onOpenMealModal}                                                                 
            >                                                                                           
              <View style={[styles.quickLogIconContainer, { backgroundColor: '#DCFCE7' }]}>             
                <Text style={styles.quickLogEmoji}>🥗</Text>                                            
              </View>                                                                                   
              <Text style={styles.quickLogTitle}>Étkezés</Text>                                         
              <Text style={styles.quickLogSubtitle}>Kalóriák & ételek</Text>                            
            </TouchableOpacity>                                                                         
                                                                                                        
            {/* 2. Vízbevitel */}                                                                       
            <TouchableOpacity                                                                           
              style={[styles.quickLogButton, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}   
              activeOpacity={0.75}                                                                      
              onPress={onOpenWaterModal}                                                                
            >                                                                                           
              <View style={[styles.quickLogIconContainer, { backgroundColor: '#E0F2FE' }]}>             
                <Text style={styles.quickLogEmoji}>💧</Text>                                            
              </View>                                                                                   
              <Text style={styles.quickLogTitle}>Vízbevitel</Text>                                      
              <Text style={styles.quickLogSubtitle}>Pohár / kulacs</Text>                               
            </TouchableOpacity>                                                                         
                                                                                                        
            {/* 3. Edzés Indítás / Rögzítés */}                                                         
            <TouchableOpacity                                                                           
              style={[styles.quickLogButton, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}   
              activeOpacity={0.75}                                                                      
              onPress={onOpenWorkoutModal}                                                              
            >                                                                                           
              <View style={[styles.quickLogIconContainer, { backgroundColor: '#F3E8FF' }]}>             
                <Text style={styles.quickLogEmoji}>🏋️</Text>                                            
              </View>                                                                                   
              <Text style={styles.quickLogTitle}>Edzés</Text>                                           
              <Text style={styles.quickLogSubtitle}>Terv vagy széria</Text>                             
            </TouchableOpacity>                                                                         
          </View>                                                                                       
        </View>                                                                                         
      );                                                                                                
    };                                                                                                  
                                                                                                        
    const styles = StyleSheet.create({                                                                  
      container: {                                                                                      
        marginBottom: 8,                                                                                
      },                                                                                                
      sectionHeaderRow: {                                                                               
        flexDirection: 'row',                                                                           
        justifyContent: 'space-between',                                                                
        alignItems: 'center',                                                                           
        marginBottom: 12,                                                                               
      },                                                                                                
      sectionTitle: {                                                                                   
        fontSize: 16,                                                                                   
        fontWeight: '800',                                                                              
        color: colors.neutral[900],                                                                     
        letterSpacing: -0.3,                                                                            
      },                                                                                                
      sectionSub: {                                                                                     
        fontSize: 12,                                                                                   
        color: colors.neutral[500],                                                                     
        marginTop: 1,                                                                                   
      },                                                                                                
      quickLogGrid: {                                                                                   
        flexDirection: 'row',                                                                           
        justifyContent: 'space-between',                                                                
        marginBottom: 16,                                                                               
      },                                                                                                
      quickLogButton: {                                                                                 
        flex: 1,                                                                                        
        borderRadius: 16,                                                                               
        paddingVertical: 14,                                                                            
        paddingHorizontal: 8,                                                                           
        alignItems: 'center',                                                                           
        marginHorizontal: 4,                                                                            
        borderWidth: 1.5,                                                                               
        shadowColor: '#000',                                                                            
        shadowOffset: { width: 0, height: 1 },                                                          
        shadowOpacity: 0.03,                                                                            
        shadowRadius: 4,                                                                                
        elevation: 1,                                                                                   
      },                                                                                                
      quickLogIconContainer: {                                                                          
        width: 44,                                                                                      
        height: 44,                                                                                     
        borderRadius: 22,                                                                               
        alignItems: 'center',                                                                           
        justifyContent: 'center',                                                                       
        marginBottom: 8,                                                                                
      },                                                                                                
      quickLogEmoji: {                                                                                  
        fontSize: 22,                                                                                   
      },                                                                                                
      quickLogTitle: {                                                                                  
        fontSize: 13,                                                                                   
        fontWeight: '700',                                                                              
        color: colors.neutral[900],                                                                     
        marginBottom: 2,                                                                                
      },                                                                                                
      quickLogSubtitle: {                                                                               
        fontSize: 10,                                                                                   
        fontWeight: '500',                                                                              
        color: colors.neutral[500],                                                                     
        textAlign: 'center',                                                                            
      },                                                                                                
    });