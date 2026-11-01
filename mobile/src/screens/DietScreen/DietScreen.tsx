import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../themes/tokens';
import {
  getTodayMeals,
  getTodayConsumedCalories,
  addMealData,
  DEFAULT_DAILY_CALORIE_GOAL,
  MealEntry,
} from '../../services/dietService';

const DIET_TYPES = [
  {
    id: 'Regular',
    title: 'Hagyományos',
    desc: 'Kiegyensúlyozott fehérje, szénhidrát és zsír arány.',
    macros: '50% Szénhidrát • 25% Fehérje • 25% Zsír',
  },
  {
    id: 'Ketogenic',
    title: 'Ketogén',
    desc: 'Magas zsír- és minimális szénhidrátbevitel a ketózis eléréséhez.',
    macros: '70% Zsír • 25% Fehérje • 5% Szénhidrát',
  },
  {
    id: 'Vegan',
    title: 'Vegán',
    desc: 'Teljes mértékben növényi alapú táplálkozás.',
    macros: '55% Szénhidrát • 25% Fehérje • 20% Zsír',
  },
];

const DietScreen = ({ navigation }: any) => {
  const [selectedDiet, setSelectedDiet] = useState<string>('Regular');
  const [consumedCalories, setConsumedCalories] = useState<number>(0);
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Új étkezés gyors hozzáadás űrlap
  const [mealName, setMealName] = useState<string>('');
  const [mealCalories, setMealCalories] = useState<string>('');
  const [mealType, setMealType] = useState<string>('Ebéd');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Adatok betöltése képernyőre lépéskor
  const loadDietData = async () => {
    try {
      const [cals, meals] = await Promise.all([
        getTodayConsumedCalories(),
        getTodayMeals(),
      ]);
      setConsumedCalories(cals);
      setTodayMeals(meals);
    } catch (e) {
      console.warn('Hiba az étrend adatok betöltésekor:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDietData();
    }, [])
  );

  const handleSelectDiet = (typeId: string) => {
    setSelectedDiet(typeId);
    const target = DIET_TYPES.find((d) => d.id === typeId);
    Alert.alert('Étrend kiválasztva', `Aktív étrend: ${target?.title || typeId}`);
  };

  const handleAddMeal = async () => {
    const cals = parseInt(mealCalories, 10);
    if (isNaN(cals) || cals <= 0) {
      Alert.alert('Hiba', 'Kérlek adj meg érvényes kalóriaértéket!');
      return;
    }

    try {
      setIsSaving(true);
      await addMealData(mealName.trim() || `${mealType} étkezés`, cals, mealType);
      setMealName('');
      setMealCalories('');
      await loadDietData();
      Alert.alert('Sikeres mentés 🎉', `${cals} kcal rögzítve! A Főmenü automatikusan frissül.`);
    } catch (e: any) {
      Alert.alert('Hiba', e.message || 'Nem sikerült elmenteni az étkezést.');
    } finally {
      setIsSaving(false);
    }
  };

  const caloriePercent = Math.min(
    100,
    Math.round((consumedCalories / DEFAULT_DAILY_CALORIE_GOAL) * 100)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.summaryLabel}>MAI ELFOGYASZTOTT KALÓRIA</Text>
            <Text style={styles.summaryValue}>
              {consumedCalories}{' '}
              <Text style={styles.summaryGoal}>/ {DEFAULT_DAILY_CALORIE_GOAL} kcal</Text>
            </Text>
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>{caloriePercent}%</Text>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${caloriePercent}%` }]} />
        </View>

        <Text style={styles.remainingText}>
          {Math.max(0, DEFAULT_DAILY_CALORIE_GOAL - consumedCalories)} kcal maradt a napi célból
        </Text>
      </View>

      
      <Text style={styles.sectionHeading}>Válassz étrend típust:</Text>
      <View style={styles.dietSelectorRow}>
        {DIET_TYPES.map((diet) => {
          const isSelected = selectedDiet === diet.id;
          return (
            <TouchableOpacity
              key={diet.id}
              style={[styles.dietTabBtn, isSelected && styles.dietTabBtnActive]}
              activeOpacity={0.8}
              onPress={() => handleSelectDiet(diet.id)}
            >
              <Text style={[styles.dietTabBtnText, isSelected && styles.dietTabBtnTextActive]}>
                {diet.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      
      {(() => {
        const active = DIET_TYPES.find((d) => d.id === selectedDiet) || DIET_TYPES[0];
        return (
          <View style={styles.dietDetailCard}>
            <Text style={styles.dietDetailTitle}>🥗 {active.title} étrend</Text>
            <Text style={styles.dietDetailDesc}>{active.desc}</Text>
            <View style={styles.macrosBadge}>
              <Text style={styles.macrosBadgeText}>📊 {active.macros}</Text>
            </View>
          </View>
        );
      })()}

      
      <View style={styles.addMealCard}>
        <Text style={styles.addMealTitle}>➕ Étkezés hozzáadása</Text>

        <View style={styles.mealTypeRow}>
          {['Reggeli', 'Ebéd', 'Vacsora', 'Snack'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.mealTypeChip, mealType === type && styles.mealTypeChipActive]}
              onPress={() => setMealType(type)}
            >
              <Text style={[styles.mealTypeChipText, mealType === type && styles.mealTypeChipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="Étel neve (pl. Zabkása gyümölcsökkel)"
          placeholderTextColor="#94A3B8"
          value={mealName}
          onChangeText={setMealName}
        />

        <TextInput
          style={styles.textInput}
          placeholder="Kalória (kcal, pl. 380)"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={mealCalories}
          onChangeText={setMealCalories}
        />

        <TouchableOpacity
          style={styles.saveMealBtn}
          onPress={handleAddMeal}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveMealBtnText}>Kalória hozzáadása a mai naphoz</Text>
          )}
        </TouchableOpacity>
      </View>

      
      <Text style={styles.sectionHeading}>Mai rögzített étkezések ({todayMeals.length}):</Text>
      {todayMeals.length === 0 ? (
        <View style={styles.emptyMealsCard}>
          <Text style={styles.emptyMealsText}>Még nem rögzítettél étkezést ma.</Text>
          <Text style={styles.emptyMealsSub}>Használd a fenti űrlapot vagy a Főmenü gyors naplózóját!</Text>
        </View>
      ) : (
        <View style={styles.mealsListWrapper}>
          {todayMeals.map((meal, index) => (
            <View key={meal.id || index} style={styles.mealItemRow}>
              <View style={styles.mealItemLeft}>
                <Text style={styles.mealItemName}>{meal.name}</Text>
                <Text style={styles.mealItemType}>{meal.mealType || 'Étkezés'}</Text>
              </View>
              <Text style={styles.mealItemCalories}>+{meal.calories} kcal</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

export default DietScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 18,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.neutral[900],
    marginTop: 2,
  },
  summaryGoal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[400],
  },
  percentBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[500],
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 10,
    marginTop: 4,
  },
  dietSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dietTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dietTabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dietTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  dietTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  dietDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dietDetailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  dietDetailDesc: {
    fontSize: 13,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 10,
  },
  macrosBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  macrosBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },

  addMealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addMealTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mealTypeChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  mealTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  mealTypeChipTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.neutral[900],
    marginBottom: 10,
  },
  saveMealBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveMealBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  emptyMealsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyMealsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 4,
  },
  emptyMealsSub: {
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
  },

  mealsListWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mealItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mealItemLeft: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  mealItemType: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  mealItemCalories: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
});