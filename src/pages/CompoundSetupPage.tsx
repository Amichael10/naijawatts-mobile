import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, UserPlus } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getCompound, saveCompound, generateId } from '@/lib/storage';
import { Compound, Tenant } from '@/lib/types';

export default function CompoundSetupPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';
  const existing = isEditing ? getCompound(id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [tenants, setTenants] = useState<Tenant[]>(existing?.tenants || []);
  const [nameError, setNameError] = useState(false);

  // New tenant form
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

    // Auto-scroll & focus
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
          <label className="input-label">Compound Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(false);
            }}
            placeholder='e.g. "No. 14 Balogun Street"'
            className={`input-field ${nameError ? 'animate-shake border-destructive' : ''}`}
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
                {tenants.map((tenant) => (
                  <motion.div
                    key={tenant.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="flex items-center gap-1.5 bg-secondary border border-border rounded-full px-3 py-1.5"
                  >
                    <span className="text-xs">⚡</span>
                    <span className="text-[13px] font-body text-foreground">
                      {tenant.flatLabel} — {tenant.name}
                    </span>
                    <button
                      onClick={() => removeTenant(tenant.id)}
                      className="text-muted-foreground hover:text-destructive ml-1 active:scale-90 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Add Tenant Form */}
          <div ref={formRef} className="card-surface space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="input-label text-xs">Flat / Room</label>
                <input
                  ref={flatRef}
                  type="text"
                  value={newFlat}
                  onChange={(e) => {
                    setNewFlat(e.target.value);
                    setFieldErrors(p => ({ ...p, flat: false }));
                  }}
                  placeholder='e.g. "Flat 2"'
                  className={`input-field text-sm ${fieldErrors.flat ? 'animate-shake border-destructive' : ''}`}
                />
              </div>
              <div className="flex-1">
                <label className="input-label text-xs">Tenant Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setFieldErrors(p => ({ ...p, name: false }));
                  }}
                  placeholder="e.g. Emeka"
                  className={`input-field text-sm ${fieldErrors.name ? 'animate-shake border-destructive' : ''}`}
                />
              </div>
            </div>
            <button
              onClick={addTenant}
              className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
            >
              <UserPlus className="w-4 h-4" />
              Add Tenant +
            </button>
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
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isEditing ? 'Update Compound' : 'Save Compound'}
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}
