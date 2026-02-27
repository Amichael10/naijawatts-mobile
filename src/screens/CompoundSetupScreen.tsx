import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTheme, fonts, getTenantColor } from '../theme';
import {
    generateId,
    saveCompound,
    loadAppData,
    Tenant,
    Compound,
} from '../utils';
import type { HomeStackParamList } from '../navigation/HomeStack';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'CompoundSetup'>;
type RouteType = RouteProp<HomeStackParamList, 'CompoundSetup'>;

/* ────────── Sub-components ────────── */

/** Animated Tenant Chip */
function TenantChip({
    tenant,
    onRemove,
}: {
    tenant: Tenant;
    onRemove: () => void;
}) {
    const { colors } = useTheme();
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
        }).start();
    }, [scale]);

    return (
        <Animated.View style={[styles.chipScale, { transform: [{ scale }] }]}>
            <View
                style={[
                    styles.chip,
                    { backgroundColor: colors.bgSurface, borderColor: colors.border },
                ]}
            >
                <View
                    style={[
                        styles.chipDot,
                        { backgroundColor: getTenantColor(tenant.colorIndex) },
                    ]}
                />
                <Text style={[styles.chipText, { color: colors.textPrimary }]}>
                    {tenant.flatLabel} — {tenant.name}
                </Text>
                <TouchableOpacity
                    onPress={onRemove}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.chipRemove}
                >
                    <Feather name="x" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

/* ────────── Main Screen ────────── */

