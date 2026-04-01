-- Sprint 3: campos ESG, valor ponderado, forecast

-- 1. Campos de cualificación ESG
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS servicio_interes TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS estado_certificacion TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS empleados_empresa TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS decision_maker BOOLEAN DEFAULT false;

-- 2. Campos de forecast / probabilidad
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS probabilidad_cierre INTEGER;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS fecha_cierre_probable DATE;

-- 3. Constraints de validación (opcionales, no bloquean nada si el valor es NULL)
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_probabilidad_check;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_probabilidad_check
  CHECK (probabilidad_cierre IS NULL OR (probabilidad_cierre >= 0 AND probabilidad_cierre <= 100));
