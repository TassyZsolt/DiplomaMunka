import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { colors, spacing, borderRadius, shadows } from '../../themes/tokens';
import placeholderAvatar from '../../../assets/images/placeholderAvatar.jpg';

const FITNESS_GOALS = [
  'Izomtömeg-növelés',
  'Szálkásítás / Fogyás',
  'Erőnlét növelése',
  'Állóképesség',
  'Egészségmegőrzés',
];

const EditProfileScreen = ({ route, navigation }: any) => {
  const userData = route?.params?.userData || {};

  const [lastName, setLastName] = useState<string>(userData.lastName || '');
  const [firstName, setFirstName] = useState<string>(userData.firstName || '');
  const [weight, setWeight] = useState<string>(userData.weight ? String(userData.weight) : '');
  const [height, setHeight] = useState<string>(userData.height ? String(userData.height) : '');
  const [age, setAge] = useState<string>(userData.age ? String(userData.age) : '');
  const [gender, setGender] = useState<string>(userData.gender || 'Férfi');
  const [fitnessGoal, setFitnessGoal] = useState<string>(userData.fitnessGoal || 'Izomtömeg-növelés');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(!route?.params?.userData);

  useEffect(() => {
    if (!route?.params?.userData) {
      getUserProfile()
        .then((profile) => {
          if (profile) {
            setLastName(profile.lastName || '');
            setFirstName(profile.firstName || '');
            if (profile.weight) setWeight(String(profile.weight));
            if (profile.height) setHeight(String(profile.height));
            if (profile.age) setAge(String(profile.age));
            if (profile.gender) setGender(profile.gender);
            if (profile.fitnessGoal) setFitnessGoal(profile.fitnessGoal);
          }
        })
        .catch((err) => console.warn('Nem sikerült betölteni a profilt:', err))
        .finally(() => setLoadingProfile(false));
    }
  }, []);

  const handleSave = async () => {
    // 1. Név érvényesítés
    if (!lastName.trim() || !firstName.trim()) {
      Alert.alert('Hiányzó adat', 'Kérlek add meg a vezeték- és keresztnevedet!');
      return;
    }

    // 2. Testsúly érvényesítés (ha meg van adva)
    let parsedWeight: number | null = null;
    if (weight.trim()) {
      parsedWeight = parseFloat(weight.trim().replace(',', '.'));
      if (isNaN(parsedWeight) || parsedWeight < 30 || parsedWeight > 300) {
        Alert.alert('Érvénytelen testsúly', 'A testsúly 30 és 300 kg között lehet!');
        return;
      }
    }

    // 3. Magasság érvényesítés (ha meg van adva)
    let parsedHeight: number | null = null;
    if (height.trim()) {
      parsedHeight = parseFloat(height.trim().replace(',', '.'));
      if (isNaN(parsedHeight) || parsedHeight < 100 || parsedHeight > 250) {
        Alert.alert('Érvénytelen magasság', 'A testmagasság 100 és 250 cm között lehet!');
        return;
      }
    }

    // 4. Életkor érvényesítés (ha meg van adva)
    let parsedAge: number | null = null;
    if (age.trim()) {
      parsedAge = parseInt(age.trim(), 10);
      if (isNaN(parsedAge) || parsedAge < 12 || parsedAge > 120) {
        Alert.alert('Érvénytelen életkor', 'Az életkor 12 és 120 év között lehet!');
        return;
      }
    }

    try {
      setIsSaving(true);

      // Delegálva a userService-hez a rétegarchitektúra szerint
      await updateUserProfile({
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        weight: parsedWeight,
        height: parsedHeight,
        age: parsedAge,
        gender,
        fitnessGoal,
      });

      Alert.alert('Sikeres mentés 🎉', 'A profilod adatai sikeresen frissültek!');
      navigation.goBack();
    } catch (err: any) {
      console.error('Hiba a profil mentésekor:', err);
      Alert.alert('Hiba', err.message || 'Nem sikerült elmenteni a módosításokat.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={[styles.screenWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screenWrapper}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AVATAR ELŐNÉZET */}
        <View style={styles.avatarContainer}>
          <Image source={placeholderAvatar} style={styles.avatarImage} />
          <Text style={styles.avatarSubNote}>Profilkép (alapértelmezett)</Text>
        </View>

        {/* SZEMÉLYES ADATOK SZEKCIÓ */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Személyes Adatok</Text>

          <Text style={styles.inputLabel}>Vezetéknév *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="pl. Kovács"
            placeholderTextColor={colors.textLight}
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.inputLabel}>Keresztnév *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="pl. János"
            placeholderTextColor={colors.textLight}
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        {/* TESTADATOK SZEKCIÓ */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Testösszetétel & Méretek</Text>
          <Text style={styles.sectionSub}>A pontos BMI számításhoz és kalóriabecsléshez</Text>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Testsúly (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="pl. 78"
                placeholderTextColor={colors.textLight}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Magasság (cm)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="pl. 182"
                placeholderTextColor={colors.textLight}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.rowInputs, { marginTop: spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Életkor (év)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="pl. 24"
                placeholderTextColor={colors.textLight}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Biológiai Nem</Text>
              <View style={styles.genderRow}>
                {['Férfi', 'Nő'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* FITNESZ CÉL VÁLASZTÓ */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Fő Fitnesz Cél</Text>
          <Text style={styles.sectionSub}>Válaszd ki az aktuális edzési és táplálkozási fókuszodat:</Text>

          <View style={styles.goalPillsContainer}>
            {FITNESS_GOALS.map((goal) => {
              const isSelected = fitnessGoal === goal;
              return (
                <TouchableOpacity
                  key={goal}
                  style={[styles.goalPill, isSelected && styles.goalPillActive]}
                  onPress={() => setFitnessGoal(goal)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.goalPillText, isSelected && styles.goalPillTextActive]}>
                    {goal}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* MENTÉS & MÉGSE GOMBOK */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Módosítások Mentése 💾</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Mégse</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
  },
  // Avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: 10,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarSubNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  // Kártyák
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  genderBtnTextActive: {
    color: colors.white,
  },
  // Célválasztó
  goalPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 6,
  },
  goalPill: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate[600],
  },
  goalPillTextActive: {
    color: colors.white,
  },
  // Gombok
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...shadows.button,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
