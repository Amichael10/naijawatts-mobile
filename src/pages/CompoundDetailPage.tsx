import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, Users, Settings, Clock } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getCompound } from '@/lib/storage';

export default function CompoundDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const compound = id ? getCompound(id) : null;

  if (!compound) {
    return (
      <AppShell title="Not Found" showBack>
        <div className="card-surface text-center py-12">
          <p className="text-muted-foreground font-body">Compound not found</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={compound.name} showBack>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚡</span>
            <h2 className="font-display font-extrabold text-xl text-foreground">{compound.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            <Users className="w-3.5 h-3.5 inline mr-1" />
            {compound.tenants.length} tenant{compound.tenants.length !== 1 ? 's' : ''}
            {compound.tenants.length > 0 && (
              <span> — {compound.tenants.map(t => t.name).join(', ')}</span>
            )}
          </p>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => navigate(`/calculate?compound=${compound.id}`)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            Calculate Bill Split
          </button>

          <button
            onClick={() => navigate(`/history/${compound.id}`)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5" />
            View History
          </button>

          <button
            onClick={() => navigate(`/compound/${compound.id}/edit`)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Edit Compound
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}
