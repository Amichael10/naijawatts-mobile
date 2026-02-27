import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme, fonts, getTenantColor } from '../theme';
import { loadAppData, Compound, Calculation } from '../utils';
import type { HomeStackParamList } from '../navigation/HomeStack';
import type { BottomTabParamList } from '../navigation/BottomTabNavigator';

type HomeNavProp = CompositeNavigationProp<
    NativeStackNavigationProp<HomeStackParamList, 'Home'>,
    BottomTabNavigationProp<BottomTabParamList>
>;

/* ────────── Helpers ────────── */

function getGreeting(): { greeting: string; subtitle: string } {
    const hour = new Date().getHours();
    if (hour < 12) {
        return {
            greeting: 'Good morning 🌤️',
            subtitle: 'Ready to split the morning bills?',
        };
    }
    if (hour < 17) {
        return {
            greeting: 'Good afternoon ☀️',
            subtitle: "Ready to split today's bills?",
        };
    }
    return {
        greeting: 'Good evening 🌙',
        subtitle: "Let's settle tonight's bills.",
    };
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatNaira(amount: number): string {
    return `₦${amount.toLocaleString('en-NG')}`;
}

/* ────────── Sub-components ────────── */

function TenantColorBar({
    splits,
    height = 12,
    borderRadius = 100,
}: {
    splits: Calculation['splits'];
    height?: number;
    borderRadius?: number;
}) {
    const total = splits.reduce((s, r) => s + r.share, 0);
    if (total === 0) return null;

    return (
        <View
            style={{
                flexDirection: 'row',
                height,
                borderRadius,
                overflow: 'hidden',
                width: '100%',
            }}
        >
            {splits.map((s, i) => {
                const pct = (s.share / total) * 100;
                if (pct === 0) return null;
                return (
                    <View
                        key={`${s.tenantId}-${i}`}
                        style={{
                            width: `${pct}%`,
                            backgroundColor: getTenantColor(s.colorIndex),
                        }}
                    />
                );
            })}
        </View>
    );
}

function MiniColorBar({ splits }: { splits: Calculation['splits'] }) {
    return (
        <View style={{ width: 80 }}>
            <TenantColorBar splits={splits} height={6} borderRadius={100} />
        </View>
    );
}

/* ────────── Home Screen ────────── */

export default function HomeScreen() {
    const { mode, colors, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<HomeNavProp>();
    const [compounds, setCompounds] = useState<Compound[]>([]);
    const { greeting, subtitle } = getGreeting();

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const data = await loadAppData();
                setCompounds(data.compounds);
            })();
        }, [])
    );

    // Most recent calculation across all compounds
    const latestCalc: { calc: Calculation; compound: Compound } | null = (() => {
        let best: { calc: Calculation; compound: Compound } | null = null;
        for (const c of compounds) {
            if (c.history.length > 0) {
                const newest = c.history[0];
                if (!best || newest.date > best.calc.date) {
                    best = { calc: newest, compound: c };
                }
            }
        }
        return best;
    })();

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
                    <Text style={[styles.logo, { color: colors.accent }]}>
                        NaijaWatts ⚡
                    </Text>
                    <TouchableOpacity
                        onPress={toggleTheme}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Feather
                            name={mode === 'dark' ? 'sun' : 'moon'}
                            size={22}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                {/* ── Greeting ── */}
                <View style={styles.greetingSection}>
                    <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
                        {greeting}
                    </Text>
                    <Text style={[styles.greetingMain, { color: colors.textPrimary }]}>
                        {subtitle}
                    </Text>
                </View>

                {/* ── Hero Card ── */}
                {latestCalc ? (
                    <View
                        style={[
                            styles.heroCard,
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
                        <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
                            Last Split
                        </Text>
                        <Text style={[styles.heroName, { color: colors.textPrimary }]}>
                            {latestCalc.compound.name}
                        </Text>
                        <Text style={[styles.heroDate, { color: colors.textSecondary }]}>
                            {formatDate(latestCalc.calc.date)}
                        </Text>
                        <Text style={[styles.heroAmount, { color: colors.accent }]}>
                            {formatNaira(latestCalc.calc.totalAmount)}
                        </Text>

                        {/* Tenant color bar */}
                        <View style={styles.heroBarWrap}>
                            <TenantColorBar splits={latestCalc.calc.splits} />
                        </View>

                        {/* Legend */}
                        <View style={styles.legendRow}>
                            {latestCalc.calc.splits.map((s, i) => (
                                <View key={`${s.tenantId}-${i}`} style={styles.legendItem}>
                                    <View
                                        style={[
                                            styles.legendDot,
                                            { backgroundColor: getTenantColor(s.colorIndex) },
                                        ]}
                                    />
                                    <Text
                                        style={[styles.legendText, { color: colors.textSecondary }]}
                                        numberOfLines={1}
                                    >
                                        {s.name} • {formatNaira(s.share)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Split Again button */}
                        <TouchableOpacity
                            style={[styles.splitAgainBtn, { borderColor: colors.accent }]}
                            onPress={() =>
                                navigation.navigate('CalculateTab' as any)
                            }
                        >
                            <Text
                                style={[styles.splitAgainText, { color: colors.accent }]}
                            >
                                Split Again →
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.emptyCard,
                            { borderColor: colors.border },
                        ]}
                    >
                        <Feather name="home" size={32} color={colors.textSecondary} />
                        <Text
                            style={[styles.emptyText, { color: colors.textSecondary }]}
                        >
                            No compounds yet
                        </Text>
                        <Text
                            style={[styles.emptySubtext, { color: colors.textSecondary }]}
                        >
                            Add a compound to get started
                        </Text>
                    </View>
                )}

                {/* ── Compounds List ── */}
                {compounds.length > 0 && (
                    <View style={styles.section}>
                        <Text
                            style={[styles.sectionTitle, { color: colors.textPrimary }]}
                        >
                            Your Compounds
                        </Text>
                        {compounds.map((compound) => {
                            const lastCalc = compound.history[0];
                            return (
                                <TouchableOpacity
                                    key={compound.id}
                                    style={[
                                        styles.compoundCard,
                                        {
                                            backgroundColor: colors.bgCard,
                                            borderColor: colors.border,
                                            ...Platform.select({
                                                ios: {
                                                    shadowColor: '#000',
                                                    shadowOpacity: 0.08,
                                                    shadowRadius: 8,
                                                    shadowOffset: { width: 0, height: 2 },
                                                },
                                                android: { elevation: 2 },
                                            }),
                                        },
                                    ]}
                                    onPress={() =>
                                        navigation.navigate('CalculateTab' as any)
                                    }
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.compoundLeft}>
                                        <Text
                                            style={[
                                                styles.compoundName,
                                                { color: colors.textPrimary },
                                            ]}
                                        >
                                            {compound.name}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.compoundSub,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            {compound.tenants.length} tenant
                                            {compound.tenants.length !== 1 ? 's' : ''}
                                        </Text>
                                    </View>

                                    <View style={styles.compoundRight}>
                                        {lastCalc && (
                                            <>
                                                <MiniColorBar splits={lastCalc.splits} />
                                                <Text
                                                    style={[
                                                        styles.compoundAmount,
                                                        { color: colors.accent },
                                                    ]}
                                                >
                                                    {formatNaira(lastCalc.totalAmount)}
                                                </Text>
                                            </>
                                        )}
                                    </View>

                                    <Feather
                                        name="chevron-right"
                                        size={18}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ── Bottom Buttons ── */}
                <View style={styles.buttonsWrap}>
                    <TouchableOpacity
                        style={[
                            styles.primaryBtn,
                            { backgroundColor: colors.accent },
                        ]}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('CompoundSetup')}
                    >
                        <Feather
                            name="plus"
                            size={20}
                            color={colors.accentText}
                            style={{ marginRight: 8 }}
                        />
                        <Text
                            style={[styles.primaryBtnText, { color: colors.accentText }]}
                        >
                            New Compound
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.secondaryBtn,
                            { borderColor: colors.accent },
                        ]}
                        activeOpacity={0.85}
                        onPress={() =>
                            navigation.navigate('CalculateTab' as any)
                        }
                    >
                        <Feather
                            name="zap"
                            size={20}
                            color={colors.accent}
                            style={{ marginRight: 8 }}
                        />
                        <Text
                            style={[styles.secondaryBtnText, { color: colors.accent }]}
                        >
                            Quick Split
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

/* ────────── Styles ────────── */

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 20 },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingTop: 8,
    },
    logo: {
        fontFamily: fonts.bold,
        fontSize: 24,
    },

    /* Greeting */
    greetingSection: { marginBottom: 24 },
    greetingSub: {
        fontFamily: fonts.regular,
        fontSize: 13,
        marginBottom: 4,
    },
    greetingMain: {
        fontFamily: fonts.bold,
        fontSize: 22,
    },

    /* Hero Card */
    heroCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 28,
        borderWidth: 1,
    },
    heroLabel: {
        fontFamily: fonts.regular,
        fontSize: 12,
        marginBottom: 4,
    },
    heroName: {
        fontFamily: fonts.bold,
        fontSize: 20,
        marginBottom: 2,
    },
    heroDate: {
        fontFamily: fonts.regular,
        fontSize: 13,
        marginBottom: 12,
    },
    heroAmount: {
        fontFamily: fonts.bold,
        fontSize: 32,
        marginBottom: 16,
    },
    heroBarWrap: { marginBottom: 12 },

    /* Legend */
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 5,
    },
    legendText: {
        fontFamily: fonts.regular,
        fontSize: 13,
    },

    /* Split Again */
    splitAgainBtn: {
        alignSelf: 'flex-end',
        borderWidth: 1.5,
        borderRadius: 100,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    splitAgainText: {
        fontFamily: fonts.bold,
        fontSize: 13,
    },

    /* Empty state */
    emptyCard: {
        borderRadius: 16,
        padding: 32,
        marginBottom: 28,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontFamily: fonts.bold,
        fontSize: 16,
        marginTop: 12,
    },
    emptySubtext: {
        fontFamily: fonts.regular,
        fontSize: 13,
        marginTop: 4,
    },

    /* Section */
    section: { marginBottom: 28 },
    sectionTitle: {
        fontFamily: fonts.bold,
        fontSize: 16,
        marginBottom: 12,
    },

    /* Compound cards */
    compoundCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
    },
    compoundLeft: { flex: 1 },
    compoundName: {
        fontFamily: fonts.bold,
        fontSize: 15,
    },
    compoundSub: {
        fontFamily: fonts.regular,
        fontSize: 13,
        marginTop: 2,
    },
    compoundRight: {
        alignItems: 'flex-end',
        marginRight: 10,
        gap: 4,
    },
    compoundAmount: {
        fontFamily: fonts.bold,
        fontSize: 14,
    },

    /* Buttons */
    buttonsWrap: { gap: 12 },
    primaryBtn: {
        height: 56,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        width: '100%',
    },
    primaryBtnText: {
        fontFamily: fonts.bold,
        fontSize: 16,
    },
    secondaryBtn: {
        height: 56,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        width: '100%',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
    },
    secondaryBtnText: {
        fontFamily: fonts.bold,
        fontSize: 16,
    },
});