export default function CompoundSetupScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavProp>();
    const route = useRoute<RouteType>();

    const editCompoundId = route.params?.compoundId;
    const isEditMode = !!editCompoundId;

    // Form State
    const [compoundName, setCompoundName] = useState('');
    const [compoundNameFocused, setCompoundNameFocused] = useState(false);

    const [tenants, setTenants] = useState<Tenant[]>([]);

    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantFlat, setNewTenantFlat] = useState('');

    const [nameError, setNameError] = useState(false);
    const [flatError, setFlatError] = useState(false);

    // Refs for scrolling and focus
    const scrollViewRef = useRef<ScrollView>(null);
    const tenantNameInputRef = useRef<TextInput>(null);
    const tenantFlatInputRef = useRef<TextInput>(null);

    // Shake animation values
    const shakeName = useRef(new Animated.Value(0)).current;
    const shakeFlat = useRef(new Animated.Value(0)).current;

    // Load existing data if editing
    useEffect(() => {
        if (isEditMode && editCompoundId) {
            (async () => {
                const data = await loadAppData();
                const existing = data.compounds.find((c) => c.id === editCompoundId);
                if (existing) {
                    setCompoundName(existing.name);
                    setTenants(existing.tenants);
                }
            })();
        }
    }, [isEditMode, editCompoundId]);

    /* ────────── Actions ────────── */

    const triggerShake = (anim: Animated.Value) => {
        Animated.sequence([
            Animated.timing(anim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleAddTenant = () => {
        const nameStr = newTenantName.trim();
        const flatStr = newTenantFlat.trim();

        let hasError = false;
        if (!nameStr) {
            setNameError(true);
            triggerShake(shakeName);
            hasError = true;
        } else {
            setNameError(false);
        }

        if (!flatStr) {
            setFlatError(true);
            triggerShake(shakeFlat);
            hasError = true;
        } else {
            setFlatError(false);
        }

        if (hasError) return;

        // Valid — assign next color index
        const newTenant: Tenant = {
            id: generateId(),
            name: nameStr,
            flatLabel: flatStr,
            colorIndex: tenants.length,
        };

        setTenants((prev) => [...prev, newTenant]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Clear inputs and error state
        setNewTenantName('');
        setNewTenantFlat('');
        setNameError(false);
        setFlatError(false);

        // Auto-focus name field for next entry
        setTimeout(() => {
            tenantNameInputRef.current?.focus();
            // Scroll to bottom is automatically handled by KeyboardAvoidingView + ScrollView,
            // but we force a bottom scroll to ensure the empty form remains visible
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleRemoveTenant = (id: string) => {
        setTenants((prev) => {
            // Re-map color indices so they remain sequential without gaps
            const filtered = prev.filter((t) => t.id !== id);
            return filtered.map((t, idx) => ({ ...t, colorIndex: idx }));
        });
    };

    const handleSaveCompound = async () => {
        if (!compoundName.trim() || tenants.length < 2) return;

        try {
            let compoundToSave: Compound;

            if (isEditMode && editCompoundId) {
                // Load existing to preserve history
                const data = await loadAppData();
                const existing = data.compounds.find((c) => c.id === editCompoundId);
                compoundToSave = {
                    id: editCompoundId,
                    name: compoundName.trim(),
                    tenants,
                    history: existing?.history || [],
                };
            } else {
                // Create new
                compoundToSave = {
                    id: generateId(),
                    name: compoundName.trim(),
                    tenants,
                    history: [],
                };
            }

            await saveCompound(compoundToSave);
            navigation.goBack();
        } catch (e) {
            console.error(e);
        }
    };

    const isSaveReady = compoundName.trim().length > 0 && tenants.length >= 2;

    /* ────────── Render ────────── */

    return (
        <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
            {/* ── Header ── */}
            <View
                style={[
                    styles.header,
                    { paddingTop: insets.top + 8, backgroundColor: colors.bgPrimary },
                ]}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.headerBtn}
                >
                    <Feather name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={[styles.title, { color: colors.textPrimary }]}>
                    {isEditMode ? 'Edit Compound' : 'New Compound'}
                </Text>

                <TouchableOpacity
                    onPress={handleSaveCompound}
                    disabled={!isSaveReady}
                    style={styles.headerBtnRight}
                >
                    <Text
                        style={[
                            styles.saveText,
                            { color: isSaveReady ? colors.accent : colors.textSecondary },
                        ]}
                    >
                        Save
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={[
                        styles.scroll,
                        { paddingBottom: insets.bottom + 40 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Compound Name ── */}
                    <View style={styles.fieldBlock}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>
                            Compound Name
                        </Text>
                        <View
                            style={[
                                styles.compoundInputWrap,
                                {
                                    backgroundColor: colors.bgSurface,
                                    borderColor: compoundNameFocused
                                        ? colors.accent
                                        : colors.border,
                                    ...(compoundNameFocused && {
                                        shadowColor: colors.accent,
                                        shadowOpacity: 0.2,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 0, height: 0 },
                                        elevation: 4,
                                    }),
                                },
                            ]}
                        >
                            <TextInput
                                style={[styles.input, { color: colors.textPrimary }]}
                                placeholder="e.g. 10 Samuel Olabode"
                                placeholderTextColor={colors.textSecondary}
                                value={compoundName}
                                onChangeText={setCompoundName}
                                onFocus={() => setCompoundNameFocused(true)}
                                onBlur={() => setCompoundNameFocused(false)}
                                returnKeyType="done"
                            />
                        </View>
                    </View>

                    {/* ── Added Tenants (Chips) ── */}
                    <View style={styles.chipsSection}>
                        <View style={styles.chipsRow}>
                            {tenants.map((t) => (
                                <TenantChip
                                    key={t.id}
                                    tenant={t}
                                    onRemove={() => handleRemoveTenant(t.id)}
                                />
                            ))}
                        </View>
                        {tenants.length < 2 && (
                            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                                Add at least {2 - tenants.length} more tenant{tenants.length === 1 ? '' : 's'}
                            </Text>
                        )}
                    </View>

                    {/* ── Add Tenant Form Card ── */}
                    <View
                        style={[
                            styles.formCard,
                            { backgroundColor: colors.bgCard, borderColor: colors.border },
                        ]}
                    >
                        {/* Tenant Name */}
                        <View style={styles.formFieldBlock}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Tenant Name
                            </Text>
                            <Animated.View style={{ transform: [{ translateX: shakeName }] }}>
                                <TextInput
                                    ref={tenantNameInputRef}
                                    style={[
                                        styles.formInput,
                                        {
                                            backgroundColor: colors.bgSurface,
                                            color: colors.textPrimary,
                                            borderColor: nameError ? colors.error : colors.border,
                                        },
                                    ]}
                                    placeholder="e.g. Emeka"
                                    placeholderTextColor={colors.textSecondary}
                                    value={newTenantName}
                                    onChangeText={(val) => {
                                        setNewTenantName(val);
                                        if (val.trim()) setNameError(false);
                                    }}
                                    keyboardType="default"
                                    returnKeyType="next"
                                    onSubmitEditing={() => tenantFlatInputRef.current?.focus()}
                                />
                            </Animated.View>
                            {nameError && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    This field is required
                                </Text>
                            )}
                        </View>

                        {/* Flat / Room */}
                        <View style={styles.formFieldBlock}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Flat / Room
                            </Text>
                            <Animated.View style={{ transform: [{ translateX: shakeFlat }] }}>
                                <TextInput
                                    ref={tenantFlatInputRef}
                                    style={[
                                        styles.formInput,
                                        {
                                            backgroundColor: colors.bgSurface,
                                            color: colors.textPrimary,
                                            borderColor: flatError ? colors.error : colors.border,
                                        },
                                    ]}
                                    placeholder="e.g. Flat 2, BQ, Room 3"
                                    placeholderTextColor={colors.textSecondary}
                                    value={newTenantFlat}
                                    onChangeText={(val) => {
                                        setNewTenantFlat(val);
                                        if (val.trim()) setFlatError(false);
                                    }}
                                    returnKeyType="done"
                                    onSubmitEditing={handleAddTenant}
                                />
                            </Animated.View>
                            {flatError && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    This field is required
                                </Text>
                            )}
                        </View>

                        {/* Add Button */}
                        <TouchableOpacity
                            style={[
                                styles.addBtn,
                                { backgroundColor: colors.accent, marginTop: 16 },
                            ]}
                            activeOpacity={0.85}
                            onPress={handleAddTenant}
                        >
                            <Text style={[styles.addBtnText, { color: colors.accentText }]}>
                                Add Tenant +
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

/* ────────── Styles ────────── */

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingTop: 16 },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        zIndex: 10,
    },
    headerBtn: {
        width: 40,
        alignItems: 'flex-start',
    },
    headerBtnRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 18,
    },
    saveText: {
        fontFamily: fonts.bold,
        fontSize: 16,
    },

    /* Field base */
    fieldBlock: { marginBottom: 24 },
    label: {
        fontFamily: fonts.bold,
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    /* Compound Input */
    compoundInputWrap: {
        height: 56,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    input: {
        fontFamily: fonts.medium,
        fontSize: 16, // iOS zoom prevention
        flex: 1,
    },

    /* Chips Section */
    chipsSection: { marginBottom: 20 },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    hintText: {
        fontFamily: fonts.medium,
        fontSize: 12,
    },
    chipScale: { alignSelf: 'flex-start' },
    chip: {
        height: 36,
        borderRadius: 100,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    chipText: {
        fontFamily: fonts.medium,
        fontSize: 13,
    },
    chipRemove: { marginLeft: 8 },

    /* Form Card */
    formCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    formFieldBlock: { marginBottom: 16 },
    formInput: {
        height: 56,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontFamily: fonts.medium,
        fontSize: 16, // iOS zoom prevention
    },
    errorText: {
        fontFamily: fonts.medium,
        fontSize: 12,
        marginTop: 6,
    },

    /* Add Tenant Button */
    addBtn: {
        height: 56,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    addBtnText: {
        fontFamily: fonts.bold,
        fontSize: 16,
    },
});
