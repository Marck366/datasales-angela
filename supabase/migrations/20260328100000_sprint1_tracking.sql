-- Sprint 1: rastreo del estado del cliente
-- Añade: lost_reason, status_changed_at, last_activity_at

-- 1. Nuevas columnas en contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- 2. Trigger: actualizar status_changed_at cuando cambia el status
CREATE OR REPLACE FUNCTION public.set_status_changed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_status_changed_at ON public.contacts;
CREATE TRIGGER trg_status_changed_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_status_changed_at();

-- 3. Trigger: actualizar last_activity_at en contacts cuando se registra una interacción real
CREATE OR REPLACE FUNCTION public.update_contact_last_activity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type IN ('llamada', 'email', 'whatsapp', 'reunion') THEN
    UPDATE public.contacts
    SET last_activity_at = NEW.created_at
    WHERE id = NEW.contact_id
      AND (last_activity_at IS NULL OR last_activity_at < NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_last_activity ON public.activities;
CREATE TRIGGER trg_update_last_activity
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_activity();

-- 4. Retroactivo: rellenar last_activity_at con la última interacción existente
UPDATE public.contacts c
SET last_activity_at = (
  SELECT MAX(a.created_at)
  FROM public.activities a
  WHERE a.contact_id = c.id
    AND a.type IN ('llamada', 'email', 'whatsapp', 'reunion')
)
WHERE EXISTS (
  SELECT 1 FROM public.activities a
  WHERE a.contact_id = c.id
    AND a.type IN ('llamada', 'email', 'whatsapp', 'reunion')
);
