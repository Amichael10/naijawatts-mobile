/**
 * NaijaWatts — Storage Functions
 *
 * All data persistence via AsyncStorage.
 * Single key stores entire AppData object.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppData, Compound, Calculation } from './types';

const STORAGE_KEY = 'naijawatts_data';

/** Generate a unique ID using timestamp + random suffix. */
export function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Create a fresh, empty AppData object. */
function createEmptyAppData(): AppData {
    return {
        compounds: [],
        lastUpdated: new Date().toISOString(),
    };
}

/** Load all app data from AsyncStorage. Returns empty data if nothing saved. */
export async function loadAppData(): Promise<AppData> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw) as AppData;
        }
        return createEmptyAppData();
    } catch {
        return createEmptyAppData();
    }
}

/** Save entire app data to AsyncStorage. */
export async function saveAppData(data: AppData): Promise<void> {
    try {
        data.lastUpdated = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save app data:', error);
    }
}

/** Add a new compound or update an existing one (matched by id). */
export async function saveCompound(compound: Compound): Promise<void> {
    try {
        const data = await loadAppData();
        const index = data.compounds.findIndex((c) => c.id === compound.id);
        if (index >= 0) {
            data.compounds[index] = compound;
        } else {
            data.compounds.push(compound);
        }
        await saveAppData(data);
    } catch (error) {
        console.error('Failed to save compound:', error);
    }
}

/** Delete a compound by ID. */
export async function deleteCompound(compoundId: string): Promise<void> {
    try {
        const data = await loadAppData();
        data.compounds = data.compounds.filter((c) => c.id !== compoundId);
        await saveAppData(data);
    } catch (error) {
        console.error('Failed to delete compound:', error);
    }
}

/**
 * Save a calculation to a compound's history.
 * Keeps a maximum of 5 entries, newest first.
 */
export async function saveCalculation(
    compoundId: string,
    calculation: Calculation
): Promise<void> {
    try {
        const data = await loadAppData();
        const compound = data.compounds.find((c) => c.id === compoundId);
        if (!compound) {
            console.error('Compound not found:', compoundId);
            return;
        }
        // Insert at the front (newest first), cap at 5
        compound.history = [calculation, ...compound.history].slice(0, 5);
        await saveAppData(data);
    } catch (error) {
        console.error('Failed to save calculation:', error);
    }
}

/**
 * Clears all calculation history for a given compound
 */
export async function clearCalculationHistory(compoundId: string): Promise<void> {
    try {
        const data = await loadAppData();
        const compound = data.compounds.find((c) => c.id === compoundId);
        if (compound) {
            compound.history = [];
            await saveAppData(data);
        }
    } catch (error) {
        console.error('Failed to clear history:', error);
    }
}
