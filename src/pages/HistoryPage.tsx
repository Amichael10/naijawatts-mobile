import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { getCompounds, getCompound } from '@/lib/storage';
import { BillCalculation, Compound } from '@/lib/types';

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export default function HistoryPage() {
  const { compoundId } = useParams();
  const navigate = useNavigate();

  const compounds = getCompounds();
  const [selectedId, setSelectedId] = useState(compoundId || '');
  const compound = selectedId ? getCompound(selectedId) : null;
  const history = compound?.history || [];

  const viewCalc = (calc: BillCalculation, name: string) => {
    sessionStorage.setItem('naijawatts_lastcalc', JSON.stringify(calc));
    sessionStorage.setItem('naijawatts_lastcompound', name);
    navigate('/results');
  };

  return (
    <AppShell title="History" showBack={!!compoundId}>
      <div className="space-y-5">
        {!compoundId && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <label className="input-label">Select Compound</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a compound…</option>
              {compounds.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </motion.div>
        )}

        {selectedId && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-surface text-center py-10"
          >
            <div className="text-4xl mb-3">📊</div>
            <p className="text-muted-foreground font-body">
              No calculations yet for this compound
            </p>
          </motion.div>
        )}

        <div className="space-y-3">
          {history.map((calc, i) => {
            const date = new Date(calc.date).toLocaleDateString('en-NG', {
              day: 'numeric', month: 'short', year: 'numeric',
            });
            return (
              <motion.button
                key={calc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => viewCalc(calc, compound!.name)}
                className="card-surface-hover w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-sm text-foreground">{date}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {calc.mode === 'smart' ? '⚡ Smart Split' : '➗ Equal Split'} · {calc.results.length} tenants
                    </p>
                  </div>
                  <span className="font-display font-extrabold text-primary">
                    {formatNaira(calc.totalAmount)}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
