import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

const MOTIVOS = [
  { key: 'Precio', emoji: '💰' },
  { key: 'Competencia', emoji: '⚔️' },
  { key: 'Timing', emoji: '⏰' },
  { key: 'Sin interés', emoji: '😶' },
  { key: 'Sin respuesta', emoji: '📵' },
];

interface PerdidoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  onConfirm: (motivo: string, notas: string) => void;
  isPending?: boolean;
}

export const PerdidoModal = ({ open, onOpenChange, contactName, onConfirm, isPending }: PerdidoModalProps) => {
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');

  const handleConfirm = () => {
    if (!motivo) return;
    onConfirm(motivo, notas.trim());
    setMotivo('');
    setNotas('');
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) { setMotivo(''); setNotas(''); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">¿Por qué se perdió?</DialogTitle>
          <p className="text-sm text-muted-foreground">{contactName}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {MOTIVOS.map(m => (
              <button
                key={m.key}
                onClick={() => setMotivo(m.key)}
                className={cn(
                  'py-3 rounded-xl text-center border border-border bg-card transition-all',
                  motivo === m.key && 'ring-2 ring-destructive bg-destructive/5'
                )}
              >
                <span className="text-xl block">{m.emoji}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.key}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-start">
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className={cn("w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-sky/50 h-20 resize-none flex-1")}
              placeholder="Notas adicionales (opcional)..."
            />
            <VoiceInputButton 
              onTranscript={(t) => setNotas(prev => prev ? `${prev} ${t}` : t)}
              className="h-10 w-10 shrink-0 mt-0.5"
            />
          </div>
          <button
            onClick={handleConfirm}
            disabled={!motivo || isPending}
            className="w-full py-3 bg-destructive text-destructive-foreground font-heading font-bold rounded-xl active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Confirmar pérdida'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
