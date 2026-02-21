import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { BillCalculation } from '@/lib/types';

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

export default function ResultsPage() {
  const navigate = useNavigate();
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

  return (
    <AppShell title="Results" showBack>
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground font-body">{compoundName} · {date}</p>
          <div className="text-3xl font-display font-extrabold text-primary mt-2">
            <AnimatedAmount value={calc.totalAmount} />
          </div>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {calc.mode === 'smart' ? 'Smart Split' : 'Equal Split'} · {calc.results.length} tenants
          </p>
        </motion.div>

        {/* Tenant Cards */}
        <div className="space-y-3">
          {calc.results.map((result, i) => (
            <motion.div
              key={result.tenantId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="tenant-result-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-foreground">{result.name}</h3>
                  <p className="text-sm text-muted-foreground font-body">{result.flatLabel}</p>
                  {result.kwhUsed !== undefined && (
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {result.kwhUsed} kWh used
                    </p>
                  )}
                </div>
                <span className="text-xl font-display font-extrabold text-primary">
                  {formatNaira(result.amountOwed)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Share */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button onClick={shareViaWhatsApp} className="btn-primary flex items-center justify-center gap-2 bg-success">
            <Share2 className="w-5 h-5" />
            Share via WhatsApp
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}
