import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getWaterData, addWaterData } from '../../services/waterService';
import { colors } from '../../themes/tokens';

const DAILY_TARGET = 2000; // Napi vízcél ml-ben

const StatScreen = ({ navigation }: any) => {
  const [totalWater, setTotalWater] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  const loadData = async () => {
    try {
      const logs = await getWaterData();
      const total = logs.reduce((sum: number, log: any) => sum + (log.amountMl || 0), 0);
      setTotalWater(total);
    } catch (error) {
      console.error("Error loading water data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddWater = async (amount: number) => {
    try {
      await addWaterData(amount);
      loadData();
    } catch (error) {
      console.error("Error adding water data:", error);
    }
  };

  const handleAddCustomWater = async () => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Kérlek érvényes számot adj meg!');
      return;
    }
    await handleAddWater(amount);
    setCustomAmount('');
    setModalVisible(false);
  };

  // SVG kördiagram beállítások
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min((totalWater / DAILY_TARGET) * 100, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Statisztikák</Text>

      {/* Vízfogyasztás kártya kördiagrammal */}
      <View style={styles.hydrationCard}>
        <Text style={styles.cardTitle}>Vízfogyasztás</Text>
        
        {/* Kördiagram tároló */}
        <View style={styles.ringContainer}>
          <Svg width={size} height={size}>
            {/* Háttér kör */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.neutral[200]}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Előrehaladás kör */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          {/* Belső szöveg */}
          <View style={styles.centerTextContainer}>
            <Text style={styles.currentAmountText}>{totalWater}</Text>
            <View style={styles.divider} />
            <Text style={styles.targetText}>{DAILY_TARGET} ml</Text>
            <Text style={styles.percentText}>{Math.round((totalWater / DAILY_TARGET) * 100)}%</Text>
          </View>
        </View>

        {/* Gyors rögzítési gombok */}
        <View style={styles.pillContainer}>
          <TouchableOpacity style={styles.pill} onPress={() => handleAddWater(250)}>
            <Text style={styles.pillText}>+250 ml</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.pill} onPress={() => handleAddWater(500)}>
            <Text style={styles.pillText}>+500 ml</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.pill, styles.customPill]} onPress={() => setModalVisible(true)}>
            <Text style={[styles.pillText, styles.customPillText]}>Egyéni</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menü gombok rácsos elrendezésben */}
      <View style={styles.gridContainer}>
        {/* Személyes statisztikák */}
        <TouchableOpacity
          style={styles.fullWidthItem}
          onPress={() => alert('Kiválasztva: Személyes statisztikák')}
        >
          <Text style={styles.itemText}>Személyes statisztikák</Text>
        </TouchableOpacity>

        {/* Előrehaladás és Lépés Számláló */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.halfWidthItem}
            onPress={() => alert('Kiválasztva: Előrehaladás')}
          >
            <Text style={styles.itemText}>Előrehaladás</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.halfWidthItem}
            onPress={() => alert('Kiválasztva: Lépés Számláló')}
          >
            <Text style={styles.itemText}>Lépés Számláló</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Egyéni mennyiség Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Egyéni mennyiség (ml)</Text>
            <TextInput
              style={styles.input}
              placeholder="Pl. 350"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={setCustomAmount}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setCustomAmount('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Mégse</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleAddCustomWater}
              >
                <Text style={styles.saveButtonText}>Hozzáadás</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default StatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 16,
  },
  hydrationCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  ringContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentAmountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: colors.neutral[300],
    marginVertical: 4,
  },
  targetText: {
    fontSize: 14,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  percentText: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  pillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pillText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customPill: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  customPillText: {
    color: colors.primary,
  },
  gridContainer: {
    width: '100%',
    marginBottom: 20,
  },
  fullWidthItem: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfWidthItem: {
    width: '48.5%',
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: colors.neutral[200],
  },
  cancelButtonText: {
    color: colors.neutral[700],
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});
