import { useState, useMemo, useCallback } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/hooks/useAuth';
import { ContactCard } from '@/components/contacts/ContactCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddClientDrawer } from '@/components/contacts/AddClientDrawer';
import {
  Search, Plus, LayoutGrid, Briefcase,
  TrendingUp, CalendarDays, AlertTriangle,
  Video, Phone, MapPin, Monitor,
} from 'lucide-react';
import { ContactStatus, Priority, PipelineType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// ─── Animation presets ───────────────────────────────────────────────────────
const page = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const section = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 360, damping: 30 } },
};
const fadeSlide = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07, type: 'spring' as const, stiffness: 300, damping: 28 },
  }),
};

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusTier = 'primary' | 'secondary';
interface StatusConfig {
  key: ContactStatus;
  label: string;
  bgDefault: string;   // visible even when not active
  bgActive: string;    // on filter active
  borderColor: string; // top accent bar
  fgClass: string;
  glowRgba: string;
  tier: StatusTier;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MeetingIcon = ({ type }: { type?: string }) => {
  const cls = 'w-3 h-3';
  if (type === 'videoconferencia') return <Video className={cls} />;
  if (type === 'telematica')       return <Monitor className={cls} />;
  if (type === 'llamada')          return <Phone className={cls} />;
  if (type === 'presencial')       return <MapPin className={cls} />;
  return <CalendarDays className={cls} />;
};

// ─── Component ────────────────────────────────────────────────────────────────
const Index = () => {
  const [activePipeline, setActivePipeline] = useState<PipelineType>('captura');
  const [search, setSearch]                 = useState('');
  const [activeFilter, setActiveFilter]     = useState<ContactStatus | null>(null);
  const [tipoFilter, setTipoFilter]         = useState<string>('todos');
  const [prioridadFilter, setPrioridadFilter] = useState<Priority | null>(null);
  const [showAtencion, setShowAtencion]     = useState(false);
  const [addOpen, setAddOpen]               = useState(false);
  const [showTeam, setShowTeam]             = useState(false);
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const { profile, user } = useAuth();

  const isElevated   = profile?.role === 'admin' || profile?.role === 'jefe_ventas';
  const filterUserId = isElevated && showTeam ? null : user?.id ?? null;
  const { data: rawContacts = [], isLoading } = useContacts(filterUserId);
  const allContacts = useMemo(() => rawContacts.filter(c => c.is_primary), [rawContacts]);

  // ── Derived values ──
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const weekMeetings = useMemo(() => {
    const now = new Date();
    const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return rawContacts
      .filter(c => {
        if (!c.scheduled_date) return false;
        const d = new Date(c.scheduled_date);
        return d >= monday && d <= sunday;
      })
      .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime());
  }, [allContacts]);

