import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Linking,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { useTheme, fonts, getTenantColor } from '../theme';
import { loadAppData, Calculation, tempResult } from '../utils';
import type { CalculateStackParamList } from '../navigation/CalculateStack';

type NavProp = NativeStackNavigationProp<CalculateStackParamList, 'Results'>;
type RouteType = RouteProp<CalculateStackParamList, 'Results'>;

/* ────────── Helpers ────────── */

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function shareOnWhatsApp(result: Calculation) {
    try {
        const colorEmojis = ['🟢', '🔵', '🔴', '🟡', '🟣', '🔵', '🟠', '🟢'];

        const lines = [
            '⚡ NaijaWatts Bill Split',
            `${result.compoundName} · ${formatDate(result.date)}`,
            `Mode: ${result.mode === 'smart' ? 'Smart Split' : 'Equal Split'}`,
            '',
            ...result.splits.map(
                (s) =>
                    `${colorEmojis[s.colorIndex % 8]} ${s.name} (${s.flatLabel
                    }): ₦${s.share.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
            ),
            '',
            `Total: ₦${result.totalAmount.toLocaleString('en-NG')}`,
            '---',
            'Shared via NaijaWatts 🇳🇬',
        ];

        const message = lines.join('\n');
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open WhatsApp. Make sure WhatsApp is installed.');
        });
    } catch (error) {
        Alert.alert('Error', 'Could not open WhatsApp. Make sure WhatsApp is installed.');
    }
}

/* ────────── SVG Donut Chart ────────── */

const AnimatedPath = Animated.createAnimatedComponent(Path);

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

function arcPath(
    cx: number,
    cy: number,
    rInner: number,
    rOuter: number,
    startAngle: number,
    endAngle: number
) {
    // If a single slice is exactly 360, math fails, so bound to 359.99
    const sweep = endAngle - startAngle;
    const safeEnd = sweep >= 360 ? startAngle + 359.99 : endAngle;

    const startOuter = polarToCartesian(cx, cy, rOuter, safeEnd);
    const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
    const startInner = polarToCartesian(cx, cy, rInner, startAngle);
    const endInner = polarToCartesian(cx, cy, rInner, safeEnd);

    const largeArc = safeEnd - startAngle > 180 ? 1 : 0;

    return `
    M ${startOuter.x} ${startOuter.y}
    A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}
    L ${startInner.x} ${startInner.y}
    A ${rInner} ${rInner} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}
    Z
  `;
}

function DonutChart({
    result,
    cx = 110,
    cy = 110,
    outerR = 90,
    innerR = 58,
}: {
    result: Calculation;
    cx?: number;
    cy?: number;
    outerR?: number;
    innerR?: number;
}) {
    const total = result.totalAmount;
    const animProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 600ms sweep animation
        Animated.timing(animProgress, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
        }).start();
    }, [animProgress]);

    let currentStartAngle = 0;

    return (
        <View style={styles.chartWrap}>
            <Svg width={cx * 2} height={cy * 2} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
                {result.splits.map((s, i) => {
                    if (s.share <= 0) return null;

                    const sliceDegrees = (s.share / total) * 360;
                    const start = currentStartAngle;
                    const end = currentStartAngle + sliceDegrees;

                    currentStartAngle = end;

                    // We interpolate the end angle of this slice from 'start' to 'end' based on global progress
                    // This creates a "draw in" effect sequentially if we clamp it, but for simplicity we 
                    // just scale the total 360 degree circle fill, or simply scale the whole group
                    // A true sequential sweep requires individual bounds per slice. 
                    // An easy approximation: sweep the total angle from 0 to end, capping at actual slice end
                    // For perfection we will animate the arc sweep.
                    return (
                        <AnimatedPath
                            key={`slice-${i}`}
                            fill={getTenantColor(s.colorIndex)}
                            d={animProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [
                                    arcPath(cx, cy, innerR, outerR, start, start), // 0 width
                                    arcPath(cx, cy, innerR, outerR, start, end), // full width
                                ],
                            })}
                        />
                    );
                })}
            </Svg>
        </View>
    );
}

/* ────────── Main Screen ────────── */

export default function ResultsScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavProp>();
    const route = useRoute<RouteType>();

    const [result, setResult] = useState<Calculation | null>(null);

    // Staggered animated values
    const cardOpacities = useRef<Animated.Value[]>([]).current;
    const cardTranslateY = useRef<Animated.Value[]>([]).current;

    useFocusEffect(
        React.useCallback(() => {
            // Load calculation from history (passed via ID or string)
            // Because we passed a faux 'calcuationId' we load the compound history to fetch it
            // The instruction specifically mentioned Result is passed as Nav Param (but to dodge string limit we fetch it)
            const fetchResult = async () => {
                try {
                    const cid = route.params?.calculationId;
                    const data = await loadAppData();

                    if (cid === 'quick') {
                        if (tempResult.current) {
                            setupResultData(tempResult.current);
                        } else if ((route.params as any)?.result) {
                            setupResultData((route.params as any).result);
                        }
                    } else {
                        const compound = data.compounds.find(c => c.id === cid);
                        // Get the newest calculation (index 0)
                        if (compound && compound.history.length > 0) {
                            setupResultData(compound.history[0]);
                        }
                    }
                } catch (e) { }
            };

            fetchResult();
        }, [route])
    );

    const setupResultData = (data: Calculation) => {
        setResult(data);

        // Haptic feedback for result screen load
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Initialize animation values
        data.splits.forEach((_, i) => {
            if (!cardOpacities[i]) cardOpacities[i] = new Animated.Value(0);
            if (!cardTranslateY[i]) cardTranslateY[i] = new Animated.Value(20);
        });

        // Start staggered animation
        const animations = data.splits.map((_, i) =>
            Animated.parallel([
                Animated.timing(cardOpacities[i], {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(cardTranslateY[i], {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ])
        );
        Animated.stagger(50, animations).start();
    };


    if (!result) return <View style={[styles.root, { backgroundColor: colors.bgPrimary }]} />;

    return (
        <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.navigate('Calculate')}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Feather name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTexts}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>
                            {result.compoundName}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {formatDate(result.date)}
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* ── Chart & Center Text ── */}
                <View style={styles.chartSection}>
                    <DonutChart result={result} />
                    <View style={styles.centerTextWrap}>
                        <Text style={[styles.centerSub, { color: colors.textSecondary }]}>
                            Total Split
                        </Text>
                        <Text style={[styles.centerMain, { color: colors.textPrimary }]}>
                            ₦{result.totalAmount.toLocaleString('en-NG')}
                        </Text>
                    </View>
                </View>

                {/* ── Legend ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.legendScroll}
                    style={styles.legendContainer}
                >
                    {result.splits.map((s, i) => {
                        const pct = Math.round((s.share / result.totalAmount) * 100);
                        return (
                            <View
                                key={`legend-${i}`}
                                style={[
                                    styles.legendBtn,
                                    { backgroundColor: colors.bgSurface, borderColor: colors.border },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.legendDot,
                                        { backgroundColor: getTenantColor(s.colorIndex) },
                                    ]}
                                />
                                <Text style={[styles.legendText, { color: colors.textPrimary }]}>
                                    {s.name.split(' ')[0]} {pct}%
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* ── Breakdown ── */}
                <View style={styles.breakdownSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Breakdown
                    </Text>

                    {result.splits.map((s, i) => (
                        <Animated.View
                            key={`card-${i}`}
                            style={[
                                styles.breakdownCard,
                                {
                                    backgroundColor: colors.bgCard,
                                    borderColor: colors.border,
                                    opacity: cardOpacities[i] || 1,
                                    transform: [{ translateY: cardTranslateY[i] || 0 }],
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.breakdownBar,
                                    { backgroundColor: getTenantColor(s.colorIndex) },
                                ]}
                            />
                            <View style={styles.breakdownLeft}>
                                <Text style={[styles.bdName, { color: colors.textPrimary }]}>
                                    {s.name}
                                </Text>
                                <Text style={[styles.bdFlat, { color: colors.textSecondary }]}>
                                    {s.flatLabel}
                                </Text>
                                {result.mode === 'smart' && s.kwh !== undefined && (
                                    <Text style={[styles.bdKwh, { color: colors.textSecondary }]}>
                                        {s.kwh} kWh used
                                    </Text>
                                )}
                            </View>

                            <View style={styles.breakdownRight}>
                                <Text
                                    style={[
                                        styles.bdAmount,
                                        { color: getTenantColor(s.colorIndex) },
                                    ]}
                                >
                                    ₦
                                    {s.share.toLocaleString('en-NG', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 2,
                                    })}
                                </Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                {/* ── Actions ── */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.shareBtn, { backgroundColor: colors.accent }]}
                        activeOpacity={0.85}
                        onPress={() => shareOnWhatsApp(result)}
                    >
                        <Feather
                            name="upload"
                            size={20}
                            color={colors.accentText}
                            style={{ marginRight: 8, transform: [{ rotate: '-90deg' }] }}
                        />
                        <Text style={[styles.shareText, { color: colors.accentText }]}>
                            Share on WhatsApp
                        </Text>
                    </TouchableOpacity>

                    {(route.params as any)?.historyMode ? (
                        <TouchableOpacity
                            style={[styles.calcAgainBtn, { borderColor: colors.accent }]}
                            activeOpacity={0.85}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={[styles.calcAgainText, { color: colors.accent }]}>
                                Back to History
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.calcAgainBtn, { borderColor: colors.accent }]}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('Calculate')}
                        >
                            <Text style={[styles.calcAgainText, { color: colors.accent }]}>
                                Calculate Again
                            </Text>
                        </TouchableOpacity>
                    )}
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
        marginBottom: 32,
    },
    backBtn: { width: 40 },
    headerTexts: { flex: 1, alignItems: 'center' },
    title: { fontFamily: fonts.bold, fontSize: 18 },
    subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },

    /* Chart */
    chartSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        position: 'relative',
        height: 220,
    },
    chartWrap: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerTextWrap: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    centerSub: {
        fontFamily: fonts.regular,
        fontSize: 12,
        marginBottom: 4,
    },
    centerMain: {
        fontFamily: fonts.bold,
        fontSize: 24,
    },

    /* Legend */
    legendContainer: {
        marginBottom: 32,
    },
    legendScroll: {
        gap: 8,
        paddingRight: 20, // To allow scrolling past end organically
    },
    legendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        fontFamily: fonts.regular,
        fontSize: 13,
    },

    /* Breakdown */
    breakdownSection: { marginBottom: 32 },
    sectionTitle: {
        fontFamily: fonts.bold,
        fontSize: 16,
        marginBottom: 16,
    },
    breakdownCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingLeft: 20,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    breakdownBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    breakdownLeft: { flex: 1 },
    bdName: { fontFamily: fonts.bold, fontSize: 16 },
    bdFlat: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
    bdKwh: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
    breakdownRight: {},
    bdAmount: { fontFamily: fonts.bold, fontSize: 20 },

    /* Actions */
    actions: { gap: 12, paddingBottom: 20 },
    shareBtn: {
        height: 56,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareText: { fontFamily: fonts.bold, fontSize: 16 },
    calcAgainBtn: {
        height: 56,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    calcAgainText: { fontFamily: fonts.bold, fontSize: 16 },
});
