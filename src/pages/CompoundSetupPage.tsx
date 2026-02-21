import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, UserPlus } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getCompound, saveCompound, generateId } from '@/lib/storage';
import { Compound, Tenant } from '@/lib/types';

const TENANT_COLORS = [
  '#C8F135', '#2EC4B6', '#FF6B6B', '#FFD166',
  '#A78BFA', '#60A5FA', '#FB923C', '#34D399',
];

export default function CompoundSetupPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';
  const existing = isEditing ? getCompound(id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [tenants, setTenants] = useState<Tenant[]>(existing?.tenants || []);
  const [nameError, setNameError] = useState(false);

  const [newFlat, setNewFlat] = useState('');
  const [newName, setNewName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ flat?: boolean; name?: boolean }>({});
  const flatRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const addTenant = () => {
    const errs: { flat?: boolean; name?: boolean } = {};
    if (!newFlat.trim()) errs.flat = true;
    if (!newName.trim()) errs.name = true;
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    const tenant: Tenant = {
      id: generateId(),
      name: newName.trim(),
      flatLabel: newFlat.trim(),
    };
    setTenants(prev => [...prev, tenant]);
    setNewFlat('');
    setNewName('');
    setFieldErrors({});

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flatRef.current?.focus();
    }, 200);
  };

  const removeTenant = (tenantId: string) => {
    setTenants(tenants.filter(t => t.id !== tenantId));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }

    const compound: Compound = {
      id: existing?.id || generateId(),
      name: name.trim(),
      tenants,
      history: existing?.history || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    saveCompound(compound);
    navigate(`/compound/${compound.id}`, { replace: true });
  };

  const canSave = tenants.length >= 2 && name.trim().length > 0;

  return (
    <AppShell title={isEditing ? 'Edit Compound' : 'New Compound'} showBack>
      <div className="space-y-6">
        {/* Compound Name */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Compound Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(false);
            }}
            placeholder='e.g. "No. 14 Balogun Street"'
            className={`w-full rounded-[14px] border bg-secondary px-4 py-[18px] text-base font-body text-foreground transition-all duration-200 outline-none min-h-[56px] ${
              nameError
                ? 'animate-shake border-destructive'
                : 'border-input focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
            }`}
          />
        </motion.div>

        {/* Tenants Section */}
        <div>
          <h3 className="font-display font-bold text-base text-foreground mb-3">
            Tenants ({tenants.length})
          </h3>

          {/* Chips */}
          {tenants.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <AnimatePresence>
                {tenants.map((tenant, idx) => {
                  const color = TENANT_COLORS[idx % TENANT_COLORS.length];
                  return (
                    <motion.div
                      key={tenant.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="flex items-center gap-2 bg-secondary border border-border rounded-full h-9 px-3"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-body font-medium text-foreground">
                        {tenant.flatLabel} — {tenant.name}
                      </span>
                      <button
                        onClick={() => removeTenant(tenant.id)}
                        className="text-muted-foreground hover:text-destructive ml-0.5 active:scale-90 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Add Tenant Form */}
          <div ref={formRef} className="bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Flat / Room
                </label>
                <input
                  ref={flatRef}
                  type="text"
                  value={newFlat}
                  onChange={(e) => {
                    setNewFlat(e.target.value);
                    setFieldErrors(p => ({ ...p, flat: false }));
                  }}
                  placeholder="e.g. Flat 2, BQ, Room 3"
                  className={`w-full rounded-[14px] border bg-secondary px-4 py-[18px] text-base font-body text-foreground transition-all duration-200 outline-none min-h-[56px] ${
                    fieldErrors.flat
                      ? 'animate-shake border-destructive'
                      : 'border-input focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Tenant Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setFieldErrors(p => ({ ...p, name: false }));
                  }}
                  placeholder="e.g. Emeka"
                  className={`w-full rounded-[14px] border bg-secondary px-4 py-[18px] text-base font-body text-foreground transition-all duration-200 outline-none min-h-[56px] ${
                    fieldErrors.name
                      ? 'animate-shake border-destructive'
                      : 'border-input focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
                  }`}
                />
              </div>
            </div>
            <div className="mt-5">
              <button
                onClick={addTenant}
                className="btn-primary flex items-center justify-center gap-2 min-h-[56px] text-base"
              >
                <UserPlus className="w-5 h-5" />
                Add Tenant +
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-body mt-2 text-center">
            Add at least 2 tenants
          </p>
        </div>

        {/* Save */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn-primary flex items-center justify-center gap-2 min-h-[56px]"
          >
            <Save className="w-5 h-5" />
            {isEditing ? 'Update Compound' : 'Save Compound'}
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}
