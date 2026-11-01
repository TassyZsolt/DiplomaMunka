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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { registerUser } from '../../services/authService';
import { colors } from '../../themes/tokens';

const RegisterScreen = ({ navigation }: any) => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // beviteli mező képernyőre görgetése
  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, Platform.OS === 'ios' ? 80 : 180);
  };

  // Regisztráció elküldése
  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedLastName || !trimmedFirstName) {
      Alert.alert('Hiányzó adat', 'Kérlek add meg a vezeték- és keresztnevedet!');
      return;
    }
    if (!trimmedEmail) {
      Alert.alert('Hiányzó adat', 'Kérlek add meg az e-mail címedet!');
      return;
    }
    if (!password) {
      Alert.alert('Hiányzó adat', 'Kérlek adj meg egy jelszót!');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Gyenge jelszó', 'A jelszónak legalább 6 karakter hosszúnak kell lennie!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Jelszó eltérés', 'A megadott két jelszó nem egyezik meg!');
      return;
    }

    try {
      setLoading(true);
      await registerUser(trimmedEmail, password, trimmedFirstName, trimmedLastName);
      Alert.alert(
        'Sikeres regisztráció! 🎉',
        `Üdvözlünk a FitTrack-ben, ${trimmedFirstName}!`,
        [
          {
            text: 'Irány a Főmenü',
            onPress: () => navigation.navigate('Menu'),
          },
        ]
      );
    } catch (error: any) {
      let friendlyMessage = 'Nem sikerült a regisztráció. Kérlek próbáld újra!';
      const err = error.message || '';
      if (err.includes('email-already-in-use')) {
        friendlyMessage = 'Ez az e-mail cím már regisztrálva van! Próbálj bejelentkezni.';
      } else if (err.includes('invalid-email')) {
        friendlyMessage = 'Érvénytelen e-mail formátum!';
      } else if (err.includes('weak-password')) {
        friendlyMessage = 'A jelszó túl gyenge. Használj legalább 6 karaktert!';
      } else if (err.includes('network-request-failed')) {
        friendlyMessage = 'Hálózati hiba! Kérlek ellenőrizd az internetkapcsolatodat.';
      }
      Alert.alert('Regisztrációs hiba', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // közösségi fiókok
  const handleSocialRegister = (provider: 'Google' | 'Apple') => {
    Alert.alert(
      `${provider} regisztráció`,
      `A(z) ${provider} fiókkal történő regisztráció beállítása folyamatban van. Kérlek használd a fenti űrlapot!`,
      [{ text: 'Értem' }]
    );
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
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 36 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >

          
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))}
              activeOpacity={0.7}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#334155"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.backButtonText}>Vissza</Text>
            </TouchableOpacity>
          </View>

          
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🏃</Text>
            </View>
            <Text style={styles.appName}>FitTrack</Text>
            <Text style={styles.welcomeTitle}>Új fiók létrehozása</Text>
            <Text style={styles.welcomeSubtitle}>
              Csatlakozz még ma, és kövesd nyomon az edzéseidet, lépéseidet és étrendedet!
            </Text>
          </View>


          
          <View style={styles.formContainer}>
            
            <View style={styles.namesRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Vezetéknév</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="pl. Kovács"
                    placeholderTextColor="#94A3B8"
                    value={lastName}
                    onChangeText={setLastName}
                    onFocus={() => scrollToInput(0)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Keresztnév</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="pl. Péter"
                    placeholderTextColor="#94A3B8"
                    value={firstName}
                    onChangeText={setFirstName}
                    onFocus={() => scrollToInput(0)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-mail cím</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                      stroke="#64748B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M22 6l-10 7L2 6"
                      stroke="#64748B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="pelda@email.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => scrollToInput(90)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            
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
                      stroke="#64748B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M7 11V7a5 5 0 0 1 10 0v4"
                      stroke="#64748B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Legalább 6 karakter"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => scrollToInput(180)}
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
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M1 1l22 22"
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jelszó megerősítése</Text>
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
                      stroke="#64748B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M7 11V7a5 5 0 0 1 10 0v4"
                      stroke="#64748B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Jelszó ismétlése"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => scrollToInput(270)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeToggleButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  {showConfirmPassword ? (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M1 1l22 22"
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Fiók létrehozása</Text>
              )}
            </TouchableOpacity>
          </View>


          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>vagy regisztráció ezzel</Text>
            <View style={styles.dividerLine} />
          </View>

          
          <View style={styles.socialButtonsContainer}>
            
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => handleSocialRegister('Google')}
              activeOpacity={0.8}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <Path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <Path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <Path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </Svg>
              <Text style={styles.googleButtonText}>Folytatás Google-fiókkal</Text>
            </TouchableOpacity>

            
            <TouchableOpacity
              style={styles.appleButton}
              onPress={() => handleSocialRegister('Apple')}
              activeOpacity={0.8}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96 1.01-3.1-.98.04-2.16.66-2.86 1.48-.61.71-1.15 1.87-1.01 2.99 1.1.08 2.2-.55 2.86-1.37z" />
              </Svg>
              <Text style={styles.appleButtonText}>Folytatás Apple-fiókkal</Text>
            </TouchableOpacity>
          </View>

          
          <View style={styles.footerRow}>
            <Text style={styles.footerPromptText}>Már van fiókod?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
              style={{ marginLeft: 6 }}
            >
              <Text style={styles.loginLinkText}>Bejelentkezés</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    flexGrow: 1,
  },

    topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 6,
  },

  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#DBEAFE',
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
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },

    formContainer: {
    marginBottom: 20,
  },
  namesRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },
  eyeToggleButton: {
    padding: 6,
  },

  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  socialButtonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 10,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  appleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
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
    color: '#64748B',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
});
