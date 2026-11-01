import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors } from '../../themes/tokens';

interface QuickWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
  onNavigate?: (screenName: string) => void;
}

interface WorkoutOption {
  title: string;
  subtitle: string;
  emoji: string;
  screen: string;
}

const WORKOUT_OPTIONS: WorkoutOption[] = [
  {
    title: 'Predefiniált Edzés Indítása',
    subtitle: 'Interaktív sorozatkövető, időzítő és pipálható ismétlések',
    emoji: '⚡',
    screen: 'Exercise',
  },
  {
    title: 'Edzéselőzmények & Elemzés',
    subtitle: 'Korábbi edzések megtekintése, heti volumenek',
    emoji: '📈',
    screen: 'WorkoutProgress',
  },
  {
    title: 'Egyéni Csúcs (PR) Rögzítése',
    subtitle: 'Guggolás, fekvenyomás, felhúzás 1RM és új rekordok',
    emoji: '🏆',
    screen: 'PersonalStats',
  },
];

export const QuickWorkoutModal: React.FC<QuickWorkoutModalProps> = ({
  visible,
  onClose,
  navigation,
  onNavigate,
}) => {
  const handleSelect = (screen: string) => {
    onClose();
    if (onNavigate) {
      onNavigate(screen);
    } else if (navigation) {
      navigation.navigate(screen);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>🏋️</Text>
              <Text style={styles.modalTitle}>Edzés gyorsindítás</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.modalDescription}>
            Válassz az alábbi lehetőségek közül az edzés és rekordok naplózásához:
          </Text>

          {/* Option Tiles */}
          {WORKOUT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.screen}
              style={styles.workoutOptionTile}
              onPress={() => handleSelect(option.screen)}
              activeOpacity={0.7}
            >
              <Text style={styles.workoutOptionEmoji}>{option.emoji}</Text>
              <View style={styles.workoutOptionTextContainer}>
                <Text style={styles.workoutOptionTitle}>{option.title}</Text>
                <Text style={styles.workoutOptionSub}>{option.subtitle}</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Cancel button */}
          <TouchableOpacity
            style={[styles.cancelModalBtn, { marginTop: 12, width: '100%' }]}
            onPress={onClose}
          >
            <Text style={styles.cancelModalBtnText}>Mégse</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  workoutOptionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workoutOptionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutOptionTextContainer: {
    flex: 1,
  },
  workoutOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  workoutOptionSub: {
    fontSize: 11,
    color: colors.neutral[500],
    lineHeight: 15,
  },
  optionArrow: {
    fontSize: 20,
    color: colors.neutral[400],
    fontWeight: '600',
    marginLeft: 8,
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
