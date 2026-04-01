-- Migración: nevera → pospuesto
-- 1. Migrar datos existentes
UPDATE public.contacts SET status = 'pospuesto' WHERE status = 'nevera';

-- 2. Cambiar el CHECK constraint
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('nuevo', 'agendado', 'cerrado', 'perdido', 'pospuesto'));

-- 3. Actualizar get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT json_build_object(
    'total',      COUNT(*),
    'nuevo',      COUNT(*) FILTER (WHERE status = 'nuevo'),
    'agendado',   COUNT(*) FILTER (WHERE status = 'agendado'),
    'cerrado',    COUNT(*) FILTER (WHERE status = 'cerrado'),
    'perdido',    COUNT(*) FILTER (WHERE status = 'perdido'),
    'pospuesto',  COUNT(*) FILTER (WHERE status = 'pospuesto')
  )
  FROM public.contacts;
$$;
