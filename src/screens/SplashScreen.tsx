import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, fonts } from '../theme';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const { colors } = useTheme();
    const fillProgress = useRef(new Animated.Value(0)).current;

    const boltPath = "M 60,10 L 25,90 L 55,90 L 40,170 L 95,70 L 65,70 Z";

    useEffect(() => {
        // Start animation immediately
        Animated.timing(fillProgress, {
            toValue: 180,
            duration: 2000,
            useNativeDriver: false,
        }).start(() => {
            // Wait a tiny bit then finish
            setTimeout(onFinish, 200);
        });
    }, [fillProgress, onFinish]);

    return (
        <View style={styles.root}>
            <View style={styles.boltContainer}>
                {/* 1. Filling Layer (Plain View BEHIND) */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        backgroundColor: colors.accent,
                        width: 120,
                        height: fillProgress,
                    }}
                />

                {/* 2. Static SVG Hole & Outline (ON TOP) */}
                <Svg
                    width="120"
                    height="180"
                    viewBox="0 0 120 180"
                    style={StyleSheet.absoluteFill}
                >
                    {/* The Negative Mask */}
                    <Path
                        d={`M 0,0 H 120 V 180 H 0 Z ${boltPath}`}
                        fill="#111111"
                        fillRule="evenodd"
                    />
                    {/* The Outline */}
                    <Path
                        d={boltPath}
                        stroke={colors.accent}
                        strokeWidth="3"
                        fill="transparent"
                    />
                </Svg>
            </View>

            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.accent }]}>
                    NaijaWatts
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    ⚡ Split your light bill fairly
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#111111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    boltContainer: {
        width: 120,
        height: 180,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
    },
});
