import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronDown, ChevronUp, X, UserPlus, Building2, TrendingUp, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCreateContact } from '@/hooks/useContacts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { calcSemanaLabel } from '@/lib/semana';
import { ContactStatus, Priority } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const SERVICIOS = ['B Corp', 'CSRD', 'Huella Carbono', 'ESG Reporting', 'Otro'];
const CERTIFICACIONES = ['Sin proceso', 'En evaluación', 'En proceso', 'Certificado'];
const EMPLEADOS = ['<10', '10-50', '50-250', '>250'];

const AddClientDrawer = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [form, setForm] = useState({
    empresa: '', nombre: '', apellido: '', email: '', telefono: '', linkedin: '',
    pipeline: 'captura' as 'captura' | 'cartera',
    estado: 'nuevo', prioridad: 'media', valor: '', notas: '', tipo: 'Cliente',
    servicio_interes: '', estado_certificacion: '', empleados_empresa: '',
    decision_maker: false, probabilidad_cierre: '',
  });
  const [semanaDate, setSemanaDate] = useState<Date>();
  const [esgOpen, setEsgOpen] = useState(false);
  const createContact = useCreateContact();
  const { user } = useAuth();

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'pipeline') {
        next.estado = value === 'captura' ? 'nuevo' : 'propuesta_solicitada';
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.empresa || !form.nombre || !form.apellido || !form.tipo) {
      toast({ title: 'Campos requeridos', description: 'Empresa, Nombre, Apellido y Tipo son obligatorios.', variant: 'destructive' });
      return;
    }
    try {
      const effectiveDate = semanaDate || new Date();
      const semanaLabel = calcSemanaLabel(effectiveDate);
      await createContact.mutateAsync({
        empresa: form.empresa,
        first_name: form.nombre,
        last_name: form.apellido,
        email: form.email || undefined,
        phone: form.telefono || undefined,
        linkedin_url: form.linkedin || undefined,
        pipeline: form.pipeline,
        status: form.estado as ContactStatus,
        prioridad: form.prioridad as Priority,
        valor_potencial: form.valor ? Number(form.valor) : undefined,
        probabilidad_cierre: form.probabilidad_cierre ? Number(form.probabilidad_cierre) : undefined,
        semana: semanaLabel,
        semana_date: format(effectiveDate, 'yyyy-MM-dd'),
        tipo: form.tipo,
        assigned_to: user?.id,
        is_primary: true,
        servicio_interes: form.servicio_interes || undefined,
        estado_certificacion: form.estado_certificacion || undefined,
        empleados_empresa: form.empleados_empresa || undefined,
        decision_maker: form.decision_maker,
      });
      toast({ title: '✅ Cliente registrado', description: `${form.nombre} ${form.apellido} añadido al sistema.` });
      onOpenChange(false);
      setForm({ empresa: '', nombre: '', apellido: '', email: '', telefono: '', linkedin: '', pipeline: 'captura', estado: 'nuevo', prioridad: 'media', valor: '', notas: '', tipo: 'Cliente', servicio_interes: '', estado_certificacion: '', empleados_empresa: '', decision_maker: false, probabilidad_cierre: '' });
      setSemanaDate(undefined);
      setEsgOpen(false);
    } catch (err) {
      const error = err as Error;
      toast({ 
        title: 'Error al registrar', 
        description: error.message || 'Verifica los datos del cliente.',
        variant: 'destructive' 
      });
    }
  };

  const inputClass = cn(
    "w-full px-4 py-3 rounded-2xl text-sm font-bold text-[#002B49] transition-all placeholder:text-slate-400 bg-slate-50/50 border border-slate-100",
    "focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 focus:outline-none"
  );
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block";

  const statusOptions = form.pipeline === 'captura' 
    ? [
        { value: 'nuevo', label: 'Nuevo', emoji: '🆕' },
        { value: 'agendado', label: 'Agendado', emoji: '📅' },
        { value: 'pendiente_propuesta', label: 'P. Propuesta', emoji: '📝' },
        { value: 'propuesta_mandada', label: 'P. Mandada', emoji: '📩' },
        { value: 'aplazado', label: 'Aplazado', emoji: '⏸️' },
        { value: 'perdido', label: 'Perdido', emoji: '❌' },
        { value: 'cerrado', label: 'Cerrado', emoji: '✅' },
      ]
    : [
        { value: 'propuesta_solicitada', label: 'P. Solicitada', emoji: '🙋‍♂️' },
        { value: 'propuesta_entregada', label: 'P. Entregada', emoji: '📄' },
        { value: 'aceptada', label: 'Aceptada', emoji: '🤝' },
        { value: 'prevision_cierre', label: 'Previsión', emoji: '📈' },
        { value: 'rechazada', label: 'Rechazada', emoji: '🚫' },
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="w-[92%] max-h-[92svh] sm:max-w-2xl rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden p-0 border-none shadow-2xl bg-white focus:outline-none flex flex-col">
        <motion.div
           initial={{ scale: 0.9, opacity: 0, y: 30 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           transition={{ type: "spring", damping: 25, stiffness: 400 }}
           className="flex-1 flex flex-col min-h-0"
        >
          {/* CABECERA FLOTANTE NAVY */}
          <div className="bg-[#002B49] p-8 text-white relative flex-shrink-0">
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-50"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
            <DialogHeader className="p-0 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                   <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-2xl tracking-tighter">Nueva Incorporación</DialogTitle>
                  <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-widest mt-0.5">Ventana de Creación Asset</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* CUERPO SCRILLABLE */}
          <div className="px-8 py-8 overflow-y-auto space-y-10 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-200">
            
            {/* BLOQUE I: IDENTIDAD INSTITUCIONAL */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-4 h-4 text-[#005A92]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#002B49]">Identidad Institucional</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Institución / Empresa *</label>
                  <input value={form.empresa} onChange={(e) => handleChange('empresa', e.target.value)} className={inputClass} placeholder="Nombre oficial" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nombre *</label>
                    <input value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Apellido *</label>
                    <input value={form.apellido} onChange={(e) => handleChange('apellido', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Email Directo</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass} placeholder="correo@empresa.com" />
                </div>
                <div>
                  <label className={labelClass}>Teléfono de Contacto</label>
                  <input type="tel" value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} className={inputClass} placeholder="+34..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Relación Institucional *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Cliente', 'Partner'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleChange('tipo', t)}
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
                <div>
                  <label className={labelClass}>Semana de Iteración</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(inputClass, "flex items-center justify-between font-bold", !semanaDate && "text-slate-300")}>
                        {semanaDate ? `${calcSemanaLabel(semanaDate)} · ${format(semanaDate, 'd MMM yyyy', { locale: es })}` : 'Seleccionar fecha...'}
                        <CalendarIcon className="w-4 h-4 text-[#005A92]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
                      <Calendar mode="single" selected={semanaDate} onSelect={setSemanaDate} initialFocus className={cn("p-4 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </section>

            {/* BLOQUE II: PERFIL COMERCIAL */}
            <section className="space-y-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-4 h-4 text-[#005A92]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#002B49]">Perfil Comercial</h3>
              </div>

              <div>
                <label className={labelClass}>Ubicación Pipeline</label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                  {(['captura', 'cartera'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleChange('pipeline', p)}
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
                <label className={labelClass}>Estatus Inicial</label>
                <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none">
                  {statusOptions.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleChange('estado', s.value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-xl border whitespace-nowrap transition-all shrink-0",
                        form.estado === s.value
                          ? "bg-[#002B49] border-[#002B49] text-white shadow-md scale-[1.05]"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <span className="text-sm">{s.emoji}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Prioridad</label>
                    <select value={form.prioridad} onChange={(e) => handleChange('prioridad', e.target.value)} className={cn(inputClass, "appearance-none bg-no-repeat bg-[right_1rem_center]")}>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Valor Prob. (€)</label>
                    <input type="number" value={form.valor} onChange={(e) => handleChange('valor', e.target.value)} className={inputClass} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Probabilidad de Éxito (%)</label>
                  <div className="relative">
                    <input type="number" min="0" max="100" value={form.probabilidad_cierre} onChange={(e) => handleChange('probabilidad_cierre', e.target.value)} className={inputClass} placeholder="—" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">%</span>
                  </div>
                </div>
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
                          <button key={s} type="button"
                            onClick={() => handleChange('servicio_interes', form.servicio_interes === s ? '' : s)}
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
                      <label className={labelClass}>Estado de Certificación</label>
                      <div className="flex flex-wrap gap-2">
                        {CERTIFICACIONES.map(c => (
                          <button key={c} type="button"
                            onClick={() => handleChange('estado_certificacion', form.estado_certificacion === c ? '' : c)}
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
                      <label className={labelClass}>Tamaño del Equipo</label>
                      <div className="flex gap-2">
                        {EMPLEADOS.map(e => (
                          <button key={e} type="button"
                            onClick={() => handleChange('empleados_empresa', form.empleados_empresa === e ? '' : e)}
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
                      <label className={labelClass}>C-Level / Decisor</label>
                      <button
                        type="button"
                        onClick={() => handleChange('decision_maker', !form.decision_maker)}
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

          {/* PIE DE VENTANA FLOTANTE */}
          <div className="p-8 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 flex gap-4 flex-shrink-0">
            <button 
              onClick={() => onOpenChange(false)}
              className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 font-heading font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-[10px]"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={createContact.isPending} 
              className="flex-[2] py-5 bg-[#002B49] text-white font-heading font-black rounded-2xl shadow-xl shadow-[#002B49]/20 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]"
            >
              {createContact.isPending ? 'Procesando...' : 'Incorporar Asset'}
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export { AddClientDrawer };
