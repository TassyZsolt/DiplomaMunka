import React from 'react';
import { View, Button, Text } from 'react-native';
import styles from './HomeScreenStyles';
import { globalStyles } from '../../globalStyles';


const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={[globalStyles.container, styles.container]}>
      <Text style={styles.title}>Üdvözöllek!</Text>
      <View style={styles.button}>
        <Button title="Regisztráció" onPress={() => navigation.navigate('Register')} />
      </View>
      <View style={styles.button}>
        <Button title="Bejelentkezés" onPress={() => navigation.navigate('Login')} />
      </View>
    </View>
  );
};
 
export default HomeScreen;
