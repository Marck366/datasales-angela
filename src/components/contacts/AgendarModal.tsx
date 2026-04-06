import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Sparkles, Clock, MapPin, Tablet, Phone as PhoneIcon, Video, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUpdateContactStatus } from '@/hooks/useContacts';
import { useCreateActivity } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { motion, AnimatePresence } from 'framer-motion';

const meetingTypes = [
  { value: 'presencial', label: 'Presencial', emoji: <MapPin className="w-4 h-4" />, color: 'emerald' },
  { value: 'telematica', label: 'Telemática', emoji: <Tablet className="w-4 h-4" />, color: 'sky' },
  { value: 'llamada', label: 'Llamada', emoji: <PhoneIcon className="w-4 h-4" />, color: 'orange' },
  { value: 'videoconferencia', label: 'Videoconferencia', emoji: <Video className="w-4 h-4" />, color: 'indigo' },
];

interface AgendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
}

export const AgendarModal = ({ open, onOpenChange, contactId, contactName }: AgendarModalProps) => {
  const [date, setDate] = useState<Date>();
  const [meetingType, setMeetingType] = useState('');
  const [notes, setNotes] = useState('');
  const updateStatus = useUpdateContactStatus();
  const createActivity = useCreateActivity();
  const { profile } = useAuth();

  const handleSave = async () => {
    if (!date || !meetingType) {
      toast({ title: 'Campos requeridos', description: 'Selecciona fecha y tipo de reunión.', variant: 'destructive' });
      return;
    }
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      await updateStatus.mutateAsync({
        id: contactId,
        status: 'agendado',
        scheduled_date: dateStr,
        meeting_type: meetingType,
      });
      if (profile) {
        const typeLabel = meetingTypes.find(t => t.value === meetingType)?.label || meetingType;
        await createActivity.mutateAsync({
          contact_id: contactId,
          type: 'reunion',
          content: `Reunión ${typeLabel} agendada para ${format(date, "d 'de' MMMM", { locale: es })}${notes ? `. ${notes}` : ''}`,
          created_by: profile.id,
        });
      }
      toast({ title: '📅 Reunión agendada' });
      onOpenChange(false);
      setDate(undefined);
      setMeetingType('');
      setNotes('');
    } catch {
      toast({ title: 'Error al agendar', variant: 'destructive' });
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-2xl text-sm font-bold text-[#002B49] transition-all placeholder:text-slate-300 glass-input focus:outline-none focus:ring-4 focus:ring-primary/10";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="w-[94%] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[2.5rem] p-0 border-none shadow-2xl bg-white/95 backdrop-blur-3xl focus:outline-none">
        <motion.div
           initial={{ scale: 0.9, opacity: 0, y: 20 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           transition={{ type: "spring", damping: 25, stiffness: 400 }}
           className="relative"
        >
          {/* BOTÓN CERRAR PREMIUM */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-[#002B49] transition-all z-50"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
            <DialogHeader className="p-0 text-left">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                   <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-heading font-black tracking-tight">Agendar Reunión</DialogTitle>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#002B49]/40">{contactName}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <label className={labelClass}>Fecha de la reunión *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(inputClass, "flex items-center justify-between", !date && "text-slate-300")}>
                      {date ? format(date, "d 'de' MMMM yyyy", { locale: es }) : 'Seleccionar fecha...'}
                      <CalendarIcon className="w-4 h-4 text-primary opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className={cn("p-4 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className={labelClass}>Canal / Tipo de reunión *</label>
                <div className="grid grid-cols-2 gap-3">
                  {meetingTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setMeetingType(t.value)}
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl border transition-all text-left group/btn",
                        meetingType === t.value 
                          ? "bg-white border-[#002B49] text-[#002B49] shadow-md ring-2 ring-[#002B49]/5" 
                          : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        meetingType === t.value ? "bg-[#03A7E1] text-white" : "bg-white text-slate-300 group-hover/btn:text-slate-400"
                      )}>
                        {t.emoji}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Notas de Preparación</label>
                <div className="relative group">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={cn(inputClass, "h-28 resize-none py-4 pr-12")}
                    placeholder="Objetivo de la reunión..."
                  />
                  <div className="absolute right-3 bottom-3">
                    <VoiceInputButton 
                      onTranscript={(t) => setNotes(prev => prev ? `${prev} ${t}` : t)}
                      className="h-9 w-9 bg-primary text-white rounded-[1rem] shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={updateStatus.isPending}
              className="w-full py-5 bg-[#002B49] text-white font-heading font-black rounded-2xl shadow-xl shadow-[#002B49]/20 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]"
            >
              {updateStatus.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Confirmar Agendamiento</span>
                </div>
              )}
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
