import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, ClipPath, Rect, Circle } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { useTheme, fonts } from '../theme';
import type { CalculateStackParamList } from '../navigation/CalculateStack';

type NavProp = NativeStackNavigationProp<CalculateStackParamList, 'Loading'>;
type RouteType = RouteProp<CalculateStackParamList, 'Loading'>;

/* ────────── Animated Components ────────── */
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/* ────────── Main Screen ────────── */

export default function LoadingScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<NavProp>();
    const route = useRoute<RouteType>();

    // The parameter from CalculateScreen
    const calculationId = route.params?.calculationId;

    // ── Animation Refs ──
    const fillProgress = useRef(new Animated.Value(0)).current;
    const bubble1 = useRef(new Animated.Value(0)).current;
    const bubble2 = useRef(new Animated.Value(0)).current;
    const bubble3 = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    // ── "Calculating..." Dots State ──
    const [dots, setDots] = useState('');

    useEffect(() => {
        // Start text fade-in
        setTimeout(() => {
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, 300);

        // Dots loop
        const dotInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
        }, 400);

        // Main Fill Animation (0 to 180 over 3s)
        Animated.timing(fillProgress, {
            toValue: 180,
            duration: 3000,
            useNativeDriver: false, // required for SVG attributes
        }).start(() => {
            clearInterval(dotInterval);
            // Navigate exactly after 3 seconds, passing along the calculation id
            navigation.replace('Results', { calculationId });
        });

        // ── Bubble Particle Loops ──
        const animateBubble = (anim: Animated.Value, delay: number) => {
            setTimeout(() => {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            }, delay);
        };

        animateBubble(bubble1, 0);
        animateBubble(bubble2, 800);
        animateBubble(bubble3, 1600);

        return () => clearInterval(dotInterval);
    }, [calculationId, fillProgress, navigation, textOpacity, bubble1, bubble2, bubble3]);

    /* ────────── Render ────────── */

    const boltPath = "M 60,10 L 25,90 L 55,90 L 40,170 L 95,70 L 65,70 Z";

    return (
        <View style={styles.root}>
            {/* ── Lightning Bolt ── */}
            <View style={styles.boltContainer}>
                {/* 1. Static Outline with Shadow */}
                <Svg
                    width="120"
                    height="180"
                    viewBox="0 0 120 180"
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            shadowColor: colors.accent,
                            shadowRadius: 8,
                            shadowOpacity: 0.8,
                            shadowOffset: { width: 0, height: 0 },
                            elevation: 5,
                        }
                    ]}
                >
                    <Path
                        d={boltPath}
                        stroke={colors.accent}
                        strokeWidth="3"
                        fill="transparent"
                    />
                </Svg>

                {/* 2. Filling Layer (Simplified Animated View) */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0,
                        width: 120,
                        overflow: 'hidden',
                        height: fillProgress,
                    }}
                >
                    <View style={{ position: 'absolute', bottom: 0, width: 120, height: 180 }}>
                        <Svg width="120" height="180" viewBox="0 0 120 180">
                            <Path d={boltPath} fill={colors.accent} />
                        </Svg>
                    </View>
                </Animated.View>

                {/* 3. Bubbles (Overlay) */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {/* Bubble 1 (bottom left) */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: 50,
                            bottom: 40,
                            opacity: bubble1.interpolate({
                                inputRange: [0, 0.8, 1],
                                outputRange: [0, 0.6, 0]
                            }),
                            transform: [{
                                translateY: bubble1.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -60]
                                })
                            }]
                        }}
                    >
                        <Svg width="6" height="6"><Circle cx="3" cy="3" r="3" fill="white" /></Svg>
                    </Animated.View>

                    {/* Bubble 2 (middle) */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: 45,
                            bottom: 80,
                            opacity: bubble2.interpolate({
                                inputRange: [0, 0.8, 1],
                                outputRange: [0, 0.6, 0]
                            }),
                            transform: [{
                                translateY: bubble2.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -40]
                                })
                            }]
                        }}
                    >
                        <Svg width="4" height="4"><Circle cx="2" cy="2" r="2" fill="white" /></Svg>
                    </Animated.View>

                    {/* Bubble 3 (top right) */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: 70,
                            bottom: 100,
                            opacity: bubble3.interpolate({
                                inputRange: [0, 0.8, 1],
                                outputRange: [0, 0.6, 0]
                            }),
                            transform: [{
                                translateY: bubble3.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -50]
                                })
                            }]
                        }}
                    >
                        <Svg width="8" height="8"><Circle cx="4" cy="4" r="4" fill="white" /></Svg>
                    </Animated.View>
                </View>
            </View>

            {/* ── Text ── */}
            <Animated.Text
                style={[
                    styles.text,
                    { color: colors.accent, opacity: textOpacity }
                ]}
            >
                Calculating{dots}
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#111111', // Enforced true dark mode for theater effect
        alignItems: 'center',
        justifyContent: 'center',
    },
    boltContainer: {
        width: 120,
        height: 180,
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontFamily: fonts.medium,
        fontSize: 16,
        width: 120,
        textAlign: 'center',
    },
});
