import React, { useState } from 'react';
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
import { updateUserProfile } from '../../services/userService';
import { colors } from '../../themes/tokens';
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
  const [fitnessGoal, setFitnessGoal] = useState<string>(userData.fitnessGoal || 'Izomtömeg-növelés');
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

    try {
      setIsSaving(true);

      // Delegálva a userService-hez a rétegarchitektúra szerint
      await updateUserProfile({
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        weight: parsedWeight,
        height: parsedHeight,
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
            placeholderTextColor="#94A3B8"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.inputLabel}>Keresztnév *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="pl. János"
            placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
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
            <ActivityIndicator color="#FFFFFF" size="small" />
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
    backgroundColor: '#F8FAFC',
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
    marginBottom: 20,
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
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  // Kártyák
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  // Célválasztó
  goalPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  goalPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  goalPillTextActive: {
    color: '#FFFFFF',
  },
  // Gombok
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
