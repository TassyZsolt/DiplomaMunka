import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'background',
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    marginBottom: 15,
  },
  buttonWrapper: {
    marginVertical: 10
  }
});

export default MenuScreen;

