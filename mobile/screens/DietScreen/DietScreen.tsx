import React from 'react';
import { View, Button } from 'react-native';
import styles from './DietScreenStyle';

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