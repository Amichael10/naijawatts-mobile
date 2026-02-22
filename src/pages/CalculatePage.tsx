import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { getCompound, getCompounds, addCalculationToHistory, generateId } from '@/lib/storage';
import { TenantResult, BillCalculation, Compound } from '@/lib/types';

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Clamp negatives to 0 */
function clampInput(val: string): string {
  const n = Number(val);
  if (val !== '' && !isNaN(n) && n < 0) return '0';
  return val;
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[12px] font-body mt-1" style={{ color: '#FF4D4D' }}>
      {message}
    </p>
  );
}

const errorBorderStyle = '!border-[#FF4D4D] animate-shake';

export default function CalculatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const allCompounds = getCompounds();
  const compoundId = searchParams.get('compound');
  const compound = compoundId ? getCompound(compoundId) : null;

  const [mode, setMode] = useState<'smart' | 'equal'>('smart');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Smart split state
  const [totalUnits, setTotalUnits] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [readings, setReadings] = useState<Record<string, string>>(
    compound ? Object.fromEntries(compound.tenants.map(t => [t.id, ''])) : {}
  );

  // Equal split state
  const [equalTotal, setEqualTotal] = useState('');
  const [equalCount, setEqualCount] = useState(compound ? String(compound.tenants.length) : '2');

  const handleSelectCompound = (id: string) => {
    setSearchParams({ compound: id });
    setDropdownOpen(false);
    const c = getCompound(id);
    if (c) {
      setReadings(Object.fromEntries(c.tenants.map(t => [t.id, ''])));
      setEqualCount(String(c.tenants.length));
    }
    setErrors({});
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) => {
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const handleCalculate = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'smart') {
      const units = Number(totalUnits);
      if (!totalUnits || isNaN(units) || units <= 0) {
        newErrors['totalUnits'] = 'Enter total units (must be > 0)';
      }

      const ta = Number(totalAmount);
      if (!totalAmount || isNaN(ta) || ta <= 0) {
        newErrors['totalAmount'] = 'Enter total amount spent (must be > 0)';
      }

      if (compound) {
        compound.tenants.forEach(t => {
          const val = readings[t.id];
          if (val === '' || val === undefined) {
            newErrors[`reading-${t.id}`] = 'Enter kWh reading';
          } else if (isNaN(Number(val)) || Number(val) < 0) {
            newErrors[`reading-${t.id}`] = 'Must be ≥ 0';
          }
        });
      }
    } else {
      if (!equalTotal || isNaN(Number(equalTotal)) || Number(equalTotal) <= 0) {
        newErrors['equalTotal'] = 'Enter a valid amount > 0';
      }
      if (!equalCount || isNaN(Number(equalCount)) || Number(equalCount) < 1) {
        newErrors['equalCount'] = 'Must be at least 1';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let results: TenantResult[];
    let finalTotal: number;
    let units: number | undefined;
    let cpu: number | undefined;
    let remainingUnits: number | undefined;
    let remainingAmount: number | undefined;

    if (mode === 'smart' && compound) {
      units = Number(totalUnits);
      finalTotal = Number(totalAmount);
      cpu = roundTo2(finalTotal / units);

      const tenantReadings = compound.tenants.map(t => ({
        tenant: t,
        kwh: Number(readings[t.id]) || 0,
      }));

      const totalUsed = tenantReadings.reduce((s, r) => s + r.kwh, 0);
      remainingUnits = roundTo2(units - totalUsed);
      remainingAmount = roundTo2(remainingUnits * cpu);

      results = tenantReadings.map(r => ({
        tenantId: r.tenant.id,
        name: r.tenant.name,
        flatLabel: r.tenant.flatLabel,
        kwhUsed: r.kwh,
        amountOwed: roundTo2(r.kwh * cpu!),
      }));
    } else {
      finalTotal = Number(equalTotal);
      const count = Number(equalCount);
      const perPerson = roundTo2(finalTotal / count);
      const remainder = roundTo2(finalTotal - perPerson * count);

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
      totalAmount: finalTotal,
      totalUnits: units,
      costPerUnit: cpu,
      results,
      remainingUnits,
      remainingAmount,
    };

    if (compoundId) {
      addCalculationToHistory(compoundId, calc);
    }

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
          className="bg-secondary rounded-full p-1 flex border border-border"
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
            {/* Total Units */}
            <div>
              <label className="input-label">Total Units Purchased (kWh)</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={totalUnits}
                onChange={(e) => {
                  setTotalUnits(clampInput(e.target.value));
                  clearError('totalUnits');
                }}
                placeholder="e.g. 50"
                className={`input-field ${errors['totalUnits'] ? errorBorderStyle : ''}`}
              />
              <InlineError message={errors['totalUnits']} />
            </div>

            {/* Total Amount */}
            <div>
              <label className="input-label">Total Amount Spent (₦)</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={totalAmount}
                onChange={(e) => {
                  setTotalAmount(clampInput(e.target.value));
                  clearError('totalAmount');
                  clearError('costPerUnit');
                }}
                placeholder="e.g. 5000"
                className={`input-field ${errors['totalAmount'] ? errorBorderStyle : ''}`}
              />
              <InlineError message={errors['totalAmount']} />
            </div>

            {/* Auto-calculated Cost Per Unit display */}
            {totalUnits && totalAmount && Number(totalUnits) > 0 && Number(totalAmount) > 0 && (
              <div className="card-surface border-primary/20">
                <p className="text-sm font-body text-muted-foreground">
                  Cost Per Unit: <span className="text-foreground font-semibold">₦{roundTo2(Number(totalAmount) / Number(totalUnits))}/kWh</span>
                </p>
              </div>
            )}

            {/* Compound Selector */}
            <div>
              <label className="input-label mb-2">Select Compound</label>
              {allCompounds.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`input-field flex items-center justify-between w-full text-left ${!compound ? 'text-muted-foreground' : 'text-foreground'}`}
                  >
                    <span>{compound ? `⚡ ${compound.name}` : 'Choose a compound...'}</span>
                    <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {allCompounds.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCompound(c.id)}
                          className={`block w-full text-left px-4 py-3 text-sm font-body transition-colors hover:bg-secondary ${c.id === compoundId ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'}`}
                        >
                          ⚡ {c.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({c.tenants.length} tenant{c.tenants.length !== 1 ? 's' : ''})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-surface border-primary/30">
                  <p className="text-sm text-foreground font-body">
                    ⚠️ No compounds yet. Create one to use Smart Split.
                  </p>
                  <button
                    onClick={() => navigate('/compound/new')}
                    className="btn-primary mt-3 text-sm"
                  >
                    Create Compound
                  </button>
                </div>
              )}
            </div>

            {!compound && allCompounds.length > 0 && (
              <p className="text-sm text-muted-foreground font-body text-center">
                👆 Select a compound above to enter meter readings
              </p>
            )}

            {/* Tenant Readings */}
            {compound && (
              <div>
                <h3 className="input-label mb-3">Meter Readings (kWh)</h3>
                {errors['readingsGeneral'] && (
                  <p className="text-[12px] font-body mb-2" style={{ color: '#FF4D4D' }}>
                    {errors['readingsGeneral']}
                  </p>
                )}
                <div className="space-y-3">
                  {compound.tenants.map((tenant) => (
                    <div key={tenant.id} className="card-surface">
                      <label className="text-sm font-display font-semibold text-foreground">
                        {tenant.flatLabel} ({tenant.name})
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.1"
                        value={readings[tenant.id] || ''}
                        onChange={(e) => {
                          setReadings(prev => ({ ...prev, [tenant.id]: clampInput(e.target.value) }));
                          clearError(`reading-${tenant.id}`);
                          clearError('readingsGeneral');
                        }}
                        placeholder="kWh used"
                        className={`input-field mt-2 ${errors[`reading-${tenant.id}`] ? errorBorderStyle : ''}`}
                      />
                      <InlineError message={errors[`reading-${tenant.id}`]} />
                    </div>
                  ))}
                </div>
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
                inputMode="numeric"
                min="0"
                step="1"
                value={equalTotal}
                onChange={(e) => {
                  setEqualTotal(clampInput(e.target.value));
                  clearError('equalTotal');
                }}
                placeholder="e.g. 10000"
                className={`input-field ${errors['equalTotal'] ? errorBorderStyle : ''}`}
              />
              <InlineError message={errors['equalTotal']} />
            </div>
            <div>
              <label className="input-label">Number of Tenants</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={equalCount}
                onChange={(e) => {
                  setEqualCount(clampInput(e.target.value));
                  clearError('equalCount');
                }}
                placeholder="e.g. 4"
                className={`input-field ${errors['equalCount'] ? errorBorderStyle : ''}`}
              />
              <InlineError message={errors['equalCount']} />
            </div>
          </motion.div>
        )}

        <button
          onClick={handleCalculate}
          disabled={mode === 'smart' && !compound}
          className="btn-primary text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Calculate Split
        </button>
      </div>
    </AppShell>
  );
}
