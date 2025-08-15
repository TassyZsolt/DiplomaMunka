import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { loginUser } from '../../services/authService';
import styles from './LoginScreenStyle';

const LoginScreen = ({navigation} : any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await loginUser(email, password);
      Alert.alert('Sikeres bejelentkezés!');
      setEmail('');
      setPassword('');
      navigation.navigate('Menu');
    } catch (error: any) {
      Alert.alert('Hiba', error.message || 'Sikertelen bejelentkezés.');
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bejelentkezés</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Jelszó"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Bejelentkezés" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
