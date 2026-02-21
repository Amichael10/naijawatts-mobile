import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, Users, ChevronRight } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getCompounds, deleteCompound } from '@/lib/storage';
import { Compound } from '@/lib/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [compounds, setCompounds] = useState<Compound[]>(getCompounds);

  const handleDelete = (id: string) => {
    deleteCompound(id);
    setCompounds(getCompounds());
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-display font-extrabold text-foreground">
            Your Compounds
          </h2>
          <p className="text-muted-foreground font-body mt-1">
            Manage bills for your properties
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <button
            onClick={() => navigate('/compound/new')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Compound
          </button>
          <button
            onClick={() => navigate('/calculate')}
            className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Zap className="w-5 h-5" />
            Quick Split
          </button>
        </motion.div>

        {/* Compounds List */}
        <AnimatePresence mode="wait">
          {compounds.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="card-surface text-center py-12"
            >
              <div className="text-5xl mb-4">💡</div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">
                No compounds yet
              </h3>
              <p className="text-muted-foreground font-body text-sm mb-6 max-w-[250px] mx-auto">
                Add your first compound to start splitting electricity bills fairly
              </p>
              <button
                onClick={() => navigate('/compound/new')}
                className="btn-primary max-w-[220px] mx-auto flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Compound
              </button>
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-3">
              {compounds.map((compound, i) => {
                const lastCalc = compound.history[0];
                return (
                  <motion.div
                    key={compound.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => navigate(`/compound/${compound.id}`)}
                      className="card-surface-hover w-full text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">⚡</span>
                            <h3 className="font-display font-bold text-base text-foreground truncate">
                              {compound.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                            <Users className="w-3.5 h-3.5" />
                            <span>{compound.tenants.length} tenant{compound.tenants.length !== 1 ? 's' : ''}</span>
                            {lastCalc && (
                              <>
                                <span>·</span>
                                <span>Last split: {timeAgo(lastCalc.date)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
