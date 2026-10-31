import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {
    ExerciseDoc,
    ExerciseCategory,
    MuscleGroup,
    TrackingType,
    createCustomExercise,
} from '../../services/exerciseService';

interface CustomExerciseModalProps {
    visible: boolean;
    onClose: () => void;
    onExerciseCreated: (exercise: ExerciseDoc) => void;
}

export const CustomExerciseModal: React.FC<CustomExerciseModalProps> = ({
    visible,
    onClose,
    onExerciseCreated,
}) => {
    const [name, setName] = useState('');
    const [englishName, setEnglishName] = useState('');
    const [category, setCategory] = useState<ExerciseCategory>('gym');
    const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('mellkas');
    const [trackingType, setTrackingType] =
        useState<TrackingType>('reps_and_weight');
    const [isSaving, setIsSaving] = useState(false);

    const resetForm = () => {
        setName('');
        setEnglishName('');
        setCategory('gym');
        setMuscleGroup('mellkas');
        setTrackingType('reps_and_weight');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Hiányzó adat', 'Kérlek add meg a gyakorlat nevét!');
            return;
        }

        try {
            setIsSaving(true);
            const created = await createCustomExercise({
                name: name.trim(),
                englishName: englishName.trim() || name.trim(),
                category,
                muscleGroup,
                trackingType,
                equipment: 'none',
            });

            onExerciseCreated(created);
            Alert.alert('Sikeres létrehozás 🎉', `A(z) "${created.name}" gyakorlat      
          bekerült a listába!`);
            handleClose();
        } catch (e: any) {
            Alert.alert('Hiba', e.message || 'Nem sikerült létrehozni a gyakorlatot.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent
            onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Új Gyakorlat Hozzáadása</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <Text style={styles.formLabel}>Gyakorlat magyar neve *</Text>
                    <TextInput
                        style={styles.formInput}
                        placeholder="pl. Oldalemelés kézisúlyzóval"
                        placeholderTextColor="#94A3B8"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.formLabel}>Angol elnevezés (opcionális)</Text>
                    <TextInput
                        style={styles.formInput}
                        placeholder="pl. Lateral Raise"
                        placeholderTextColor="#94A3B8"
                        value={englishName}
                        onChangeText={setEnglishName}
                    />

                    {/* Kategória */}
                    <Text style={styles.formLabel}>Kategória</Text>
                    <View style={styles.pillsRow}>
                        {(['gym', 'calisthenics', 'mobility'] as ExerciseCategory[]).map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.pill, category === c && styles.pillActive]}
                                onPress={() => setCategory(c)}
                            >
                                <Text style={[styles.pillText, category === c &&
                                    styles.pillTextActive]}>
                                    {c === 'gym' ? 'Súlyzós' : c === 'calisthenics' ? 'Saját testsúly' : 'Mobilitás'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Izomcsoport */}
                    <Text style={styles.formLabel}>Cél izomcsoport</Text>
                    <View style={styles.pillsRow}>
                        {(['mellkas', 'hat', 'vall', 'lab', 'kar', 'torzs'] as
                            MuscleGroup[]).map((mg) => (
                                <TouchableOpacity
                                    key={mg}
                                    style={[styles.pill, muscleGroup === mg && styles.pillActive]}
                                    onPress={() => setMuscleGroup(mg)}
                                >
                                    <Text style={[styles.pillText, muscleGroup === mg &&
                                        styles.pillTextActive]}>
                                        {mg}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </View>

                    {/* Mérés módja */}
                    <Text style={styles.formLabel}>Mérés módja (Tracking Type)</Text>
                    <View style={styles.pillsRow}>
                        {(['reps_and_weight', 'reps_only', 'time_hold'] as
                            TrackingType[]).map((tt) => (
                                <TouchableOpacity
                                    key={tt}
                                    style={[styles.pill, trackingType === tt && styles.pillActive]}
                                    onPress={() => setTrackingType(tt)}
                                >
                                    <Text style={[styles.pillText, trackingType === tt &&
                                        styles.pillTextActive]}>
                                        {tt === 'reps_and_weight'
                                            ? 'Súly & Ismétlés'
                                            : tt === 'reps_only'
                                                ? 'Csak Ismétlés'
                                                : 'Időtartam (mp)'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </View>

                    {/* Mentés Gomb */}
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}
                        disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.saveBtnText}>Mentés az Adatbázisba ✓</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'flex-end',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '90%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '700',
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 12,
        marginBottom: 6,
    },
    formInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pillActive: {
        backgroundColor: '#0EA5E9',
        borderColor: '#0284C7',
    },
    pillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    pillTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    saveBtn: {
        backgroundColor: '#0EA5E9',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});            