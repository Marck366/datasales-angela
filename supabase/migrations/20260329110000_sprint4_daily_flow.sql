-- Sprint 4: Flujo comercial diario (Fricción Cero)
-- Añade: next_step, score_ai

-- 1. Nuevas columnas en contacts para seguimiento y prioridad
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS next_step TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS score_ai INTEGER DEFAULT 0;

-- 2. Comentario de documentación para el campo next_step
COMMENT ON COLUMN public.contacts.next_step IS 'Almacena la acción inmediata a realizar con el cliente después del último contacto.';

-- 3. Asegurar que seguimiento_date existe (por si acaso no se aplicaron migraciones previas)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='seguimiento_date') THEN
        ALTER TABLE public.contacts ADD COLUMN seguimiento_date DATE;
    END IF;
END $$;
