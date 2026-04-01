import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAllActivities, useCreateActivity } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/contacts/StatusBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Search, ArrowRight, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Activity } from '@/types';

const activityIcons: Record<string, string> = {
  nota: '📝', llamada: '📞', email: '✉️', whatsapp: '💬', reunion: '🤝', estado: '🔄',
};

const TIPOS = [
  { key: 'todos',   label: 'Todas' },
  { key: 'reunion', label: '🤝 Reuniones' },
  { key: 'llamada', label: '📞 Llamadas' },
  { key: 'nota',    label: '📝 Notas' },
  { key: 'estado',  label: '🔄 Cambios' },
] as const;

const PERIODOS = [
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes',    label: 'Este mes' },
  { key: 'todo',   label: 'Todo' },
] as const;

type TipoKey = typeof TIPOS[number]['key'];
type PeriodoKey = typeof PERIODOS[number]['key'];

interface GroupedClient {
  contactId: string;
  contactName: string;
  companyName: string;
  status: string;
  lastActivityAt: string;
  activities: Activity[];
}

import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

/* ── QuickNote inline por grupo ── */
const QuickNote = ({ contactId }: { contactId: string }) => {
  const [text, setText] = useState('');
  const { profile } = useAuth();
  const createActivity = useCreateActivity();

  const handleSend = async () => {
    if (!text.trim() || !profile) return;
    try {
      await createActivity.mutateAsync({
        contact_id: contactId,
        type: 'nota',
        content: text.trim(),
        created_by: profile.id,
      });
      setText('');
      toast({ title: '📝 Nota guardada' });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
        placeholder="Añadir nota rápida..."
        className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50"
      />
      <VoiceInputButton 
        size="sm"
        onTranscript={(t) => setText(prev => prev ? `${prev} ${t}` : t)}
        className="h-9 w-9 shrink-0"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || createActivity.isPending}
        className="p-2 h-9 w-9 flex items-center justify-center bg-primary text-primary-foreground rounded-xl disabled:opacity-40 active:scale-95 transition-all shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ── Main ── */
const NotesPage = () => {
  const navigate = useNavigate();
  const { data: allActivities = [], isLoading } = useAllActivities();
  const [search, setSearch]       = useState('');
  const [tipoFilter, setTipoFilter]     = useState<TipoKey>('todos');
  const [periodoFilter, setPeriodoFilter] = useState<PeriodoKey>('todo');
  const [activeTab, setActiveTab] = useState<'clientes' | 'feed'>('clientes');
  const [openIds, setOpenIds]     = useState<Set<string>>(new Set());

  /* ── Filtro por período ── */
  const cutoff = useMemo(() => {
    const now = new Date();
    if (periodoFilter === 'semana') {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString();
    }
    if (periodoFilter === 'mes') {
      const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString();
    }
    return null;
  }, [periodoFilter]);

  /* ── Actividades filtradas ── */
  const filteredActivities = useMemo(() => {
    let acts = allActivities;
    if (cutoff) acts = acts.filter(a => a.created_at >= cutoff);
    if (tipoFilter !== 'todos') acts = acts.filter(a => a.type === tipoFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      acts = acts.filter(a =>
        a.contact?.company?.name?.toLowerCase().includes(q) ||
        `${a.contact?.first_name} ${a.contact?.last_name}`.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q)
      );
    }
    return acts;
  }, [allActivities, cutoff, tipoFilter, search]);

  /* ── Vista agrupada ── */
  const grouped = useMemo(() => {
    const map = new Map<string, GroupedClient>();
    for (const a of filteredActivities) {
      const cId = a.contact_id || 'unknown';
      if (!map.has(cId)) {
        map.set(cId, {
          contactId: cId,
          contactName: a.contact ? `${a.contact.first_name} ${a.contact.last_name}` : 'Desconocido',
          companyName: a.contact?.company?.name || 'Sin empresa',
          status: a.contact?.status || 'nuevo',
          lastActivityAt: a.created_at,
          activities: [],
        });
      }
      map.get(cId)!.activities.push(a);
    }
    return Array.from(map.values()).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  }, [filteredActivities]);

  const toggleOpen = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const daysSince = (dateStr: string) => {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (d === 0) return 'hoy';
    if (d === 1) return 'ayer';
    return `hace ${d} días`;
  };

  /* ── Feed: agrupar por día ── */
  const feedByDay = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    for (const a of filteredActivities) {
      const day = new Date(a.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!groups[day]) groups[day] = [];
      groups[day].push(a);
    }
    return Object.entries(groups);
  }, [filteredActivities]);

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${active
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'bg-card/60 border border-border text-muted-foreground'}`;

  return (
    <AppLayout>
      <div className="px-4 pt-5">
        {/* ─── Header ─── */}
        <div className="mb-5">
          <h1 className="text-3xl font-heading font-black text-foreground mb-0.5">Notas</h1>
          <p className="text-muted-foreground text-sm">{filteredActivities.length} actividades</p>
        </div>

        {/* ─── Buscador ─── */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar empresa, contacto o contenido..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 glass rounded-2xl text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* ─── Filtro tipo ─── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none">
          {TIPOS.map(t => (
            <button key={t.key} onClick={() => setTipoFilter(t.key)} className={chipClass(tipoFilter === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── Filtro período + tabs ─── */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex gap-1.5 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
            {PERIODOS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodoFilter(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${periodoFilter === p.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
            {(['clientes', 'feed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${activeTab === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'clientes' ? '👤' : '📋'} {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Contenido ─── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >

              {/* ══ TAB: POR CLIENTE ══ */}
              {activeTab === 'clientes' && (
                <div className="space-y-3 pb-4">
                  {grouped.map(group => (
                    <Collapsible
                      key={group.contactId}
                      open={openIds.has(group.contactId)}
                      onOpenChange={() => toggleOpen(group.contactId)}
                    >
                      <div className="glass rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2 p-4">
                          <CollapsibleTrigger className="flex-1 min-w-0 text-left">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-heading font-bold text-sm text-foreground truncate">{group.companyName}</p>
                                <p className="text-xs text-muted-foreground truncate">{group.contactName}</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                  {group.activities.length} actividades · última {daysSince(group.lastActivityAt)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <StatusBadge status={group.status as any} />
                                {openIds.has(group.contactId)
                                  ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
                                  : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/contact/${group.contactId}`); }}
                            className="shrink-0 p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-primary-foreground transition-all"
                            title="Ir a la ficha"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <CollapsibleContent>
                          <div className="mx-4 mb-4 border-l-2 border-primary/20 pl-4 space-y-3">
                            {group.activities.map((a: Activity) => {
                              const highlight = search.trim() && a.content?.toLowerCase().includes(search.toLowerCase());
                              return (
                                <div key={a.id} className={`flex items-start gap-3 p-2 rounded-xl transition-colors ${highlight ? 'bg-primary/5 border border-primary/20' : ''}`}>
                                  <span className="text-base mt-0.5 shrink-0">{activityIcons[a.type || 'nota'] || '📌'}</span>
                                  <div className="flex-1 min-w-0">
                                    {a.type === 'estado' ? (
                                      <p className="text-sm text-foreground">
                                        {a.old_value} → <span className="font-bold">{a.new_value}</span>
                                        {a.content && <span className="text-muted-foreground"> · {a.content}</span>}
                                      </p>
                                    ) : (
                                      <p className="text-sm text-foreground leading-relaxed">{a.content}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {a.created_by_profile?.name} · {new Date(a.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            <QuickNote contactId={group.contactId} />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                  {grouped.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      {search ? 'Sin resultados para esa búsqueda.' : 'Sin actividad en este período.'}
                    </p>
                  )}
                </div>
              )}

              {/* ══ TAB: FEED ══ */}
              {activeTab === 'feed' && (
                <div className="space-y-6 pb-4">
                  {feedByDay.map(([day, acts]) => (
                    <div key={day}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 capitalize">{day}</p>
                      <div className="space-y-2">
                        {acts.map((a: Activity) => (
                          <motion.div
                            key={a.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass rounded-2xl p-3 flex items-start gap-3 cursor-pointer hover:bg-card/80 transition-colors"
                            onClick={() => navigate(`/contact/${a.contact_id}`)}
                          >
                            <span className="text-base shrink-0 mt-0.5">{activityIcons[a.type || 'nota'] || '📌'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-xs font-bold text-foreground truncate">
                                  {a.contact?.company?.name || `${a.contact?.first_name} ${a.contact?.last_name}`}
                                </p>
                                {a.contact?.status && <StatusBadge status={a.contact.status} />}
                              </div>
                              {a.type === 'estado' ? (
                                <p className="text-xs text-muted-foreground">
                                  {a.old_value} → <span className="font-bold text-foreground">{a.new_value}</span>
                                  {a.content && ` · ${a.content}`}
                                </p>
                              ) : (
                                <p className="text-xs text-foreground/80 line-clamp-2">{a.content}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground/60 mt-1">
                                {a.created_by_profile?.name} · {new Date(a.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {feedByDay.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      {search ? 'Sin resultados para esa búsqueda.' : 'Sin actividad en este período.'}
                    </p>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  );
};

export default NotesPage;
