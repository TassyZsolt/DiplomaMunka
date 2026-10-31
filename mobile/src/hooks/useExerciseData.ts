import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import {
    WorkoutPlan,
    getWorkoutPlans,
    getCustomWorkoutPlans,
    deleteCustomWorkoutPlan,
} from '../services/workoutService';
import {
    ExerciseDoc,
    fetchAvailableExercises,
    deleteCustomExercise,
} from '../services/exerciseService';

export const useExerciseData = () => {
    const [templatePlans, setTemplatePlans] = useState<WorkoutPlan[]>([]);
    const [customPlans, setCustomPlans] = useState<WorkoutPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
    const [exercisesDb, setExercisesDb] = useState<ExerciseDoc[]>([]);

    const loadAllData = async () => {
        try {
            setLoadingPlans(true);
            setTemplatePlans(getWorkoutPlans());

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

    const addCustomPlan = (newPlan: WorkoutPlan) => {
        setCustomPlans((prev) => [newPlan, ...prev]);
    };

    const addCustomExercise = (newEx: ExerciseDoc) => {
        setExercisesDb((prev) => [newEx, ...prev]);
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
                        try {
                            await deleteCustomWorkoutPlan(plan.id);
                            setCustomPlans((prev) => prev.filter((p) => p.id !== plan.id));
                        } catch (err: any) {
                            Alert.alert('Hiba', err.message || 'Nem sikerült törölni az edzéstervet.');
                        }
                    },
                },
            ]
        );
    };

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

    return {
        templatePlans,
        customPlans,
        loadingPlans,
        exercisesDb,
        addCustomPlan,
        addCustomExercise,
        handleDeletePlan,
        handleDeleteCustomExercise,
        refreshData: loadAllData,
    };
};         