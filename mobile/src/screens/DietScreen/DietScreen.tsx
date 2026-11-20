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
import { colors, spacing, borderRadius, shadows } from '../../themes/tokens';
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
  };

  const handleAddMeal = async () => {
    const cals = parseInt(mealCalories, 10);
    if (isNaN(cals) || cals <= 0 || cals > 3500) {
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
          placeholderTextColor={colors.textLight}
          value={mealName}
          onChangeText={setMealName}
        />

        <TextInput
          style={styles.textInput}
          placeholder="Kalória (kcal, pl. 380)"
          placeholderTextColor={colors.textLight}
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
            <ActivityIndicator color={colors.white} size="small" />
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
    backgroundColor: colors.background,
  },
  content: {
    padding: 18,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.header,
    padding: 18,
    marginBottom: spacing.xl,
    borderLeftWidth: 5,
    borderLeftColor: colors.success,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.successDark,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  summaryGoal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  percentBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.successText,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.xs,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: spacing.xs,
  },
  dietSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dietTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dietTabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dietTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dietTabBtnTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  dietDetailCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dietDetailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  dietDetailDesc: {
    fontSize: 13,
    color: colors.slate[600],
    lineHeight: 18,
    marginBottom: 10,
  },
  macrosBadge: {
    backgroundColor: colors.borderLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
  },
  macrosBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  addMealCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addMealTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealTypeChipActive: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  mealTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate[600],
  },
  mealTypeChipTextActive: {
    color: colors.successDark,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  saveMealBtn: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  saveMealBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  emptyMealsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyMealsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyMealsSub: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },

  mealsListWrapper: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  mealItemLeft: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mealItemType: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  mealItemCalories: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },
});