import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContact, useUpdateContactStatus, useDeleteContact } from '@/hooks/useContacts';
import { useActivities, useCreateActivity } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { DeleteContactDialog } from '@/components/contacts/DeleteContactDialog';
import { PerdidoModal } from '@/components/contacts/PerdidoModal';
import { PospuestoModal } from '@/components/contacts/PospuestoModal';
import { StatusBadge } from '@/components/contacts/StatusBadge';
import { TipoBadge } from '@/components/contacts/TipoBadge';
import { MailSmartDrawer } from '@/components/contacts/MailSmartDrawer';
import { EditContactModal } from '@/components/contacts/EditContactModal';
import { RegistrarContactoModal } from '@/components/contacts/RegistrarContactoModal';
import { AppLayout } from '@/components/layout/AppLayout';
import { Phone, MessageCircle, Mail, ArrowLeft, Linkedin, ChevronDown, ChevronUp, Send, Calendar, Pencil, UserCheck, AlertCircle, Trash2, TrendingUp, Sparkles, Building2, LayoutGrid } from 'lucide-react';
import { getDaysSinceLastContact, getActivitySummary } from '@/lib/scoring';
import { ContactStatus } from '@/types';
import { AgendarModal } from '@/components/contacts/AgendarModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { PrepararReunionDrawer } from '@/components/contacts/PrepararReunionDrawer';
import { cn } from '@/lib/utils';

const statusOptions: Record<string, { label: string; emoji: string }[]> = {
  captura: [
    { label: 'Nuevo', emoji: '🆕' },
    { label: 'Agendado', emoji: '📅' },
    { label: 'P. Propuesta', emoji: '📝' },
    { label: 'P. Mandada', emoji: '📩' },
    { label: 'Aplazado', emoji: '⏸️' },
    { label: 'Perdido', emoji: '❌' },
    { label: 'Cerrado', emoji: '✅' },
  ],
  cartera: [
    { label: 'P. Solicitada', emoji: '🙋‍♂️' },
    { label: 'P. Entregada', emoji: '📄' },
    { label: 'Aceptada', emoji: '🤝' },
    { label: 'Previsión', emoji: '📈' },
    { label: 'Rechazada', emoji: '🚫' },
  ],
};

const labelToKey: Record<string, ContactStatus> = {
  'Nuevo': 'nuevo',
  'Agendado': 'agendado',
  'P. Propuesta': 'pendiente_propuesta',
  'P. Mandada': 'propuesta_mandada',
  'Aplazado': 'aplazado',
  'Perdido': 'perdido',
  'Cerrado': 'cerrado',
  'P. Solicitada': 'propuesta_solicitada',
  'P. Entregada': 'propuesta_entregada',
  'Aceptada': 'aceptada',
  'Previsión': 'prevision_cierre',
  'Rechazada': 'rechazada',
};

