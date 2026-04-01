import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUpdateContactStatus } from '@/hooks/useContacts';
import { useCreateActivity } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

const meetingTypes = [
  { value: 'presencial', label: 'Presencial', emoji: '🏢' },
  { value: 'telematica', label: 'Telemática', emoji: '💻' },
  { value: 'llamada', label: 'Llamada', emoji: '📞' },
  { value: 'videoconferencia', label: 'Videoconferencia', emoji: '📹' },
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

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-sky/50";
  const labelClass = "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Agendar reunión</DialogTitle>
          <p className="text-sm text-muted-foreground">{contactName}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Fecha de la reunión *</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(inputClass, "flex items-center justify-between", !date && "text-muted-foreground")}>
                  {date ? format(date, "d 'de' MMMM yyyy", { locale: es }) : 'Seleccionar fecha'}
                  <CalendarIcon className="w-4 h-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className={labelClass}>Tipo de reunión *</label>
            <div className="grid grid-cols-2 gap-2">
              {meetingTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setMeetingType(t.value)}
                  className={cn(
                    "py-3 rounded-xl text-center border border-border bg-card transition-all",
                    meetingType === t.value && "ring-2 ring-sky"
                  )}
                >
                  <span className="text-xl block">{t.emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Notas (opcional)</label>
            <div className="flex gap-2 items-start">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn(inputClass, "h-20 resize-none flex-1")}
                placeholder="Observaciones sobre la reunión..."
              />
              <VoiceInputButton 
                onTranscript={(t) => setNotes(prev => prev ? `${prev} ${t}` : t)}
                className="h-10 w-10 shrink-0 mt-0.5"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={updateStatus.isPending}
            className="w-full py-3 bg-sky text-accent-foreground font-heading font-bold rounded-xl active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {updateStatus.isPending ? 'Guardando...' : 'Agendar Reunión'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
