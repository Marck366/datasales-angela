import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useContacts } from '@/hooks/useContacts';
import { useAllActivities } from '@/hooks/useActivities';
import { ContactCard } from '@/components/contacts/ContactCard';
import { StatusBadge } from '@/components/contacts/StatusBadge';
import { TipoBadge } from '@/components/contacts/TipoBadge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Contact, PipelineType, Activity } from '@/types';
import {
  Calendar, AlertCircle, ChevronDown, ChevronUp,
  Search, Users, Video, Phone as PhoneIcon, Monitor, Building2, Target,
  Sun, TrendingUp, LayoutGrid, Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ── RPC hooks ── */
interface RankingEntry {
  id: string; name: string; email: string; role: string;
  avatar_color: string; total: number; cerrados: number;
  agendados: number; valor: number;
}

const useDashboardRanking = () =>
  useQuery({
    queryKey: ['dashboard_ranking'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_ranking');
      if (error) throw error;
      return data as unknown as RankingEntry[];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

/* ── Helpers ── */
const meetingTypeIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  presencial: { icon: <Building2 className="w-4 h-4" />, label: 'Presencial' },
  telematica: { icon: <Monitor className="w-4 h-4" />, label: 'Telemática' },
  llamada: { icon: <PhoneIcon className="w-4 h-4" />, label: 'Llamada' },
  videoconferencia: { icon: <Video className="w-4 h-4" />, label: 'Videoconf.' },
};

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const toDateStr = (d: Date) => d.toISOString().split('T')[0];
const getEndOfWeek = (d: Date) => {
  const end = new Date(d);
  end.setDate(end.getDate() + (7 - end.getDay()));
  return end;
};

type SortKey = 'empresa' | 'tipo' | 'contacto' | 'responsable' | 'semana' | 'estado' | 'seguimiento';
type SortDir = 'asc' | 'desc';

/* ── Sub-components ── */
const MeetingRow = ({ c }: { c: Contact }) => {
  const mt = meetingTypeIcons[c.meeting_type || ''] || meetingTypeIcons.llamada;
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-background/50 dark:bg-white/5 rounded-2xl border border-border/50 shadow-sm transition-all hover:bg-white/10">
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sky shrink-0 border border-border">
        {mt.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-black text-sm text-foreground truncate tracking-tight">{c.company?.name}</p>
        <p className="text-xs text-muted-foreground font-medium truncate">{c.first_name} {c.last_name} · {mt.label}</p>
      </div>
      <p className="text-[10px] font-black text-sky uppercase tracking-widest shrink-0">{c.assigned_profile?.name?.split(' ')[0]}</p>
    </div>
  );
};

/* ── Main ── */
const DashboardPage = () => {
  const [activePipeline, setActivePipeline] = useState<PipelineType>('captura');
  const { data: ranking = [] } = useDashboardRanking();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: activities = [] } = useAllActivities();

  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Tab: Hoy — state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>('todos');

  // Tab: Equipo — state
  const [expandedCommercial, setExpandedCommercial] = useState<string | null>(null);
  const [allClientsOpen, setAllClientsOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableTipoFilter, setTableTipoFilter] = useState<string>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('empresa');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── Derived data (Pipeline-aware) ── */
  const pipelineContacts = useMemo(() => contacts.filter(c => c.pipeline === activePipeline), [contacts, activePipeline]);
  
  const stats = useMemo(() => {
    return {
      total: pipelineContacts.length,
      nuevo: pipelineContacts.filter(c => c.status === 'nuevo' || c.status === 'propuesta_solicitada').length,
      agendado: pipelineContacts.filter(c => c.status === 'agendado' || c.status === 'propuesta_entregada').length,
      pendiente_propuesta: pipelineContacts.filter(c => c.status === 'pendiente_propuesta' || c.status === 'aceptada').length,
      propuesta_mandada: pipelineContacts.filter(c => c.status === 'propuesta_mandada' || c.status === 'prevision_cierre').length,
      cerrado: pipelineContacts.filter(c => c.status === 'cerrado').length,
      perdido: pipelineContacts.filter(c => c.status === 'perdido' || c.status === 'rechazada').length,
    };
  }, [pipelineContacts]);

  const today = toDateStr(new Date());
  const endOfWeek = toDateStr(getEndOfWeek(new Date()));
  const total = stats.total;
  const conversionRate = total > 0 ? ((stats.cerrado / total) * 100).toFixed(1) : '0';

  const pipelineValor = useMemo(() => {
    const map: Record<string, number> = {};
    pipelineContacts.forEach(c => {
      if (c.valor_potencial) map[c.status] = (map[c.status] ?? 0) + c.valor_potencial;
    });
    return map;
  }, [pipelineContacts]);

  const activePipelineValue = useMemo(() => {
    if (activePipeline === 'captura') {
      return (pipelineValor['nuevo'] ?? 0) + (pipelineValor['agendado'] ?? 0) + (pipelineValor['pendiente_propuesta'] ?? 0) + (pipelineValor['propuesta_mandada'] ?? 0);
    } else {
      return (pipelineValor['propuesta_solicitada'] ?? 0) + (pipelineValor['propuesta_entregada'] ?? 0) + (pipelineValor['prevision_cierre'] ?? 0);
    }
  }, [pipelineValor, activePipeline]);

  const forecastPonderado = useMemo(() => {
    const defaultProb: Record<string, number> = { 
      nuevo: 10, agendado: 40, pendiente_propuesta: 60, propuesta_mandada: 75, cerrado: 100, perdido: 0,
      propuesta_solicitada: 40, propuesta_entregada: 70, aceptada: 100, prevision_cierre: 90, rechazada: 0
    };
    return pipelineContacts
      .filter(c => !['cerrado', 'perdido', 'aceptada', 'rechazada'].includes(c.status) && c.valor_potencial)
      .reduce((sum, c) => {
        const prob = c.probabilidad_cierre ?? defaultProb[c.status] ?? 10;
        return sum + (c.valor_potencial! * prob) / 100;
      }, 0);
  }, [pipelineContacts]);

  const fmtValor = (v: number) => {
    if (!v) return '—';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M €`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}k €`;
    return `${v.toLocaleString('es-ES')} €`;
  };

  const tipoCounts = useMemo(() => ({
    clientes: pipelineContacts.filter(c => c.tipo === 'Cliente').length,
    partners: pipelineContacts.filter(c => c.tipo === 'Partner').length,
  }), [pipelineContacts]);

  const kpis = useMemo(() => {
    const isCaptura = activePipeline === 'captura';
    if (isCaptura) {
      return [
        { key: 'nuevo', label: 'Nuevos', value: stats.nuevo, fg: 'text-sky-700 dark:text-sky-400', gradient: 'from-sky-500/20 to-transparent', filter: 'nuevo' },
        { key: 'agendado', label: 'Agendados', value: stats.agendado, fg: 'text-orange-700 dark:text-orange-400', gradient: 'from-orange-500/20 to-transparent', filter: 'agendado' },
        { key: 'pendiente_propuesta', label: 'P. Propuesta', value: stats.pendiente_propuesta, fg: 'text-blue-700 dark:text-blue-400', gradient: 'from-blue-500/20 to-transparent', filter: 'pendiente_propuesta' },
        { key: 'propuesta_mandada', label: 'P. Mandada', value: stats.propuesta_mandada, fg: 'text-indigo-700 dark:text-indigo-400', gradient: 'from-sky-500/20 to-transparent', filter: 'propuesta_mandada' },
        { key: 'cerrado', label: 'Cerrados', value: stats.cerrado, fg: 'text-emerald-700 dark:text-emerald-400', gradient: 'from-emerald-500/20 to-transparent', filter: 'cerrado' },
        { key: 'perdido', label: 'Perdidos', value: stats.perdido, fg: 'text-rose-700 dark:text-rose-400', gradient: 'from-rose-500/20 to-transparent', filter: 'perdido' },
      ];
    } else {
      return [
        { key: 'propuesta_solicitada', label: 'P. Solicitada', value: stats.nuevo, fg: 'text-sky-700 dark:text-sky-400', gradient: 'from-sky-500/20 to-transparent', filter: 'propuesta_solicitada' },
        { key: 'propuesta_entregada', label: 'P. Entregada', value: stats.agendado, fg: 'text-orange-700 dark:text-orange-400', gradient: 'from-orange-500/20 to-transparent', filter: 'propuesta_entregada' },
        { key: 'aceptada', label: 'Aceptadas', value: stats.pendiente_propuesta, fg: 'text-emerald-700 dark:text-emerald-400', gradient: 'from-emerald-500/20 to-transparent', filter: 'aceptada' },
        { key: 'prevision_cierre', label: 'Previsión', value: stats.propuesta_mandada, fg: 'text-sky-700 dark:text-sky-400', gradient: 'from-sky-500/20 to-transparent', filter: 'prevision_cierre' },
        { key: 'rechazada', label: 'Rechazadas', value: stats.perdido, fg: 'text-rose-700 dark:text-rose-400', gradient: 'from-rose-500/20 to-transparent', filter: 'rechazada' },
      ];
    }
  }, [stats, activePipeline]);

  const filteredContacts = useMemo(() => {
    if (!activeFilter) return [];
    let list = activeFilter === 'total' ? pipelineContacts : pipelineContacts.filter(c => c.status === activeFilter);
    if (tipoFilter === 'Cliente') list = list.filter(c => c.tipo === 'Cliente');
    if (tipoFilter === 'Partner') list = list.filter(c => c.tipo === 'Partner');
    return list;
  }, [activeFilter, pipelineContacts, tipoFilter]);

  const meetingsToday = useMemo(() => pipelineContacts.filter(c => c.scheduled_date === today), [pipelineContacts, today]);
  const meetingsThisWeek = useMemo(
    () => pipelineContacts.filter(c => c.scheduled_date && c.scheduled_date > today && c.scheduled_date <= endOfWeek),
    [pipelineContacts, today, endOfWeek]
  );
  
  const weekByDay = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    meetingsThisWeek.forEach(c => {
      const dayName = dayNames[new Date(c.scheduled_date! + 'T12:00:00').getDay()];
      if (!groups[dayName]) groups[dayName] = [];
      groups[dayName].push(c);
    });
    return groups;
  }, [meetingsThisWeek]);

  const pendingContacts = useMemo(() => {
    const results: { contact: Contact; reason: string; urgencyScore: number }[] = [];
    pipelineContacts.forEach(c => {
      if (c.seguimiento_date && c.seguimiento_date <= today) {
        const d = Math.floor((Date.now() - new Date(c.seguimiento_date + 'T00:00:00').getTime()) / 86400000);
        results.push({ contact: c, reason: `Seguimiento vencido (${d}d)`, urgencyScore: 100 + d });
      }
      if (c.status === 'agendado' && c.scheduled_date && c.scheduled_date < today) {
        const d = Math.floor((Date.now() - new Date(c.scheduled_date + 'T00:00:00').getTime()) / 86400000);
        results.push({ contact: c, reason: `Reunión pasada sin cerrar (${d}d)`, urgencyScore: 90 + d });
      }
      if (c.status === 'nuevo' || c.status === 'propuesta_solicitada') {
        const acts = (activities as Activity[]).filter(a => a.contact_id === c.id);
        const latest = acts.length > 0 ? [...acts].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at : c.created_at;
        const d = Math.floor((Date.now() - new Date(latest).getTime()) / 86400000);
        if (d >= 7) results.push({ contact: c, reason: `Sin contacto hace ${d} días`, urgencyScore: 50 + d });
      }
    });

    const map = new Map<string, typeof results[0]>();
    results.forEach(r => {
      const ex = map.get(r.contact.id);
      if (!ex || r.urgencyScore > ex.urgencyScore) map.set(r.contact.id, r);
    });
    return Array.from(map.values()).sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [pipelineContacts, activities, today]);

  const funnelStages = [
    { label: 'Nuevos',    count: stats?.nuevo    ?? 0, color: 'bg-[#002B49]', valor: pipelineValor['nuevo']    ?? 0 },
    { label: 'Agendados', count: stats?.agendado ?? 0, color: 'bg-[#005A92]', valor: pipelineValor['agendado'] ?? 0 },
    { label: 'Cerrados',  count: stats?.cerrado  ?? 0, color: 'bg-emerald-600', valor: pipelineValor['cerrado']  ?? 0 },
    { label: 'Perdidos',  count: stats?.perdido  ?? 0, color: 'bg-rose-600', valor: pipelineValor['perdido']  ?? 0 },
  ];
  const maxFunnel = Math.max(...funnelStages.map(s => s.count), 1);

  const campaignSegments = useMemo(() => {
    const lastByContact: Record<string, string> = {};
    (activities as Activity[]).forEach(a => {
      if (a.type && ['llamada', 'email', 'whatsapp', 'reunion'].includes(a.type) && (!lastByContact[a.contact_id] || new Date(a.created_at) > new Date(lastByContact[a.contact_id])))
        lastByContact[a.contact_id] = a.created_at;
    });
    const daysSince = (id: string) => {
      const last = lastByContact[id];
      return last ? Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000) : 999;
    };
    return {
      llamarHoy: pipelineContacts.filter(c => c.seguimiento_date && c.seguimiento_date <= today && !['cerrado', 'perdido', 'pospuesto'].includes(c.status)),
      frios: pipelineContacts.filter(c => daysSince(c.id) >= 14 && c.status === 'nuevo').sort((a, b) => daysSince(b.id) - daysSince(a.id)),
      altaEstancados: pipelineContacts.filter(c => c.prioridad === 'alta' && ['nuevo', 'agendado'].includes(c.status)),
      winback: pipelineContacts.filter(c => c.status === 'perdido' && daysSince(c.id) <= 90),
    };
  }, [pipelineContacts, activities, today]);

  const perdidoMotivos = useMemo(() => {
    const counts: Record<string, number> = {};
    (activities as Activity[])
      .filter(a => a.type === 'estado' && a.new_value === 'perdido')
      .forEach(a => {
        const motivo = a.content ? a.content.split(' · ')[0].trim() : 'Sin registrar';
        counts[motivo] = (counts[motivo] ?? 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activities]);

  const contactsByCommercial = useMemo(() => {
    const map: Record<string, Contact[]> = {};
    contacts.forEach(c => {
      const key = c.assigned_to || 'unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [contacts]);

  const sortedTableContacts = useMemo(() => {
    let list = contacts;
    if (tableTipoFilter === 'Cliente') list = list.filter(c => c.tipo === 'Cliente');
    if (tableTipoFilter === 'Partner') list = list.filter(c => c.tipo === 'Partner');
    if (tableSearch) {
      const q = tableSearch.trim().toLowerCase();
      list = list.filter(c =>
        (c.company?.name || '').toLowerCase().includes(q) ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.assigned_profile?.name || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let va = '', vb = '';
      if (sortKey === 'empresa')      { va = a.company?.name || '';                        vb = b.company?.name || ''; }
      else if (sortKey === 'tipo')    { va = a.tipo;                                        vb = b.tipo; }
      else if (sortKey === 'contacto'){ va = `${a.first_name} ${a.last_name}`;             vb = `${b.first_name} ${b.last_name}`; }
      else if (sortKey === 'responsable') { va = a.assigned_profile?.name || '';           vb = b.assigned_profile?.name || ''; }
      else if (sortKey === 'semana')  { va = a.semana || '';                                vb = b.semana || ''; }
      else if (sortKey === 'estado')  { va = a.status;                                     vb = b.status; }
      else if (sortKey === 'seguimiento') { va = a.seguimiento_date || '9999-99-99';               vb = b.seguimiento_date || '9999-99-99'; }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [contacts, tableSearch, sortKey, sortDir, tableTipoFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#002B49]/40 cursor-pointer hover:text-[#002B49] transition-colors whitespace-nowrap"
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {sortKey === k && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );

  const tabs = [
    { label: 'Hoy', icon: <Sun className="w-3.5 h-3.5" />, badge: pendingContacts.length },
    { label: 'Pipeline', icon: <TrendingUp className="w-3.5 h-3.5" />, badge: 0 },
    { label: 'Equipo', icon: <Users className="w-3.5 h-3.5" />, badge: 0 },
  ];

  return (
    <AppLayout>
      <div className="relative z-10 w-full min-h-screen bg-background pb-20">
        {/* ─── Header ─── */}
        <div className="px-5 pt-8 pb-4">
          <p className="text-sky text-xs font-black uppercase tracking-[0.2em] mb-1">
            {profile?.name?.split(' ')[0] || 'Usuario'}
          </p>
          <h1 className="text-3xl font-heading font-black text-foreground mb-1 tracking-tighter">Centro de Mando</h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">Estrategia y métricas en tiempo real</p>

          {/* ─── Pipeline Switcher ─── */}
          <div className="flex p-1.5 gap-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-sm max-w-sm">
            <button
              onClick={() => { setActivePipeline('captura'); setActiveFilter(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1.5rem] text-xs font-black transition-all duration-500",
                activePipeline === 'captura' 
                  ? "bg-[#002B49] dark:bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-500 dark:text-muted-foreground hover:text-[#002B49] dark:hover:text-foreground hover:bg-slate-200 dark:hover:bg-muted"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              CAPTURA
            </button>
            <button
              onClick={() => { setActivePipeline('cartera'); setActiveFilter(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1.5rem] text-xs font-black transition-all duration-500",
                activePipeline === 'cartera' 
                  ? "bg-[#002B49] dark:bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-500 dark:text-white/60 hover:text-[#002B49] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
              )}
            >
              <Briefcase className="w-4 h-4" />
              CARTERA
            </button>
          </div>
        </div>

        {/* ─── Sticky tab strip ─── */}
        <div className="sticky top-[64px] z-30 bg-background/80 backdrop-blur-2xl border-b border-border px-5 py-3">
          <div className="flex gap-1 bg-card border border-border rounded-2xl p-1 shadow-sm">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {activeTab === i && (
                  <motion.div
                    layoutId="tab-indicator-dash"
                    className="absolute inset-0 bg-muted rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className={cn(
                  "relative z-10 flex items-center gap-2",
                  activeTab === i ? "text-foreground" : "text-muted-foreground"
                )}>
                  {tab.icon}
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center tabular-nums">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Tab content ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-5 pt-6 pb-24 space-y-8"
          >

            {/* ══════════ TAB 0: HOY ══════════ */}
            {activeTab === 0 && (
              <>
                {/* KPI cards */}
                <section className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {kpis.map(k => (
                      <button
                        key={k.key}
                        onClick={() => !contactsLoading && setActiveFilter(f => f === k.filter ? null : k.filter)}
                        className={cn(
                          "relative overflow-hidden glass rounded-[2.5rem] p-5 text-center transition-all duration-500",
                          activeFilter === k.filter
                            ? cn("scale-[1.05] z-20 shadow-2xl ring-2 bg-slate-50 dark:bg-white/10 ring-inset", k.gradient, "ring-slate-200 dark:ring-white/20")
                            : "hover:scale-[1.02] hover:shadow-xl hover:border-slate-200 dark:hover:border-white/20"
                        )}
                      >
                        <span className={cn("text-3xl font-heading font-black tabular-nums block leading-none mb-2 tracking-tighter", k.fg)}>{contactsLoading ? '—' : k.value}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest block text-[#002B49] dark:text-white/90">{k.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => !contactsLoading && setActiveFilter(f => f === 'total' ? null : 'total')}
                    className={cn(
                      "w-full glass rounded-[2.5rem] p-5 text-center transition-all duration-500",
                      activeFilter === 'total'
                        ? "scale-[1.05] z-20 shadow-2xl ring-1 ring-white/20 bg-white/10"
                        : "hover:scale-[1.02] hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total en {activePipeline.toUpperCase()}:</span>
                      <span className="text-xl font-heading font-black text-foreground tabular-nums tracking-tighter">{total}</span>
                    </div>
                  </button>
                </section>

                {/* KPI Drill-down */}
                <AnimatePresence>
                  {activeFilter && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                          Auditando: {activeFilter.toUpperCase().replace('_', ' ')} ({filteredContacts.length})
                        </h3>
                        <div className="flex gap-2">
                          {(['todos', 'Cliente', 'Partner'] as const).map(t => (
                            <button
                              key={t}
                              onClick={() => setTipoFilter(tipoFilter === t ? 'todos' : t)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                tipoFilter === t ? "bg-primary text-white shadow-md" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {t === 'todos' ? 'TODOS' : t.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {filteredContacts.length === 0 
                          ? <p className="text-center py-8 text-muted-foreground font-medium text-sm bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">Sin contactos con estos filtros</p>
                          : filteredContacts.map((c, i) => (
                              <ContactCard 
                                key={c.id} 
                                contact={c} 
                                index={i} 
                                isExpanded={expandedId === c.id}
                                onToggle={() => setExpandedId(prev => prev === c.id ? null : c.id)}
                              />
                            ))
                        }
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Reuniones hoy */}
                <section className="glass rounded-[2.5rem] p-8 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-sky/10 flex items-center justify-center text-sky">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Reuniones de hoy</h2>
                      <p className="text-xl font-heading font-black text-foreground tracking-tighter">{meetingsToday.length} Programadas</p>
                    </div>
                  </div>
                  {meetingsToday.length === 0
                    ? <p className="text-sm text-muted-foreground font-medium py-2 italic">No hay reuniones hoy</p>
                    : <div className="space-y-3">{meetingsToday.map(c => <MeetingRow key={c.id} c={c} />)}</div>
                  }
                </section>

                {/* Esta semana */}
                {Object.keys(weekByDay).length > 0 && (
                  <section className="glass rounded-[2.5rem] p-8 backdrop-blur-md">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 font-bold">Planificación Semanal</h2>
                    <div className="space-y-8">
                      {Object.entries(weekByDay).map(([day, list]) => (
                        <div key={day}>
                          <p className="text-xs font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky" />
                            {day}
                          </p>
                          <div className="space-y-3 pl-4 border-l-2 border-muted">{list.map(c => <MeetingRow key={c.id} c={c} />)}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Pendientes */}
                {pendingContacts.length > 0 && (
                  <section className="glass rounded-[2.5rem] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <AlertCircle className="w-32 h-32 text-rose-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">Atención Crítica</h2>
                        <p className="text-2xl font-heading font-black text-white tracking-tighter">{pendingContacts.length} Pendientes</p>
                      </div>
                    </div>
                    <div className="space-y-3 relative z-10">
                      {pendingContacts.map(({ contact: c, reason }) => (
                        <div key={c.id} className="flex items-center gap-4 py-4 px-5 bg-white/10 backdrop-blur rounded-[1.5rem] border border-white/20 shadow-sm hover:translate-x-1 transition-transform">
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-black text-sm text-white truncate tracking-tight">{c.company?.name}</p>
                            <p className="text-[10px] text-white/50 font-bold truncate opacity-70 uppercase tracking-widest mt-0.5">{c.first_name} {c.last_name}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="w-1 h-1 rounded-full bg-rose-500" />
                              <p className="text-[9px] font-black text-rose-600 uppercase tracking-[0.1em]">{reason}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <StatusBadge status={c.status} />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{c.assigned_profile?.name?.split(' ')[0]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* ══════════ TAB 1: PIPELINE ══════════ */}
            {activeTab === 1 && (
              <>
                {/* Métricas de rendimiento */}
                <div className="glass rounded-[2.5rem] p-8 space-y-8 backdrop-blur-md">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block mb-2">Tasa de Efectividad</span>
                      <span className="text-4xl font-heading font-black text-foreground tabular-nums tracking-tighter">{conversionRate}%</span>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-4">
                        <motion.div
                          className="h-full bg-emerald-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${conversionRate}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block mb-2">Activos en {activePipeline.toUpperCase()}</span>
                      <span className="text-4xl font-heading font-black text-sky tabular-nums tracking-tighter">
                        {fmtValor(activePipelineValue)}
                      </span>
                      <p className="text-[10px] font-black text-sky/40 uppercase tracking-widest mt-2 italic font-bold">Valor potencial bruto</p>
                    </div>
                  </div>

                  {/* Forecast */}
                  <div className="pt-8 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky mb-1.5 block">Cierre Estratégico (Forecast)</span>
                      <span className="text-3xl font-heading font-black text-emerald-600 tabular-nums tracking-tighter">
                        {fmtValor(Math.round(forecastPonderado))}
                      </span>
                    </div>
                    <div className="text-right bg-muted px-5 py-3 rounded-2xl border border-border">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground block mb-1">Ratio de Confianza</span>
                      {activePipelineValue > 0 && (
                        <span className="text-sm font-black text-foreground tabular-nums">
                          {Math.round((forecastPonderado / activePipelineValue) * 100)}% <span className="text-[10px] text-muted-foreground font-bold opacity-60">PONDERADO</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Funnel chart */}
                <div className="glass rounded-[2.5rem] p-8 backdrop-blur-md">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 font-bold">Embudo de Conversión</h3>
                  <div className="space-y-6">
                    {funnelStages.map((s, idx) => (
                      <div key={s.label} className="flex items-center gap-6">
                        <span className="text-[10px] font-black w-24 shrink-0 text-foreground uppercase tracking-widest">{s.label}</span>
                        <div className="flex-1 h-10 bg-muted rounded-2xl overflow-hidden relative border border-border/50">
                          <motion.div
                            className={cn("h-full rounded-2xl flex items-center justify-end pr-4", s.color)}
                            initial={{ width: 0 }}
                            animate={{ width: `${(s.count / (maxFunnel || 1)) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                          >
                            <span className="text-[10px] font-black text-white tabular-nums tracking-widest">{s.count}</span>
                          </motion.div>
                        </div>
                        <span className="text-sm font-black tabular-nums text-muted-foreground w-24 text-right shrink-0">
                          {fmtValor(s.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Segments grid */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Target className="w-4 h-4 text-sky" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-bold">Segmentación de Campaña</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: '📞', label: ' ACCIONES HOY', desc: 'SGMOS. CRÍTICOS', list: campaignSegments.llamarHoy, color: 'text-rose-600', bg: 'bg-rose-500/5 border-rose-500/10' },
                      { icon: '🧊', label: 'FRÍOS ESTRATÉGICOS', desc: 'SIN CONTACTO +14D', list: campaignSegments.frios, color: 'text-sky', bg: 'bg-sky/5 border-sky/10' },
                      { icon: '🔥', label: 'PRIORIDAD ALTA', desc: 'IMPACTO INMEDIATO', list: campaignSegments.altaEstancados, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' },
                      { icon: '♻️', label: 'WINBACK', desc: 'REQ. REACTIVACIÓN', list: campaignSegments.winback, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
                    ].filter(s => s.list.length > 0).map(s => (
                      <div key={s.label} className={cn("rounded-[2.5rem] p-6 border shadow-sm transition-all hover:shadow-md", s.bg)}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl">{s.icon}</span>
                          <span className={cn("text-3xl font-heading font-black tabular-nums tracking-tighter", s.color)}>{s.list.length}</span>
                        </div>
                        <p className={cn("text-[9px] font-black uppercase tracking-widest leading-tight", s.color)}>{s.label}</p>
                        <p className="text-[9px] text-white/40 font-bold mt-1 uppercase tracking-widest">{s.desc}</p>
                        <div className="space-y-1 mt-4 pt-4 border-t border-border">
                          {s.list.slice(0, 2).map(c => (
                            <p key={c.id} className="text-[9px] text-foreground font-black truncate uppercase opacity-50">
                              {c.company?.name || `${c.first_name}`}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Motivos de pérdida premium */}
                {perdidoMotivos.length > 0 && (
                  <div className="glass rounded-[2.5rem] p-8 backdrop-blur-md">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-8 font-bold">Análisis de Descartes</h3>
                    <div className="space-y-5">
                      {perdidoMotivos.map(([motivo, count]) => {
                        const pct = Math.round((count / (stats?.perdido || 1)) * 100);
                        return (
                          <div key={motivo} className="flex items-center gap-5">
                            <span className="text-[10px] font-black w-28 shrink-0 text-white/40 uppercase truncate">{motivo}</span>
                            <div className="flex-1 h-6 bg-white/5 rounded-xl overflow-hidden border border-white/10">
                              <motion.div
                                className="h-full bg-rose-500/20 rounded-xl flex items-center justify-end pr-3 border border-rose-500/10"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              >
                                <span className="text-[9px] font-black text-rose-400 tabular-nums">{count}</span>
                              </motion.div>
                            </div>
                            <span className="text-[10px] font-black text-white/20 w-10 text-right shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══════════ TAB 2: EQUIPO ══════════ */}
            {activeTab === 2 && (
              <>
                {/* Ranking Institucional */}
                <div className="glass rounded-[2.5rem] p-8 border border-border/50 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-sky/10 flex items-center justify-center text-sky shadow-sm">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground font-bold">Performance Audit</h3>
                      <p className="text-2xl font-heading font-black text-foreground tracking-tighter">Liderazgo Comercial</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {ranking.map((p, i) => {
                      const isExpanded = expandedCommercial === p.id;
                      const theirContacts = (contactsByCommercial[p.id] || []).slice(0, 5);
                      return (
                        <div key={p.id}>
                          <button
                            onClick={() => setExpandedCommercial(isExpanded ? null : p.id)}
                            className={cn(
                              "w-full flex items-center gap-6 py-5 px-6 rounded-[2rem] transition-all duration-500 border",
                              isExpanded ? "bg-white/10 border-white/20 shadow-inner translate-x-1" : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                          >
                            <span className="text-xl font-heading font-black text-white/10 w-8 tabular-nums italic">0{i + 1}</span>
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-xl" style={{ backgroundColor: `#${p.avatar_color}` }}>
                              {p.name[0]}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-heading font-black text-lg text-white truncate tracking-tight leading-tight">{p.name}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{p.total} ASIGNADOS</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[9px] font-black text-sky uppercase tracking-widest">{fmtValor(p.valor)}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-3xl font-heading font-black text-emerald-400 tabular-nums tracking-tighter block">{p.cerrados}</span>
                              <span className="text-[8px] text-emerald-400/60 font-black uppercase tracking-[0.2em]">Cierres</span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-white/20" /> : <ChevronDown className="w-5 h-5 text-white/20" />}
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden bg-white/5 rounded-b-[2.5rem] border-x border-b border-white/10 mb-4"
                              >
                                <div className="p-8 space-y-3">
                                  {theirContacts.length === 0
                                    ? <p className="text-[9px] font-black text-white/20 uppercase text-center py-6 border border-dashed border-white/10 rounded-3xl">Pestaña estratégica vacía</p>
                                    : theirContacts.map(c => (
                                        <div key={c.id} className="flex items-center gap-5 py-4 px-6 bg-white/5 rounded-[1.5rem] border border-white/10 shadow-sm transition-transform hover:scale-[1.01]">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{c.company?.name}</p>
                                            <p className="text-[9px] text-white/40 font-bold truncate italic mt-0.5">{c.first_name} {c.last_name}</p>
                                          </div>
                                          <StatusBadge status={c.status} />
                                        </div>
                                      ))
                                  }
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Auditoría Global Expandible */}
                <div className="glass rounded-[2.5rem] overflow-hidden border-border/50 shadow-sm backdrop-blur-md bg-card/70 dark:bg-card/40">
                  <button
                    onClick={() => setAllClientsOpen(o => !o)}
                    className="w-full flex items-center justify-between p-8 hover:bg-white/10 transition-all duration-500 text-left"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-foreground shadow-sm">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-bold">Inventario Maestro</h3>
                        <p className="text-2xl font-heading font-black text-foreground tracking-tighter">Explorador Global <span className="text-muted-foreground ml-2">({contacts.length})</span></p>
                      </div>
                    </div>
                    {allClientsOpen ? <ChevronUp className="w-6 h-6 text-foreground/20" /> : <ChevronDown className="w-6 h-6 text-foreground/20" />}
                  </button>
                  <AnimatePresence>
                    {allClientsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-white/5 border-t border-white/10"
                      >
                        <div className="p-8 space-y-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <Input
                                placeholder="Filtrar por empresa, contacto o responsable institucional..."
                                value={tableSearch}
                                onChange={e => setTableSearch(e.target.value)}
                                className="pl-12 h-14 text-sm rounded-[1.5rem] border-slate-100 bg-slate-50/30 focus:ring-[#005A92]/20 focus:border-[#005A92] font-medium"
                              />
                            </div>
                            <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                              {(['todos', 'Cliente', 'Partner'] as const).map(t => (
                                <button
                                  key={t}
                                  onClick={() => setTableTipoFilter(tableTipoFilter === t ? 'todos' : t)}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    tableTipoFilter === t ? "bg-white shadow-sm text-[#002B49]" : "text-slate-400 hover:bg-white/50"
                                  )}
                                >
                                  {t === 'todos' ? 'TOTAL' : t.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="overflow-x-auto -mx-8">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                  <SortHeader k="empresa" label="Institución" />
                                  <SortHeader k="tipo" label="Relación" />
                                  <SortHeader k="contacto" label="Decisor" />
                                  <SortHeader k="responsable" label="Gestor" />
                                  <SortHeader k="semana" label="Iteración" />
                                  <SortHeader k="estado" label="Status" />
                                  <SortHeader k="seguimiento" label="Next Step" />
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {sortedTableContacts.map(c => (
                                  <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-4 font-black text-sm text-[#002B49] truncate max-w-[200px] tracking-tight">{c.company?.name || '—'}</td>
                                    <td className="px-5 py-4"><TipoBadge tipo={c.tipo} /></td>
                                    <td className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-tight">{c.first_name} {c.last_name}</td>
                                    <td className="px-5 py-4 text-[11px] font-bold text-[#005A92] tabular-nums">{c.assigned_profile?.name?.split(' ')[0] || '—'}</td>
                                    <td className="px-5 py-4 text-[11px] font-black text-slate-300 uppercase tracking-widest tabular-nums">{c.semana || '—'}</td>
                                    <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                                    <td className="px-5 py-4 text-[11px] font-black tabular-nums">
                                      {c.seguimiento_date
                                        ? <span className={cn(
                                            "px-2 py-1 rounded-lg border",
                                            c.seguimiento_date <= today ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                          )}>
                                            {new Date(c.seguimiento_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                          </span>
                                        : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