const activityIcons: Record<string, string> = {
  nota: '📝', llamada: '📞', email: '✉️', whatsapp: '💬', reunion: '🤝', estado: '🔄',
};

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: contact, isLoading } = useContact(id);
  const { data: activities = [] } = useActivities(id);
  const updateStatus = useUpdateContactStatus();
  const deleteContact = useDeleteContact();
  const createActivity = useCreateActivity();

  const [showDetails, setShowDetails] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [perdidoOpen, setPerdidoOpen] = useState(false);
  const [pospuestoOpen, setPospuestoOpen] = useState(false);
  const [prepareOpen, setPrepareOpen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showHealth, setShowHealth] = useState(false);

  const canDelete = profile?.role === 'admin' || profile?.role === 'jefe_ventas';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-5 space-y-6">
          <div className="h-10 w-24 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-slate-400 font-medium italic">Contacto no localizado en el registro.</div>
      </AppLayout>
    );
  }

  const handleStatusChange = async (newStatus: ContactStatus) => {
    if (newStatus === 'perdido') { setPerdidoOpen(true); return; }
    if (newStatus === 'aplazado') { setPospuestoOpen(true); return; }
    const oldStatus = contact.status;
    try {
      await updateStatus.mutateAsync({ id: contact.id, status: newStatus });
      if (profile) {
        await createActivity.mutateAsync({
          contact_id: contact.id, type: 'estado', old_value: oldStatus, new_value: newStatus, created_by: profile.id,
        });
      }
      toast({ title: `Estatus actualizado: ${newStatus}` });
    } catch {
      toast({ title: 'Error de sincronización', variant: 'destructive' });
    }
  };

  const handlePospuestoConfirm = async (motivo: string, fechaRevision?: string) => {
    const oldStatus = contact.status;
    try {
      await updateStatus.mutateAsync({ id: contact.id, status: 'aplazado', seguimiento_date: fechaRevision });
      if (profile) {
        await createActivity.mutateAsync({
          contact_id: contact.id, type: 'estado', old_value: oldStatus, new_value: 'aplazado',
          content: motivo, created_by: profile.id,
        });
      }
      toast({ title: '⏸️ Movido a "Aplazado"' });
      setPospuestoOpen(false);
    } catch {
      toast({ title: 'Error al cambiar estado', variant: 'destructive' });
    }
  };

  const handlePerdidoConfirm = async (motivo: string, notas: string) => {
    const oldStatus = contact.status;
    const activityContent = notas ? `${motivo} · ${notas}` : motivo;
    try {
      await updateStatus.mutateAsync({ id: contact.id, status: 'perdido', lost_reason: motivo });
      if (profile) {
        await createActivity.mutateAsync({
          contact_id: contact.id, type: 'estado', old_value: oldStatus, new_value: 'perdido',
          content: activityContent, created_by: profile.id,
        });
      }
      toast({ title: '❌ Registrado como perdido' });
      setPerdidoOpen(false);
    } catch {
      toast({ title: 'Error al cambiar estado', variant: 'destructive' });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !profile) return;
    try {
      await createActivity.mutateAsync({ contact_id: contact.id, type: 'nota', content: newNote, created_by: profile.id });
      setNewNote('');
      toast({ title: '📝 Nota estratégica añadida' });
    } catch {
      toast({ title: 'Error al añadir nota', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contact.id);
      toast({ title: 'Registro eliminado con éxito' });
      navigate('/');
    } catch {
      toast({ title: 'Vulnerabilidad de red', variant: 'destructive' });
    }
  };

  const initials = (contact.company?.name || contact.first_name || '').substring(0, 2).toUpperCase();
  const todayStr = new Date().toISOString().split('T')[0];
  const isFollowUpDue = contact.seguimiento_date && contact.seguimiento_date <= todayStr;

  return (
    <AppLayout>
      <div className="relative min-h-screen bg-background pt-8 pb-24 px-5 transition-colors duration-500">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#002B49] transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              VOLVER
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#002B49] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[#002B49]/20 transition-all active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
              EDITAR PERFIL
            </button>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. PERFIL MAESTRO (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <section className="glass rounded-[3rem] p-8 lg:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transition-transform group-hover:scale-110 duration-700">
                  <Building2 className="w-64 h-64 text-[#002B49]" />
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                  <div
                    className="w-24 h-24 lg:w-28 lg:h-28 rounded-[2.5rem] flex items-center justify-center font-heading font-black text-4xl text-white shrink-0 shadow-2xl shadow-blue-200"
                    style={{ backgroundColor: `#${contact.assigned_profile?.avatar_color || '005A92'}` }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h1 className="text-4xl lg:text-5xl font-heading font-black text-[#002B49] dark:text-white tracking-tighter leading-tight truncate drop-shadow-sm">
                         {contact.company?.name || contact.first_name}
                      </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-6">
                      <TipoBadge tipo={contact.tipo || 'Cliente'} />
                      <StatusBadge status={contact.status} />
                    </div>
                    <p className="text-slate-500 dark:text-white/80 font-bold text-lg leading-snug">
                      {contact.first_name} {contact.last_name} 
                      {contact.job_title && <><span className="mx-2 text-[#005A92]/40">/</span> {contact.job_title}</>}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 relative z-10">
                  <a href={`tel:${contact.phone}`} className="flex flex-col items-center justify-center py-6 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 group shadow-sm">
                    <Phone className="w-5 h-5 text-[#002B49] dark:text-white transition-colors mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#002B49] dark:text-white/60">Llamar</span>
                  </a>
                  <a href={`https://wa.me/${contact.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center py-6 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 group shadow-sm">
                    <MessageCircle className="w-5 h-5 text-[#002B49] dark:text-white transition-colors mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#002B49] dark:text-white/60">WhatsApp</span>
                  </a>
                  <button onClick={() => setMailOpen(true)} className="flex flex-col items-center justify-center py-6 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 group shadow-sm">
                    <Mail className="w-5 h-5 text-[#002B49] dark:text-white transition-colors mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#002B49] dark:text-white/60">Email</span>
                  </button>
                  <button onClick={() => setAgendarOpen(true)} className="flex flex-col items-center justify-center py-6 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 group shadow-sm">
                    <Calendar className="w-5 h-5 text-[#002B49] dark:text-white transition-colors mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#002B49] dark:text-white/60">Agenda</span>
                  </button>
                </div>
              </section>

              {/* Trazabilidad Comercial */}
              {(() => {
                const summary = getActivitySummary(activities);
                const daysSince = getDaysSinceLastContact(activities);
                // const score = calcFullScore(contact, activities);
                if (summary.total === 0 && daysSince === null) return null;
                return (
                  <section className="glass rounded-[3rem] p-8 lg:p-10 relative overflow-hidden">
                    <div 
                      onClick={() => setShowHealth(!showHealth)}
                      className="flex items-center justify-between mb-8 relative z-10 cursor-pointer group/header"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[1.25rem] bg-[#005A92]/10 flex items-center justify-center text-[#005A92] group-hover/header:rotate-12 transition-transform">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Auditoría Institucional</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-heading font-black text-[#002B49] dark:text-white tracking-tighter">Estado de Salud Comercial</p>
                            <div className={cn("transition-transform duration-300", showHealth ? "rotate-180" : "")}>
                              <ChevronDown className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-auto">
                        <div className={cn("transition-transform duration-300", showHealth ? "rotate-180" : "")}>
                          <ChevronDown className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {showHealth && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { icon: '📞', count: summary.llamadas, label: 'Llamadas' },
                              { icon: '💬', count: summary.whatsapp, label: 'WhatsApp' },
                              { icon: '📩', count: summary.emails, label: 'Email' },
                              { icon: '🤝', count: summary.reuniones, label: 'Reuniones' },
                            ].map(s => (
                              <div key={s.label} className="bg-card/40 dark:bg-white/5 backdrop-blur-xl border border-border/50 dark:border-white/10 rounded-[2.5rem] p-6 text-center transition-all hover:bg-card/60 dark:hover:bg-white/10 hover:scale-[1.05] hover:shadow-2xl shadow-sm group">
                                <span className="text-3xl block mb-3 drop-shadow-md group-hover:scale-110 transition-transform">{s.icon}</span>
                                <span className="text-4xl font-heading font-black text-[#002B49] dark:text-white tabular-nums mb-1 block tracking-tighter">{s.count}</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#005A92] dark:text-blue-200/60 transition-colors group-hover:text-primary">{s.label}</span>
                              </div>
                            ))}
                          </div>
                          
                          {daysSince !== null && (
                            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-white/5 flex justify-center">
                              <p className={cn(
                                "px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                daysSince > 14 ? "bg-rose-50 text-rose-600 border-rose-100" : 
                                daysSince > 7 ? "bg-orange-50 text-orange-600 border-orange-100" : 
                                "bg-emerald-50 text-emerald-700 border-emerald-100"
                              )}>
                                {daysSince === 0 ? '✨ Interacción registrada hoy' : `🕒 Silencio comercial: ${daysSince} días`}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })()}
            </div>

            {/* 2. BARRA ESTRATÉGICA (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Acciones Críticas */}
              <section className="glass rounded-[2.5rem] p-8 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40 font-bold mb-6">Operaciones</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRegistrarOpen(true)}
                    className="col-span-2 h-16 flex items-center justify-center gap-3 bg-[#002B49] dark:bg-white text-white dark:text-[#002B49] font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-[#002B49]/20 hover:-translate-y-1 transition-all active:scale-95"
                  >
                    <UserCheck className="w-5 h-5" />
                    REGISTRAR ACTIVIDAD
                  </button>
                  
                  <button
                    onClick={() => setPrepareOpen(true)}
                    className="h-28 flex flex-col items-center justify-center gap-3 bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-white/10 border border-slate-100 dark:border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-[#002B49] dark:text-white transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    RESUMEN CLIENTE
                  </button>

                  <button
                    className="h-28 flex flex-col items-center justify-center gap-3 bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-white/10 border border-slate-100 dark:border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-[#002B49] dark:text-white transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    PREVISIÓN
                  </button>
                </div>

                <div className="pt-4">
                  {isFollowUpDue ? (
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.1em] bg-rose-50 text-rose-600 border border-rose-100 rounded-[1.25rem] px-5 py-4 shadow-sm animate-pulse">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>Contactar hoy urgente</span>
                    </div>
                  ) : contact.seguimiento_date ? (
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.1em] bg-slate-50 text-slate-400 border border-slate-100 rounded-[1.25rem] px-5 py-4">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Siguiente acción: {new Date(contact.seguimiento_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  ) : null}
                  
                  {contact.scheduled_date && (
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.1em] bg-[#005A92]/5 text-[#005A92] border border-[#005A92]/10 rounded-[1.25rem] px-5 py-4">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span className="font-bold">Reunión fijada: {new Date(contact.scheduled_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Info Drill-down (Bento) */}
              <section className="glass rounded-[2.5rem] p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-bold">Metadata</h3>
                   <button onClick={() => setShowDetails(!showDetails)} className="text-[#005A92] p-2 bg-background/50 dark:bg-white/5 border border-border/50 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                     {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                   </button>
                </div>
                
                <AnimatePresence>
                  {showDetails ? (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="space-y-4 text-xs">
                        {contact.email && <div className="flex justify-between border-b border-slate-50 dark:border-white/5 pb-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Email</span> <a href={`mailto:${contact.email}`} className="text-[#002B49] dark:text-white font-bold text-right break-all ml-4 lowercase">{contact.email}</a></div>}
                        {contact.phone && <div className="flex justify-between border-b border-slate-50 dark:border-white/5 pb-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Teléfono</span> <a href={`tel:${contact.phone}`} className="text-[#002B49] dark:text-white font-bold tabular-nums">{contact.phone}</a></div>}
                        {contact.linkedin_url && <div className="flex justify-between border-b border-slate-50 dark:border-white/5 pb-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">LinkedIn</span> <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#005A92] dark:text-sky-400 font-black uppercase flex items-center gap-1.5 hover:underline tracking-widest"><Linkedin className="w-3 h-3" /> Perfil</a></div>}
                        {contact.valor_potencial && (
                          <div className="flex justify-between border-b border-slate-50 dark:border-white/5 pb-3">
                            <span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Valor</span>
                            <span className="font-heading font-black text-[#002B49] dark:text-white tabular-nums text-sm">{contact.valor_potencial.toLocaleString('es-ES')} €</span>
                          </div>
                        )}
                        {contact.probabilidad_cierre != null && (
                          <div className="flex justify-between border-b border-slate-50 pb-3">
                            <span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Prob.</span>
                            <span className="font-bold tabular-nums text-emerald-700">{contact.probabilidad_cierre}%</span>
                          </div>
                        )}
                        {/* ESG */}
                        {(contact.servicio_interes || contact.estado_certificacion || contact.empleados_empresa || contact.decision_maker) && (
                          <div className="mt-6 pt-4 border-t border-slate-100">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4 block">🌱 ESG INDICATORS</p>
                            <div className="space-y-3">
                              {contact.servicio_interes && <div className="flex justify-between items-center gap-4"><span className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Servicio</span> <span className="font-bold text-[#002B49] dark:text-white truncate text-right">{contact.servicio_interes}</span></div>}
                              {contact.estado_certificacion && <div className="flex justify-between items-center gap-4"><span className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Certif.</span> <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">{contact.estado_certificacion}</span></div>}
                              {contact.empleados_empresa && <div className="flex justify-between items-center gap-4"><span className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Equipo</span> <span className="font-black text-[#002B49] dark:text-white tabular-nums">{contact.empleados_empresa}</span></div>}
                              {contact.decision_maker && <div className="flex justify-between items-center gap-4"><span className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Target</span> <span className="font-black text-emerald-700 uppercase tracking-widest">Decision Maker ✓</span></div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <p className="text-xs text-slate-400/80 leading-relaxed font-medium">Información institucional de contacto y valoración ESG. Expande para ver métricas financieras.</p>
                  )}
                </AnimatePresence>
              </section>

              {/* Status Manager (Minimalist version) */}
              <section className="glass rounded-[2.5rem] p-8 relative overflow-hidden">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-bold mb-6">Pipeline</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(statusOptions[contact.pipeline || 'captura'] || statusOptions.captura).map((s) => {
                    const key = labelToKey[s.label];
                    const isActive = contact.status === key;
                    return (
                      <button
                        key={s.label}
                        onClick={() => handleStatusChange(key)}
                        className={cn(
                          "px-3 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border flex items-center gap-2.5",
                          isActive
                            ? "bg-[#002B49] dark:bg-primary border-[#002B49] dark:border-primary text-white shadow-lg"
                            : "bg-background/50 dark:bg-white/5 border-border/50 dark:border-white/10 text-slate-400 hover:border-slate-200 dark:hover:border-white/20"
                        )}
                      >
                        <span className="text-base grayscale-[0.5] leading-none">{s.emoji}</span>
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
                {contact.status_changed_at && (() => {
                  const days = Math.floor((Date.now() - new Date(contact.status_changed_at).getTime()) / 86_400_000);
                  const isStale = contact.status === 'agendado' && days > 21;
                  return (
                    <p className={cn(
                      "mt-6 text-[9px] font-black uppercase tracking-[0.2em] opacity-40", 
                      isStale ? "text-rose-600 opacity-100" : "text-slate-500"
                    )}>
                      {isStale ? '⚠️ ESTANCADO' : 'ESTADO ACTUAL'} · {days} DÍAS
                    </p>
                  );
                })()}
              </section>
            </div>
          </div>

          {/* ACTIVITY TIMELINE (Institutional) */}
          <section className="glass rounded-[3.5rem] p-8 lg:p-12">
            <div 
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-background/50 dark:bg-white/5 border border-border/50 dark:border-white/10 flex items-center justify-center text-[#002B49] dark:text-white group-hover:bg-primary/10 transition-colors">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#002B49] dark:text-white font-bold">Línea de Tiempo Permanente</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {activities.length} Interacciones registradas
                  </p>
                </div>
              </div>
              <div className="bg-background/50 dark:bg-white/5 p-2 rounded-xl border border-border/50 dark:border-white/10">
                {showTimeline ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            <AnimatePresence>
              {showTimeline && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-10">
                    <div className="flex gap-4 mb-14 items-center">
                      <div className="relative flex-1 group">
                        <input
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                          placeholder="Insertar nota estratégica..."
                          className="w-full pl-6 pr-16 py-5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] text-sm text-[#002B49] dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-[#005A92]/10 focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-slate-300 shadow-inner"
                        />
                        <button 
                          onClick={handleAddNote} 
                          className="absolute right-2 top-2 bottom-2 aspect-square bg-[#002B49] dark:bg-primary text-white flex items-center justify-center rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#002B49]/30 dark:shadow-primary/20 z-10"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      <VoiceInputButton 
                        onTranscript={(t) => setNewNote(prev => prev ? `${prev} ${t}` : t)}
                        className="h-[60px] w-[60px] shrink-0 bg-white dark:bg-white/10 shadow-xl shadow-slate-200 dark:shadow-none rounded-[2rem]" 
                      />
                    </div>

                    <div className="space-y-12 relative before:absolute before:inset-0 before:left-6 before:-translate-x-1/2 before:h-full before:w-1 before:bg-slate-50 dark:before:bg-white/5 md:before:left-1/2 md:before:translate-x-0">
                      {activities.map((a, idx) => {
                        const prev = activities[idx - 1];
                        const gapDays = prev ? Math.floor((new Date(prev.created_at).getTime() - new Date(a.created_at).getTime()) / 86_400_000) : null;
                        const showGap = gapDays !== null && gapDays >= 7;
                        
                        return (
                          <div key={a.id}>
                            {showGap && (
                              <div className="flex items-center gap-6 py-4 relative z-10">
                                <div className="flex-1 h-px bg-rose-100" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 bg-rose-50 px-5 py-1.5 rounded-full border border-rose-100 shrink-0 shadow-sm">
                                  {gapDays} DÍAS DE SILENCIO ESTRATÉGICO
                                </span>
                                <div className="flex-1 h-px bg-rose-100" />
                              </div>
                            )}
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className="relative flex md:items-start group cursor-default z-10 hover:z-20"
                            >
                              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-[#002B49] border border-slate-100 dark:border-white/10 text-xl shadow-lg relative z-10 shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 group-hover:scale-110 group-hover:bg-[#002B49] dark:group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-[#002B49]/5">
                                {activityIcons[a.type] || '📌'}
                              </div>
                              
                              <div className={cn(
                                "flex-1 ml-10 p-8 rounded-[2.5rem] transition-all bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm group-hover:shadow-2xl group-hover:border-primary/30 dark:group-hover:bg-white/[0.08] md:w-[calc(50%-3rem)] md:ml-0",
                                idx % 2 === 0 ? "md:ml-auto" : "md:mr-auto"
                              )}>
                                {a.type === 'estado' ? (
                                  <div className="text-sm font-bold">
                                    <p className="text-[#002B49]/40 dark:text-sky-200/40 uppercase tracking-widest text-[9px] mb-2 font-black">Actualización de Sistema</p>
                                    <p className="text-[#002B49] dark:text-white/90 leading-6">
                                      <span className="text-[#005A92] dark:text-sky-300 font-black">{a.created_by_profile?.name}</span> transicionó este contacto desde <span className="bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-white/60 line-through px-2 py-0.5 rounded-lg">{a.old_value}</span> a <span className="bg-[#005A92] dark:bg-sky-500/20 text-white dark:text-sky-200 px-2 py-0.5 rounded-lg border border-transparent dark:border-sky-500/30">{a.new_value}</span>
                                    </p>
                                    {a.content && (
                                      <div className={cn(
                                        "mt-4 p-4 rounded-xl border font-bold text-xs",
                                        a.new_value === 'perdido' ? "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-900 dark:text-rose-400" : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-[#002B49]/60 dark:text-white/40"
                                      )}>
                                        MOTIVO: {a.content}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm">
                                     <p className="text-[#002B49]/40 dark:text-white/30 uppercase tracking-widest text-[9px] mb-3 font-black">Nota Institucional</p>
                                     <p className="text-[#002B49] dark:text-white/90 leading-relaxed font-bold selection:bg-[#005A92]/10">{a.content}</p>
                                  </div>
                                )}
                                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-300">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#005A92]" />
                                    <span>{a.created_by_profile?.name}</span>
                                  </div>
                                  <span className="tabular-nums">{new Date(a.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                      {activities.length === 0 && (
                        <div className="py-20 text-center relative z-10">
                          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em] italic">— REGISTRO VACÍO —</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Delete Action Center */}
          {canDelete && (
             <div className="mt-8 flex justify-center pb-12">
               <button
                 onClick={() => setDeleteOpen(true)}
                 className="flex items-center gap-2 py-4 px-8 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all border border-transparent"
               >
                 <Trash2 className="w-4 h-4" />
                 ELIMINAR ASSET PERMANENTEMENTE
               </button>
             </div>
           )}
        </div>
      </div>

      <PerdidoModal open={perdidoOpen} onOpenChange={setPerdidoOpen} contactName={`${contact.first_name}`} onConfirm={handlePerdidoConfirm} isPending={updateStatus.isPending} />
      <PospuestoModal open={pospuestoOpen} onOpenChange={setPospuestoOpen} contactName={`${contact.first_name}`} onConfirm={handlePospuestoConfirm} isPending={updateStatus.isPending} />
      <MailSmartDrawer open={mailOpen} onOpenChange={setMailOpen} contact={contact} />
      <AgendarModal open={agendarOpen} onOpenChange={setAgendarOpen} contactId={contact.id} contactName={contact.first_name} />
      <EditContactModal open={editOpen} onOpenChange={setEditOpen} contact={contact} />
      <RegistrarContactoModal open={registrarOpen} onOpenChange={setRegistrarOpen} contact={contact} />
      <DeleteContactDialog open={deleteOpen} onOpenChange={setDeleteOpen} contactName={contact.first_name} companyName={contact.company?.name || ''} onConfirm={handleDelete} isDeleting={deleteContact.isPending} />
      <PrepararReunionDrawer open={prepareOpen} onOpenChange={setPrepareOpen} contact={contact} activities={activities} />
    </AppLayout>
  );
};

export default ClientDetailPage;
