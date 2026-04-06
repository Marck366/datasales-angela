import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateContact } from '@/hooks/useContacts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Star } from 'lucide-react';

interface AddSubContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

export const AddSubContactModal = ({ open, onOpenChange, companyId, companyName }: AddSubContactModalProps) => {
  const { profile } = useAuth();
  const createContact = useCreateContact();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setJobTitle('');
    setIsPrimary(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: 'Nombre y apellido son obligatorios', variant: 'destructive' });
      return;
    }

    try {
      await createContact.mutateAsync({
        empresa: companyName,
        company_id: companyId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        job_title: jobTitle.trim() || undefined,
        is_primary: isPrimary,
        assigned_to: profile?.id,
      });
      toast({ title: '✓ Sub-contacto añadido' });
      resetForm();
      onOpenChange(false);
    } catch {
      toast({ title: 'Error al crear sub-contacto', variant: 'destructive' });
    }
  };

  const inputClass = "w-full px-4 py-3.5 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-slate-300 dark:placeholder:text-white/20";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40 mb-1.5 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-[2.5rem] overflow-hidden border-0">
        {/* Header */}
        <div className="bg-[#002B49] px-8 py-6 relative">
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors">✕</button>
          <DialogHeader>
            <DialogTitle className="text-white font-heading font-black text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Añadir Sub-contacto
            </DialogTitle>
            <p className="text-white/50 text-xs font-body mt-1">{companyName}</p>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Nombre" />
            </div>
            <div>
              <label className={labelClass}>Apellido *</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Apellido" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Cargo</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} placeholder="Ej: Director RRHH, CEO..." />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="email@empresa.com" />
          </div>

          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+34 600 000 000" />
          </div>

          {/* Primary toggle */}
          <button
            type="button"
            onClick={() => setIsPrimary(!isPrimary)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all ${
              isPrimary
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10'
                : 'border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5'
            }`}
          >
            <Star className={`w-5 h-5 transition-colors ${isPrimary ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-white/20'}`} />
            <div className="text-left">
              <span className={`text-xs font-bold ${isPrimary ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-white/50'}`}>
                Contacto Principal
              </span>
              <p className="text-[10px] text-slate-400 dark:text-white/30">Reemplazará al actual como principal</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 font-heading font-black rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all uppercase tracking-[0.2em] text-[10px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={createContact.isPending}
            className="flex-[2] py-4 bg-[#002B49] text-white font-heading font-black rounded-2xl shadow-xl shadow-[#002B49]/20 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]"
          >
            {createContact.isPending ? 'Guardando...' : 'Añadir Contacto'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
