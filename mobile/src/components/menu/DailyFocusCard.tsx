import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { WorkoutPlan } from '../../services/workoutService';
import { colors } from '../../themes/tokens';

interface DailyFocusCardProps {
    workoutPlans: WorkoutPlan[];
    selectedPlanIndex: number;
    onSelectPlan: (index: number) => void;
    onStartWorkout: () => void;
    onViewProgress: () => void;
    onViewAllPlans: () => void;
}

export const DailyFocusCard: React.FC<DailyFocusCardProps> = ({
    workoutPlans,
    selectedPlanIndex,
    onSelectPlan,
    onStartWorkout,
    onViewProgress,
    onViewAllPlans,
}) => {
    const currentFocusPlan = workoutPlans[selectedPlanIndex] || workoutPlans[0];

    return (
        <View style={styles.container}>
            
            <View style={styles.sectionHeaderRow}>
                <View>
                    <Text style={styles.sectionTitle}>Mai fókusz</Text>
                    <Text style={styles.sectionSub}>Előre definiált edzéstervek a fitnesz
                        céljaidhoz</Text>
                </View>
                <TouchableOpacity onPress={onViewAllPlans}>
                    <Text style={styles.viewAllLink}>Mind ({workoutPlans.length}) ›</Text>
                </TouchableOpacity>
            </View>

            
            {workoutPlans.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.planSelectorRow}
                >
                    {workoutPlans.map((plan, index) => {
                        const isSelected = index === selectedPlanIndex;
                        return (
                            <TouchableOpacity
                                key={plan.id}
                                style={[styles.planPill, isSelected && styles.planPillActive]}
                                activeOpacity={0.8}
                                onPress={() => onSelectPlan(index)}
                            >
                                <Text style={[styles.planPillText, isSelected &&
                                    styles.planPillTextActive]}>
                                    {plan.name.split(' ')[0]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            
            {currentFocusPlan && (
                <View style={styles.focusWorkoutCard}>
                    <View style={styles.focusWorkoutTop}>
                        <View>
                            <View style={styles.focusPlanBadge}>
                                <Text style={styles.focusPlanBadgeText}>MAI AJÁNLÁS</Text>
                            </View>
                            <Text style={styles.focusWorkoutName}>{currentFocusPlan.name}</Text>
                            <Text
                                style={styles.focusWorkoutCategory}>{currentFocusPlan.category}</Text>
                        </View>

                        <View style={styles.focusDurationBadge}>
                            <Text style={styles.focusDurationText}>⏱️
                                {currentFocusPlan.durationEst}</Text>
                        </View>
                    </View>

                    <Text style={styles.focusWorkoutDesc} numberOfLines={2}>
                        {currentFocusPlan.description}
                    </Text>

                    
                    <View style={styles.exercisesPreviewWrapper}>
                        <Text style={styles.exercisesPreviewHeading}>
                            Tartalmazott gyakorlatok ({currentFocusPlan.exercises.length}):
                        </Text>
                        <View style={styles.exerciseChipsRow}>
                            {currentFocusPlan.exercises.slice(0, 4).map((ex, idx) => (
                                <View key={idx} style={styles.singleExChip}>
                                    <Text style={styles.singleExChipText}>• {ex.name}</Text>
                                </View>
                            ))}
                            {currentFocusPlan.exercises.length > 4 && (
                                <View style={[styles.singleExChip, {
                                    backgroundColor: '#E2E8F0'
                                }]}>
                                    <Text style={[styles.singleExChipText, {
                                        color:
                                            colors.neutral[700]
                                    }]}>
                                        +{currentFocusPlan.exercises.length - 4} további
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    
                    <View style={styles.focusActionRow}>
                        <TouchableOpacity
                            style={styles.startWorkoutPrimaryBtn}
                            activeOpacity={0.85}
                            onPress={onStartWorkout}
                        >
                            <Text style={styles.startWorkoutBtnText}>Edzés megtekintése &
                                Indítás ▶</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.viewProgressBtn}
                            activeOpacity={0.85}
                            onPress={onViewProgress}
                        >
                            <Text style={styles.viewProgressBtnText}>Előzmények</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
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
    viewAllLink: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    planSelectorRow: {
        paddingVertical: 4,
        marginBottom: 10,
    },
    planPill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    planPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    planPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.neutral[700],
    },
    planPillTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    focusWorkoutCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    focusWorkoutTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    focusPlanBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 4,
        alignSelf: 'flex-start',
    },
    focusPlanBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#92400E',
        letterSpacing: 0.5,
    },
    focusWorkoutName: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.neutral[900],
    },
    focusWorkoutCategory: {
        fontSize: 12,
        color: colors.neutral[500],
        marginTop: 1,
    },
    focusDurationBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    focusDurationText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.neutral[800],
    },
    focusWorkoutDesc: {
        fontSize: 13,
        color: colors.neutral[600],
        lineHeight: 18,
        marginBottom: 12,
    },
    exercisesPreviewWrapper: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        marginBottom: 14,
    },
    exercisesPreviewHeading: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.neutral[500],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    exerciseChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    singleExChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    singleExChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary,
    },
    focusActionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    startWorkoutPrimaryBtn: {
        flex: 2,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startWorkoutBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    viewProgressBtn: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewProgressBtnText: {
        color: colors.neutral[800],
        fontWeight: '600',
        fontSize: 13,
    },
});