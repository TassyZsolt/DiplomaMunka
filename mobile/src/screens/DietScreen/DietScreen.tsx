import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { colors } from '../../themes/tokens';

const DietScreen = () => {
  const handleSelect = (type: string) => {
    alert(`Selected diet: ${type}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button title="Ketogén" onPress={() => handleSelect('Ketogenic')} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Hagyományos" onPress={() => handleSelect('Regular')} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Vegán" onPress={() => handleSelect('Vegan')} />
        </View>
      </View>
    </View>
  );
};

export default DietScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
});