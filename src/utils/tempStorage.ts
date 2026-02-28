import { Calculation } from './types';

/**
 * Temporary storage for Quick Split calculations 
 * that haven't been saved to a compound block yet.
 */
export const tempResult: { current: Calculation | null } = {
    current: null,
};
