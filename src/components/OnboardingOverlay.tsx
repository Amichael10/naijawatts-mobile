import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Linking,
    Dimensions,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, fonts } from '../theme';

const { width, height } = Dimensions.get('window');

const ONBOARDED_KEY = 'nw_onboarded';

export default function OnboardingOverlay() {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const checkOnboarded = async () => {
            try {
                const value = await AsyncStorage.getItem(ONBOARDED_KEY);
                if (value !== 'true') {
                    setVisible(true);
                }
            } catch (e) {
                // If error, show onboarding just in case
                setVisible(true);
            }
        };
        checkOnboarded();
    }, []);

    const handleGetStarted = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
            setVisible(false);
        } catch (e) {
            setVisible(false);
        }
    };

    const openPrivacy = () => {
        Linking.openURL('https://naijawatts.com/privacy');
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={[styles.container, { backgroundColor: '#0d0d0d' }]}>
                {/* ── Icon ── */}
                <View style={styles.iconCircle}>
                    <Text style={[styles.boltIcon, { color: colors.accent }]}>⚡</Text>
                </View>

                {/* ── Title ── */}
                <Text style={[styles.title, { color: 'white' }]}>NaijaWatts</Text>
                <Text style={[styles.subtitle, { color: '#ccc' }]}>
                    Split your compound light bill fairly and instantly
                </Text>

                {/* ── Feature List Card ── */}
                <View style={[styles.card, { backgroundColor: '#1a1a1a', borderColor: '#333' }]}>
                    <FeatureItem label="Smart split by usage" color={colors.accent} />
                    <FeatureItem label="Equal split option" color={colors.accent} />
                    <FeatureItem label="Share via WhatsApp" color={colors.accent} />
                    <FeatureItem label="Everything stays on your phone" color={colors.accent} />
                </View>

                {/* ── Footer ── */}
                <View style={styles.footer}>
                    <Text style={styles.privacyText}>
                        By tapping Get Started you agree to our{' '}
                        <Text style={[styles.link, { color: colors.accent }]} onPress={openPrivacy}>
                            Privacy Policy
                        </Text>
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={handleGetStarted}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.buttonText, { color: 'black' }]}>
                            Get Started ⚡
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function FeatureItem({ label, color }: { label: string; color: string }) {
    return (
        <View style={styles.featureItem}>
            <Feather name="check" size={20} color={color} />
            <Text style={styles.featureLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: height * 0.15,
        zIndex: 9999,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    boltIcon: {
        fontSize: 50,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 36,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: fonts.medium,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    card: {
        width: '100%',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureLabel: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: 'white',
        marginLeft: 12,
    },
    footer: {
        width: '100%',
        marginTop: 'auto',
        marginBottom: Platform.OS === 'ios' ? 60 : 40,
        alignItems: 'center',
    },
    privacyText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: '#888',
        marginBottom: 20,
    },
    link: {
        textDecorationLine: 'underline',
    },
    button: {
        width: '100%',
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#C8F135',
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
            },
            android: { elevation: 8 },
        }),
    },
    buttonText: {
        fontFamily: fonts.bold,
        fontSize: 18,
    },
});
