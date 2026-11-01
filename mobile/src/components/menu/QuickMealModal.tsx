import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { colors } from '../../themes/tokens';
import { addMealData } from '../../services/dietService';

interface QuickMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateDiet: () => void;
}

export const QuickMealModal: React.FC<QuickMealModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onNavigateDiet,
}) => {
  const [mealName, setMealName] = useState<string>('');
  const [mealCalories, setMealCalories] = useState<string>('');
  const [mealType, setMealType] = useState<string>('Ebéd');
  const [isSavingMeal, setIsSavingMeal] = useState<boolean>(false);

  const handleSaveMeal = async () => {
    const cals = parseInt(mealCalories, 10);
    if (isNaN(cals) || cals <= 0) {
      Alert.alert('Figyelem', 'Kérlek adj meg érvényes kalóriamennyiséget (pl. 450 kcal)!');
      return;
    }

    try {
      setIsSavingMeal(true);
      await addMealData(mealName.trim() || `${mealType} étkezés`, cals, mealType);
      setMealName('');
      setMealCalories('');
      onClose();
      Alert.alert('Sikeres rögzítés 🎉', `${cals} kcal hozzáadva a mai fogyasztáshoz!`);
      onSuccess();
    } catch (error: any) {
      Alert.alert('Hiba', error.message || 'Nem sikerült elmenteni az étkezést.');
    } finally {
      setIsSavingMeal(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>🥗</Text>
              <Text style={styles.modalTitle}>Étkezés naplózása</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Rögzítsd a mai fogyasztásod, amely automatikusan frissíti a napi kalóriaszámlálót!
          </Text>

          {/* Étkezés típusa chipek */}
          <Text style={styles.inputLabel}>Étkezés fajtája:</Text>
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

          {/* Étel neve */}
          <Text style={styles.inputLabel}>Étel / Fogás megnevezése (opcionális):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="pl. Csirkemell rizzsel, Fehérjeturmix"
            placeholderTextColor="#94A3B8"
            value={mealName}
            onChangeText={setMealName}
          />

          {/* Kalória */}
          <Text style={styles.inputLabel}>Elfogyasztott kalória (kcal):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="pl. 450"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={mealCalories}
            onChangeText={setMealCalories}
          />

          {/* Gyors kalória hozzáadó gombok */}
          <View style={styles.quickCalPillsRow}>
            {[200, 350, 500, 750].map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.quickCalPill}
                onPress={() => setMealCalories(String(val))}
              >
                <Text style={styles.quickCalPillText}>+{val} kcal</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={onClose}
            >
              <Text style={styles.cancelModalBtnText}>Mégse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleSaveMeal}
              disabled={isSavingMeal}
            >
              {isSavingMeal ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitModalBtnText}>Rögzítés</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Közvetlen navigáció az Étrend képernyőre */}
          <TouchableOpacity
            style={styles.modalDietScreenLink}
            onPress={() => {
              onClose();
              onNavigateDiet();
            }}
          >
            <Text style={styles.modalDietScreenLinkText}>Ugrás az Étrend képernyőre ›</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  modalDescription: {
    fontSize: 13,
    color: colors.neutral[600],
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.neutral[900],
    marginBottom: 14,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
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
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  mealTypeChipTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  quickCalPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  quickCalPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  quickCalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  submitModalBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalDietScreenLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  modalDietScreenLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
