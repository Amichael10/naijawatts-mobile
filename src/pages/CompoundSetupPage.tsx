import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getCompound, saveCompound, generateId } from '@/lib/storage';
import { Compound, Tenant } from '@/lib/types';

export default function CompoundSetupPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';

  const existing = isEditing ? getCompound(id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [tenants, setTenants] = useState<Tenant[]>(
    existing?.tenants || [
      { id: generateId(), name: '', flatLabel: '' },
    ]
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const addTenant = () => {
    setTenants([...tenants, { id: generateId(), name: '', flatLabel: '' }]);
  };

  const removeTenant = (tenantId: string) => {
    if (tenants.length <= 1) return;
    setTenants(tenants.filter(t => t.id !== tenantId));
  };

  const updateTenant = (tenantId: string, field: keyof Tenant, value: string) => {
    setTenants(tenants.map(t => t.id === tenantId ? { ...t, [field]: value } : t));
    setErrors(prev => ({ ...prev, [`${tenantId}-${field}`]: false }));
  };

  const handleSave = () => {
    const newErrors: Record<string, boolean> = {};

    if (!name.trim()) newErrors['name'] = true;
    tenants.forEach(t => {
      if (!t.name.trim()) newErrors[`${t.id}-name`] = true;
      if (!t.flatLabel.trim()) newErrors[`${t.id}-flatLabel`] = true;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const compound: Compound = {
      id: existing?.id || generateId(),
      name: name.trim(),
      tenants: tenants.map(t => ({
        ...t,
        name: t.name.trim(),
        flatLabel: t.flatLabel.trim(),
      })),
      history: existing?.history || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    saveCompound(compound);
    navigate(`/compound/${compound.id}`, { replace: true });
  };

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
              setErrors(prev => ({ ...prev, name: false }));
            }}
            placeholder='e.g. "No. 14 Balogun Street"'
            className={`input-field ${errors['name'] ? 'animate-shake border-destructive' : ''}`}
          />
        </motion.div>

        {/* Tenants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base text-foreground">
              Tenants ({tenants.length})
            </h3>
            <button
              onClick={addTenant}
              className="flex items-center gap-1 text-primary font-display font-semibold text-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <AnimatePresence initial={false}>
            <div className="space-y-3">
              {tenants.map((tenant, i) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="card-surface"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-display font-semibold text-muted-foreground">
                      Tenant {i + 1}
                    </span>
                    {tenants.length > 1 && (
                      <button
                        onClick={() => removeTenant(tenant.id)}
                        className="text-destructive p-1 active:scale-90 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="input-label">Name</label>
                      <input
                        type="text"
                        value={tenant.name}
                        onChange={(e) => updateTenant(tenant.id, 'name', e.target.value)}
                        placeholder="e.g. Emeka"
                        className={`input-field ${errors[`${tenant.id}-name`] ? 'animate-shake border-destructive' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="input-label">Flat / Room Label</label>
                      <input
                        type="text"
                        value={tenant.flatLabel}
                        onChange={(e) => updateTenant(tenant.id, 'flatLabel', e.target.value)}
                        placeholder='e.g. "Flat 2" or "Boys Quarters"'
                        className={`input-field ${errors[`${tenant.id}-flatLabel`] ? 'animate-shake border-destructive' : ''}`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>

        {/* Save */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            {isEditing ? 'Update Compound' : 'Save Compound'}
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}
