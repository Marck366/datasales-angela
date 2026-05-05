import { useState, useCallback } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, Loader2, RefreshCw } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact, Activity } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  activities: Activity[];
}

export const PrepararReunionDrawer = ({ open, onOpenChange, contact, activities }: Props) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const generateBriefing = useCallback(async () => {
    setLoading(true);
    setSummary(null);
    try {
      const recent = activities.slice(0, 5).map((a) => ({
        type: a.type,
        content: a.content || '',
      }));
      const data = await aiApi.prepararReunion(contact.id, recent);
      setSummary(data.briefing);
      toast({ title: 'Briefing generado con éxito' });
    } catch (err) {
      const error = err as Error;
      console.error('Error IA:', error);
      toast({ 
        title: 'Error al generar briefing', 
        description: error.message || 'La IA está descansando, intenta de nuevo en un momento.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  }, [contact, activities]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background/80 backdrop-blur-xl border-t border-border rounded-t-[2.5rem] max-h-[85vh]">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-muted/30 my-4" />
        
        <DrawerHeader className="px-6">
          <div className="flex items-center gap-3 mb-1">
            <DrawerTitle className="text-2xl font-heading font-black">Resumen cliente</DrawerTitle>
            <span className="bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-bold px-1.5 py-0.5 tracking-tighter shadow-sm">
              IA
            </span>
          </div>
          <DrawerDescription className="text-muted-foreground font-medium">
            {contact.first_name} {contact.last_name} · {contact.company?.name || 'Empresa desconocida'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-4 overflow-y-auto custom-scrollbar min-h-[300px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center gap-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                  <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                </div>
                <div>
                  <p className="font-heading font-bold text-lg">Analizando el historial...</p>
                  <p className="text-sm text-muted-foreground">Extrayendo puntos clave para el resumen</p>
                </div>
              </motion.div>
            ) : summary ? (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 prose prose-sm dark:prose-invert max-w-none pb-8"
              >
                <div className="glass p-5 rounded-[2rem] border-primary/10 shadow-inner">
                  {summary.split('\n').map((line, i) => {
                    if (line.startsWith('**')) {
                       const title = line.replace(/\*\*/g, '');
                       return (
                         <div key={i} className="flex items-center gap-2 text-[10px] font-black text-primary/70 uppercase tracking-widest mt-6 mb-3 first:mt-0">
                           {title}
                         </div>
                       );
                    }
                    if (line.trim().startsWith('-')) {
                      return (
                        <div key={i} className="flex items-start gap-3 mb-2 px-1">
                          <div className="w-1 h-1 rounded-full bg-primary/40 mt-2 shrink-0" />
                          <p className="text-sm m-0 leading-relaxed text-foreground/90 font-medium">{line.replace(/^- /, '')}</p>
                        </div>
                      );
                    }
                    return line.trim() ? (
                      <p key={i} className="text-sm leading-relaxed text-foreground/90 font-medium mb-4 px-1">{line}</p>
                    ) : null;
                  })}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-card/40 rounded-[2rem] border border-dashed border-border/60">
                <Brain className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium px-10">
                  Pulsa el botón inferior para generar un briefing estratégico basado en tus interacciones pasadas.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <DrawerFooter className="px-6 pb-8 pt-2">
          <Button 
            onClick={generateBriefing} 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-2xl shadow-lg shadow-primary/25 active:scale-95 transition-all text-base gap-2"
          >
            {loading ? (
               <Loader2 className="w-5 h-5 animate-spin" />
            ) : summary ? (
               <>
                 <RefreshCw className="w-5 h-5" />
                 Regenerar briefing
               </>
            ) : (
               <>
                 <Sparkles className="w-5 h-5" />
                 Generar briefing
               </>
            )}
          </Button>
          <p className="text-[9px] text-center text-muted-foreground/60 uppercase font-bold tracking-tighter mt-2">
            Desarrollado por el equipo de IA de DatâSales
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
