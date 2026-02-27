import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { useTheme, fonts, getTenantColor } from '../theme';
import {
    loadAppData,
    clearCalculationHistory,
    Compound,
    Calculation,
} from '../utils';
import type { HomeStackParamList } from '../navigation/HomeStack'; // Navigating back to Calculate/Results happens via their own stack, but History is a tab. We need to navigate to CalculateTab -> Results from here.

// A composite type isn't strictly necessary if using any for standard stack jumps, but we'll cleanly route to CalculateStack's Results.
type NavProp = NativeStackNavigationProp<any>;

/* ────────── Helpers ────────── */

function formatDate(iso: string): string {
    const d = new Date(iso);
    // e.g. "21 Feb 2026 · 3:45 PM"
    const dateStr = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return `${dateStr} · ${timeStr}`;
}

function shareOnWhatsApp(result: Calculation) {
    const colorEmojis = ['🟢', '🔵', '🔴', '🟡', '🟣', '🔵', '🟠', '🟢'];

    const lines = [
        '⚡ NaijaWatts Bill Split',
        `${result.compoundName} · ${formatDate(result.date)}`,
        `Mode: ${result.mode === 'smart' ? 'Smart Split' : 'Equal Split'}`,
        '',
        ...result.splits.map(
            (s) =>
                `${colorEmojis[s.colorIndex % 8]} ${s.name} (${s.flatLabel
                }): ₦${s.share.toLocaleString('en-NG', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                })}`
        ),
        '',
        `Total: ₦${result.totalAmount.toLocaleString('en-NG')}`,
        '---',
        'Shared via NaijaWatts 🇳🇬',
    ];

    const message = lines.join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

    Linking.openURL(url);
}

/* ────────── Sub-components ────────── */

