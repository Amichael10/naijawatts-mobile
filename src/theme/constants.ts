/**
 * NaijaWatts — Theme Constants
 *
 * Color system for dark and light modes,
 * tenant color palette, and typography tokens.
 */

export const theme = {
    dark: {
        bgPrimary: '#111111',
        bgSurface: '#1A1A1A',
        bgCard: '#222222',
        border: '#2A2A2A',
        textPrimary: '#FFFFFF',
        textSecondary: '#888888',
        accent: '#C8F135',
        accentText: '#111111',
        error: '#FF4D4D',
        success: '#22C55E',
    },
    light: {
        bgPrimary: '#F5F5F5',
        bgSurface: '#FFFFFF',
        bgCard: '#FFFFFF',
        border: '#E5E5E5',
        textPrimary: '#111111',
        textSecondary: '#6B7280',
        accent: '#7CB519',
        accentText: '#FFFFFF',
        error: '#EF4444',
        success: '#16A34A',
    },
};

/** Assign to tenants by index. Cycles if > 8 tenants. */
export const tenantColors = [
    '#C8F135', // lime
    '#2EC4B6', // teal
    '#FF6B6B', // coral
    '#FFD166', // yellow
    '#A78BFA', // purple
    '#60A5FA', // blue
    '#FB923C', // orange
    '#34D399', // green
];

/** Get a tenant color by index (cycles through the palette). */
export function getTenantColor(index: number): string {
    return tenantColors[index % tenantColors.length];
}

/** Theme color type derived from the theme object. */
export type ThemeColors = typeof theme.dark;

/** Theme mode type. */
export type ThemeMode = 'dark' | 'light';

/** Typography font family tokens. */
export const fonts = {
    bold: 'SpaceGrotesk_700Bold',
    medium: 'SpaceGrotesk_500Medium',
    regular: 'SpaceGrotesk_400Regular',
} as const;

/** Typography size scale. */
export const fontSizes = {
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    caption: 13,
    small: 11,
} as const;
