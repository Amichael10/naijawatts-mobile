/**
 * NaijaWatts — TypeScript Types
 */

export type Tenant = {
    id: string;
    name: string;
    flatLabel: string;
    colorIndex: number; // index into tenantColors array
};

export type SplitResult = {
    tenantId: string;
    name: string;
    flatLabel: string;
    kwh?: number; // only for Smart Split
    share: number; // amount in Naira
    colorIndex: number;
};

export type Calculation = {
    id: string;
    date: string; // ISO string
    mode: 'smart' | 'equal';
    totalAmount: number;
    splits: SplitResult[];
    compoundName: string;
};

export type Compound = {
    id: string;
    name: string;
    tenants: Tenant[];
    history: Calculation[]; // max 5, newest first
};

export type AppData = {
    compounds: Compound[];
    lastUpdated: string;
};
