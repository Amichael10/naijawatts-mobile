/**
 * NaijaWatts — Utils barrel export
 */

// Types
export type {
    Tenant,
    SplitResult,
    Calculation,
    Compound,
    AppData,
} from './types';

// Storage
export {
    generateId,
    loadAppData,
    saveAppData,
    saveCompound,
    deleteCompound,
    saveCalculation,
    clearCalculationHistory,
} from './storage';

// Temp Storage for Quick Splits
export { tempResult } from './tempStorage';


// Calculations
export {
    calculateSmartSplit,
    calculateEqualSplit,
} from './calculations';
