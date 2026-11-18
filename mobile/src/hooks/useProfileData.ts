import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import {
  UserProfile,
  getUserProfile,
  calculateBmi,
  BmiResult,
  formatMemberSince,
} from '../services/userService';
import { getWorkoutSessions } from '../services/workoutService';
import { getPersonalRecords, calculateTotalPr } from '../services/prService';
import { resetPassword } from '../services/authService';

export const useProfileData = (navigation?: any) => {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [workoutCount, setWorkoutCount] = useState<number>(0);
  const [totalPr, setTotalPr] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Adatok betöltése a szolgáltatásokból
  const loadProfileData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Párhuzamos adatlekérések
        const [profile, sessions, prs] = await Promise.all([
          getUserProfile(user.uid),
          getWorkoutSessions(),
          getPersonalRecords(),
        ]);

        setUserData(profile);
        setWorkoutCount(sessions.length);
        setTotalPr(calculateTotalPr(prs));
      }
    } catch (err) {
      console.warn('Hiba a profiladatok betöltésekor:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handlePasswordReset = () => {
    const targetEmail = userData?.email || auth.currentUser?.email;
    if (!targetEmail) {
      Alert.alert('Hiba', 'Nem található email cím a jelszó visszaállításához.');
      return;
    }

    Alert.alert(
      'Jelszó visszaállítása',
      `Szeretnél jelszó-visszaállító linket kapni a(z) ${targetEmail} email címre?`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Email küldése',
          onPress: async () => {
            try {
              await resetPassword(targetEmail);
              Alert.alert('Sikeres küldés ✉️', 'Kérlek ellenőrizd a bejövő leveleidet!');
            } catch (e: any) {
              Alert.alert('Hiba', e.message || 'Nem sikerült elküldeni az emailt.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = (nav?: any) => {
    const navToUse = nav || navigation;
    Alert.alert('Kijelentkezés', 'Biztosan ki szeretnél lépni a fiókodból?', [
      { text: 'Mégse', style: 'cancel' },
      {
        text: 'Kijelentkezés',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            if (navToUse) {
              navToUse.navigate('Login');
            }
          } catch (e) {
            if (navToUse) {
              navToUse.navigate('Login');
            }
          }
        },
      },
    ]);
  };

  const bmiInfo: BmiResult | null = calculateBmi(userData?.weight, userData?.height);
  const fullName = `${userData?.lastName || ''} ${userData?.firstName || ''}`.trim() || 'Sportoló';
  const displayEmail = userData?.email || auth.currentUser?.email || 'Nincs megadva';
  const memberSinceText = formatMemberSince(userData?.createdAt);

  return {
    userData,
    loading,
    refreshing,
    workoutCount,
    totalPr,
    bmiInfo,
    fullName,
    displayEmail,
    memberSinceText,
    onRefresh,
    handlePasswordReset,
    handleLogout,
    loadProfileData,
  };
};
