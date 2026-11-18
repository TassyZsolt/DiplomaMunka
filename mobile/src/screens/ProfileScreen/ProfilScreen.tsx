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
import { colors, spacing, borderRadius, shadows } from '../../themes/tokens';
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
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Kijelentkezés a fiókból</Text>
          </View>
          <Text style={[styles.actionArrow, { color: colors.danger }]}>›</Text>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  // Fejléc Kártya
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.header,
    padding: 22,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
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
    borderRadius: borderRadius.sm,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmailText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
  },
  memberTag: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.lg,
  },
  memberTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate[600],
  },
  editProfileBtn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  goalBadgeRow: {
    gap: spacing.sm,
  },
  goalBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primaryBorderLight,
  },
  goalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  goalDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  // Mutatók Kártya
  metricsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metricItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  metricSub: {
    fontSize: 10,
    color: colors.textLight,
  },
  bmiPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginTop: 2,
  },
  bmiPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Aktivitás Kártya
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  activityBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activityEmoji: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  activityNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Műveletek Kártya
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRowBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  actionBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actionArrow: {
    fontSize: 18,
    color: colors.textLight,
    fontWeight: '600',
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
});
