import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { auth } from '../../../firebaseConfig';
import { colors, spacing, borderRadius, shadows } from '../../themes/tokens';

const HomeScreen = ({ navigation }: any) => {
  const currentUser = auth.currentUser;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoEmoji}>⚡</Text>
        </View>

        <Text style={styles.appName}>FitTrack</Text>
        <Text style={styles.subtitle}>
          {currentUser
            ? `Bejelentkezve mint ${currentUser.email || 'felhasználó'}`
            : 'Személyes fitnesz, edzés és táplálkozás követő'}
        </Text>

        <View style={styles.buttonContainer}>
          {currentUser ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Menu' }],
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Irány a Főmenü 🚀</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Bejelentkezés</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Új fiók regisztrációja</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.header,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryBorderLight,
    ...shadows.sm,
  },
  logoEmoji: {
    fontSize: 34,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
    lineHeight: 20,
    maxWidth: 280,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 340,
    gap: spacing.md,
  },
  primaryButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
