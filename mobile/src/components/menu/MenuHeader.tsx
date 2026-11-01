import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../themes/tokens';
import placeholderAvatar from '../../../assets/images/placeholderAvatar.jpg';

interface MenuHeaderProps {
  userName: string;
  onNavigateProfile: () => void;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({
  userName,
  onNavigateProfile,
}) => {
  // Köszöntés napszak alapján és motivációs üzenet
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) {
      return {
        greeting: 'Jó reggelt',
        subtext: 'Kezdd energikusan a napot egy kiadós edzéssel vagy reggelivel!',
      };
    }
    if (hour >= 10 && hour < 18) {
      return {
        greeting: 'Szép napot',
        subtext: 'Ne felejts el elegendő folyadékot inni és mozogni!',
      };
    }
    if (hour >= 18 && hour < 22) {
      return {
        greeting: 'Kellemes estét',
        subtext: 'Zárd a napot a céljaid felülvizsgálatával vagy egy levezető edzéssel!',
      };
    }
    return {
      greeting: 'Üdvözöllek',
      subtext: 'A regeneráció és pihenés éppolyan fontos, mint a kemény munka!',
    };
  };

  // Dátum formázása
  const getFormattedDate = () => {
    const now = new Date();
    const days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    const months = [
      'január', 'február', 'március', 'április', 'május', 'június',
      'július', 'augusztus', 'szeptember', 'október', 'november', 'december'
    ];
    return `${now.getFullYear()}. ${months[now.getMonth()]} ${now.getDate()}., ${days[now.getDay()]}`;
  };

  const { greeting, subtext } = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.avatarTouchable}
          activeOpacity={0.8}
          onPress={onNavigateProfile}
        >
          <Image source={placeholderAvatar} style={styles.avatarImage} />
          <View style={styles.onlineStatusBadge} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.userNameText} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={styles.dateSubtitle}>{getFormattedDate()}</Text>
        </View>

        <TouchableOpacity
          style={styles.profileActionBtn}
          activeOpacity={0.7}
          onPress={onNavigateProfile}
        >
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      
      <View style={styles.motivationBanner}>
        <Text style={styles.motivationText}>✨ {subtext}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTouchable: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  onlineStatusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.neutral[900],
    marginTop: 1,
  },
  dateSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  profileActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  motivationBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  motivationText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
});
