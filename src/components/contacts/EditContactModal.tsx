import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Contact, ContactStatus, PipelineType } from '@/types';
import { useUpdateContact } from '@/hooks/useContacts';
import { toast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, X, Pencil, Building2, TrendingUp, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICIOS = ['B Corp', 'CSRD', 'Huella Carbono', 'ESG Reporting', 'Otro'];
const CERTIFICACIONES = ['Sin proceso', 'En evaluación', 'En proceso', 'Certificado'];
const EMPLEADOS = ['<10', '10-50', '50-250', '>250'];

const statusOptionsByPipeline: Record<string, { label: string; emoji: string; key: ContactStatus }[]> = {
  captura: [
    { label: 'Nuevo', emoji: '🆕', key: 'nuevo' },
    { label: 'Agendado', emoji: '📅', key: 'agendado' },
    { label: 'P. Propuesta', emoji: '📝', key: 'pendiente_propuesta' },
    { label: 'P. Mandada', emoji: '📩', key: 'propuesta_mandada' },
    { label: 'Cerrado', emoji: '✅', key: 'cerrado' },
    { label: 'Perdido', emoji: '❌', key: 'perdido' },
    { label: 'Aplazado', emoji: '⏸️', key: 'aplazado' },
  ],
  cartera: [
    { label: 'P. Solicitada', emoji: '🙋‍♂️', key: 'propuesta_solicitada' },
    { label: 'P. Entregada', emoji: '📄', key: 'propuesta_entregada' },
    { label: 'Aceptada', emoji: '🤝', key: 'aceptada' },
    { label: 'Previsión', emoji: '📈', key: 'prevision_cierre' },
    { label: 'Rechazada', emoji: '🚫', key: 'rechazada' },
  ],
};

interface EditContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

export const EditContactModal = ({ open, onOpenChange, contact }: EditContactModalProps) => {
  const [form, setForm] = useState({
    empresa: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    tipo: 'Cliente',
    prioridad: 'media',
    valor_potencial: '',
    probabilidad_cierre: '',
    fecha_cierre_probable: '',
    servicio_interes: '',
    estado_certificacion: '',
    empleados_empresa: '',
    decision_maker: false,
    next_step: '',
    pipeline: 'captura' as PipelineType,
    status: 'nuevo' as ContactStatus,
  });
  const [esgOpen, setEsgOpen] = useState(false);
  const updateContact = useUpdateContact();

  useEffect(() => {
    if (contact && open) {
      setForm({
        empresa: contact.company?.name || '',
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email || '',
        phone: contact.phone || '',
        tipo: contact.tipo || 'Cliente',
        prioridad: contact.prioridad || 'media',
        valor_potencial: contact.valor_potencial?.toString() || '',
        probabilidad_cierre: contact.probabilidad_cierre?.toString() || '',
        fecha_cierre_probable: contact.fecha_cierre_probable || '',
        servicio_interes: contact.servicio_interes || '',
        estado_certificacion: contact.estado_certificacion || '',
        empleados_empresa: contact.empleados_empresa || '',
        decision_maker: contact.decision_maker ?? false,
        next_step: contact.next_step || '',
        pipeline: contact.pipeline || 'captura',
        status: contact.status || 'nuevo',
      });
      if (contact.servicio_interes || contact.estado_certificacion || contact.empleados_empresa) {
        setEsgOpen(true);
      }
    }
  }, [contact, open]);

  const initialFormSnapshot = useMemo(() => {
    if (!contact) return '';
    return JSON.stringify({
      empresa: contact.company?.name || '',
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      tipo: contact.tipo || 'Cliente',
      prioridad: contact.prioridad || 'media',
      valor_potencial: contact.valor_potencial?.toString() || '',
      probabilidad_cierre: contact.probabilidad_cierre?.toString() || '',
      fecha_cierre_probable: contact.fecha_cierre_probable || '',
      servicio_interes: contact.servicio_interes || '',
      estado_certificacion: contact.estado_certificacion || '',
      empleados_empresa: contact.empleados_empresa || '',
      decision_maker: contact.decision_maker ?? false,
      next_step: contact.next_step || '',
      pipeline: contact.pipeline || 'captura',
      status: contact.status || 'nuevo',
    });
  }, [contact]);

  const isDirty = open && JSON.stringify(form) !== initialFormSnapshot;

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast({ title: 'Nombre y apellido son obligatorios', variant: 'destructive' });
      return;
    }
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        empresa: form.empresa,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        tipo: form.tipo,
        prioridad: form.prioridad,
        valor_potencial: form.valor_potencial ? Number(form.valor_potencial) : null,
        probabilidad_cierre: form.probabilidad_cierre ? Number(form.probabilidad_cierre) : null,
        fecha_cierre_probable: form.fecha_cierre_probable || null,
        servicio_interes: form.servicio_interes || null,
        estado_certificacion: form.estado_certificacion || null,
        empleados_empresa: form.empleados_empresa || null,
        decision_maker: form.decision_maker,
        // Bypass next_step if column doesn't exist (handled in hook or passed as null)
        next_step: form.next_step || null,
        pipeline: form.pipeline,
      });
      toast({ title: '✅ Contacto actualizado', description: 'Los cambios se han sincronizado con éxito.' });
      onOpenChange(false);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      toast({ 
        title: 'Error al actualizar', 
        description: error.message || 'Verifica los datos del contacto.',
        variant: 'destructive' 
      });
    }
  };

  const f = (field: keyof typeof form, value: string | number | boolean | null) => 
    setForm(prev => ({ ...prev, [field]: value }));
  
  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-[#002B49] focus:outline-none focus:ring-4 focus:ring-[#005A92]/10 focus:bg-white transition-all placeholder:text-slate-300";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block";
  
  const currentPipelineStages = statusOptionsByPipeline[form.pipeline || 'captura'] || statusOptionsByPipeline.captura;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="w-[92%] max-h-[92svh] sm:max-w-2xl rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden p-0 border-none shadow-2xl bg-white focus:outline-none">
        <div className="bg-[#002B49] p-8 text-white relative">
          <DialogClose className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-50">
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader className="p-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                 <Pencil className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="font-heading text-2xl tracking-tighter">Editar Perfil Asset</DialogTitle>
                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-widest mt-0.5">Gestión de Registro Maestro</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
          
          {/* BLOQUE I: IDENTIDAD INSTITUCIONAL */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-4 h-4 text-[#005A92]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#002B49]">Datos Identitarios</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Institución / Empresa</label>
                <input value={form.empresa} onChange={e => f('empresa', e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre *</label>
                  <input value={form.first_name} onChange={e => f('first_name', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Apellido *</label>
                  <input value={form.last_name} onChange={e => f('last_name', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Email Permanente</label>
                <input type="email" value={form.email} onChange={e => f('email', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Teléfono Directo</label>
                <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Relación Institucional *</label>
              <div className="grid grid-cols-2 gap-3">
                {['Cliente', 'Partner'].map(t => (
                  <button key={t} type="button" onClick={() => f('tipo', t)}
                    className={cn(
                      "py-4 rounded-2xl flex items-center justify-center gap-2 border transition-all font-black uppercase tracking-widest text-[9px]",
                      form.tipo === t 
                        ? "bg-white border-[#002B49] text-[#002B49] shadow-md ring-2 ring-[#002B49]/5" 
                        : "bg-slate-50 border-slate-100 text-slate-400"
                    )}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t === 'Cliente' ? '#03A7E1' : '#8DC63F' }} />
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* BLOQUE II: PERFIL COMERCIAL & PIPELINE */}
          <section className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-4 h-4 text-[#005A92]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#002B49]">Estrategia Commercial</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Ubicación Pipeline</label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                  {(['captura', 'cartera'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => f('pipeline', p)}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        form.pipeline === p ? "bg-white text-[#002B49] shadow-sm" : "text-slate-400 hover:text-slate-500"
                      )}
                    >
                      {p === 'captura' ? '📥 Captura' : '💼 Cartera'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Prioridad Actual</label>
                <div className="grid grid-cols-3 gap-2">
                  {['alta', 'media', 'baja'].map(p => (
                    <button key={p} type="button" onClick={() => f('prioridad', p)}
                      className={cn(
                        "py-3.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                        form.prioridad === p
                          ? "bg-[#002B49] border-[#002B49] text-white shadow-md"
                          : "bg-white border-slate-100 text-slate-400"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Valor Potencial (€)</label>
                  <input type="number" value={form.valor_potencial} onChange={e => f('valor_potencial', e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className={labelClass}>Probabilidad (%)</label>
                  <input type="number" min="0" max="100" value={form.probabilidad_cierre} onChange={e => f('probabilidad_cierre', e.target.value)} className={inputClass} placeholder="—" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Fecha Cierre Previsto</label>
                <input type="date" value={form.fecha_cierre_probable} onChange={e => f('fecha_cierre_probable', e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Siguiente Paso Estratégico</label>
              <input value={form.next_step} onChange={e => f('next_step', e.target.value)} className={cn(inputClass, "italic font-normal")} placeholder="Define la acción inmediata..." />
            </div>
          </section>

          {/* BLOQUE III: 🌱 ESG INDICATORS */}
          <section className="pt-4">
            <button
              type="button"
              onClick={() => setEsgOpen(o => !o)}
              className={cn(
                "w-full flex items-center justify-between py-5 px-6 rounded-3xl transition-all border",
                esgOpen ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={cn("w-5 h-5", esgOpen ? "animate-pulse" : "opacity-40")} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Indicadores Estratégicos ESG</span>
              </div>
              {esgOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 opacity-40" />}
            </button>

            {esgOpen && (
              <div className="mt-8 space-y-8 pl-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Servicio de Interés</label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICIOS.map(s => (
                        <button key={s} type="button" onClick={() => f('servicio_interes', form.servicio_interes === s ? '' : s)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                            form.servicio_interes === s 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md" 
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Certificación</label>
                    <div className="flex flex-wrap gap-2">
                      {CERTIFICACIONES.map(c => (
                        <button key={c} type="button" onClick={() => f('estado_certificacion', form.estado_certificacion === c ? '' : c)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                            form.estado_certificacion === c 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md" 
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Tamaño Organización</label>
                    <div className="flex gap-2">
                      {EMPLEADOS.map(e => (
                        <button key={e} type="button" onClick={() => f('empleados_empresa', form.empleados_empresa === e ? '' : e)}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            form.empleados_empresa === e 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md" 
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Interlocutor Directo</label>
                    <button
                      type="button"
                      onClick={() => f('decision_maker', !form.decision_maker)}
                      className={cn(
                        "flex items-center gap-4 px-6 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all w-full",
                        form.decision_maker 
                          ? "bg-white border-emerald-600 text-emerald-700 shadow-md ring-2 ring-emerald-50" 
                          : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        form.decision_maker ? "border-emerald-600 bg-emerald-600" : "border-slate-200"
                      )}>
                        {form.decision_maker && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      Target: Decision Maker
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 p-8 bg-white dark:bg-[#001a2d] border-t border-slate-100 dark:border-white/10 flex gap-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 font-heading font-black rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all uppercase tracking-[0.2em] text-[10px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={updateContact.isPending || !isDirty}
            className={cn(
              "flex-[2] py-5 bg-[#002B49] text-white font-heading font-black rounded-2xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]",
              isDirty
                ? "shadow-2xl shadow-[#00AEEF]/30 animate-pulse-subtle"
                : "shadow-xl shadow-[#002B49]/20"
            )}
          >
            {updateContact.isPending ? 'Guardando...' : isDirty ? 'Guardar Cambios' : 'Sin cambios'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
