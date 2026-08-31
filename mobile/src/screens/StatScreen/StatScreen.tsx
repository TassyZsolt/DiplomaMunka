import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { getWaterData, addWaterData } from '../../services/waterService';
import { colors } from '../../themes/tokens';

const StatScreen = ({ navigation }: any) => {
  const [totalWater, setTotalWater] = useState<number>(0);

  const loadData = async () => {
    const logs = await getWaterData();
    const total = logs.reduce((sum: number, log: any) => sum + (log.amountMl || 0), 0);
    setTotalWater(total);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddWater = async () => {
    await addWaterData(250); //250 ml hozzáadása
    loadData();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Statisztikák</Text>

      {/* Grid container for stats */}
      <View style={styles.gridContainer}>
        {/* Személyes statisztikák (top, full width) */}
        <TouchableOpacity
          style={styles.fullWidthItem}
          onPress={() => alert('Kiválasztva: Személyes statisztikák')}
        >
          <Text style={styles.itemText}>Személyes statisztikák</Text>
        </TouchableOpacity>

        
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

      {/* Water consumption widget */}
      <View style={styles.waterCard}>
        <Text style={styles.waterTitle}>Vízfogyasztás</Text>
        <Text style={styles.waterText}>Ma elfogyasztott víz mennyiség:</Text>
        <Text style={styles.waterAmount}>{totalWater} ml</Text>
        
        <TouchableOpacity style={styles.waterButton} onPress={handleAddWater}>
          <Text style={styles.waterButtonText}>+250ml</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.welcomeText}>Üdv a statisztikai oldalon!</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 16,
  },
  gridContainer: {
    width: '100%',
    marginBottom: 20,
  },
  fullWidthItem: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary, // #3AC786
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfWidthItem: {
    width: '48.5%', // Slightly less than 50% to leave a gap in between
    paddingVertical: 24,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary, // #3AC786
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  waterCard: {
    width: '100%',
    backgroundColor: colors.surface, // #F5F5F5
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginVertical: 12,
  },
  waterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  waterText: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  waterAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary, // #0069FF
    marginBottom: 16,
  },
  waterButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  waterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
});


