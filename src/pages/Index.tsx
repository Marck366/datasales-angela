import { useState, useMemo, useCallback } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/hooks/useAuth';
import { ContactCard } from '@/components/contacts/ContactCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddClientDrawer } from '@/components/contacts/AddClientDrawer';
import { Search, Plus, LayoutGrid, Briefcase } from 'lucide-react';
import { ContactStatus, Priority, PipelineType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface StatusConfig {
  key: ContactStatus;
  label: string;
  bgClass: string;
  fgClass: string;
  gridSpan?: string;
}

const Index = () => {
  const [activePipeline, setActivePipeline] = useState<PipelineType>('captura');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ContactStatus | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [prioridadFilter, setPrioridadFilter] = useState<Priority | null>(null);
  const [showAtencion, setShowAtencion] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { profile, user } = useAuth();

  const isElevated = profile?.role === 'admin' || profile?.role === 'jefe_ventas';
  const filterUserId = isElevated && showTeam ? null : user?.id ?? null;

  const { data: allContacts = [], isLoading } = useContacts(filterUserId);

  const currentStatuses = useMemo(() => {
    if (activePipeline === 'captura') {
      return [
        { key: 'cerrado' as const, label: 'Cerrados', gradient: 'from-emerald-500/20 to-transparent', fgClass: 'text-emerald-700 dark:text-emerald-400', borderClass: 'border-emerald-500/20', glowClass: 'shadow-sm', gridSpan: 'col-span-4' },
        { key: 'nuevo' as const, label: 'Nuevos', gradient: 'from-sky-500/20 to-transparent', fgClass: 'text-sky-700 dark:text-sky-400', borderClass: 'border-sky-500/20', glowClass: 'shadow-sm', gridSpan: 'col-span-4' },
        { key: 'agendado' as const, label: 'Agendados', gradient: 'from-orange-500/20 to-transparent', fgClass: 'text-orange-700 dark:text-orange-400', borderClass: 'border-orange-500/20', glowClass: 'shadow-sm', gridSpan: 'col-span-4' },
        { key: 'pendiente_propuesta' as const, label: 'P. Propuesta', gradient: 'from-white/10 to-transparent', fgClass: 'text-[#002B49] dark:text-white/90', borderClass: 'border-white/10', glowClass: 'shadow-none', gridSpan: 'col-span-3' },
        { key: 'propuesta_mandada' as const, label: 'P. Mandada', gradient: 'from-indigo-500/10 to-transparent', fgClass: 'text-indigo-700 dark:text-indigo-400', borderClass: 'border-white/10', glowClass: 'shadow-none', gridSpan: 'col-span-3' },
        { key: 'aplazado' as const, label: 'Aplazados', gradient: 'from-white/5 to-transparent', fgClass: 'text-slate-500 dark:text-white/70', borderClass: 'border-white/5', glowClass: 'shadow-none', gridSpan: 'col-span-3' },
        { key: 'perdido' as const, label: 'Perdidos', gradient: 'from-rose-500/10 to-transparent', fgClass: 'text-rose-700 dark:text-rose-400', borderClass: 'border-rose-500/10', glowClass: 'shadow-none', gridSpan: 'col-span-3' },
      ];
    }
    return [
      { key: 'aceptada' as const, label: 'Aceptadas', gradient: 'from-emerald-500/20 to-transparent', fgClass: 'text-emerald-700 dark:text-emerald-400', borderClass: 'border-emerald-500/20', glowClass: 'shadow-sm', gridSpan: 'col-span-6 h-28 flex flex-col justify-center' },
      { key: 'prevision_cierre' as const, label: 'Previsión', gradient: 'from-orange-500/20 to-transparent', fgClass: 'text-orange-700 dark:text-orange-400', borderClass: 'border-orange-500/20', glowClass: 'shadow-sm', gridSpan: 'col-span-6 h-28 flex flex-col justify-center' },
      { key: 'propuesta_solicitada' as const, label: 'P. Solicitada', gradient: 'from-white/10 to-transparent', fgClass: 'text-[#002B49] dark:text-white/90', borderClass: 'border-white/10', glowClass: 'shadow-none', gridSpan: 'col-span-4' },
      { key: 'propuesta_entregada' as const, label: 'P. Entregada', gradient: 'from-blue-500/10 to-transparent', fgClass: 'text-blue-700 dark:text-blue-400', borderClass: 'border-white/10', glowClass: 'shadow-none', gridSpan: 'col-span-4' },
      { key: 'rechazada' as const, label: 'Rechazadas', gradient: 'from-rose-500/10 to-transparent', fgClass: 'text-rose-700 dark:text-rose-400', borderClass: 'border-rose-500/10', glowClass: 'shadow-none', gridSpan: 'col-span-4' },
    ];
  }, [activePipeline]);


  const atencionContacts = useMemo(() => {
    return allContacts.filter(c => {
      if (c.status === 'cerrado' || c.status === 'perdido' || c.status === 'aceptada' || c.status === 'rechazada') return false;
      if (c.seguimiento_date) {
        const overdueDays = Math.floor((Date.now() - new Date(c.seguimiento_date).getTime()) / 86_400_000);
        if (overdueDays > 3) return true;
      }
      if (c.last_activity_at) {
        const daysSince = Math.floor((Date.now() - new Date(c.last_activity_at).getTime()) / 86_400_000);
        if (daysSince > 21) return true;
      }
      if (c.status === 'agendado' && c.status_changed_at) {
        const daysInStatus = Math.floor((Date.now() - new Date(c.status_changed_at).getTime()) / 86_400_000);
        if (daysInStatus > 28) return true;
      }
      return false;
    });
  }, [allContacts]);

  const contacts = useMemo(() => {
    const base = allContacts.filter(c => c.pipeline === activePipeline);
    let filtered = showAtencion ? atencionContacts.filter(c => c.pipeline === activePipeline) : base;
    
    if (!showAtencion && activeFilter) {
      filtered = filtered.filter((c) => c.status === activeFilter);
    }
    if (tipoFilter === 'Cliente') filtered = filtered.filter(c => c.tipo === 'Cliente');
    if (tipoFilter === 'Partner') filtered = filtered.filter(c => c.tipo === 'Partner');
    if (prioridadFilter) filtered = filtered.filter(c => c.prioridad === prioridadFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.company?.name.toLowerCase().includes(q) ||
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [search, activeFilter, tipoFilter, prioridadFilter, showAtencion, atencionContacts, allContacts, activePipeline]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of currentStatuses) {
      c[s.key] = allContacts.filter((ct) => ct.status === s.key).length;
    }
    return c;
  }, [allContacts, currentStatuses]);

  const handleFilterToggle = useCallback((key: ContactStatus) => {
    setShowAtencion(false);
    setActiveFilter((prev) => (prev === key ? null : key));
  }, []);

  const handlePipelineChange = (pipeline: PipelineType) => {
    setActivePipeline(pipeline);
    setActiveFilter(null);
    setShowAtencion(false);
  };

  return (
    <AppLayout>
      <div className="px-4 pt-5 pb-24">
        <div className="mb-6">
          <h2 className="text-xl font-heading font-black text-[#002B49] dark:text-white mb-0.5 tracking-tighter">
            {profile?.name?.split(' ')[0] || 'Usuario'}
          </h2>
          <p className="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-widest">
            {allContacts.length} MÉTRICAS DE IMPACTO HOY
          </p>
        </div>

        <div className="flex p-1.5 gap-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] mb-8 backdrop-blur-xl max-w-md mx-auto">
          <button
            onClick={() => handlePipelineChange('captura')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500",
              activePipeline === 'captura' 
                ? "bg-[#002B49] dark:bg-primary text-white shadow-xl shadow-primary/20" 
                : "text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-[#002B49] dark:hover:text-white"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Captura
          </button>
          <button
            onClick={() => handlePipelineChange('cartera')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500",
              activePipeline === 'cartera' 
                ? "bg-[#002B49] dark:bg-primary text-white shadow-xl shadow-primary/20" 
                : "text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-[#002B49] dark:hover:text-white"
            )}
          >
            <Briefcase className="w-4 h-4" />
            Cartera
          </button>
        </div>

        <div className="grid grid-cols-12 gap-3 mb-10">
          {currentStatuses.map((s) => (
            <button
              key={s.key}
              onClick={() => handleFilterToggle(s.key)}
              className={cn(
                "relative glass rounded-[2.5rem] p-5 text-center transition-all duration-700 overflow-hidden group border border-border/50 dark:border-white/20",
                s.gridSpan || "col-span-4",
                activeFilter === s.key
                  ? cn("scale-[1.05] z-20 shadow-2xl bg-gradient-to-br ring-2 ring-inset ring-slate-200 dark:ring-white/30", s.gradient, s.borderClass)
                  : cn("hover:scale-[1.02] hover:bg-white dark:hover:bg-white/10")
              )}
            >
              <div className="relative z-10 flex flex-col items-center justify-center">
                <span className={cn(s.fgClass, "text-4xl font-heading font-black tabular-nums block leading-none mb-1.5 tracking-tighter")}>
                  {counts[s.key] || 0}
                </span>
                <span className={cn(s.fgClass, "text-[9px] font-bold uppercase tracking-[0.2em] opacity-90")}>
                  {s.label}
                </span>
              </div>

              <div className={cn(
                "absolute top-0 right-0 w-16 h-16 blur-2xl opacity-10 transition-opacity group-hover:opacity-30",
                s.fgClass.replace('text-', 'bg-')
              )} />
            </button>
          ))}
        </div>

        {atencionContacts.length > 0 && (
          <button
            onClick={() => {
              setShowAtencion(s => !s);
              setActiveFilter(null);
            }}
            className={cn(
              "w-full flex items-center justify-between mb-6 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 border",
              showAtencion
                ? "bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/20"
                : "bg-destructive/5 text-destructive border-destructive/10 hover:bg-destructive/10"
            )}
          >
            <span className="flex items-center gap-3">
              <span className="animate-pulse">⚠️</span>
              Requieren atención
            </span>
            <span className={cn(
              "text-xs font-black px-2.5 py-1 rounded-full",
              showAtencion ? "bg-white/20" : "bg-destructive text-destructive-foreground"
            )}>
              {atencionContacts.length}
            </span>
          </button>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex gap-1.5 pr-4 border-r border-border/50">
              {(['todos', 'Cliente', 'Partner'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipoFilter(tipoFilter === t ? 'todos' : t)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap",
                    tipoFilter === t
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-card/40 border border-border/50 text-muted-foreground hover:bg-card/80"
                  )}
                >
                  {t === 'todos' ? 'Todos' : t === 'Cliente' ? 'Clientes' : 'Partners'}
                </button>
              ))}
            </div>
            
            <div className="flex gap-1.5">
              {(['alta', 'media', 'baja'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPrioridadFilter(prev => prev === p ? null : p)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0",
                    prioridadFilter === p
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-card/40 border border-border/50 text-muted-foreground hover:bg-card/80"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", 
                    p === 'alta' ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                    p === 'media' ? 'bg-status-agendado-fg' : 
                    'bg-muted-foreground'
                  )} />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {isElevated && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-card/40 border border-border/50 rounded-xl whitespace-nowrap ml-auto">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Equipo</span>
                <Switch checked={showTeam} onCheckedChange={setShowTeam} className="scale-75" />
              </div>
            )}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Buscar por empresa, contacto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 backdrop-blur-md rounded-2xl text-sm font-body border-slate-100 dark:border-white/10 placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm text-[#002B49] dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card/40 p-5 rounded-3xl border border-border/30 animate-pulse h-32" />
              ))}
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout" initial={false}>
                {contacts.map((contact, i) => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact} 
                    index={i} 
                    isExpanded={expandedId === contact.id}
                    onToggle={() => setExpandedId(prev => prev === contact.id ? null : contact.id)}
                  />
                ))}
              </AnimatePresence>
              
              {contacts.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 px-10 glass rounded-3xl"
                >
                  <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4 grayscale">
                    🔍
                  </div>
                  <h3 className="text-xl font-heading font-black mb-2">Sin resultados</h3>
                  <p className="text-sm text-muted-foreground">
                    No encontramos contactos en el flujo de <b>{activePipeline}</b> con los filtros aplicados.
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setAddOpen(true)}
        className="fixed bottom-24 right-6 z-50 bg-primary p-5 rounded-2xl shadow-2xl shadow-primary/40 text-primary-foreground group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <Plus className="w-7 h-7 relative z-10" />
      </motion.button>

      <AddClientDrawer open={addOpen} onOpenChange={setAddOpen} />
    </AppLayout>
  );
};

export default Index;
