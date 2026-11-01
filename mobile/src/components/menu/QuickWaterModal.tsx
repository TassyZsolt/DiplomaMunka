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
import { addWaterData, getWaterData } from '../../services/waterService';

interface QuickWaterModalProps {
  visible: boolean;
  todayWater: number;
  dailyGoal?: number;
  onClose: () => void;
  onSuccess: (updatedWater: number) => void;
}

const WATER_PRESETS = [
  { amount: 250, emoji: '🥛', label: '+250 ml', sub: '1 pohár' },
  { amount: 500, emoji: '🍶', label: '+500 ml', sub: '1 kulacs' },
  { amount: 750, emoji: '💧', label: '+750 ml', sub: 'Nagy palack' },
  { amount: 1000, emoji: '🚰', label: '+1000 ml', sub: '1 liter' },
];

export const QuickWaterModal: React.FC<QuickWaterModalProps> = ({
  visible,
  todayWater,
  dailyGoal = 2000,
  onClose,
  onSuccess,
}) => {
  const [waterInput, setWaterInput] = useState<string>('250');
  const [isSavingWater, setIsSavingWater] = useState<boolean>(false);

  const handleAddWaterQuick = async (amount: number) => {
    try {
      setIsSavingWater(true);
      await addWaterData(amount);
      const waterLogs = await getWaterData();
      const sumWater = waterLogs.reduce((sum: number, log: any) => sum + (log.amountMl || 0), 0);
      Alert.alert('Folyadékbevitel 💧', `+${amount} ml sikeresen hozzáadva!`);
      onClose();
      onSuccess(sumWater);
    } catch (error: any) {
      Alert.alert('Hiba', error.message || 'Nem sikerült hozzáadni a vizet.');
    } finally {
      setIsSavingWater(false);
    }
  };

  const handleCustomWaterSubmit = () => {
    const amt = parseInt(waterInput, 10);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Figyelem', 'Kérlek adj meg érvényes vízmennyiséget ml-ben (pl. 330)!');
      return;
    }
    handleAddWaterQuick(amt);
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
              <Text style={{ fontSize: 24, marginRight: 8 }}>💧</Text>
              <Text style={styles.modalTitle}>Vízbevitel rögzítése</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          
          <Text style={styles.modalDescription}>
            Mai eddigi fogyasztásod:{' '}
            <Text style={{ fontWeight: 'bold', color: '#0284C7' }}>{todayWater} ml</Text> a célként kitűzött{' '}
            {dailyGoal} ml-ből.
          </Text>

          
          <Text style={styles.inputLabel}>Válassz gyors adagot vagy adj meg egyedit:</Text>
          <View style={styles.waterQuickPresetsGrid}>
            {WATER_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.amount}
                style={styles.waterPresetBtn}
                onPress={() => handleAddWaterQuick(preset.amount)}
                disabled={isSavingWater}
              >
                <Text style={styles.waterPresetEmoji}>{preset.emoji}</Text>
                <Text style={styles.waterPresetText}>{preset.label}</Text>
                <Text style={styles.waterPresetSub}>{preset.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Egyedi mennyiség (ml):</Text>
          <View style={styles.customWaterRow}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
              placeholder="pl. 330"
              keyboardType="numeric"
              value={waterInput}
              onChangeText={setWaterInput}
            />
            <TouchableOpacity
              style={styles.customWaterAddBtn}
              onPress={handleCustomWaterSubmit}
              disabled={isSavingWater}
            >
              {isSavingWater ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.customWaterAddBtnText}>Hozzáadás</Text>
              )}
            </TouchableOpacity>
          </View>

          
          <TouchableOpacity
            style={[styles.cancelModalBtn, { marginTop: 16, width: '100%' }]}
            onPress={onClose}
          >
            <Text style={styles.cancelModalBtnText}>Bezárás</Text>
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
  waterQuickPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  waterPresetBtn: {
    width: '48%',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  waterPresetEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  waterPresetText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369A1',
  },
  waterPresetSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  customWaterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customWaterAddBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  customWaterAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelModalBtn: {
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
});
