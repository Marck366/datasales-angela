import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, ExternalLink, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const cities = ['Todas', 'Valencia', 'Madrid', 'Barcelona', 'Alicante'];
const quarters = ['Todos', 'Q1', 'Q2', 'Q3', 'Q4'];

const getQuarter = (dateStr: string) => {
  const month = new Date(dateStr).getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
};

const EventsPage = () => {
  const [cityFilter, setCityFilter] = useState('Todas');
  const [quarterFilter, setQuarterFilter] = useState('Todos');
  const { data: allEvents = [], isLoading } = useEvents();

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      if (cityFilter !== 'Todas' && e.city !== cityFilter) return false;
      if (quarterFilter !== 'Todos' && getQuarter(e.date) !== quarterFilter) return false;
      return true;
    });
  }, [cityFilter, quarterFilter, allEvents]);

  return (
    <AppLayout>
      {/* ─── Background orbs ─── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full mix-blend-screen opacity-30" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-sky/10 blur-[80px] rounded-full mix-blend-screen opacity-20" />
      </div>

      <div className="relative z-10 px-4 pt-6 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-black text-foreground mb-1">Eventos ESG</h1>
          <p className="text-muted-foreground text-sm">Directorio de eventos del sector impacto</p>
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                cityFilter === c
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'glass text-muted-foreground hover:bg-card/60'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {quarters.map((q) => (
            <button
              key={q}
              onClick={() => setQuarterFilter(q)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                quarterFilter === q
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'glass text-muted-foreground hover:bg-card/60'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-5 border border-border/40 hover:bg-card/60 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-heading font-black text-foreground text-lg leading-snug flex-1 group-hover:text-primary transition-colors">
                    {event.name}
                  </h3>
                  {event.attending && (
                    <span className="bg-primary/15 text-primary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ml-2 shrink-0 border border-primary/20 ring-1 ring-primary/10">
                      Asistimos
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {format(new Date(event.date), "d 'de' MMMM", { locale: es })}
                  </span>
                  <span className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {event.city}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground/90 leading-relaxed mb-4">
                    {event.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto">
                  {event.type ? (
                    <span className="bg-secondary/50 text-muted-foreground text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-border/40">
                      {event.type}
                    </span>
                  ) : <div />}
                  
                  {event.website && (
                    <a
                      href={event.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-widest hover:underline"
                    >
                      Más info <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Sin eventos para estos filtros.</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EventsPage;
