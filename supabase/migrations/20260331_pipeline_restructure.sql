-- 20260331_pipeline_restructure.sql
-- Fase 1: Añadir columna pipeline y ampliar estados

-- 1. Añadir columna pipeline con valor por defecto 'captura'
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS pipeline TEXT DEFAULT 'captura'
  CHECK (pipeline IN ('captura', 'cartera'));

-- 2. Eliminar el constraint antiguo para poder limpiar los datos
-- Se elimina primero porque el valor 'aplazado' no existe en la regla vieja
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_status_check;

-- 3. Limpieza de estados antiguos
-- Pasamos estados obsoletos a los nuevos nombres
UPDATE public.contacts SET status = 'aplazado' WHERE status = 'pospuesto' OR status = 'nevera';

-- 4. Aplicar el NUEVO CHECK constraint con los 12 estados permitidos
ALTER TABLE public.contacts ADD CONSTRAINT contacts_status_check 
  CHECK (status IN (
    'nuevo', 'agendado', 'pendiente_propuesta', 'propuesta_mandada', 'aplazado', 'perdido', 'cerrado', -- Captura
    'propuesta_solicitada', 'propuesta_entregada', 'aceptada', 'prevision_cierre', 'rechazada'        -- Cartera
  ));

-- 5. Comentarios para documentación
COMMENT ON COLUMN public.contacts.pipeline IS 'Define si el contacto está en el flujo de Captación o en Cartera de clientes existentes';
COMMENT ON COLUMN public.contacts.status IS 'Estado específico dentro del pipeline correspondiente';