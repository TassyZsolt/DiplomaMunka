import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { ExerciseDoc } from '../../services/exerciseService';
import { auth } from '../../../firebaseConfig';
import { colors } from '../../themes/tokens';

interface ExercisePickerModalProps {
    visible: boolean;
    exercises: ExerciseDoc[];
    onClose: () => void;
    onSelectExercise: (exercise: ExerciseDoc) => void;
    onDeleteExercise: (exercise: ExerciseDoc) => void;
    onOpenCreateCustom: () => void;
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
    visible,
    exercises,
    onClose,
    onSelectExercise,
    onDeleteExercise,
    onOpenCreateCustom,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Összes');

    const filteredExercises = useMemo(() => {
        return exercises.filter((ex) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                ex.name.toLowerCase().includes(q) ||
                (ex.englishName && ex.englishName.toLowerCase().includes(q)) ||
                ex.muscleGroup.toLowerCase().includes(q);

            if (selectedCategoryFilter === 'Összes') return matchesSearch;
            if (selectedCategoryFilter === 'Súlyzós') return matchesSearch &&
                ex.category === 'gym';
            if (selectedCategoryFilter === 'Saját testsúly') return matchesSearch &&
                ex.category === 'calisthenics';
            if (selectedCategoryFilter === 'Mobilitás') return matchesSearch &&
                ex.category === 'mobility';
            return matchesSearch;
        });
    }, [exercises, searchQuery, selectedCategoryFilter]);

    const currentUserId = auth.currentUser?.uid;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Gyakorlat Kiválasztása</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeBtnText}>✕</Text>
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
                            style={[styles.catChip, selectedCategoryFilter === cat &&
                                styles.catChipActive]}
                            onPress={() => setSelectedCategoryFilter(cat)}
                        >
                            <Text style={[styles.catChipText, selectedCategoryFilter === cat &&
                                styles.catChipTextActive]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Új egyéni gyakorlat létrehozása gomb */}
                <TouchableOpacity style={styles.createCustomRowBtn}
                    onPress={onOpenCreateCustom}>
                    <Text style={styles.createCustomRowText}>
                        + Nem találod? Hozz létre új egyéni gyakorlatot!
                    </Text>
                </TouchableOpacity>

                {/* Gyakorlatok listája */}
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {filteredExercises.map((ex) => {
                        const canDelete = Boolean(
                            ex.isCustom &&
                            ((currentUserId && ex.userId === currentUserId) || (!currentUserId
                                && ex.userId === 'guest'))
                        );

                        return (
                            <View key={ex.id} style={styles.exerciseListItem}>
                                <TouchableOpacity
                                    style={{ flex: 1 }}
                                    onPress={() => onSelectExercise(ex)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.titleRow}>
                                        <Text style={styles.exListTitle}>{ex.name}</Text>
                                        {ex.isCustom && (
                                            <View style={styles.customBadge}>
                                                <Text style={styles.customBadgeText}>[Saját]</Text>
                                            </View>
                                        )}
                                    </View>
                                    {ex.englishName ? (
                                        <Text style={styles.exListEnglishName}>{ex.englishName}</Text>
                                    ) : null}

                                    <View style={styles.badgesRow}>
                                        <View style={[styles.exBadge, {
                                            backgroundColor: '#FEF3C7'
                                        }]}>
                                            <Text style={[styles.exBadgeText, { color: '#B45309' }]}>
                                                {ex.muscleGroup.toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={[styles.exBadge, {
                                            backgroundColor: '#F3E8FF'
                                        }]}>
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

                                <View style={styles.actionButtons}>
                                    {canDelete && (
                                        <TouchableOpacity
                                            style={styles.deleteIconBtn}
                                            onPress={() => onDeleteExercise(ex)}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            accessibilityLabel="Gyakorlat törlése"
                                        >
                                            <Text style={{ fontSize: 15 }}>🗑️</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={styles.selectArrow}
                                        onPress={() => onSelectExercise(ex)}
                                    >
                                        <Text style={{
                                            fontSize: 18, color: colors.primary,
                                            fontWeight: '700'
                                        }}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
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
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '700',
    },
    searchBarWrapper: {
        paddingHorizontal: 16,
        marginTop: 12,
    },
    searchBarInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    categoryFilterRow: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    catChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    catChipActive: {
        backgroundColor: '#0EA5E9',
        borderColor: '#0284C7',
    },
    catChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    catChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    createCustomRowBtn: {
        marginHorizontal: 16,
        marginBottom: 10,
        paddingVertical: 10,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        alignItems: 'center',
    },
    createCustomRowText: {
        fontSize: 13,
        color: '#0284C7',
        fontWeight: '700',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    exerciseListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    exListTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    customBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    customBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0369A1',
    },
    exListEnglishName: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
    },
    exBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    exBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deleteIconBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
    },
    selectArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
});