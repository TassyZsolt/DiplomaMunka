import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { globalStyles } from '../../../globalStyles';
import { colors, spacing } from '../../themes/tokens';


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
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing['3xl'],
    textAlign: 'center',
  },
  button: {
    marginBottom: spacing.lg,
  },
});
