import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { colors } from '../../themes/tokens';

interface HubNavigationGridProps {
    navigation?: any;
    onNavigate?: (screenName: string) => void;
    onLogout: () => void;
}

interface HubItem {
    id: string;
    title: string;
    desc: string;
    emoji: string;
    screen: string;
    bgColor: string;
}

const HUB_ITEMS: HubItem[] = [
    {
        id: 'exercise',
        title: 'Edzéstervek',
        desc: 'Predefiniált tervek & szériák',
        emoji: '🏋️‍♂️',
        screen: 'Exercise',
        bgColor: '#EFF6FF',
    },
    {
        id: 'diet',
        title: 'Étrend & Diéta',
        desc: 'Étrend típusok & kalóriák',
        emoji: '🥗',
        screen: 'Diet',
        bgColor: '#F0FDF4',
    },
    {
        id: 'stats',
        title: 'Statisztikák',
        desc: 'Víz, lépés és volumen grafikonok',
        emoji: '📊',
        screen: 'Stats',
        bgColor: '#FAF5FF',
    },
    {
        id: 'profil',
        title: 'Profilom',
        desc: 'Személyes adatok kezelése',
        emoji: '👤',
        screen: 'Profil',
        bgColor: '#FFFBEB',
    },
    {
        id: 'progress',
        title: 'Haladás & PR-ek',
        desc: 'Egyéni csúcsok és súlyrekordok',
        emoji: '🏆',
        screen: 'WorkoutProgress',
        bgColor: '#FEF2F2',
    },
    {
        id: 'stepcounter',
        title: 'Lépésszámláló',
        desc: 'Napi célok & kadencia bontás',
        emoji: '👟',
        screen: 'StepCounter',
        bgColor: '#F0F9FF',
    },
];

export const HubNavigationGrid: React.FC<HubNavigationGridProps> = ({
    navigation,
    onNavigate,
    onLogout,
}) => {
    const handlePress = (screen: string) => {
        if (onNavigate) {
            onNavigate(screen);
        } else if (navigation) {
            navigation.navigate(screen);
        }
    };

    return (
        <View style={styles.container}>
            {/* Szekció fejléc */}
            <View style={styles.sectionHeaderRow}>
                <View>
                    <Text style={styles.sectionTitle}>Alkalmazás menü</Text>
                    <Text style={styles.sectionSub}>Főbb funkciók és részletes
                        felületek</Text>
                </View>
            </View>

            {/* 6 Kártyás rács */}
            <View style={styles.hubGrid}>
                {HUB_ITEMS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.hubCard}
                        activeOpacity={0.8}
                        onPress={() => handlePress(item.screen)}
                    >
                        <View style={[styles.hubIconBg, { backgroundColor: item.bgColor }]}>
                            <Text style={styles.hubEmoji}>{item.emoji}</Text>
                        </View>
                        <View style={styles.hubTextCol}>
                            <Text style={styles.hubTitle}>{item.title}</Text>
                            <Text style={styles.hubDesc}>{item.desc}</Text>
                        </View>
                        <Text style={styles.hubArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Kijelentkezés szekció */}
            <View style={styles.logoutSection}>
                <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                    <Text style={styles.logoutBtnText}>🚪 Kijelentkezés a fiókból</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.neutral[900],
        letterSpacing: -0.3,
    },
    sectionSub: {
        fontSize: 12,
        color: colors.neutral[500],
        marginTop: 1,
    },
    hubGrid: {
        gap: 10,
        marginBottom: 20,
    },
    hubCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    hubIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    hubEmoji: {
        fontSize: 22,
    },
    hubTextCol: {
        flex: 1,
    },
    hubTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.neutral[900],
    },
    hubDesc: {
        fontSize: 12,
        color: colors.neutral[500],
        marginTop: 1,
    },
    hubArrow: {
        fontSize: 20,
        color: colors.neutral[400],
        fontWeight: '300',
        paddingHorizontal: 4,
    },
    logoutSection: {
        marginTop: 4,
        marginBottom: 10,
    },
    logoutBtn: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    logoutBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#DC2626',
    },
});