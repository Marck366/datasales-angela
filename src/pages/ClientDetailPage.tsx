import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContact, useUpdateContactStatus, useDeleteContact, useSetPrimaryContact } from '@/hooks/useContacts';
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
import { SubContactsList } from '@/components/contacts/SubContactsList';
import { AddSubContactModal } from '@/components/contacts/AddSubContactModal';
import { AppLayout } from '@/components/layout/AppLayout';
import { Phone, MessageCircle, Mail, ArrowLeft, Linkedin, ChevronDown, ChevronUp, Send, Calendar, Pencil, UserCheck, AlertCircle, Trash2, TrendingUp, Sparkles, Building2, LayoutGrid, Star, History, Clock } from 'lucide-react';
import { getDaysSinceLastContact, getActivitySummary } from '@/lib/scoring';
import { ContactStatus } from '@/types';
import { AgendarModal } from '@/components/contacts/AgendarModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { PrepararReunionDrawer } from '@/components/contacts/PrepararReunionDrawer';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 30 } as const,
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
  const setPrimary = useSetPrimaryContact();

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
  const [showESG, setShowESG] = useState(false);
  const [showContactData, setShowContactData] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [addSubContactOpen, setAddSubContactOpen] = useState(false);

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
  
  const lastActivity = activities[0];
  const lastActivityTime = lastActivity ? formatDistanceToNow(new Date(lastActivity.created_at), { locale: es, addSuffix: true }) : null;

  return (
    <AppLayout>
      <div className="relative min-h-screen bg-background pb-24 transition-colors duration-500">
        <div className="max-w-6xl mx-auto">

          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between px-5 pt-8 pb-4">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#002B49] dark:hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              VOLVER
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#002B49] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[#002B49]/20 transition-all active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
              EDITAR
            </button>
          </div>



          <div className="px-5 space-y-6">
            {/* ============================================ */}
            {/* SECTION 2: IDENTITY                          */}
            {/* ============================================ */}
            <motion.section
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.05 }}
              className="glass rounded-[3rem] p-8 lg:px-10 lg:py-10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transition-transform group-hover:scale-110 duration-700">
                <Building2 className="w-48 h-48 text-[#002B49]" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-6">
                  <div
                    className="w-20 h-20 lg:w-24 lg:h-24 rounded-[2rem] flex items-center justify-center font-heading font-black text-3xl lg:text-4xl text-white shrink-0 shadow-2xl shadow-blue-200 dark:shadow-blue-900/30"
                    style={{ backgroundColor: `#${contact.assigned_profile?.avatar_color || '005A92'}` }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h1 className="text-3xl lg:text-4xl font-heading font-black text-[#002B49] dark:text-white tracking-tighter leading-tight truncate">
                      {contact.company?.name || contact.first_name}
                    </h1>
                    <p className="text-slate-500 dark:text-white/70 font-bold text-base leading-snug mt-1.5">
                      {contact.first_name} {contact.last_name}
                      {contact.job_title && <span className="text-[#005A92]/40 dark:text-white/30"> / {contact.job_title}</span>}
                    </p>
                    {lastActivityTime && (
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/20">
                        <History className="w-3 h-3" />
                        <span>Actividad {lastActivityTime}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <TipoBadge tipo={contact.tipo || 'Cliente'} />
                      <StatusBadge status={contact.status} />
                      {contact.is_primary ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-400/20">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Principal
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setPrimary.mutate({ contactId: contact.id, companyId: contact.company?.id || '' });
                            toast({ title: '★ Contacto principal actualizado' });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/30 border border-slate-100 dark:border-white/10 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200 transition-all active:scale-95 group"
                        >
                          <Star className="w-2.5 h-2.5 group-hover:fill-amber-400" /> Hacer Principal
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Operations inside Identity Card */}
                {/* Compact Operations inside Identity Card */}
                <div className="grid grid-cols-2 md:flex md:flex-col gap-2 shrink-0 w-full md:w-auto mt-6 md:mt-0">
                  <button
                    onClick={() => setRegistrarOpen(true)}
                    className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#002B49] dark:bg-white text-white dark:text-[#002B49] rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95 shadow-md h-11"
                  >
                    <UserCheck className="w-4 h-4" />
                    Registrar Actividad
                  </button>
                  <button
                    onClick={() => setPrepareOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#002B49] dark:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-white/10 transition-all shadow-sm h-11"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Resumen
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#002B49] dark:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-white/10 transition-all shadow-sm h-11"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Previsión
                  </button>
                </div>
              </div>

              {/* Follow-up alerts inline */}
              {isFollowUpDue && (
                <div className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.1em] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-2xl px-5 py-3 animate-pulse relative z-10">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Seguimiento pendiente — contactar hoy</span>
                </div>
              )}

              {contact.scheduled_date && (
                <div className="mt-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.1em] bg-[#005A92]/5 dark:bg-sky-500/10 text-[#005A92] dark:text-sky-400 border border-[#005A92]/10 dark:border-sky-500/20 rounded-2xl px-5 py-3 relative z-10">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Reunión: {new Date(contact.scheduled_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                  {contact.meeting_type && <span className="ml-auto opacity-60">{contact.meeting_type}</span>}
                </div>
              )}
            </motion.section>

            {/* ACTION BAR — Now below Identity */}
            <motion.div
              {...fadeInUp}
              className="px-0 pb-2 pt-2"
            >
              <div className="glass rounded-[2rem] p-3 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
                <div className="grid grid-cols-4 gap-2">
                  <a href={`tel:${contact.phone}`} className="flex flex-col items-center justify-center py-4 rounded-[1.5rem] bg-[#002B49] dark:bg-[#002B49] text-white hover:bg-[#003d66] transition-all active:scale-90 group">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Llamar</span>
                  </a>
                  <button onClick={() => setAgendarOpen(true)} className="flex flex-col items-center justify-center py-4 rounded-[1.5rem] bg-[#005A92] text-white hover:bg-[#006db0] transition-all active:scale-90 group">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Agendar</span>
                  </button>
                  <button onClick={() => setMailOpen(true)} className="flex flex-col items-center justify-center py-4 rounded-[1.5rem] bg-[#0078d4] text-white hover:bg-[#1a8ae6] transition-all active:scale-90 group">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Outlook</span>
                  </button>
                  <a href={`https://wa.me/${contact.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center py-4 rounded-[1.5rem] bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all active:scale-90 group">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">WhatsApp</span>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* ============================================ */}
            {/* SECTION 3: SUB-CONTACTS                      */}
            {/* ============================================ */}
            {contact.company_id && (
              <motion.section
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: 0.1 }}
                className="glass rounded-[2.5rem] px-6 py-5"
              >
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40 mb-3">Contactos de la empresa</h3>
                <SubContactsList
                  companyId={contact.company_id}
                  currentContactId={contact.id}
                  onAddSubContact={() => setAddSubContactOpen(true)}
                />
              </motion.section>
            )}

            {/* ============================================ */}
            {/* SECTION 4: CONTACT DATA (always visible)     */}
            {/* ============================================ */}
            <motion.section
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.15 }}
              className="glass rounded-[2.5rem] p-8"
            >
              <div 
                onClick={() => setShowContactData(!showContactData)}
                className="flex items-center justify-between cursor-pointer group/header"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#005A92]/10 dark:bg-sky-500/20 flex items-center justify-center text-[#005A92] dark:text-sky-400 group-hover/header:rotate-12 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40">Datos de contacto</h3>
                </div>
                <div className={cn("transition-transform duration-300", showContactData ? "rotate-180" : "")}>
                  <ChevronDown className="w-4 h-4 text-slate-300 dark:text-white/30" />
                </div>
              </div>

              <AnimatePresence>
                {showContactData && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all group">
                          <div className="w-9 h-9 rounded-xl bg-[#0078d4]/10 dark:bg-[#0078d4]/20 flex items-center justify-center text-[#0078d4]">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Email</p>
                            <p className="text-sm font-bold text-[#002B49] dark:text-white truncate">{contact.email}</p>
                          </div>
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all group">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Teléfono</p>
                            <p className="text-sm font-bold text-[#002B49] dark:text-white tabular-nums">{contact.phone}</p>
                          </div>
                        </a>
                      )}
                      {contact.linkedin_url && (
                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all group">
                          <div className="w-9 h-9 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2]">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">LinkedIn</p>
                            <p className="text-sm font-bold text-[#0A66C2] dark:text-sky-400">Ver perfil</p>
                          </div>
                        </a>
                      )}
                      {(contact.valor_potencial != null && contact.valor_potencial > 0) && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 text-base font-black">€</div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Valor potencial</p>
                            <p className="text-sm font-heading font-black text-[#002B49] dark:text-white tabular-nums">{contact.valor_potencial.toLocaleString('es-ES')} €</p>
                          </div>
                        </div>
                      )}
                      {contact.probabilidad_cierre != null && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Probabilidad</p>
                            <p className="text-sm font-heading font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{contact.probabilidad_cierre}%</p>
                          </div>
                        </div>
                      )}
                      {contact.next_step && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#005A92]/5 dark:bg-sky-500/10 border border-[#005A92]/10 dark:border-sky-500/20 md:col-span-2">
                          <div className="w-9 h-9 rounded-xl bg-[#005A92]/10 dark:bg-sky-500/20 flex items-center justify-center text-[#005A92] dark:text-sky-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#005A92]/50 dark:text-sky-400/50">Siguiente paso</p>
                            <p className="text-sm font-bold text-[#005A92] dark:text-sky-300">{contact.next_step}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* GRID: Operations + Pipeline | Health + ESG */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                {/* ============================================ */}
                {/* SECTION 6: PIPELINE STATUS                   */}
                {/* ============================================ */}
                <motion.section
                  {...fadeInUp}
                  transition={{ ...fadeInUp.transition, delay: 0.25 }}
                  className="glass rounded-[2.5rem] p-8"
                >
                  <div 
                    onClick={() => setShowPipeline(!showPipeline)}
                    className="flex items-center justify-between cursor-pointer group/header"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#002B49] dark:bg-primary flex items-center justify-center text-white group-hover/header:rotate-12 transition-transform">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40">Pipeline · {contact.pipeline || 'captura'}</h3>
                    </div>
                    <div className={cn("transition-transform duration-300", showPipeline ? "rotate-180" : "")}>
                      <ChevronDown className="w-4 h-4 text-slate-300 dark:text-white/30" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {showPipeline && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3 mt-6">
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
                              "mt-5 text-[9px] font-black uppercase tracking-[0.2em] opacity-40",
                              isStale ? "text-rose-600 opacity-100" : "text-slate-500"
                            )}>
                              {isStale ? '⚠️ ESTANCADO' : 'ESTADO ACTUAL'} · {days} DÍAS
                            </p>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              </div>

              {/* Column 2: Health & ESG - Only render if there is data to avoid empty space in grid */}
              {(() => {
                const summary = getActivitySummary(activities);
                const hasHealth = summary.total > 0 || getDaysSinceLastContact(activities) !== null;
                const hasESG = contact.servicio_interes || contact.estado_certificacion || contact.empleados_empresa || contact.decision_maker;
                
                if (!hasHealth && !hasESG) return null;

                return (
                  <div className="lg:col-span-5 space-y-6">
                    {/* Health Section */}
                    {hasHealth && (
                      <motion.section
                        {...fadeInUp}
                        transition={{ ...fadeInUp.transition, delay: 0.3 }}
                        className="glass rounded-[2.5rem] p-8"
                      >
                        <div
                          onClick={() => setShowHealth(!showHealth)}
                          className="flex items-center justify-between cursor-pointer group/header"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#005A92]/10 dark:bg-sky-500/20 flex items-center justify-center text-[#005A92] dark:text-sky-400 group-hover/header:rotate-12 transition-transform">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40">Salud Comercial</h3>
                              {getDaysSinceLastContact(activities) !== null && (
                                <p className={cn(
                                  "text-xs font-bold mt-0.5",
                                  getDaysSinceLastContact(activities)! > 14 ? "text-rose-500" : getDaysSinceLastContact(activities)! > 7 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                                )}>
                                  {getDaysSinceLastContact(activities) === 0 ? 'Hoy' : `${getDaysSinceLastContact(activities)}d sin contacto`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={cn("transition-transform duration-300", showHealth ? "rotate-180" : "")}>
                            <ChevronDown className="w-4 h-4 text-slate-300 dark:text-white/30" />
                          </div>
                        </div>

                        <AnimatePresence>
                          {showHealth && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-3 mt-6">
                                {[
                                  { icon: '📞', count: summary.llamadas, label: 'Llamadas' },
                                  { icon: '💬', count: summary.whatsapp, label: 'WhatsApp' },
                                  { icon: '📩', count: summary.emails, label: 'Email' },
                                  { icon: '🤝', count: summary.reuniones, label: 'Reuniones' },
                                ].map(s => (
                                  <div key={s.label} className="bg-card/40 dark:bg-white/5 backdrop-blur-xl border border-border/50 dark:border-white/10 rounded-2xl p-4 text-center transition-all hover:scale-[1.03]">
                                    <span className="text-2xl block mb-1">{s.icon}</span>
                                    <span className="text-2xl font-heading font-black text-[#002B49] dark:text-white tabular-nums block tracking-tighter">{s.count}</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">{s.label}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.section>
                    )}

                    {/* ESG Section */}
                    {hasESG && (
                      <motion.section
                        {...fadeInUp}
                        transition={{ ...fadeInUp.transition, delay: 0.35 }}
                        className="glass rounded-[2.5rem] p-8"
                      >
                        <div
                          onClick={() => setShowESG(!showESG)}
                          className="flex items-center justify-between cursor-pointer group/header"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover/header:rotate-12 transition-transform">
                              <span className="text-base">🌱</span>
                            </div>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40">Indicadores ESG</h3>
                          </div>
                          <div className={cn("transition-transform duration-300", showESG ? "rotate-180" : "")}>
                            <ChevronDown className="w-4 h-4 text-slate-300 dark:text-white/30" />
                          </div>
                        </div>

                        <AnimatePresence>
                          {showESG && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 mt-6 text-xs">
                                {contact.servicio_interes && (
                                  <div className="flex justify-between items-center gap-4">
                                    <span className="text-slate-400 dark:text-white/40 font-black uppercase tracking-widest text-[8px]">Servicio</span>
                                    <span className="font-bold text-[#002B49] dark:text-white truncate text-right">{contact.servicio_interes}</span>
                                  </div>
                                )}
                                {contact.estado_certificacion && (
                                  <div className="flex justify-between items-center gap-4">
                                    <span className="text-slate-400 dark:text-white/40 font-black uppercase tracking-widest text-[8px]">Certificación</span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-lg">{contact.estado_certificacion}</span>
                                  </div>
                                )}
                                {contact.empleados_empresa && (
                                  <div className="flex justify-between items-center gap-4">
                                    <span className="text-slate-400 dark:text-white/40 font-black uppercase tracking-widest text-[8px]">Equipo</span>
                                    <span className="font-black text-[#002B49] dark:text-white tabular-nums">{contact.empleados_empresa}</span>
                                  </div>
                                )}
                                {contact.decision_maker && (
                                  <div className="flex justify-between items-center gap-4">
                                    <span className="text-slate-400 dark:text-white/40 font-black uppercase tracking-widest text-[8px]">Target</span>
                                    <span className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-[9px]">Decision Maker ✓</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.section>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ============================================ */}
            {/* SECTION 9: ACTIVITY TIMELINE                 */}
            {/* ============================================ */}
            <motion.section
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.4 }}
              className="glass rounded-[3rem] p-8 lg:p-12"
            >
              <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setShowTimeline(!showTimeline)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-background/50 dark:bg-white/5 border border-border/50 dark:border-white/10 flex items-center justify-center text-[#002B49] dark:text-white group-hover:bg-primary/10 transition-colors">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#002B49] dark:text-white font-bold">Línea de Tiempo</h3>
                    <p className="text-[9px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-widest mt-0.5">
                      {activities.length} interacciones
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
                            className="w-full pl-6 pr-16 py-5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] text-sm text-[#002B49] dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-[#005A92]/10 focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-slate-300 dark:placeholder:text-white/20 shadow-inner"
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
                                  <div className="flex-1 h-px bg-rose-100 dark:bg-rose-500/20" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-5 py-1.5 rounded-full border border-rose-100 dark:border-rose-500/20 shrink-0 shadow-sm">
                                    {gapDays} DÍAS DE SILENCIO
                                  </span>
                                  <div className="flex-1 h-px bg-rose-100 dark:bg-rose-500/20" />
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
                                      <p className="text-[#002B49]/40 dark:text-sky-200/40 uppercase tracking-widest text-[9px] mb-2 font-black">Actualización</p>
                                      <p className="text-[#002B49] dark:text-white/90 leading-6">
                                        <span className="text-[#005A92] dark:text-sky-300 font-black">{a.created_by_profile?.name}</span> cambió de <span className="bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-white/60 line-through px-2 py-0.5 rounded-lg">{a.old_value}</span> a <span className="bg-[#005A92] dark:bg-sky-500/20 text-white dark:text-sky-200 px-2 py-0.5 rounded-lg border border-transparent dark:border-sky-500/30">{a.new_value}</span>
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
                                      <p className="text-[#002B49]/40 dark:text-white/30 uppercase tracking-widest text-[9px] mb-3 font-black">Nota</p>
                                      <p className="text-[#002B49] dark:text-white/90 leading-relaxed font-bold">{a.content}</p>
                                    </div>
                                  )}
                                  <div className="mt-6 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-300 dark:text-white/20">
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
                            <p className="text-xs font-black text-slate-300 dark:text-white/20 uppercase tracking-[0.4em] italic">— REGISTRO VACÍO —</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Delete Action Center */}
            {canDelete && (
              <div className="mt-4 flex justify-center pb-12">
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-2 py-4 px-8 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-white/20 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-100 dark:hover:border-rose-500/20 transition-all border border-transparent"
                >
                  <Trash2 className="w-4 h-4" />
                  ELIMINAR REGISTRO
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <PerdidoModal open={perdidoOpen} onOpenChange={setPerdidoOpen} contactName={`${contact.first_name}`} onConfirm={handlePerdidoConfirm} isPending={updateStatus.isPending} />
      <PospuestoModal open={pospuestoOpen} onOpenChange={setPospuestoOpen} contactName={`${contact.first_name}`} onConfirm={handlePospuestoConfirm} isPending={updateStatus.isPending} />
      <MailSmartDrawer open={mailOpen} onOpenChange={setMailOpen} contact={contact} />
      <AgendarModal open={agendarOpen} onOpenChange={setAgendarOpen} contactId={contact.id} contactName={contact.first_name} />
      <EditContactModal open={editOpen} onOpenChange={setEditOpen} contact={contact} />
      <RegistrarContactoModal open={registrarOpen} onOpenChange={setRegistrarOpen} contact={contact} />
      <DeleteContactDialog open={deleteOpen} onOpenChange={setDeleteOpen} contactName={contact.first_name} companyName={contact.company?.name || ''} onConfirm={handleDelete} isDeleting={deleteContact.isPending} />
      <PrepararReunionDrawer open={prepareOpen} onOpenChange={setPrepareOpen} contact={contact} activities={activities} />
      {contact.company_id && contact.company?.name && (
        <AddSubContactModal
          open={addSubContactOpen}
          onOpenChange={setAddSubContactOpen}
          companyId={contact.company_id}
          companyName={contact.company.name}
        />
      )}
    </AppLayout>
  );
};

export default ClientDetailPage;
