import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Contact } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Copy, Sparkles, Mail, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MailSmartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

const templates = [
  { key: 'primera', label: '1ª Propuesta', subject: 'Propuesta de colaboración ESG — Ângela Impact Economy', body: (c: Contact) => `Estimado/a ${c.first_name},\n\nMe pongo en contacto desde Ângela Impact Economy para presentarle nuestra propuesta de consultoría ESG adaptada a las necesidades de ${c.company?.name || 'su organización'}.\n\nEn el contexto actual de la directiva CSRD y los nuevos requisitos de reporting de sostenibilidad, creemos que podemos aportar un valor significativo.\n\n¿Le parecería bien agendar una breve llamada esta semana para explorar las posibilidades?\n\nUn cordial saludo,\nÂngela Impact Economy` },
  { key: 'seguimiento', label: 'Seguimiento', subject: 'Seguimiento — Ângela Impact Economy', body: (c: Contact) => `Hola ${c.first_name},\n\nEspero que esté bien. Le escribo para dar seguimiento a nuestra conversación anterior sobre los servicios de consultoría ESG para ${c.company?.name || 'su organización'}.\n\n¿Ha tenido oportunidad de revisar la propuesta? Quedo a su disposición para resolver cualquier duda.\n\nSaludos cordiales,\nÂngela Impact Economy` },
  { key: 'cierre', label: 'Cierre', subject: 'Próximos pasos — Ângela Impact Economy', body: (c: Contact) => `Estimado/a ${c.first_name},\n\nGracias por su interés en nuestros servicios de consultoría ESG. Adjunto le envío la propuesta final para ${c.company?.name || 'su organización'} con los detalles de alcance y condiciones.\n\n¿Podríamos agendar una reunión para formalizar los próximos pasos?\n\nQuedo a su disposición.\nÂngela Impact Economy` },
  { key: 'reactivacion', label: 'Reactivación', subject: 'Novedades ESG — Ângela Impact Economy', body: (c: Contact) => `Hola ${c.first_name},\n\nHace un tiempo tuvimos la oportunidad de hablar sobre las necesidades ESG de ${c.company?.name || 'su organización'}. Con las últimas novedades regulatorias (CSRD, taxonomía UE), me gustaría retomar la conversación.\n\n¿Le interesaría una sesión informativa sin compromiso?\n\nUn saludo,\nÂngela Impact Economy` },
];

export const MailSmartDrawer = ({ open, onOpenChange, contact }: MailSmartDrawerProps) => {
  const [activeTemplate, setActiveTemplate] = useState(0);
  const template = templates[activeTemplate];
  const emailBody = template.body(contact);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    toast({ title: '📋 Copiado al portapapeles' });
  };

  const handleOpenOutlook = () => {
    if (!contact.email) {
      toast({
        title: 'Falta el email del contacto',
        description: 'Añade un email al contacto antes de redactar.',
        variant: 'destructive',
      });
      return;
    }

    const MAX_URL_LENGTH = 2000;
    const to = encodeURIComponent(contact.email);
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(emailBody);
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subject}&body=${body}`;

    if (outlookUrl.length <= MAX_URL_LENGTH) {
      window.open(outlookUrl, '_blank');
      return;
    }

    // Fallback: el cliente de mail del SO suele aceptar URLs más largas que un deeplink web
    const mailtoUrl = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    if (mailtoUrl.length <= 8000) {
      window.location.href = mailtoUrl;
      toast({
        title: 'Email muy largo para Outlook web',
        description: 'Se ha abierto tu cliente de correo predeterminado.',
      });
      return;
    }

    // Último recurso: copiar el texto
    navigator.clipboard.writeText(emailBody);
    toast({
      title: 'Email demasiado largo',
      description: 'Hemos copiado el texto al portapapeles. Pégalo en tu cliente de correo.',
      variant: 'destructive',
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92svh] bg-white/95 dark:bg-[#001a2d]/98 backdrop-blur-3xl border-none shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden selection:bg-primary/20">
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-sky-blue/5 dark:to-transparent pointer-events-none" />
        <div className="mx-auto w-12 h-1.5 bg-foreground/10 rounded-full my-3" />
        
        <DrawerHeader className="pb-2 border-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shadow-sm">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start translate-y-0.5">
                <DrawerTitle className="font-heading text-xl text-navy dark:text-white leading-tight">Mail Smart</DrawerTitle>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">IA REDACCIÓN</span>
              </div>
            </div>
            
            <div className="hidden sm:flex px-4 py-1.5 bg-accent/10 rounded-full border border-accent/20 items-center gap-2 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-black text-accent-foreground uppercase tracking-[0.2em]">{contact.first_name} Active</span>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-6 sm:px-12 py-8 overflow-y-auto custom-scrollbar">
          {/* Compact Segmented Control */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-navy/5 backdrop-blur-xl">
              {templates.map((t, i) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTemplate(i)}
                  className={`relative px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-tight transition-all duration-500 ${
                    i === activeTemplate ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {i === activeTemplate && (
                    <motion.div
                      layoutId="cleanMailTab"
                      className="absolute inset-0 bg-navy dark:bg-primary rounded-xl shadow-lg shadow-navy/20 dark:shadow-primary/20"
                      transition={{ type: 'spring', bounce: 0.1, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTemplate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-4"
            >
              {/* Header Fields - Minimalist */}
              <div className="space-y-1.5 border-b border-navy/5 dark:border-white/5 pb-5">
                <div className="flex items-center gap-4 px-2">
                  <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest w-12">Para</span>
                  <div className="flex-1 text-[15px] font-medium text-foreground tracking-tight">
                    {contact.email || 'Sin especificar'}
                  </div>
                </div>
                <div className="flex items-start gap-4 px-2 pt-2">
                  <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest w-12 mt-1.5">Asunto</span>
                  <div className="flex-1 text-[15px] font-bold text-navy dark:text-sky-blue leading-tight py-1">
                    {template.subject}
                  </div>
                </div>
              </div>

              {/* Message Body - Pure Clean Window */}
              <div className="pt-4">
                <div className="glass-input rounded-[2.5rem] px-8 py-10 text-[16px] leading-relaxed max-h-[42svh] overflow-y-auto custom-scrollbar border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/20 text-foreground/90 font-medium selection:bg-primary/20 shadow-inner">
                  {emailBody}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Row - Minimalist Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 pb-6">
            <motion.button 
              whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy} 
              className="w-full sm:w-auto px-8 py-4.5 font-bold text-[11px] uppercase tracking-[.2em] text-muted-foreground hover:text-navy dark:hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <Copy className="w-4 h-4 opacity-40" /> Copiar Texto
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenOutlook} 
              className="w-full sm:w-auto px-10 py-5 bg-navy dark:bg-primary text-white font-black text-[12px] uppercase tracking-[.2em] rounded-2xl shadow-2xl shadow-navy/20 dark:shadow-primary/20 transition-all flex items-center justify-center gap-4"
            >
              <Send className="w-4 h-4" /> Enviar en Outlook
            </motion.button>
          </div>
          
          <div className="flex justify-center mt-4 opacity-10">
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Intelligence Powered Compose</span>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
