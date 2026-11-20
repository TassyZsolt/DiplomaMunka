import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { loginUser, resetPassword } from '../../services/authService';
import { colors, spacing, borderRadius, shadows } from '../../themes/tokens';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Billentyűzet kezelés és automatikus görgetés
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, Platform.OS === 'ios' ? 80 : 180);
  };

  // Elfelejtett jelszó modal állapot
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Bejelentkezés kezelése
  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Hiányzó adat', 'Kérlek add meg az e-mail címedet!');
      return;
    }
    if (!password) {
      Alert.alert('Hiányzó adat', 'Kérlek add meg a jelszavadat!');
      return;
    }

    try {
      setLoading(true);
      await loginUser(trimmedEmail, password);
      setEmail('');
      setPassword('');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Menu' }],
      });
    } catch (error: any) {
      let friendlyMessage = 'Sikertelen bejelentkezés. Kérlek próbáld újra!';
      const err = error.message || '';
      if (err.includes('user-not-found') || err.includes('wrong-password') || err.includes('invalid-credential')) {
        friendlyMessage = 'Hibás e-mail cím vagy jelszó. Kérlek ellenőrizd az adataidat!';
      } else if (err.includes('invalid-email')) {
        friendlyMessage = 'Érvénytelen e-mail formátum!';
      } else if (err.includes('network-request-failed')) {
        friendlyMessage = 'Hálózati hiba! Kérlek ellenőrizd az internetkapcsolatodat.';
      }
      Alert.alert('Bejelentkezési hiba', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // Jelszó visszaállító link küldése
  const handleResetPassword = async () => {
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      Alert.alert('Figyelem', 'Kérlek add meg az e-mail címedet a jelszó visszaállításához!');
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(targetEmail);
      setForgotModalVisible(false);
      Alert.alert(
        'E-mail elküldve ✉️',
        `A jelszó visszaállítási útmutatót elküldtük a(z) ${targetEmail} címre. Kérlek ellenőrizd a bejövő leveleidet!`
      );
    } catch (err: any) {
      Alert.alert('Hiba', err.message || 'Nem sikerült elküldeni a visszaállító e-mailt.');
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 60 : 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >


          {navigation.canGoBack() ? (
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 12H5M12 19l-7-7 7-7"
                    stroke={colors.textSecondary}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.backButtonText}>Vissza</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ height: 8 }} />
          )}



          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🏃</Text>
            </View>
            <Text style={styles.appName}>FitTrack</Text>
            <Text style={styles.welcomeTitle}>Üdvözlünk újra!</Text>
            <Text style={styles.welcomeSubtitle}>
              Jelentkezz be az edzéseid folytatásához és napi céljaid eléréséhez.
            </Text>
          </View>



          <View style={styles.formContainer}>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-mail cím</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                      stroke={colors.textMuted}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M22 6l-10 7L2 6"
                      stroke={colors.textMuted}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="pelda@email.com"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => scrollToInput(40)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Jelszó mező */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jelszó</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                      stroke={colors.textMuted}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M7 11V7a5 5 0 0 1 10 0v4"
                      stroke={colors.textMuted}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => scrollToInput(140)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeToggleButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        stroke={colors.textMuted}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M1 1l22 22"
                        stroke={colors.textMuted}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke={colors.textMuted}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke={colors.textMuted}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              </View>
            </View>


            <View style={styles.forgotPasswordRow}>
              <TouchableOpacity
                onPress={() => {
                  setResetEmail(email);
                  setForgotModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Elfelejtett jelszó?</Text>
              </TouchableOpacity>
            </View>


            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Bejelentkezés</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerPromptText}>Nincs még fiókod?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
              style={{ marginLeft: 6 }}
            >
              <Text style={styles.registerLinkText}>Regisztráció</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>



      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, marginRight: 8 }}>🔑</Text>
                <Text style={styles.modalTitle}>Jelszó visszaállítása</Text>
              </View>
              <TouchableOpacity
                onPress={() => setForgotModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Add meg az e-mail címed, és küldünk egy linket az új jelszó beállításához.
            </Text>

            <Text style={styles.inputLabel}>Regisztrált e-mail cím</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, { paddingLeft: 14 }]}
                placeholder="pelda@email.com"
                placeholderTextColor={colors.textLight}
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setForgotModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Mégse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Link küldése</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.borderLight,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },

  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.primaryBorderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },

  formContainer: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: '100%',
  },
  eyeToggleButton: {
    padding: 6,
  },

  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: 22,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },


  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 10,
  },
  footerPromptText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.header,
    padding: 22,
    ...shadows.modal,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.card,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[600],
  },
  modalSubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
