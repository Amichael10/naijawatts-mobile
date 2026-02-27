/**
 * NaijaWatts — Global Component Styles
 *
 * Shared style primitives for cards, buttons, inputs, and chips.
 * These are style objects — not a StyleSheet — so they can be
 * spread into component-level StyleSheets and composed with
 * theme colors at runtime.
 */

import { Platform, ViewStyle, TextStyle } from 'react-native';
import { fonts, fontSizes } from './constants';

/* ───────── Border Radii ───────── */
export const radii = {
    card: 16,
    input: 14,
    button: 100, // pill
    chip: 100,   // pill
} as const;

/* ───────── Card ───────── */
export const cardStyle: ViewStyle = {
    borderRadius: radii.card,
    padding: 20,
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
        },
        android: {
            elevation: 4,
        },
    }),
};

/* ───────── Buttons ───────── */

/** Base button shape shared by primary & secondary. */
const buttonBase: ViewStyle = {
    height: 56,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
};

/** Primary button style (needs accent bg + accentText color from theme). */
export const primaryButtonStyle: ViewStyle = {
    ...buttonBase,
};

/** Primary button text style. */
export const primaryButtonTextStyle: TextStyle = {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
};

/** Secondary button style (needs accent border + accentText from theme). */
export const secondaryButtonStyle: ViewStyle = {
    ...buttonBase,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
};

/** Secondary button text style. */
export const secondaryButtonTextStyle: TextStyle = {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
};

/* ───────── Input ───────── */
export const inputStyle: ViewStyle = {
    height: 56,
    borderRadius: radii.input,
    paddingHorizontal: 16,
    borderWidth: 1,
};

export const inputTextStyle: TextStyle = {
    fontFamily: fonts.medium,
    fontSize: fontSizes.body, // 16px minimum prevents iOS zoom
};

/* ───────── Chip ───────── */
export const chipStyle: ViewStyle = {
    borderRadius: radii.chip,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
};

export const chipTextStyle: TextStyle = {
    fontFamily: fonts.medium,
    fontSize: fontSizes.caption,
};

/* ───────── Typography presets ───────── */
export const typography = {
    h1: {
        fontFamily: fonts.bold,
        fontSize: fontSizes.h1,
    } as TextStyle,
    h2: {
        fontFamily: fonts.bold,
        fontSize: fontSizes.h2,
    } as TextStyle,
    h3: {
        fontFamily: fonts.bold,
        fontSize: fontSizes.h3,
    } as TextStyle,
    body: {
        fontFamily: fonts.medium,
        fontSize: fontSizes.body,
    } as TextStyle,
    caption: {
        fontFamily: fonts.regular,
        fontSize: fontSizes.caption,
    } as TextStyle,
    small: {
        fontFamily: fonts.regular,
        fontSize: fontSizes.small,
    } as TextStyle,
};
