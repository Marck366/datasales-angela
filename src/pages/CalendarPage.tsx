import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useContacts } from '@/hooks/useContacts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { StatusBadge } from '@/components/contacts/StatusBadge';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { data: allContacts = [] } = useContacts();

  const scheduledContacts = allContacts.filter((c) => c.scheduled_date);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOffset = (getDay(days[0]) + 6) % 7;

  const contactsForDate = selectedDate
    ? scheduledContacts.filter((c) => c.scheduled_date && isSameDay(new Date(c.scheduled_date), selectedDate))
    : [];

  const hasDot = (day: Date) =>
    scheduledContacts.some((c) => c.scheduled_date && isSameDay(new Date(c.scheduled_date), day));

  return (
    <AppLayout>
      <div className="px-4 pt-5">
        <h1 className="text-3xl font-heading font-black text-foreground mb-5">Agenda</h1>

        {/* ─── Navegación de mes ─── */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2.5 rounded-xl glass active:opacity-70 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-heading font-bold text-lg capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2.5 rounded-xl glass active:opacity-70 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Grid del calendario ─── */}
        <div className="glass rounded-2xl p-3 mb-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dot = hasDot(day);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative py-2 rounded-xl text-sm font-body transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/40'
                      : isToday
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'hover:bg-muted/60'
                  }`}
                >
                  {format(day, 'd')}
                  {dot && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {format(selectedDate, "d 'de' MMMM", { locale: es })}
            </h3>
            {contactsForDate.length > 0 ? (
              contactsForDate.map((c) => (
                <div key={c.id} className="glass rounded-2xl p-4 mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-foreground">{c.company?.name}</p>
                    <p className="text-sm text-muted-foreground">{c.first_name} {c.last_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <a href={`tel:${c.phone}`} className="p-2 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                      <Phone className="w-4 h-4 text-primary" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Sin contactos agendados.</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
