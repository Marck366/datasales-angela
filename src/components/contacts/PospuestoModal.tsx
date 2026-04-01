import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

const MOTIVOS = [
  { key: 'No es el momento',      emoji: '⏰' },
  { key: 'Presupuesto bloqueado', emoji: '💰' },
  { key: 'Proceso interno',       emoji: '🔄' },
  { key: 'Revisar en meses',      emoji: '📅' },
  { key: 'Otro',                  emoji: '💬' },
];

interface PospuestoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  onConfirm: (motivo: string, fechaRevision?: string) => void;
  isPending?: boolean;
}

export const PospuestoModal = ({ open, onOpenChange, contactName, onConfirm, isPending }: PospuestoModalProps) => {
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');
  const [fechaRevision, setFechaRevision] = useState<Date>();

  const reset = () => { setMotivo(''); setNotas(''); setFechaRevision(undefined); };

  const handleConfirm = () => {
    if (!motivo) return;
    const content = notas.trim() ? `${motivo} · ${notas.trim()}` : motivo;
    const dateStr = fechaRevision ? format(fechaRevision, 'yyyy-MM-dd') : undefined;
    onConfirm(content, dateStr);
    reset();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-sky/50";
  const labelClass = "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">¿Por qué se pospone?</DialogTitle>
          <p className="text-sm text-muted-foreground">{contactName}</p>
        </DialogHeader>
        <div className="space-y-4">
          {/* Motivo */}
          <div>
            <label className={labelClass}>Motivo *</label>
            <div className="grid grid-cols-2 gap-2">
              {MOTIVOS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMotivo(m.key)}
                  className={cn(
                    'py-3 rounded-xl text-center border border-border bg-card transition-all',
                    motivo === m.key && 'ring-2 ring-status-agendado-fg bg-status-agendado-bg'
                  )}
                >
                  <span className="text-xl block">{m.emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight block mt-0.5">{m.key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha de revisión */}
          <div>
            <label className={labelClass}>Fecha de revisión (opcional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(inputClass, 'flex items-center justify-between', !fechaRevision && 'text-muted-foreground')}>
                  {fechaRevision
                    ? format(fechaRevision, "d 'de' MMMM yyyy", { locale: es })
                    : 'Seleccionar fecha de vuelta'}
                  <CalendarIcon className="w-4 h-4 opacity-50 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaRevision}
                  onSelect={setFechaRevision}
                  disabled={d => d < new Date()}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
            {fechaRevision && (
              <p className="text-xs text-status-agendado-fg font-bold mt-1">
                ✓ Se programará un seguimiento para {format(fechaRevision, "d 'de' MMMM", { locale: es })}
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className={labelClass}>Notas adicionales (opcional)</label>
            <div className="flex gap-2 items-start">
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                className={cn(inputClass, 'h-16 resize-none flex-1')}
                placeholder="Detalles del aplazamiento..."
              />
              <VoiceInputButton 
                onTranscript={(t) => setNotas(prev => prev ? `${prev} ${t}` : t)}
                className="h-10 w-10 shrink-0 mt-0.5"
              />
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!motivo || isPending}
            className="w-full py-3 bg-status-agendado-fg text-white font-heading font-bold rounded-xl active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Confirmar pospuesto'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
