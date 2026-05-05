import { useNavigate } from 'react-router-dom';
import { useCompanyContacts, useSetPrimaryContact } from '@/hooks/useContacts';
import { Star, Plus, Phone, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubContactsListProps {
  companyId: string;
  currentContactId: string;
  onAddSubContact: () => void;
}

export const SubContactsList = ({ companyId, currentContactId, onAddSubContact }: SubContactsListProps) => {
  const navigate = useNavigate();
  const { data: siblings = [] } = useCompanyContacts(companyId);
  const setPrimary = useSetPrimaryContact();

  const handleSetPrimary = (contactId: string) => {
    setPrimary.mutate(
      { contactId, companyId },
      {
        onSuccess: () => {
          toast({ title: '★ Contacto principal actualizado' });
        },
        onError: () => {
          toast({ title: 'Error al cambiar contacto principal', variant: 'destructive' });
        },
      }
    );
  };

  const getDaysAgo = (dateStr: string | null) => {
    if (!dateStr) return null;
    return formatDistanceToNow(new Date(dateStr), { locale: es, addSuffix: false });
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
      <AnimatePresence mode="popLayout">
        {siblings.map((s, i) => {
          const isCurrent = s.id === currentContactId;
          const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase();
          const daysAgo = getDaysAgo(s.last_activity_at);

          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => !isCurrent && navigate(`/contact/${s.id}`)}
              className={`flex-shrink-0 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full transition-all ${
                isCurrent
                  ? 'bg-[#002B49] text-white shadow-lg shadow-[#002B49]/20'
                  : 'bg-slate-50/80 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                isCurrent ? 'bg-white/20 text-white' : 'bg-[#002B49]/10 dark:bg-white/10 text-[#002B49] dark:text-white'
              }`}>
                {initials}
              </div>

              {/* Info */}
              <div className="flex flex-col items-start min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold truncate max-w-[100px] ${isCurrent ? 'text-white' : 'text-[#002B49] dark:text-white'}`}>
                    {s.first_name}
                  </span>
                  {s.is_primary && (
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                  )}
                </div>
                <span className={`text-[9px] truncate max-w-[100px] ${isCurrent ? 'text-white/60' : 'text-slate-400 dark:text-white/40'}`}>
                  {s.job_title || (daysAgo ? `hace ${daysAgo}` : 'Sin cargo')}
                </span>
              </div>

              {/* Set primary button (only for non-primary) */}
              {!s.is_primary && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSetPrimary(s.id); }}
                  className="ml-1 p-1 rounded-full transition-all hover:bg-amber-50 dark:hover:bg-amber-500/10"
                  title="Hacer principal"
                >
                  <Star className="w-3 h-3 text-slate-300 dark:text-white/20 hover:text-amber-400 transition-colors" />
                </button>
              )}

              {/* Quick actions for non-current */}
              {!isCurrent && s.phone && (
                <div className="flex gap-1 ml-1">
                  <a href={`tel:${s.phone}`} onClick={(e) => e.stopPropagation()} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                    <Phone className="w-3 h-3 text-slate-400" />
                  </a>
                  <a href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                    <MessageCircle className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Add sub-contact button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: siblings.length * 0.05 }}
        onClick={onAddSubContact}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 hover:border-[#00AEEF] hover:text-[#00AEEF] dark:hover:border-[#00AEEF] dark:hover:text-[#00AEEF] transition-all active:scale-95"
      >
        <Plus className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Añadir</span>
      </motion.button>
    </div>
  );
};
