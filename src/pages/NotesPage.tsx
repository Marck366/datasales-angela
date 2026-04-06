import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  Cloud, 
  Layout, 
  FileBox, 
  Lock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotesPage = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'files'>('templates');

  return (
    <AppLayout>
      <div className="px-4 pt-5">
        {/* ─── Header ─── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-heading font-black text-foreground tracking-tight">Nube</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Activos comerciales y documentación</p>
          </div>
          <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Beta</span>
          </div>
        </div>

        {/* ─── Selector Principal ─── */}
        <div className="flex gap-1.5 bg-white/40 dark:bg-black/20 p-1.5 rounded-2xl border border-white/20 backdrop-blur-3xl mb-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'templates' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-white/10"
            )}
          >
            <Layout className="w-4 h-4" />
            Plantillas
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'files' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-white/10"
            )}
          >
            <FileBox className="w-4 h-4" />
            Archivos
          </button>
        </div>

        {/* ─── Contenido ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >

            {/* ══ TAB: PLANTILLAS (EN DESARROLLO) ══ */}
            {activeTab === 'templates' && (
              <div className="py-24 text-center glass rounded-[3rem] border-dashed border-2 border-border/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10 px-6">
                  <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-primary/10">
                    <Layout className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-heading font-black mb-4 tracking-tight">Nube de Plantillas</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                    Estamos preparando un repositorio de mensajes y scripts de ventas de alto rendimiento para acelerar tus tratos.
                  </p>
                  <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-white/5 rounded-full border border-border/50">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Disponible próximamente</span>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB: ARCHIVOS (EN DESARROLLO) ══ */}
            {activeTab === 'files' && (
              <div className="py-24 text-center glass rounded-[3rem] border-dashed border-2 border-border/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none" />
                <div className="relative z-10 px-6">
                  <div className="bg-sky-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-sky-500/10">
                    <FileBox className="w-10 h-10 text-sky-500 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-heading font-black mb-4 tracking-tight">Centro de Activos</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                    Sube y gestiona catálogos, presentaciones e informes para tenerlos siempre a mano en cada visita comercial.
                  </p>
                  <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-white/5 rounded-full border border-border/50">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Disponible próximamente</span>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default NotesPage;
