import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { getCompound, addCalculationToHistory, generateId } from '@/lib/storage';
import { Compound, TenantResult, BillCalculation } from '@/lib/types';

function roundToNearest10(n: number): number {
  return Math.round(n / 10) * 10;
}

export default function CalculatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const compoundId = searchParams.get('compound');
  const compound = compoundId ? getCompound(compoundId) : null;

  const [mode, setMode] = useState<'smart' | 'equal'>('smart');

  // Smart split state
  const [totalUnits, setTotalUnits] = useState('');
  const [costInput, setCostInput] = useState('');
  const [costType, setCostType] = useState<'perUnit' | 'total'>('total');
  const [readings, setReadings] = useState<Record<string, string>>(
    compound ? Object.fromEntries(compound.tenants.map(t => [t.id, ''])) : {}
  );

  // Equal split state
  const [equalTotal, setEqualTotal] = useState('');
  const [equalCount, setEqualCount] = useState(compound ? String(compound.tenants.length) : '2');

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleCalculate = () => {
    const newErrors: Record<string, boolean> = {};

    if (mode === 'smart') {
      if (!totalUnits || isNaN(Number(totalUnits))) newErrors['totalUnits'] = true;
      if (!costInput || isNaN(Number(costInput))) newErrors['costInput'] = true;
      if (compound) {
        compound.tenants.forEach(t => {
          if (!readings[t.id] || isNaN(Number(readings[t.id]))) newErrors[`reading-${t.id}`] = true;
        });
      }
    } else {
      if (!equalTotal || isNaN(Number(equalTotal))) newErrors['equalTotal'] = true;
      if (!equalCount || isNaN(Number(equalCount)) || Number(equalCount) < 1) newErrors['equalCount'] = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let results: TenantResult[];
    let totalAmount: number;
    let units: number | undefined;
    let cpu: number | undefined;

    if (mode === 'smart' && compound) {
      units = Number(totalUnits);
      totalAmount = costType === 'total' ? Number(costInput) : Number(costInput) * units;
      cpu = totalAmount / units;

      const tenantReadings = compound.tenants.map(t => ({
        tenant: t,
        kwh: Number(readings[t.id]),
      }));
      const totalKwh = tenantReadings.reduce((s, r) => s + r.kwh, 0);

      const rawShares = tenantReadings.map(r => ({
        ...r,
        raw: totalKwh > 0 ? (r.kwh / totalKwh) * totalAmount : 0,
      }));

      const rounded = rawShares.map(r => ({
        ...r,
        rounded: roundToNearest10(r.raw),
      }));

      const roundedTotal = rounded.reduce((s, r) => s + r.rounded, 0);
      const remainder = totalAmount - roundedTotal;

      results = rounded.map((r, i) => ({
        tenantId: r.tenant.id,
        name: r.tenant.name,
        flatLabel: r.tenant.flatLabel,
        kwhUsed: r.kwh,
        amountOwed: r.rounded + (i === 0 ? remainder : 0),
      }));
    } else {
      totalAmount = Number(equalTotal);
      const count = Number(equalCount);
      const perPerson = roundToNearest10(totalAmount / count);
      const remainder = totalAmount - perPerson * count;

      if (compound) {
        results = compound.tenants.slice(0, count).map((t, i) => ({
          tenantId: t.id,
          name: t.name,
          flatLabel: t.flatLabel,
          amountOwed: perPerson + (i === 0 ? remainder : 0),
        }));
      } else {
        results = Array.from({ length: count }, (_, i) => ({
          tenantId: String(i),
          name: `Tenant ${i + 1}`,
          flatLabel: `#${i + 1}`,
          amountOwed: perPerson + (i === 0 ? remainder : 0),
        }));
      }
    }

    const calc: BillCalculation = {
      id: generateId(),
      date: new Date().toISOString(),
      mode,
      totalAmount: mode === 'smart' ? totalAmount! : Number(equalTotal),
      totalUnits: units,
      costPerUnit: cpu,
      results,
    };

    if (compoundId) {
      addCalculationToHistory(compoundId, calc);
    }

    // Store calc temporarily for results page
    sessionStorage.setItem('naijawatts_lastcalc', JSON.stringify(calc));
    sessionStorage.setItem('naijawatts_lastcompound', compound?.name || 'Quick Calculation');
    navigate('/results');
  };

  return (
    <AppShell title="Calculate" showBack={!!compoundId}>
      <div className="space-y-5">
        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted rounded-full p-1 flex"
        >
          {(['smart', 'equal'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-full font-display font-bold text-sm transition-all duration-300 ${
                mode === m
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground'
              }`}
            >
              {m === 'smart' ? '⚡ Smart Split' : '➗ Equal Split'}
            </button>
          ))}
        </motion.div>

        {mode === 'smart' ? (
          <motion.div
            key="smart"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="input-label">Total Units Purchased</label>
              <input
                type="number"
                inputMode="decimal"
                value={totalUnits}
                onChange={(e) => { setTotalUnits(e.target.value); setErrors(p => ({ ...p, totalUnits: false })); }}
                placeholder="e.g. 50"
                className={`input-field ${errors['totalUnits'] ? 'animate-shake border-destructive' : ''}`}
              />
            </div>

            <div>
              <label className="input-label">
                {costType === 'total' ? 'Total Amount Spent (₦)' : 'Cost Per Unit (₦)'}
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={costInput}
                onChange={(e) => { setCostInput(e.target.value); setErrors(p => ({ ...p, costInput: false })); }}
                placeholder={costType === 'total' ? 'e.g. 5000' : 'e.g. 100'}
                className={`input-field ${errors['costInput'] ? 'animate-shake border-destructive' : ''}`}
              />
              <button
                onClick={() => setCostType(costType === 'total' ? 'perUnit' : 'total')}
                className="mt-1.5 text-xs text-primary font-display font-semibold"
              >
                Switch to {costType === 'total' ? 'cost per unit' : 'total amount'}
              </button>
            </div>

            {compound && (
              <div>
                <h3 className="input-label mb-3">Meter Readings (kWh)</h3>
                <div className="space-y-3">
                  {compound.tenants.map((tenant) => (
                    <div key={tenant.id} className="card-surface">
                      <label className="text-sm font-display font-semibold text-foreground">
                        {tenant.flatLabel} ({tenant.name})
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={readings[tenant.id] || ''}
                        onChange={(e) => {
                          setReadings(prev => ({ ...prev, [tenant.id]: e.target.value }));
                          setErrors(p => ({ ...p, [`reading-${tenant.id}`]: false }));
                        }}
                        placeholder="kWh used"
                        className={`input-field mt-2 ${errors[`reading-${tenant.id}`] ? 'animate-shake border-destructive' : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!compound && (
              <div className="card-surface bg-accent/30">
                <p className="text-sm text-foreground font-body">
                  💡 To use Smart Split with tenant names, first create a compound from the Home screen.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="equal"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="input-label">Total Amount Spent (₦)</label>
              <input
                type="number"
                inputMode="decimal"
                value={equalTotal}
                onChange={(e) => { setEqualTotal(e.target.value); setErrors(p => ({ ...p, equalTotal: false })); }}
                placeholder="e.g. 10000"
                className={`input-field ${errors['equalTotal'] ? 'animate-shake border-destructive' : ''}`}
              />
            </div>
            <div>
              <label className="input-label">Number of Tenants</label>
              <input
                type="number"
                inputMode="numeric"
                value={equalCount}
                onChange={(e) => { setEqualCount(e.target.value); setErrors(p => ({ ...p, equalCount: false })); }}
                placeholder="e.g. 4"
                className={`input-field ${errors['equalCount'] ? 'animate-shake border-destructive' : ''}`}
              />
            </div>
          </motion.div>
        )}

        <button onClick={handleCalculate} className="btn-primary text-lg">
          Calculate Split
        </button>
      </div>
    </AppShell>
  );
}
