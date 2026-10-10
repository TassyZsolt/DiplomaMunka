import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { registerUser } from '../../services/authService';
import { colors } from '../../themes/tokens';

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleRegister = async () => {
    console.log("Gomb megnyomva!")
    try {
      await registerUser(email, password, firstName, lastName);
      Alert.alert('Sikeres regisztráció');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Hiba', 'Nem sikerült regisztrálni');
    }
  };

  
  return (
    <View style={styles.container}>
      <Text>Regisztráció</Text>
      <TextInput placeholder="Vezetéknév" value={lastName} onChangeText={setLastName} style={styles.input} />
      <TextInput placeholder="Keresztnév" value={firstName} onChangeText={setFirstName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Jelszó" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Regisztráció" onPress={handleRegister} />
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
});

export default RegisterScreen;

