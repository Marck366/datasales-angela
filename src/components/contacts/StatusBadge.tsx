import { ContactStatus } from '@/types';

const statusConfig: Record<string, { bg: string; fg: string; label: string }> = {
  // Captura
  nuevo: { bg: 'bg-sky-50 dark:bg-sky-500/10', fg: 'text-sky-700 dark:text-sky-400', label: 'Nuevo' },
  agendado: { bg: 'bg-amber-50 dark:bg-amber-500/10', fg: 'text-amber-700 dark:text-amber-400', label: 'Agendado' },
  pendiente_propuesta: { bg: 'bg-slate-100 dark:bg-white/10', fg: 'text-slate-700 dark:text-white/90', label: 'P. Propuesta' },
  propuesta_mandada: { bg: 'bg-blue-50 dark:bg-blue-500/10', fg: 'text-blue-700 dark:text-blue-400', label: 'P. Mandada' },
  aplazado: { bg: 'bg-slate-50 dark:bg-white/5', fg: 'text-slate-500 dark:text-white/60', label: 'Aplazado' },
  perdido: { bg: 'bg-rose-50 dark:bg-rose-500/10', fg: 'text-rose-700 dark:text-rose-400', label: 'Perdido' },
  cerrado: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', fg: 'text-emerald-700 dark:text-emerald-400', label: 'Cerrado' },
  
  // Cartera
  propuesta_solicitada: { bg: 'bg-slate-100 dark:bg-white/10', fg: 'text-slate-700 dark:text-white/90', label: 'P. Solicitada' },
  propuesta_entregada: { bg: 'bg-blue-50 dark:bg-blue-500/10', fg: 'text-blue-700 dark:text-blue-400', label: 'P. Entregada' },
  aceptada: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', fg: 'text-emerald-700 dark:text-emerald-400', label: 'Aceptada' },
  prevision_cierre: { bg: 'bg-amber-50 dark:bg-amber-500/10', fg: 'text-amber-700 dark:text-amber-400', label: 'Previsión' },
  rechazada: { bg: 'bg-rose-50 dark:bg-rose-500/10', fg: 'text-rose-700 dark:text-rose-400', label: 'Rechazada' },

  // Backwards compat
  pospuesto: { bg: 'bg-white/5', fg: 'text-white/60', label: 'Aplazado' },
  nevera: { bg: 'bg-white/5', fg: 'text-white/60', label: 'Pospuesto' },
};

const fallback = { bg: 'bg-secondary', fg: 'text-muted-foreground', label: 'Desconocido' };

export const StatusBadge = ({ status }: { status: ContactStatus }) => {
  const config = statusConfig[status] ?? fallback;
  return (
    <span className={`${config.bg} ${config.fg} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
      {config.label}
    </span>
  );
};

export const getStatusConfig = (status: ContactStatus) => statusConfig[status];
