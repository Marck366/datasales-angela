import { useState } from 'react';
import { Contact } from '@/types';
import { StatusBadge } from './StatusBadge';
import { TipoBadge } from './TipoBadge';
import { Phone, MessageCircle, Mail, Calendar, AlertCircle, UserCheck, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AgendarModal } from './AgendarModal';
import { RegistrarContactoModal } from './RegistrarContactoModal';
import { MailSmartDrawer } from './MailSmartDrawer';
import { cn } from '@/lib/utils';

const meetingTypeLabels: Record<string, string> = {
  presencial: '🏢 Presencial',
  telematica: '💻 Telemática',
  llamada: '📞 Llamada',
  videoconferencia: '📹 Videoconf.',
};

const prioridadDot: Record<string, string> = {
  alta: 'bg-destructive',
  media: 'bg-orange-500',
  baja: 'bg-muted-foreground/30',
};

interface ContactCardProps {
  contact: Contact;
  index?: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ContactCard = ({ contact, index = 0, isExpanded, onToggle }: ContactCardProps) => {
  const navigate = useNavigate();
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);

  const isFollowUpDue = contact.seguimiento_date && contact.seguimiento_date <= new Date().toISOString().split('T')[0];

  const daysWithoutContact = contact.last_activity_at
    ? Math.floor((Date.now() - new Date(contact.last_activity_at).getTime()) / 86_400_000)
    : null;
  const daysInStatus = contact.status_changed_at
    ? Math.floor((Date.now() - new Date(contact.status_changed_at).getTime()) / 86_400_000)
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "glass p-5 rounded-[2rem] border-border/50 dark:border-white/10 mb-4 transition-all duration-500",
          isExpanded ? "ring-2 ring-[#002B49]/5 dark:ring-white/20 scale-[1.02] shadow-2xl z-10" : "hover:scale-[1.01] hover:bg-white/20 dark:hover:bg-white/10"
        )}
      >
        {/* Cabecera clickeable para expandir/colapsar */}
        <div 
          className="flex justify-between items-start cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn("w-2 h-2 rounded-full shrink-0", prioridadDot[contact.prioridad] ?? 'bg-muted-foreground/30')}
                title={`Prioridad ${contact.prioridad}`}
              />
              <h3 className="font-heading font-black text-[#002B49] dark:text-white text-lg leading-tight truncate tracking-tight">
                {contact.company?.name || `${contact.first_name} ${contact.last_name}`}
              </h3>
              <TipoBadge tipo={contact.tipo || 'Cliente'} />
            </div>
            {contact.company?.name && (
              <p className="text-slate-500 dark:text-white/60 text-sm font-semibold truncate uppercase tracking-widest">
                {contact.first_name} {contact.last_name}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {contact.valor_potencial != null && (
                <p className="text-sky text-sm font-black tabular-nums tracking-tight">
                  {contact.valor_potencial.toLocaleString('es-ES')} €
                </p>
              )}
              {contact.next_step && (
                <div className="bg-primary/5 text-primary border border-primary/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 max-w-[220px]">
                  <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                  <span className="truncate">{contact.next_step}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end justify-between h-full min-h-[52px] shrink-0 ml-3">
            <StatusBadge status={contact.status} />
            <div className="flex items-center gap-2 mt-auto pt-2">
              <div className="bg-slate-100 dark:bg-white/5 p-1.5 rounded-full border border-slate-200 dark:border-white/10 group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors">
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#002B49] dark:text-white" /> : <ChevronDown className="w-3.5 h-3.5 text-[#002B49] dark:text-white" />}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido expandido */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-4 border-t border-border/50">
                {isFollowUpDue && (
                  <div className="flex items-center gap-2 mb-4 text-xs font-bold bg-rose-500/10 text-rose-400 rounded-2xl px-4 py-2.5 border border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Seguimiento vencido: {new Date(contact.seguimiento_date!).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                  </div>
                )}

                {!isFollowUpDue && (daysWithoutContact !== null || daysInStatus !== null) && (() => {
                  const showNoContact = daysWithoutContact !== null && daysWithoutContact > 14;
                  const showStale = daysInStatus !== null && contact.status === 'agendado' && daysInStatus > 21;
                  if (!showNoContact && !showStale) return null;
                  return (
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold bg-rose-500/10 text-rose-400 rounded-2xl px-4 py-2.5 border border-rose-500/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {showStale
                        ? <span>Estancado: Agendado hace {daysInStatus} días</span>
                        : <span>Sin interacciones hace {daysWithoutContact} días</span>
                      }
                    </div>
                  );
                })()}

                {contact.scheduled_date && (
                  <div className="flex items-center gap-3 mb-4 text-xs font-semibold text-white/50 bg-white/5 rounded-2xl px-4 py-2.5 border border-white/10">
                    <Calendar className="w-4 h-4 shrink-0 text-sky" />
                    <span>
                      {new Date(contact.scheduled_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {contact.meeting_type && ` · ${meetingTypeLabels[contact.meeting_type] || contact.meeting_type}`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 mb-4">
                  <a 
                    href={`tel:${contact.phone}`} 
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col items-center justify-center py-3 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-100 dark:border-white/10"
                  >
                    <Phone className="w-4 h-4 mb-1 text-[#002B49] dark:text-white" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#002B49] dark:text-white">Llamar</span>
                  </a>
                  <a 
                    href={`https://wa.me/${contact.phone?.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col items-center justify-center py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-100 dark:border-emerald-500/20"
                  >
                    <MessageCircle className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-wider">WhatsApp</span>
                  </a>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setAgendarOpen(true); }} 
                    className="flex flex-col items-center justify-center py-3 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors border border-orange-100 dark:border-orange-500/20"
                  >
                    <Calendar className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Agendar</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMailOpen(true); }} 
                    className="flex flex-col items-center justify-center py-3 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 rounded-2xl hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors border border-sky-100 dark:border-sky-500/20"
                  >
                    <Mail className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Email</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRegistrarOpen(true); }}
                    className="flex items-center justify-center gap-2 py-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl text-xs font-black text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-[#002B49] dark:hover:text-white transition-all border border-slate-100 dark:border-white/10"
                  >
                    <UserCheck className="w-4 h-4" />
                    NOTAS
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/contact/${contact.id}`); }}
                    className="flex items-center justify-center gap-2 py-3.5 bg-[#002B49] dark:bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-[#002B49]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-white"
                  >
                    FICHA CLIENTE
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <RegistrarContactoModal
        open={registrarOpen}
        onOpenChange={setRegistrarOpen}
        contact={contact}
      />
      <MailSmartDrawer
        open={mailOpen}
        onOpenChange={setMailOpen}
        contact={contact}
      />
    </>
  );
};
