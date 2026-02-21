import { Compound } from './types';

const STORAGE_KEY = 'naijawatts_compounds';

export function getCompounds(): Compound[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCompounds(compounds: Compound[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(compounds));
}

export function getCompound(id: string): Compound | undefined {
  return getCompounds().find(c => c.id === id);
}

export function saveCompound(compound: Compound) {
  const compounds = getCompounds();
  const index = compounds.findIndex(c => c.id === compound.id);
  if (index >= 0) {
    compounds[index] = compound;
  } else {
    compounds.push(compound);
  }
  saveCompounds(compounds);
}

export function deleteCompound(id: string) {
  saveCompounds(getCompounds().filter(c => c.id !== id));
}

export function addCalculationToHistory(compoundId: string, calc: Compound['history'][0]) {
  const compound = getCompound(compoundId);
  if (!compound) return;
  compound.history = [calc, ...compound.history].slice(0, 5);
  saveCompound(compound);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
