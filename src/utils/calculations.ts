/**
 * NaijaWatts — Calculation Logic
 *
 * Two modes:
 *   Smart Split  — proportional to each tenant's kWh reading
 *   Equal Split  — evenly divided among N tenants
 *
 * All amounts are rounded to the nearest ₦10.
 */

import type { Tenant, SplitResult } from './types';

/**
 * Smart Split (Usage-Based).
 *
 * Tenants with 0 kWh get ₦0.
 * Rounding remainder is absorbed by the first non-zero tenant
 * so the total always equals `totalAmount`.
 */
export function calculateSmartSplit(
    totalAmount: number,
    tenants: Array<{ tenant: Tenant; kwh: number }>
): SplitResult[] {
    const nonZeroTenants = tenants.filter((t) => t.kwh > 0);
    const totalKwh = nonZeroTenants.reduce((sum, t) => sum + t.kwh, 0);

    const results: SplitResult[] = tenants.map(({ tenant, kwh }) => {
        if (kwh === 0) {
            return {
                tenantId: tenant.id,
                name: tenant.name,
                flatLabel: tenant.flatLabel,
                colorIndex: tenant.colorIndex,
                kwh: 0,
                share: 0,
            };
        }
        const rawShare = (kwh / totalKwh) * totalAmount;
        const rounded = Math.round(rawShare / 10) * 10;
        return {
            tenantId: tenant.id,
            name: tenant.name,
            flatLabel: tenant.flatLabel,
            colorIndex: tenant.colorIndex,
            kwh,
            share: rounded,
        };
    });

    // Rounding correction — ensure splits sum to totalAmount exactly.
    const sum = results.reduce((s, r) => s + r.share, 0);
    const diff = totalAmount - sum;
    if (diff !== 0) {
        const firstNonZero = results.find((r) => r.kwh && r.kwh > 0);
        if (firstNonZero) {
            firstNonZero.share = Math.max(0, firstNonZero.share + diff);
        }
    }

    return results;
}

/**
 * Equal Split.
 *
 * Divides `totalAmount` equally among `numTenants`,
 * rounded to the nearest ₦10. Remainder goes to the first tenant.
 */
export function calculateEqualSplit(
    totalAmount: number,
    numTenants: number,
    tenantNames?: string[]
): SplitResult[] {
    const base = Math.round(totalAmount / numTenants / 10) * 10;
    const remainder = totalAmount - base * numTenants;

    return Array.from({ length: numTenants }, (_, i) => ({
        tenantId: `t${i}`,
        name: tenantNames?.[i] ?? `Tenant ${i + 1}`,
        flatLabel: `Flat ${i + 1}`,
        colorIndex: i % 8,
        share: i === 0 ? base + remainder : base,
    }));
}
