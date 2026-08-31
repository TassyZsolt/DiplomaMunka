import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { globalStyles } from '../../../globalStyles';


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
});
