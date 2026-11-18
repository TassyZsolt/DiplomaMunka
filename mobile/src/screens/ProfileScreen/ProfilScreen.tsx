import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useProfileData } from '../../hooks/useProfileData';
import { colors } from '../../themes/tokens';
import placeholderAvatar from '../../../assets/images/placeholderAvatar.jpg';

export const ProfilScreen = ({ navigation }: any) => {
  const {
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
  } = useProfileData(navigation);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Profil betöltése...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* 1. FEJLÉC & AVATAR KÁRTYA */}
      <View style={styles.headerCard}>
        <View style={styles.avatarWrapper}>
          <Image source={placeholderAvatar} style={styles.avatarImage} />
          <View style={styles.onlineBadge} />
        </View>

        <Text style={styles.userNameText}>{fullName}</Text>
        <Text style={styles.userEmailText}>{displayEmail}</Text>

        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>📅 Tag ekkortól: {memberSinceText}</Text>
        </View>

        <TouchableOpacity
          style={styles.editProfileBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('EditProfile', { userData })}
        >
          <Text style={styles.editProfileBtnText}>✏️ Profil Adatok Módosítása</Text>
        </TouchableOpacity>
      </View>

      {/* 2. FITNESZ CÉL KÁRTYA */}
      <View style={styles.goalCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>🎯 Aktuális Fő Cél</Text>
        </View>
        <View style={styles.goalBadgeRow}>
          <View style={styles.goalBadge}>
            <Text style={styles.goalBadgeText}>
              {userData?.fitnessGoal || 'Izomtömeg-növelés'}
            </Text>
          </View>
          <Text style={styles.goalDescription}>
            {userData?.fitnessGoal === 'Szálkásítás / Fogyás'
              ? 'Kalóriadeficit és zsírégetés fókuszban.'
              : userData?.fitnessGoal === 'Erőnlét növelése'
              ? 'Nagy súlyos összetett gyakorlatok és PR rekordok.'
              : userData?.fitnessGoal === 'Állóképesség'
              ? 'Kardió és magas ismétlésszámú terhelések.'
              : 'Izomépítés, megfelelő fehérjebevitel és progresszív túlterhelés.'}
          </Text>
        </View>
      </View>

      {/* 3. FIZIKAI MUTATÓK & BMI */}
      <View style={styles.metricsCard}>
        <Text style={styles.cardHeaderTitle}>📏 Testösszetétel & Mutatók</Text>

        <View style={styles.metricsGrid}>
          {/* Testsúly */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Testsúly</Text>
            <Text style={styles.metricValue}>
              {userData?.weight ? `${userData.weight} kg` : '—'}
            </Text>
            <Text style={styles.metricSub}>Aktuális</Text>
          </View>

          {/* Magasság */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Magasság</Text>
            <Text style={styles.metricValue}>
              {userData?.height ? `${userData.height} cm` : '—'}
            </Text>
            <Text style={styles.metricSub}>Alapadat</Text>
          </View>

          {/* BMI */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>BMI Index</Text>
            {bmiInfo ? (
              <>
                <Text style={styles.metricValue}>{bmiInfo.value}</Text>
                <View style={[styles.bmiPill, { backgroundColor: bmiInfo.bgColor }]}>
                  <Text style={[styles.bmiPillText, { color: bmiInfo.textColor }]}>
                    {bmiInfo.label}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.metricValue}>—</Text>
                <Text style={styles.metricSub}>Nincs adat</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* 4. ÖSSZESÍTETT AKTIVITÁS (LIFETIME STATS) */}
      <View style={styles.activityCard}>
        <Text style={styles.cardHeaderTitle}>🏆 Eddigi Eredményeid</Text>

        <View style={styles.activityRow}>
          <View style={styles.activityBox}>
            <Text style={styles.activityEmoji}>🏋️‍♂️</Text>
            <Text style={styles.activityNumber}>{workoutCount}</Text>
            <Text style={styles.activityLabel}>Befejezett Edzés</Text>
          </View>

          <View style={styles.activityBox}>
            <Text style={styles.activityEmoji}>⚡</Text>
            <Text style={styles.activityNumber}>{totalPr} kg</Text>
            <Text style={styles.activityLabel}>Összesített PR Súly</Text>
          </View>
        </View>
      </View>

      {/* 5. FIÓK MŰVELETEK */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardHeaderTitle}>⚙️ Fiók Műveletek</Text>

        <TouchableOpacity
          style={styles.actionRowBtn}
          onPress={handlePasswordReset}
          activeOpacity={0.7}
        >
          <View style={styles.actionBtnLeft}>
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={styles.actionBtnText}>Jelszó visszaállítása emailben</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionRowBtn}
          onPress={() => handleLogout()}
          activeOpacity={0.7}
        >
          <View style={styles.actionBtnLeft}>
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Kijelentkezés a fiókból</Text>
          </View>
          <Text style={[styles.actionArrow, { color: '#EF4444' }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

export default ProfilScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  // Fejléc Kártya
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  userEmailText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  memberTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  memberTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  editProfileBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  editProfileBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  // Cél Kártya
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  goalBadgeRow: {
    gap: 8,
  },
  goalBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  goalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  goalDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  // Mutatók Kártya
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  bmiPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  bmiPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Aktivitás Kártya
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activityBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activityEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  activityNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Műveletek Kártya
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionRowBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  actionArrow: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});
