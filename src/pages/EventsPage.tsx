import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEvents, useCreateEvent } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, ExternalLink, Calendar, Plus, Euro, Info, Tag, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const cities = ['Todas', 'Valencia', 'Madrid', 'Barcelona', 'Alicante'];
const quarters = ['Todos', 'Q1', 'Q2', 'Q3', 'Q4'];

const getQuarter = (dateStr: string) => {
  if (!dateStr) return 'Q1';
  const month = new Date(dateStr).getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
};

const EventsPage = () => {
  const [cityFilter, setCityFilter] = useState('Todas');
  const [quarterFilter, setQuarterFilter] = useState('Todos');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: allEvents = [], isLoading } = useEvents();
  const createEvent = useCreateEvent();

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    city: '',
    type: 'ESG',
    sector: 'Sostenibilidad',
    description: '',
    website: '',
    attending: false,
    price_per_attendee: 0,
    notes: ''
  });

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      if (cityFilter !== 'Todas' && e.city !== cityFilter) return false;
      if (quarterFilter !== 'Todos' && getQuarter(e.date) !== quarterFilter) return false;
      return true;
    });
  }, [cityFilter, quarterFilter, allEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.city) {
      toast.error('Por favor, rellena los campos obligatorios');
      return;
    }

    try {
      await createEvent.mutateAsync(formData);
      toast.success('Evento creado correctamente');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        date: '',
        city: '',
        type: 'ESG',
        sector: 'Sostenibilidad',
        description: '',
        website: '',
        attending: false,
        price_per_attendee: 0,
        notes: ''
      });
    } catch (error) {
      toast.error('Error al crear el evento');
      console.error(error);
    }
  };

  return (
    <AppLayout>
      {/* ─── Background orbs ─── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full mix-blend-screen opacity-30" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-sky/10 blur-[80px] rounded-full mix-blend-screen opacity-20" />
      </div>

      <div className="relative z-10 px-4 pt-6 pb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-1 tracking-tight">Eventos ESG</h1>
            <p className="text-muted-foreground text-xs sm:text-sm font-medium">Directorio de eventos del sector impacto</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto rounded-full px-6 py-6 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95 h-12">
                <Plus className="w-5 h-5" />
                <span className="font-black uppercase tracking-widest text-[10px]">Añadir Evento</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[94%] sm:max-w-[550px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-white/20 dark:border-white/10 rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] p-0 border-none focus:outline-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 400,
                  bounce: 0.3
                }}
                className="p-5 sm:p-8"
              >
                <DialogHeader className="mb-4 sm:mb-6">
                  <DialogTitle className="text-2xl font-heading font-black tracking-tight flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-primary" />
                    Nuevo Evento ESG
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground font-medium">
                    Registra un nuevo evento para que todo el equipo esté informado.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Nombre del Evento *</Label>
                      <Input 
                        id="name" 
                        placeholder="Ej: ESG & Impact Summit 2026" 
                        className="rounded-2xl glass-input"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Fecha *</Label>
                      <Input 
                        id="date" 
                        type="date" 
                        className="rounded-2xl glass-input"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Ciudad *</Label>
                      <Input 
                        id="city" 
                        placeholder="Ej: Valencia" 
                        className="rounded-2xl glass-input"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Tipo</Label>
                      <Input 
                        id="type" 
                        placeholder="Ej: Congreso" 
                        className="rounded-2xl glass-input"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Precio por Asistente</Label>
                      <div className="relative">
                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="price" 
                          type="number" 
                          placeholder="0" 
                          className="rounded-2xl glass-input pl-10"
                          value={formData.price_per_attendee}
                          onChange={(e) => setFormData({...formData, price_per_attendee: Number(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="website" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Website URL</Label>
                      <Input 
                        id="website" 
                        type="url" 
                        placeholder="https://..." 
                        className="rounded-2xl glass-input"
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="description" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Descripción</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Breve descripción del evento..." 
                        className="rounded-2xl glass-input min-h-[80px]"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between glass p-4 rounded-2xl border-white/5">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-black uppercase tracking-widest">¿Asistimos?</Label>
                        <p className="text-[10px] text-muted-foreground">Marca si algún miembro del equipo asistirá.</p>
                      </div>
                      <Switch 
                        checked={formData.attending}
                        onCheckedChange={(checked) => setFormData({...formData, attending: checked})}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="w-full rounded-2xl py-6 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                      disabled={createEvent.isPending}
                    >
                      {createEvent.isPending ? 'Guardando...' : 'Guardar Evento'}
                    </Button>
                  </DialogFooter>
                </form>
              </motion.div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ─── Filtros ─── */}
        <div className="glass p-1.5 rounded-[1.5rem] sm:rounded-[2rem] mb-10 flex flex-col sm:flex-row gap-2 sm:gap-4 shadow-sm border-white/5 overflow-hidden">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-1 py-1 flex-1">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => setCityFilter(c)}
                className={cn(
                  "whitespace-nowrap px-6 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  cityFilter === c
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-white/5"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="h-px w-full bg-border/20 sm:hidden" />
          <div className="h-10 w-[1px] bg-border/40 hidden sm:block" />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-1 py-1">
            {quarters.map((q) => (
              <button
                key={q}
                onClick={() => setQuarterFilter(q)}
                className={cn(
                  "whitespace-nowrap px-6 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  quarterFilter === q
                    ? "bg-slate-800 text-white shadow-lg"
                    : "text-muted-foreground hover:bg-white/5"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 bg-card rounded-[2.5rem] animate-pulse glass" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filtered.map((event, i) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="glass rounded-[2.5rem] p-8 border border-white/5 hover:bg-card/40 transition-all group relative overflow-hidden flex flex-col"
                >
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <h3 className="font-heading font-black text-foreground text-2xl leading-tight flex-1 group-hover:text-primary transition-colors tracking-tight">
                      {event.name}
                    </h3>
                    {event.attending && (
                      <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ml-3 shrink-0 border border-emerald-500/20 backdrop-blur-sm">
                        Asistimos
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 relative z-10 mb-6">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {format(new Date(event.date), "d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{event.city}</span>
                    </div>
                    {event.price_per_attendee !== undefined && event.price_per_attendee > 0 && (
                      <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-black text-primary uppercase tracking-widest">
                          {event.price_per_attendee} € <span className="text-[9px] opacity-70">/pax</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground/80 leading-relaxed mb-8 flex-1">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto relative z-10 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {event.type && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
                          <Info className="w-3 h-3" />
                          {event.type}
                        </span>
                      )}
                    </div>
                    
                    {event.website && (
                      <a
                        href={event.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-primary/10 rounded-full text-primary hover:bg-primary hover:text-white transition-all transform hover:rotate-12"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center glass rounded-[3rem] border-dashed border-2 border-border/40">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-black mb-2 tracking-tight">No se encontraron eventos</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Prueba a cambiar los filtros o añade un nuevo evento ESG al listado.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EventsPage;