  const pipelineValue = useMemo(() => {
    const total = allContacts
      .filter(c => c.pipeline === activePipeline && c.status !== 'perdido' && c.status !== 'rechazada')
      .reduce((sum, c) => sum + (c.valor_potencial || 0), 0);
    if (!total) return null;
    if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)}M€`;
    if (total >= 1_000)     return `${Math.round(total / 1_000)}K€`;
    return `${total}€`;
  }, [allContacts, activePipeline]);

  const currentStatuses = useMemo((): StatusConfig[] => {
    if (activePipeline === 'captura') return [
      { key: 'cerrado',             label: 'Cerrados',     bgDefault: 'bg-emerald-50 dark:bg-emerald-500/10',   bgActive: 'bg-emerald-100 dark:bg-emerald-500/20', borderColor: 'border-t-emerald-400',   fgClass: 'text-emerald-700 dark:text-emerald-400', glowRgba: 'rgba(16,185,129,0.35)',  tier: 'primary' },
      { key: 'nuevo',               label: 'Nuevos',       bgDefault: 'bg-sky-50 dark:bg-sky-500/10',           bgActive: 'bg-sky-100 dark:bg-sky-500/20',         borderColor: 'border-t-sky-400',       fgClass: 'text-sky-700 dark:text-sky-400',         glowRgba: 'rgba(14,165,233,0.35)',  tier: 'primary' },
      { key: 'agendado',            label: 'Agendados',    bgDefault: 'bg-orange-50 dark:bg-orange-500/10',     bgActive: 'bg-orange-100 dark:bg-orange-500/20',   borderColor: 'border-t-orange-400',   fgClass: 'text-orange-700 dark:text-orange-400',   glowRgba: 'rgba(249,115,22,0.35)',  tier: 'primary' },
      { key: 'pendiente_propuesta', label: 'P. Propuesta', bgDefault: 'bg-slate-50 dark:bg-slate-500/10',       bgActive: 'bg-slate-100 dark:bg-slate-500/20',     borderColor: 'border-t-slate-400',    fgClass: 'text-slate-600 dark:text-slate-300',     glowRgba: 'rgba(100,116,139,0.25)', tier: 'secondary' },
      { key: 'propuesta_mandada',   label: 'P. Mandada',   bgDefault: 'bg-indigo-50 dark:bg-indigo-500/10',     bgActive: 'bg-indigo-100 dark:bg-indigo-500/20',   borderColor: 'border-t-indigo-400',   fgClass: 'text-indigo-700 dark:text-indigo-400',   glowRgba: 'rgba(99,102,241,0.3)',   tier: 'secondary' },
      { key: 'aplazado',            label: 'Aplazados',    bgDefault: 'bg-slate-50 dark:bg-white/5',            bgActive: 'bg-slate-100 dark:bg-white/10',         borderColor: 'border-t-slate-300',    fgClass: 'text-slate-500 dark:text-slate-400',     glowRgba: 'rgba(148,163,184,0.22)', tier: 'secondary' },
      { key: 'perdido',             label: 'Perdidos',     bgDefault: 'bg-rose-50 dark:bg-rose-500/10',         bgActive: 'bg-rose-100 dark:bg-rose-500/20',       borderColor: 'border-t-rose-400',     fgClass: 'text-rose-700 dark:text-rose-400',       glowRgba: 'rgba(244,63,94,0.3)',    tier: 'secondary' },
    ];
    return [
      { key: 'aceptada',            label: 'Aceptadas',    bgDefault: 'bg-emerald-50 dark:bg-emerald-500/10',   bgActive: 'bg-emerald-100 dark:bg-emerald-500/20', borderColor: 'border-t-emerald-400',   fgClass: 'text-emerald-700 dark:text-emerald-400', glowRgba: 'rgba(16,185,129,0.35)',  tier: 'primary' },
      { key: 'prevision_cierre',    label: 'Previsión',    bgDefault: 'bg-orange-50 dark:bg-orange-500/10',     bgActive: 'bg-orange-100 dark:bg-orange-500/20',   borderColor: 'border-t-orange-400',   fgClass: 'text-orange-700 dark:text-orange-400',   glowRgba: 'rgba(249,115,22,0.35)',  tier: 'primary' },
      { key: 'propuesta_solicitada',label: 'P. Solicitada',bgDefault: 'bg-slate-50 dark:bg-slate-500/10',       bgActive: 'bg-slate-100 dark:bg-slate-500/20',     borderColor: 'border-t-slate-400',    fgClass: 'text-slate-600 dark:text-slate-300',     glowRgba: 'rgba(100,116,139,0.25)', tier: 'secondary' },
      { key: 'propuesta_entregada', label: 'P. Entregada', bgDefault: 'bg-blue-50 dark:bg-blue-500/10',         bgActive: 'bg-blue-100 dark:bg-blue-500/20',       borderColor: 'border-t-blue-400',     fgClass: 'text-blue-700 dark:text-blue-400',       glowRgba: 'rgba(59,130,246,0.3)',   tier: 'secondary' },
      { key: 'rechazada',           label: 'Rechazadas',   bgDefault: 'bg-rose-50 dark:bg-rose-500/10',         bgActive: 'bg-rose-100 dark:bg-rose-500/20',       borderColor: 'border-t-rose-400',     fgClass: 'text-rose-700 dark:text-rose-400',       glowRgba: 'rgba(244,63,94,0.3)',    tier: 'secondary' },
    ];
  }, [activePipeline]);

  const primaryStatuses   = useMemo(() => currentStatuses.filter(s => s.tier === 'primary'),   [currentStatuses]);
  const secondaryStatuses = useMemo(() => currentStatuses.filter(s => s.tier === 'secondary'), [currentStatuses]);

  const atencionContacts = useMemo(() => allContacts.filter(c => {
    if (['cerrado', 'perdido', 'aceptada', 'rechazada'].includes(c.status)) return false;
    
    const now = Date.now();
    const dayMs = 86_400_000;

    // 1. Agendado y han pasado 10 días desde la fecha de reunión (scheduled_date)
    if (c.status === 'agendado' && c.scheduled_date) {
      if (now - new Date(c.scheduled_date).getTime() > 10 * dayMs) return true;
    }

    // 2. Propuesta mandada/entregada y no se ha movido nada en 14 días (last_activity_at)
    if (['propuesta_mandada', 'propuesta_entregada'].includes(c.status)) {
      const lastInteraction = c.last_activity_at ? new Date(c.last_activity_at).getTime() : new Date(c.updated_at).getTime();
      if (now - lastInteraction > 14 * dayMs) return true;
    }

    // 3. Seguimiento manual (seguimiento_date) vencido por > 3 días
    if (c.seguimiento_date && (now - new Date(c.seguimiento_date).getTime() > 3 * dayMs)) return true;

    // 4. Inactividad general extrema (21 días)
    if (c.last_activity_at && (now - new Date(c.last_activity_at).getTime() > 21 * dayMs)) return true;

    return false;
  }), [allContacts]);

  const contacts = useMemo(() => {
    const base = allContacts.filter(c => c.pipeline === activePipeline);
    let list = showAtencion ? atencionContacts.filter(c => c.pipeline === activePipeline) : base;
    if (!showAtencion && activeFilter) list = list.filter(c => c.status === activeFilter);
    if (tipoFilter === 'Cliente')  list = list.filter(c => c.tipo === 'Cliente');
    if (tipoFilter === 'Partner')  list = list.filter(c => c.tipo === 'Partner');
    if (prioridadFilter)           list = list.filter(c => c.prioridad === prioridadFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.company?.name.toLowerCase().includes(q) ||
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeFilter, tipoFilter, prioridadFilter, showAtencion, atencionContacts, allContacts, activePipeline]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of currentStatuses) c[s.key] = allContacts.filter(ct => ct.status === s.key).length;
    return c;
  }, [allContacts, currentStatuses]);

  const handleFilterToggle = useCallback((key: ContactStatus) => {
    setShowAtencion(false);
    setActiveFilter(prev => prev === key ? null : key);
  }, []);

  const handlePipelineChange = (p: PipelineType) => {
    setActivePipeline(p);
    setActiveFilter(null);
    setShowAtencion(false);
  };

  const todayStr    = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AppLayout
      headerAction={
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setAddOpen(true)}
          className="h-10 w-10 sm:w-auto sm:px-4 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:translate-y-[-2px] transition-all"
          title="Añadir cliente"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-tight hidden sm:inline">Cliente</span>
        </motion.button>
      }
    >
      <motion.div
        variants={page}
        initial="hidden"
        animate="visible"
        className="px-4 pt-5 pb-28"
      >

        {/* ════ HEADER ════ */}
        <motion.div variants={section} className="flex items-center justify-between mb-6">
          {/* Left: greeting + name + pipeline value */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground mb-0.5 leading-none">
              {greeting}
            </p>
            <h1 className="text-[27px] font-heading font-black text-[#002B49] dark:text-white tracking-tighter leading-none mb-1.5">
              {profile?.name?.split(' ')[0] || 'Usuario'}
            </h1>
            {pipelineValue && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 28 }}
                className="flex items-center gap-1.5"
              >
                <TrendingUp className="w-3 h-3 text-[#B2D235]" />
                <span className="text-[11px] font-black text-[#4f6b00] dark:text-[#B2D235] tracking-tight">
                  {pipelineValue} en pipeline
                </span>
              </motion.div>
            )}
          </div>

          {/* Right: pipeline toggle with spring sliding indicator */}
          <div className="relative flex p-1 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] rounded-[1.2rem] gap-0.5">
            {(['captura', 'cartera'] as PipelineType[]).map(p => (
              <button
                key={p}
                onClick={() => handlePipelineChange(p)}
                className={cn(
                  'relative z-10 px-3.5 py-2 rounded-[0.9rem] text-[11px] font-black transition-colors duration-300',
                  activePipeline === p ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {activePipeline === p && (
                  <motion.div
                    layoutId="pipeline-pill"
                    className="absolute inset-0 bg-[#002B49] dark:bg-primary rounded-[0.9rem] shadow-lg shadow-[#002B49]/30 dark:shadow-primary/30"
                    transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {p === 'captura' ? <LayoutGrid className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                  {p === 'captura' ? 'Captura' : 'Cartera'}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ════ ESTA SEMANA ════ */}
        <AnimatePresence>
          {weekMeetings.length > 0 && (
            <motion.div
              key="week"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mb-6 overflow-hidden"
            >
              {/* Label */}
              <div className="flex items-center gap-2 mb-2.5 px-0.5">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Esta semana
                </span>
                <span className="inline-flex items-center justify-center bg-[#002B49] dark:bg-primary text-white text-[9px] font-black w-[18px] h-[18px] rounded-full">
                  {weekMeetings.length}
                </span>
              </div>

              {/* Horizontal scroll */}
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {weekMeetings.map((c, i) => {
                  const d       = new Date(c.scheduled_date!);
                  const isToday = c.scheduled_date?.slice(0, 10) === todayStr;
                  const isTomorrow = c.scheduled_date?.slice(0, 10) === tomorrowStr;
                  const dayAbbr = d.toLocaleDateString('es-ES', { weekday: 'short' });
                  const dayNum  = d.getDate();

                  return (
                    <motion.div
                      key={c.id}
                      custom={i}
                      variants={fadeSlide}
                      initial="hidden"
                      animate="visible"
                      className={cn(
                        'flex-shrink-0 flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all',
                        isToday
                          ? 'bg-gradient-to-br from-[#002B49] to-[#0369a1] border-transparent shadow-xl shadow-[#002B49]/30'
                          : isTomorrow
                            ? 'bg-card border-primary/25 dark:border-primary/20'
                            : 'bg-card/60 backdrop-blur-sm border-border/50 dark:border-white/[0.08]'
                      )}
                    >
                      {/* Day badge */}
                      <div className={cn(
                        'text-center min-w-[26px]',
                        isToday ? 'text-white' : isTomorrow ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        <p className="text-[8px] font-bold uppercase capitalize leading-none mb-0.5">{dayAbbr}</p>
                        <p className="text-[21px] font-black leading-none tracking-tighter">{dayNum}</p>
                      </div>

                      <div className={cn('w-px h-9 rounded-full flex-shrink-0', isToday ? 'bg-white/20' : 'bg-border/60')} />

                      {/* Info */}
                      <div className="min-w-0">
                        <p className={cn(
                          'text-[12px] font-bold truncate max-w-[112px] leading-tight',
                          isToday ? 'text-white' : 'text-foreground'
                        )}>
                          {c.company?.name || `${c.first_name} ${c.last_name}`}
                        </p>
                        <div className={cn('flex items-center gap-1 mt-0.5', isToday ? 'text-white/55' : 'text-muted-foreground')}>
                          <MeetingIcon type={c.meeting_type} />
                          <p className="text-[9px] font-medium capitalize truncate">
                            {c.meeting_type || 'Reunión'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════ FUNNEL STATUS GRID ════ */}
        <motion.div variants={section} className="mb-7">

          {/* Row 1 — primary statuses (large) */}
          <div className={cn(
            'grid gap-2.5 mb-2.5',
            primaryStatuses.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          )}>
            {primaryStatuses.map((s) => {
              const isActive = activeFilter === s.key;
              return (
                <motion.button
                  key={s.key}
                  onClick={() => handleFilterToggle(s.key)}
                  whileTap={{ scale: 0.93 }}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  style={isActive ? { boxShadow: `0 10px 32px ${s.glowRgba}` } : {}}
                  className={cn(
                    'relative overflow-hidden rounded-[1.5rem] pt-5 pb-4 px-3 text-center border-t-[3px] transition-all duration-300',
                    s.bgDefault,
                    s.borderColor,
                    isActive ? 'ring-2 ring-inset ring-black/10 dark:ring-white/15 z-10' : 'hover:brightness-95 dark:hover:brightness-110'
                  )}
                >
                  <div className="relative z-10">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={counts[s.key]}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className={cn(s.fgClass, 'text-[44px] font-heading font-black tabular-nums leading-none block mb-2 tracking-tighter')}
                      >
                        {counts[s.key] || 0}
                      </motion.span>
                    </AnimatePresence>
                    <span className={cn(s.fgClass, 'text-[9px] font-black uppercase tracking-[0.22em] opacity-70')}>
                      {s.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Row 2 — secondary statuses (compact) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePipeline}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className={cn(
                'grid gap-2',
                secondaryStatuses.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
              )}
            >
              {secondaryStatuses.map((s) => {
                const isActive = activeFilter === s.key;
                return (
                  <motion.button
                    key={s.key}
                    onClick={() => handleFilterToggle(s.key)}
                    whileTap={{ scale: 0.91 }}
                    animate={{ scale: isActive ? 1.07 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    style={isActive ? { boxShadow: `0 5px 18px ${s.glowRgba}` } : {}}
                    className={cn(
                      'relative overflow-hidden rounded-2xl py-3 px-2 text-center border-t-2 transition-all duration-300',
                      s.bgDefault,
                      s.borderColor,
                      isActive ? 'ring-2 ring-inset ring-black/10 dark:ring-white/15 z-10' : 'hover:brightness-95 dark:hover:brightness-110'
                    )}
                  >
                    <div className="relative z-10">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={counts[s.key]}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          className={cn(s.fgClass, 'text-[27px] font-heading font-black tabular-nums leading-none block mb-1 tracking-tighter')}
                        >
                          {counts[s.key] || 0}
                        </motion.span>
                      </AnimatePresence>
                      <span className={cn(s.fgClass, 'text-[8px] font-black uppercase tracking-[0.14em] opacity-70 leading-none')}>
                        {s.label}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ════ ATENCIÓN ════ */}
        <AnimatePresence>
          {atencionContacts.length > 0 && (
            <motion.button
              key="atencion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowAtencion(s => !s); setActiveFilter(null); }}
              className={cn(
                'w-full flex items-center justify-between mb-5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 border',
                showAtencion
                  ? 'bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/25'
                  : 'bg-destructive/[0.06] text-destructive border-destructive/15 hover:bg-destructive/[0.1]'
              )}
            >
              <span className="flex items-center gap-2.5">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                >
                  <AlertTriangle className="w-4 h-4" />
                </motion.div>
                Requieren atención
              </span>
              <span className={cn(
                'text-xs font-black px-2.5 py-1 rounded-full min-w-[26px] text-center tabular-nums',
                showAtencion ? 'bg-white/25' : 'bg-destructive text-destructive-foreground'
              )}>
                {atencionContacts.length}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ════ FILTROS ════ */}
        <motion.div variants={section} className="space-y-2.5 mb-5">
          {/* Pills row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">

            {/* Tipo */}
            <div className="flex gap-1.5 flex-shrink-0">
              {(['todos', 'Cliente', 'Partner'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipoFilter(tipoFilter === t ? 'todos' : t)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-[11px] font-black transition-all duration-200 whitespace-nowrap',
                    tipoFilter === t
                      ? 'bg-[#002B49] dark:bg-primary text-white shadow-md shadow-[#002B49]/20 dark:shadow-primary/20'
                      : 'bg-card/60 border border-border/40 dark:border-white/[0.07] text-muted-foreground hover:bg-card'
                  )}
                >
                  {t === 'todos' ? 'Todos' : t === 'Cliente' ? 'Clientes' : 'Partners'}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-border/50 flex-shrink-0" />

            {/* Prioridad */}
            <div className="flex gap-1.5 flex-shrink-0">
              {(['alta', 'media', 'baja'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPrioridadFilter(prev => prev === p ? null : p)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black transition-all duration-200 whitespace-nowrap',
                    prioridadFilter === p
                      ? 'bg-[#002B49] dark:bg-primary text-white shadow-md shadow-[#002B49]/20'
                      : 'bg-card/60 border border-border/40 dark:border-white/[0.07] text-muted-foreground hover:bg-card'
                  )}
                >
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    p === 'alta'  ? 'bg-rose-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]' :
                    p === 'media' ? 'bg-amber-500' : 'bg-slate-400'
                  )} />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Equipo toggle (solo roles elevados) */}
            {isElevated && (
              <div className="flex items-center gap-2 px-3 py-2 bg-card/60 border border-border/40 dark:border-white/[0.07] rounded-xl whitespace-nowrap ml-auto flex-shrink-0">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Equipo</span>
                <Switch checked={showTeam} onCheckedChange={setShowTeam} className="scale-[0.72] -my-1" />
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors duration-200 group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Buscar empresa o contacto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card/60 dark:bg-white/[0.04] backdrop-blur-sm rounded-2xl text-[13px] font-medium border border-border/40 dark:border-white/[0.07] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/25 transition-all duration-200 text-foreground"
            />
          </div>
        </motion.div>

        {/* ════ CONTACT LIST ════ */}
        <motion.div variants={section} className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card/40 rounded-3xl border border-border/30 overflow-hidden">
                  <div className="animate-pulse p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="h-4 bg-muted/50 rounded-full w-2/5" />
                      <div className="h-5 bg-muted/40 rounded-full w-1/5" />
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full w-1/3" />
                    <div className="h-3 bg-muted/20 rounded-full w-3/4" />
                  </div>
                </div>
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="text-center py-16 px-8"
                >
                  <div className="w-14 h-14 bg-muted/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-base font-heading font-black mb-1.5 tracking-tight text-foreground">
                    Sin resultados
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No hay contactos en <span className="font-bold capitalize">{activePipeline}</span> con los filtros aplicados.
                  </p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

      </motion.div>

      {/* ════ DRAWERS ════ */}

      <AddClientDrawer open={addOpen} onOpenChange={setAddOpen} />
    </AppLayout>
  );
};

export default Index;
