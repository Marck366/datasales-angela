import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Contact } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Sparkles } from 'lucide-react';

interface MailSmartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

const templates = [
  { key: 'primera', label: 'Primera prop.', subject: 'Propuesta de colaboración ESG — Ângela Impact Economy', body: (c: Contact) => `Estimado/a ${c.first_name},\n\nMe pongo en contacto desde Ângela Impact Economy para presentarle nuestra propuesta de consultoría ESG adaptada a las necesidades de ${c.company?.name}.\n\nEn el contexto actual de la directiva CSRD y los nuevos requisitos de reporting de sostenibilidad, creemos que podemos aportar un valor significativo a su organización.\n\n¿Le parecería bien agendar una breve llamada esta semana para explorar las posibilidades?\n\nUn cordial saludo,\nÂngela Impact Economy` },
  { key: 'seguimiento', label: 'Seguimiento', subject: 'Seguimiento — Ângela Impact Economy', body: (c: Contact) => `Hola ${c.first_name},\n\nEspero que esté bien. Le escribo para dar seguimiento a nuestra conversación anterior sobre los servicios de consultoría ESG para ${c.company?.name}.\n\n¿Ha tenido oportunidad de revisar la propuesta? Quedo a su disposición para resolver cualquier duda.\n\nSaludos cordiales,\nÂngela Impact Economy` },
  { key: 'cierre', label: 'Cierre', subject: 'Próximos pasos — Ângela Impact Economy', body: (c: Contact) => `Estimado/a ${c.first_name},\n\nGracias por su interés en nuestros servicios de consultoría ESG. Adjunto le envío la propuesta final para ${c.company?.name} con los detalles de alcance y condiciones.\n\n¿Podríamos agendar una reunión para formalizar los próximos pasos?\n\nQuedo a su disposición.\nÂngela Impact Economy` },
  { key: 'reactivacion', label: 'Reactivación', subject: 'Novedades ESG — Ângela Impact Economy', body: (c: Contact) => `Hola ${c.first_name},\n\nHace un tiempo tuvimos la oportunidad de hablar sobre las necesidades ESG de ${c.company?.name}. Con las últimas novedades regulatorias (CSRD, taxonomía UE), me gustaría retomar la conversación.\n\n¿Le interesaría una sesión informativa sin compromiso?\n\nUn saludo,\nÂngela Impact Economy` },
];

export const MailSmartDrawer = ({ open, onOpenChange, contact }: MailSmartDrawerProps) => {
  const [activeTemplate, setActiveTemplate] = useState(0);
  const template = templates[activeTemplate];
  const emailBody = template.body(contact);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    toast({ title: '📋 Copiado al portapapeles' });
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email || '')}&su=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92svh]">
        <DrawerHeader>
          <DrawerTitle className="font-heading text-xl flex items-center gap-2">
            Mail Smart ✉️
            <span className="bg-status-cerrado-bg text-status-cerrado-fg text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Generado con IA
            </span>
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 overflow-y-auto">
          {/* Template tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {templates.map((t, i) => (
              <button
                key={t.key}
                onClick={() => setActiveTemplate(i)}
                className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  i === activeTemplate ? 'bg-navy text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Email preview */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Para</label>
              <div className="px-3 py-2.5 bg-secondary rounded-xl text-sm">{contact.email || 'Sin email'}</div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Asunto</label>
              <div className="px-3 py-2.5 bg-secondary rounded-xl text-sm font-bold">{template.subject}</div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Mensaje</label>
              <div className="px-3 py-3 bg-secondary rounded-xl text-sm whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">{emailBody}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleCopy} className="flex items-center justify-center gap-2 py-3 bg-sky text-accent-foreground font-bold rounded-xl active:opacity-80 transition animate-pulse-sky">
              <Copy className="w-4 h-4" /> Copiar
            </button>
            <button onClick={handleOpenGmail} className="flex items-center justify-center gap-2 py-3 bg-navy text-primary-foreground font-bold rounded-xl active:opacity-80 transition">
              <ExternalLink className="w-4 h-4" /> Abrir en Gmail
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
