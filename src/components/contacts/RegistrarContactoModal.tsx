import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { invalidateContactCaches } from '@/hooks/useContacts';
import { useCreateActivity } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { contactsApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { calcSeguimientoDate } from '@/lib/semana';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Contact, ContactStatus } from '@/types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect } from 'react';

const contactTypes = [
  { value: 'llamada', label: 'Llamada', emoji: '📞' },
  { value: 'email', label: 'Email', emoji: '✉️' },
  { value: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { value: 'reunion', label: 'Reunión', emoji: '🤝' },
];

const statusOptions: Record<string, { label: string; emoji: string; key: ContactStatus }[]> = {
  captura: [
    { label: 'Nuevo', emoji: '🆕', key: 'nuevo' },
    { label: 'Agendado', emoji: '📅', key: 'agendado' },
    { label: 'P. Propuesta', emoji: '📝', key: 'pendiente_propuesta' },
    { label: 'P. Mandada', emoji: '📩', key: 'propuesta_mandada' },
    { label: 'Cerrado', emoji: '✅', key: 'cerrado' },
    { label: 'Perdido', emoji: '❌', key: 'perdido' },
  ],
  cartera: [
    { label: 'P. Solicitada', emoji: '🙋‍♂️', key: 'propuesta_solicitada' },
    { label: 'P. Entregada', emoji: '📄', key: 'propuesta_entregada' },
    { label: 'Aceptada', emoji: '🤝', key: 'aceptada' },
    { label: 'Previsión', emoji: '📈', key: 'prevision_cierre' },
    { label: 'Rechazada', emoji: '🚫', key: 'rechazada' },
  ],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

export const RegistrarContactoModal = ({ open, onOpenChange, contact }: Props) => {
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [nextStep, setNextStep] = useState(contact.next_step || '');
  const [newStatus, setNewStatus] = useState<ContactStatus>(contact.status);
  
  const createActivity = useCreateActivity();
  const { profile } = useAuth();
  const qc = useQueryClient();

  // Sync state when contact changes or modal opens
  useEffect(() => {
    if (open) {
      setNewStatus(contact.status);
      setNextStep(contact.next_step || '');
      setType('');
      setNotes('');
    }
  }, [open, contact.id, contact.status, contact.next_step]);

  const handleSave = async () => {
    if (!type) {
      toast({ title: 'Selecciona un tipo de contacto', variant: 'destructive' });
      return;
    }
    if (!profile) {
      toast({ title: 'Sesión no válida', variant: 'destructive' });
      return;
    }

    try {
      const isStatusChanged = newStatus !== contact.status;
      const typeLabel = contactTypes.find(t => t.value === type)?.label || type;
      
      console.log('Iniciando registro de actividad...', { type, isStatusChanged, newStatus });

      // 1. Create communication activity
      await createActivity.mutateAsync({
        contact_id: contact.id,
        type: type as any,
        content: `${typeLabel} realizada${notes ? `: ${notes}` : ''}`,
      });

      // 2. If status changed, create status activity and update contact
      if (isStatusChanged) {
        await createActivity.mutateAsync({
          contact_id: contact.id,
          type: 'estado',
          old_value: contact.status,
          new_value: newStatus,
          content: notes || 'Cambio de estado durante registro de nota',
        });
      }

      // 3. Update contact (status, follow-up)
      const seguimiento = calcSeguimientoDate(type);
      await contactsApi.update(contact.id, {
        status: newStatus,
        seguimiento_date: seguimiento,
      });

      invalidateContactCaches(qc);
      toast({
        title: isStatusChanged ? '✅ Estado y contacto registrados' : '✅ Contacto registrado',
        description: `Próximo seguimiento: ${format(new Date(seguimiento), "d 'de' MMMM", { locale: es })}`,
      });
      
      onOpenChange(false);
    } catch (err) {
      const error = err as Error;
      toast({ 
        title: '❌ Error al registrar', 
        description: error.message || 'Verifica tu conexión o permisos de acceso.',
        variant: 'destructive' 
      });
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-sky/50 transition-all";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block";

  const currentStages = statusOptions[contact.pipeline || 'captura'] || statusOptions.captura;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="w-[92%] max-h-[92svh] sm:max-w-2xl rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden p-0 border-none shadow-2xl bg-white focus:outline-none flex flex-col">
        <div className="bg-[#002B49] p-8 text-white relative">
          <DialogClose className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-50">
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-tighter">Registrar Actividad</DialogTitle>
            <p className="text-blue-200/60 text-sm font-bold uppercase tracking-widest mt-1">
              {contact.company?.name || `${contact.first_name} ${contact.last_name}`}
            </p>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto min-h-0">
          {/* TIPO DE CONTACTO */}
          <div>
            <label className={labelClass}>¿Cómo ha sido el contacto?</label>
            <div className="grid grid-cols-4 gap-2">
              {contactTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "py-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all border",
                    type === t.value 
                      ? "bg-[#005A92] border-[#005A92] text-white shadow-lg shadow-[#005A92]/20 scale-[1.02]" 
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  <span className="text-xl block">{t.emoji}</span>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", type === t.value ? "text-white" : "text-slate-500")}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CAMBIO DE ESTADO */}
          <div>
            <label className={labelClass}>Actualizar Ubicación en Pipeline</label>
            <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none">
              {currentStages.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setNewStatus(s.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl border whitespace-nowrap transition-all shrink-0",
                    newStatus === s.key
                      ? "bg-[#002B49] border-[#002B49] text-white shadow-md scale-[1.05]"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  <span className="text-sm">{s.emoji}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* NOTAS */}
          <div>
            <label className={labelClass}>Notas Estratégicas</label>
            <div className="relative group">
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className={cn(inputClass, "h-28 resize-none pr-12 pt-4 bg-slate-50/50 border-slate-100 focus:bg-white")} 
                placeholder="Describe los puntos clave de la interacción..." 
              />
              <div className="absolute right-3 top-3">
                <VoiceInputButton 
                  onTranscript={(t) => setNotes(prev => prev ? `${prev} ${t}` : t)}
                  className="h-9 w-9 bg-white shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* PRÓXIMO PASO */}
          <div>
            <label className={labelClass}>Siguiente Acción</label>
            <div className="relative group">
              <input 
                value={nextStep} 
                onChange={(e) => setNextStep(e.target.value)} 
                className={cn(inputClass, "pr-12 h-12 bg-slate-50/50 border-slate-100 focus:bg-white font-bold")} 
                placeholder="¿Qué toca hacer ahora?" 
              />
              <div className="absolute right-3 top-1.5">
                <VoiceInputButton 
                  onTranscript={(t) => setNextStep(prev => prev ? `${prev} ${t}` : t)}
                  className="h-9 w-9 bg-white shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={() => onOpenChange(false)}
            className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 font-heading font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-xs"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={createActivity.isPending} 
            className="flex-[2] py-5 bg-[#002B49] text-white font-heading font-black rounded-2xl shadow-xl shadow-[#002B49]/20 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
          >
            {createActivity.isPending ? 'Sincronizando...' : 'Finalizar y Sincronizar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
