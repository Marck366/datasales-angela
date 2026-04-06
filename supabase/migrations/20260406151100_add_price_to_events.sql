
-- 001: Añadir columna de precio por asistente a la tabla de eventos
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price_per_attendee NUMERIC DEFAULT 0;

-- 002: Asegurar que los eventos existentes tengan un valor por defecto si es nulo
UPDATE public.events SET price_per_attendee = 0 WHERE price_per_attendee IS NULL;
