import { useAuth } from '@/hooks/useAuth';
import { useContacts } from '@/hooks/useContacts';
import { useAllActivities } from '@/hooks/useActivities';
import { AppLayout } from '@/components/layout/AppLayout';
import { Activity } from '@/types';
import { motion } from 'framer-motion';
import { LogOut, TrendingUp, Target, Briefcase, Activity as ActivityIcon, ChevronLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: allContacts = [], isLoading: loadingContacts } = useContacts();
  const { data: allActivities = [], isLoading: loadingActivities } = useAllActivities();

  // 1. Filtrar solo los datos del comercial actual
  const myContacts = useMemo(() => {
    if (!user) return [];
    return allContacts.filter(c => c.assigned_to === user.id);
  }, [allContacts, user]);

  const myActivities = useMemo(() => {
    if (!user) return [];
    return (allActivities as Activity[]).filter(a => a.created_by === user.id).slice(0, 10);
  }, [allActivities, user]);

  // 2. Calcular KPIs
  const kpis = useMemo(() => {
    const total = myContacts.length;
    let cerrados = 0;
    let carteraActiva = 0; // valor_potencial de nuevos + agendados
    let valorGanado = 0; // valor_potencial de cerrados

    myContacts.forEach(c => {
      if (c.status === 'cerrado') {
        cerrados++;
        if (c.valor_potencial) valorGanado += c.valor_potencial;
      }
      if (['nuevo', 'agendado'].includes(c.status) && c.valor_potencial) {
        carteraActiva += c.valor_potencial;
      }
    });

    const winRate = total > 0 ? ((cerrados / total) * 100).toFixed(1) : '0';

    return { total, cerrados, winRate, carteraActiva, valorGanado };
  }, [myContacts]);

  const fmtValor = (v: number) => {
    if (!v) return '0 €';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M €`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}k €`;
    return `${v.toLocaleString('es-ES')} €`;
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-8">
        {/* Cabecera y botón volver */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-full text-sm font-bold hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        {/* Perfil Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-10"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-sky flex items-center justify-center shadow-xl shadow-primary/20 border-4 border-background mb-4">
            <span className="text-4xl font-black text-primary-foreground">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <h1 className="text-2xl font-heading font-black text-foreground">{profile?.name || 'Usuario'}</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
            {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'jefe_ventas' ? 'Jefe de Ventas' : 'Comercial'}
          </p>
        </motion.div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-[2rem] p-5 border border-border flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="w-12 h-12 text-primary" />
            </div>
            <span className="text-sm font-bold text-muted-foreground mb-1">Win Rate</span>
            <span className="text-4xl font-heading font-black text-foreground tabular-nums relative z-10">{kpis.winRate}%</span>
            <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">{kpis.cerrados} de {kpis.total}</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-[2rem] p-5 border border-border flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Briefcase className="w-12 h-12 text-sky" />
            </div>
            <span className="text-sm font-bold text-muted-foreground mb-1">Cartera Activa</span>
            <span className="text-2xl font-heading font-black text-sky tabular-nums relative z-10">{fmtValor(kpis.carteraActiva)}</span>
            <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">Potencial Bruto</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-2 glass rounded-[2rem] p-5 border border-border flex items-center justify-between relative overflow-hidden group"
          >
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-24 h-24 text-lime" />
            </div>
            <div>
              <span className="text-sm font-bold text-muted-foreground block mb-1">Valor Ganado</span>
              <span className="text-xl font-bold text-muted-foreground">Impacto total facturado</span>
            </div>
            <span className="text-3xl font-heading font-black text-lime tabular-nums relative z-10">
              {fmtValor(kpis.valorGanado)}
            </span>
          </motion.div>
        </div>

        {/* Última Actividad */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ActivityIcon className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-bold text-lg text-foreground">Tu última actividad</h2>
          </div>

          <div className="glass rounded-[2rem] p-5 border border-border">
            {loadingActivities || loadingContacts ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-secondary animate-pulse rounded-xl" />)}
              </div>
            ) : myActivities.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">Aún no hay actividad registrada.</p>
            ) : (
              <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                <div className="space-y-6">
                  {myActivities.map((act: Activity) => {
                    // Encontrar a qué contacto pertenece para mostrar el nombre
                    const targetContact = allContacts.find(c => c.id === act.contact_id);
                    const contactName = targetContact ? (targetContact.company?.name || `${targetContact.first_name} ${targetContact.last_name}`) : 'Contacto desconocido';

                    return (
                      <div key={act.id} className="relative flex items-start justify-between">
                        {/* Indicador de timeline */}
                        <div className="absolute left-0 mt-1 flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border z-10 shadow-sm">
                          {act.type === 'estado' ? <TrendingUp className="w-4 h-4 text-sky" /> : <ActivityIcon className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        
                        <div className="pl-14 w-full">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-foreground">{contactName}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                              {new Date(act.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          {act.type === 'estado' ? (
                            <p className="text-xs text-muted-foreground">
                              Cambió estado a <b className="text-foreground">{act.new_value}</b>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              [<span className="uppercase text-[9px] font-bold">{act.type}</span>] {act.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
