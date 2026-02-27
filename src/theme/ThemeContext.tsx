/**
 * NaijaWatts — Theme Context
 *
 * Provides current theme colors + a toggle function to every screen.
 * Persists the user's theme preference to AsyncStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, ThemeColors, ThemeMode } from './constants';

const STORAGE_KEY = 'naijawatts_theme';

interface ThemeContextValue {
    /** Current theme mode: 'dark' | 'light' */
    mode: ThemeMode;
    /** Resolved color palette for the active mode. */
    colors: ThemeColors;
    /** Toggle between dark and light, persists to AsyncStorage. */
    toggleTheme: () => void;
    /** Whether the theme has finished loading from storage. */
    ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
    mode: 'dark',
    colors: theme.dark,
    toggleTheme: () => { },
    ready: false,
});

/** Hook to consume the theme anywhere in the tree. */
export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}

interface ThemeProviderProps {
    children: ReactNode;
    initialTheme?: ThemeMode;
}

export function ThemeProvider({ children, initialTheme = 'dark' }: ThemeProviderProps) {
    const [mode, setMode] = useState<ThemeMode>(initialTheme);
    const [ready, setReady] = useState(false);

    /* ── Load saved theme on mount ── */
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved === 'light' || saved === 'dark') {
                    setMode(saved);
                }
            } catch {
                // Silently default to dark
            } finally {
                setReady(true);
            }
        })();
    }, []);

    /* ── Toggle & persist ── */
    const toggleTheme = useCallback(() => {
        setMode((prev) => {
            const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
            AsyncStorage.setItem(STORAGE_KEY, next).catch(() => { });
            return next;
        });
    }, []);

    const colors = theme[mode];

    return (
        <ThemeContext.Provider value={{ mode, colors, toggleTheme, ready }}>
            {children}
        </ThemeContext.Provider>
    );
}
