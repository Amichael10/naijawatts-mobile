import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, Users, ChevronRight } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getCompounds, deleteCompound } from '@/lib/storage';
import { Compound, BillCalculation } from '@/lib/types';

const TENANT_COLORS = [
  '#C8F135', '#2EC4B6', '#FF6B6B', '#FFD166',
  '#A78BFA', '#60A5FA', '#FB923C', '#34D399',
];

function getGreeting(): { label: string; emoji: string; subtitle: string } {
  const h = new Date().getHours();
  if (h < 12) return { label: 'Good morning', emoji: '☀️', subtitle: "Ready to split today's bills?" };
  if (h < 17) return { label: 'Good afternoon', emoji: '🌤️', subtitle: 'Ready to calculate this afternoon?' };
  return { label: 'Good evening', emoji: '🌙', subtitle: "Let's settle tonight's bills." };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function ShareBar({ results, height = 12 }: { results: { amountOwed: number }[]; height?: number }) {
  const total = results.reduce((s, r) => s + r.amountOwed, 0);
  if (total === 0) return null;
  return (
    <div className="flex w-full overflow-hidden" style={{ height, borderRadius: 100 }}>
      {results.map((r, i) => {
        const pct = (r.amountOwed / total) * 100;
        return (
          <div
            key={i}
            style={{
              width: `${pct}%`,
              backgroundColor: TENANT_COLORS[i % TENANT_COLORS.length],
              borderRight: i < results.length - 1 ? '2px solid hsl(var(--card))' : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [compounds, setCompounds] = useState<Compound[]>(getCompounds);
  const greeting = useMemo(getGreeting, []);

  // Find most recently used compound (has history)
  const recentCompound = useMemo(() => {
    const withHistory = compounds.filter(c => c.history.length > 0);
    if (withHistory.length === 0) return null;
    return withHistory.sort((a, b) =>
      new Date(b.history[0].date).getTime() - new Date(a.history[0].date).getTime()
    )[0];
  }, [compounds]);

  const lastCalc: BillCalculation | null = recentCompound?.history[0] ?? null;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[13px] text-muted-foreground font-body">
            {greeting.label} {greeting.emoji}
          </p>
          <h2 className="text-[22px] font-display font-bold text-foreground leading-tight">
            {greeting.subtitle}
          </h2>
        </motion.div>

        {/* Hero Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {recentCompound && lastCalc ? (
            <div className="bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
              <p className="text-xs text-muted-foreground font-body mb-1">Last Split</p>
              <h3 className="font-display font-bold text-xl text-foreground">{recentCompound.name}</h3>
              <p className="text-[13px] text-muted-foreground font-body mt-0.5">
                {formatDate(lastCalc.date)}
              </p>
              <p className="text-[32px] font-display font-bold text-primary mt-2">
                ₦{lastCalc.totalAmount.toLocaleString()}
              </p>

              {/* Share bar */}
              <div className="mt-4">
                <ShareBar results={lastCalc.results} />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {lastCalc.results.map((r, i) => (
                  <div key={r.tenantId} className="flex items-center gap-1.5 text-xs font-body">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TENANT_COLORS[i % TENANT_COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{r.name}</span>
                    <span className="text-foreground font-medium">₦{r.amountOwed.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Split Again */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => navigate(`/compound/${recentCompound.id}`)}
                  className="btn-secondary !w-auto text-sm py-2 px-4"
                >
                  Split Again →
                </button>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">
                No compounds yet
              </h3>
              <p className="text-muted-foreground font-body text-sm mb-6 max-w-[250px] mx-auto">
                Add your first compound to get started
              </p>
              <button
                onClick={() => navigate('/compound/new')}
                className="btn-primary max-w-[220px] mx-auto flex items-center justify-center gap-2 min-h-[56px]"
              >
                <Plus className="w-5 h-5" />
                New Compound
              </button>
            </div>
          )}
        </motion.div>

        {/* Compounds List */}
        {compounds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="font-display font-bold text-base text-foreground mb-3">
              Your Compounds
            </h3>
            <div className="space-y-3">
              {compounds.map((compound, i) => {
                const lastC = compound.history[0];
                return (
                  <motion.div
                    key={compound.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => navigate(`/compound/${compound.id}`)}
                      className="w-full text-left bg-card rounded-[14px] p-4 border border-border transition-all duration-200 active:scale-[0.98]"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold text-[15px] text-foreground truncate">
                            {compound.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body mt-1">
                            <Users className="w-3 h-3" />
                            <span>{compound.tenants.length} tenant{compound.tenants.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {lastC && (
                            <>
                              <div className="w-20">
                                <ShareBar results={lastC.results} height={6} />
                              </div>
                              <span className="text-xs font-bold text-primary font-display">
                                ₦{lastC.totalAmount.toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Bottom Buttons */}
        <motion.div
          className="space-y-4 pt-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <button
            onClick={() => navigate('/calculate')}
            className="btn-secondary flex items-center justify-center gap-2 min-h-[56px]"
          >
            <Zap className="w-5 h-5" />
            Quick Split
          </button>
          <button
            onClick={() => navigate('/compound/new')}
            className="btn-primary flex items-center justify-center gap-2 min-h-[56px]"
          >
            <Plus className="w-5 h-5" />
            New Compound
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}
