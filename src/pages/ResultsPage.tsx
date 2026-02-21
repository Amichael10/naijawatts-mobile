import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import LightningLoader from '@/components/LightningLoader';
import AppShell from '@/components/AppShell';
import { BillCalculation } from '@/lib/types';

const TENANT_COLORS = [
  '#C8F135', '#2EC4B6', '#FF6B6B', '#FFD166',
  '#A78BFA', '#60A5FA', '#FB923C', '#34D399',
];

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function AnimatedAmount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);

  return <span>{formatNaira(display)}</span>;
}

/** Pure SVG donut chart */
function DonutChart({ results, total }: { results: BillCalculation['results']; total: number }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 85;
  const strokeWidth = 32;

  // Build arcs
  let cumulative = 0;
  const arcs = results.map((r, i) => {
    const pct = total > 0 ? r.amountOwed / total : 0;
    const startAngle = cumulative * 360 - 90;
    cumulative += pct;
    const endAngle = cumulative * 360 - 90;
    const largeArc = pct > 0.5 ? 1 : 0;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(toRad(startAngle));
    const y1 = cy + radius * Math.sin(toRad(startAngle));
    const x2 = cx + radius * Math.cos(toRad(endAngle));
    const y2 = cy + radius * Math.sin(toRad(endAngle));

    // For very small slices or full circle
    if (pct <= 0) return null;
    if (pct >= 0.9999) {
      return (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={TENANT_COLORS[i % TENANT_COLORS.length]}
          strokeWidth={strokeWidth}
        />
      );
    }

    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={TENANT_COLORS[i % TENANT_COLORS.length]}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-body text-muted-foreground">Total Split</span>
        <span className="text-2xl font-display font-bold text-foreground">
          <AnimatedAmount value={total} />
        </span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const calcData = sessionStorage.getItem('naijawatts_lastcalc');
  const compoundName = sessionStorage.getItem('naijawatts_lastcompound') || 'Quick Calculation';

  if (!calcData) {
    return (
      <AppShell title="Results" showBack>
        <div className="card-surface text-center py-12">
          <p className="text-muted-foreground font-body">No calculation to show</p>
          <button onClick={() => navigate('/calculate')} className="btn-primary mt-4 max-w-[200px] mx-auto">
            Go Calculate
          </button>
        </div>
      </AppShell>
    );
  }

  const calc: BillCalculation = JSON.parse(calcData);
  const total = calc.results.reduce((s, r) => s + r.amountOwed, 0);
  const date = new Date(calc.date).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const shareViaWhatsApp = () => {
    const lines = calc.results.map(r =>
      `${r.flatLabel} (${r.name}): ${formatNaira(r.amountOwed)}`
    );
    const message = `⚡ NaijaWatts Bill Split — ${compoundName}\n📅 ${date}\n\n${lines.join('\n')}\n\nTotal: ${formatNaira(calc.totalAmount)}\nCalculated with NaijaWatts`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <LightningLoader onComplete={() => setLoading(false)} />;
  }

  return (
    <AppShell title="Results" showBack>
      <div className="space-y-5">
        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <DonutChart results={calc.results} total={total} />
          <p className="text-[13px] text-muted-foreground font-body mt-3 text-center">
            {compoundName} · {date}
          </p>
        </motion.div>

        {/* Legend Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {calc.results.map((r, i) => {
            const pct = total > 0 ? Math.round((r.amountOwed / total) * 100) : 0;
            return (
              <div
                key={r.tenantId}
                className="flex items-center gap-1.5 shrink-0 bg-secondary border border-border rounded-lg px-2.5 py-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: TENANT_COLORS[i % TENANT_COLORS.length] }}
                />
                <span className="text-[13px] font-body text-foreground whitespace-nowrap">
                  {r.name.split(' ')[0]} {pct}%
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Breakdown List */}
        <div>
          <h3 className="font-display font-bold text-base text-foreground mb-3">Breakdown</h3>
          <div className="space-y-3">
            {calc.results.map((result, i) => (
              <motion.div
                key={result.tenantId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                className="bg-card rounded-2xl border border-border overflow-hidden flex"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {/* Color bar */}
                <div
                  className="w-1 shrink-0 rounded-l-2xl"
                  style={{ backgroundColor: TENANT_COLORS[i % TENANT_COLORS.length] }}
                />
                <div className="flex items-center justify-between flex-1 p-4">
                  <div>
                    <h4 className="font-display font-bold text-base text-foreground">{result.name}</h4>
                    <p className="text-sm text-muted-foreground font-body">{result.flatLabel}</p>
                    {result.kwhUsed !== undefined && (
                      <p className="text-xs text-muted-foreground font-body mt-0.5">
                        {result.kwhUsed} kWh
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xl font-display font-bold"
                    style={{ color: TENANT_COLORS[i % TENANT_COLORS.length] }}
                  >
                    {formatNaira(result.amountOwed)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Share */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={shareViaWhatsApp}
            className="btn-primary flex items-center justify-center gap-2"
            style={{ backgroundColor: '#25D366' }}
          >
            <Share2 className="w-5 h-5" />
            Share via WhatsApp
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}
