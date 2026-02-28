import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, fonts } from '../theme';

export default function MoreScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const openPrivacyPolicy = () => {
        Haptics.selectionAsync();
        Linking.openURL('https://naijawatts.com/privacy');
    };

    const showAbout = () => {
        Haptics.selectionAsync();
        Alert.alert(
            "NaijaWatts",
            "A bill-splitting utility app built for Nigerian compounds. All data stays on your device. No internet required."
        );
    };

    const SettingRow = ({
        icon,
        label,
        onPress,
        showChevron = true,
        isLast = false
    }: {
        icon: keyof typeof Feather.glyphMap,
        label: string,
        onPress?: () => void,
        showChevron?: boolean,
        isLast?: boolean
    }) => (
        <TouchableOpacity
            style={[
                styles.row,
                { borderBottomColor: colors.border },
                isLast && { borderBottomWidth: 0 }
            ]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.rowLeft}>
                <Feather name={icon} size={20} color={colors.accent} />
                <Text style={[styles.rowText, { color: colors.textPrimary }]}>{label}</Text>
            </View>
            {showChevron && (
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>More</Text>
                </View>

                {/* ── App Identity Card ── */}
                <View
                    style={[
                        styles.appCard,
                        {
                            backgroundColor: colors.bgCard,
                            borderColor: colors.border,
                            ...Platform.select({
                                ios: {
                                    shadowColor: '#000',
                                    shadowOpacity: 0.12,
                                    shadowRadius: 12,
                                    shadowOffset: { width: 0, height: 4 },
                                },
                                android: { elevation: 4 },
                            }),
                        },
                    ]}
                >
                    <Text style={[styles.appTitle, { color: colors.accent }]}>
                        NaijaWatts ⚡
                    </Text>
                    <Text style={[styles.appSubtitle, { color: colors.textPrimary }]}>
                        Split your compound light bill fairly
                    </Text>
                    <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
                        Built for Nigerian households 🇳🇬
                    </Text>
                    <Text style={[styles.version, { color: colors.textSecondary }]}>
                        Version 1.0.0
                    </Text>
                </View>

                {/* ── Legal Section ── */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Legal</Text>
                <View style={[styles.sectionBox, { borderColor: colors.border, backgroundColor: colors.bgSurface }]}>
                    <SettingRow
                        icon="shield"
                        label="Privacy Policy"
                        onPress={openPrivacyPolicy}
                        isLast={true}
                    />
                </View>

                {/* ── About Section ── */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>About</Text>
                <View style={[styles.sectionBox, { borderColor: colors.border, backgroundColor: colors.bgSurface }]}>
                    <SettingRow
                        icon="info"
                        label="About NaijaWatts"
                        onPress={showAbout}
                    />
                    <SettingRow
                        icon="heart"
                        label="Made for Nigeria 🇳🇬"
                        showChevron={false}
                        isLast={true}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 20 },
    header: {
        marginBottom: 24,
        paddingTop: 8,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
    },
    appCard: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        alignItems: 'center',
    },
    appTitle: {
        fontFamily: fonts.bold,
        fontSize: 28,
        marginBottom: 8,
    },
    appSubtitle: {
        fontFamily: fonts.medium,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 4,
    },
    appTagline: {
        fontFamily: fonts.regular,
        fontSize: 13,
        marginBottom: 16,
    },
    version: {
        fontFamily: fonts.regular,
        fontSize: 12,
    },
    sectionHeader: {
        fontFamily: fonts.bold,
        fontSize: 14,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionBox: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        overflow: 'hidden',
    },
    row: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowText: {
        fontFamily: fonts.medium,
        fontSize: 15,
        marginLeft: 16,
    },
});
