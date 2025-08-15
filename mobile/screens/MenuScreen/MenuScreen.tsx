import React from 'react';
import { View, Button } from 'react-native';
import styles from './MenuScreenStyles';

const MenuScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
        <Button title="Profil" onPress={() => navigation.navigate('Profil')} />
      </View>
      <View style={styles.buttonWrapper}>
        <Button title="Edzéstervek" onPress={() => navigation.navigate('Exercise')} />
      </View>
      <View style={styles.buttonWrapper}>
        <Button title="Étrend" onPress={() => navigation.navigate('Diet')} />
      </View>
      <View style={styles.buttonWrapper}>
        <Button title="Statisztikák" onPress={() => navigation.navigate('Stats')} />
      </View>
    </View>
  );
};

export default MenuScreen;