function HistoryCard({
    calc,
    colors,
    onPress,
}: {
    calc: Calculation;
    colors: any;
    onPress: () => void;
}) {
    const total = calc.splits.reduce((sum, s) => sum + s.share, 0);

    return (
        <TouchableOpacity
            style={[
                styles.card,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            {/* Top Row */}
            <View style={styles.cardTopRow}>
                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                    {formatDate(calc.date)}
                </Text>
                <View style={styles.badgeWrap}>
                    <Text style={styles.badgeText}>
                        {calc.mode === 'smart' ? 'Smart' : 'Equal'}
                    </Text>
                </View>
            </View>

            {/* Amount + Bar */}
            <Text style={[styles.cardAmount, { color: colors.accent }]}>
                ₦{calc.totalAmount.toLocaleString('en-NG')}
            </Text>

            <View style={styles.barWrap}>
                {calc.splits.map((s, i) => {
                    if (total === 0 || s.share === 0) return null;
                    const pct = (s.share / total) * 100;
                    return (
                        <View
                            key={`bar-${i}`}
                            style={{
                                width: `${pct}%`,
                                backgroundColor: getTenantColor(s.colorIndex),
                            }}
                        />
                    );
                })}
            </View>

            {/* Legend Row */}
            <View style={styles.legendRow}>
                {calc.splits.map((s, i) => (
                    <View key={`leg-${i}`} style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendDot,
                                { backgroundColor: getTenantColor(s.colorIndex) },
                            ]}
                        />
                        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                            {s.name.split(' ')[0]} ₦
                            {s.share.toLocaleString('en-NG', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            })}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Bottom Share Button */}
            <View style={styles.cardBottomRow}>
                <TouchableOpacity
                    style={styles.inlineShareBtn}
                    onPress={() => shareOnWhatsApp(calc)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.inlineShareText}>Share on WhatsApp 📤</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

/* ────────── Main Screen ────────── */

export default function HistoryScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavProp>();

    const [compounds, setCompounds] = useState<Compound[]>([]);
    const [activeCompoundId, setActiveCompoundId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        const data = await loadAppData();
        const valid = data.compounds.filter((c) => c.history.length > 0);

        // If active id isn't in valid anymore (or never set), default to first if any
        let nextActive = activeCompoundId;
        if (!valid.find((c) => c.id === activeCompoundId) && valid.length > 0) {
            nextActive = valid[0].id;
        }

        setCompounds(data.compounds); // show all compounds or only valid? Prompt: "Tapping switches which compound's history shows. If only one compound, still show it selected."
        // We'll show all compounds so the user can see empty states for compounds with no history,
        // but default select the first one.
        if (!activeCompoundId && data.compounds.length > 0) {
            setActiveCompoundId(data.compounds[0].id);
        }
    };

    const handleClearHistory = () => {
        if (!activeCompoundId) return;
        const compound = compounds.find((c) => c.id === activeCompoundId);
        if (!compound) return;

        Alert.alert(
            'Clear History',
            `Remove all calculations for ${compound.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await clearCalculationHistory(activeCompoundId);
                        await loadData();
                    },
                },
            ]
        );
    };

    const activeCompound = compounds.find((c) => c.id === activeCompoundId);
    const historyList = activeCompound?.history || [];

    return (
        <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                    History
                </Text>
            </View>

            {/* ── Compound Selector ── */}
            {compounds.length > 0 && (
                <View style={styles.selectorWrap}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.selectorScroll}
                    >
                        {compounds.map((c) => {
                            const isActive = c.id === activeCompoundId;
                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[
                                        styles.pillBtn,
                                        {
                                            backgroundColor: isActive
                                                ? colors.accent
                                                : colors.bgSurface,
                                        },
                                    ]}
                                    onPress={() => setActiveCompoundId(c.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.pillText,
                                            {
                                                color: isActive
                                                    ? colors.accentText
                                                    : colors.textSecondary,
                                            },
                                        ]}
                                    >
                                        {c.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* ── History List / Empty State ── */}
            {compounds.length === 0 || !activeCompound ? (
                <View style={styles.emptyWrap}>
                    <Feather name="clock" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                        No compounds yet
                    </Text>
                    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                        Create a compound to start splitting
                    </Text>
                </View>
            ) : historyList.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Feather name="clock" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                        No calculations yet
                    </Text>
                    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                        Run your first split to see history here
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[
                        styles.listScroll,
                        { paddingBottom: insets.bottom + 40 },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {historyList.map((calc, idx) => (
                        <HistoryCard
                            key={calc.id || idx}
                            calc={calc}
                            colors={colors}
                            onPress={() => {
                                // Navigate to Results, passing the full result explicitly (or tell Results to fetch it)
                                // We'll pass result param exactly as requested for the Loading -> Results handoff
                                navigation.navigate('CalculateTab', {
                                    screen: 'Results',
                                    params: { result: calc, historyMode: true },
                                });
                            }}
                        />
                    ))}

                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={handleClearHistory}
                        activeOpacity={0.6}
                        hitSlop={{ top: 12, bottom: 20, left: 20, right: 20 }}
                    >
                        <Text style={[styles.clearText, { color: colors.textSecondary }]}>
                            Clear History
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}

/* ────────── Styles ────────── */

const styles = StyleSheet.create({
    root: { flex: 1 },

    /* Header */
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
    },

    /* Compound Selector */
    selectorWrap: {
        marginBottom: 16,
    },
    selectorScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    pillBtn: {
        borderRadius: 100,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    pillText: {
        fontFamily: fonts.medium,
        fontSize: 14,
    },

    /* Empty State */
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontFamily: fonts.bold,
        fontSize: 18,
        marginTop: 16,
    },
    emptySub: {
        fontFamily: fonts.regular,
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },

    /* History List */
    listScroll: {
        paddingHorizontal: 20,
    },
    card: {
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardDate: {
        fontFamily: fonts.regular,
        fontSize: 12,
    },
    badgeWrap: {
        borderWidth: 1,
        borderColor: '#C8F135',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 100,
    },
    badgeText: {
        color: '#C8F135',
        fontFamily: fonts.bold,
        fontSize: 11,
    },
    cardAmount: {
        fontFamily: fonts.bold,
        fontSize: 22,
        marginTop: 6,
    },

    /* Color Bar */
    barWrap: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 100,
        overflow: 'hidden',
        width: '100%',
        marginTop: 8,
    },

    /* Legend Row */
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
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
        marginRight: 4,
    },
    legendText: {
        fontFamily: fonts.regular,
        fontSize: 12,
    },

    /* Share Button */
    cardBottomRow: {
        alignItems: 'flex-end',
        marginTop: 12,
    },
    inlineShareBtn: {
        height: 32,
        borderWidth: 1,
        borderColor: '#C8F135',
        borderRadius: 100,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineShareText: {
        color: '#C8F135',
        fontFamily: fonts.medium,
        fontSize: 11,
    },

    /* Clear BTN */
    clearBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    clearText: {
        fontFamily: fonts.medium,
        fontSize: 13,
    },
});
