-- ==========================================
-- SCRIPT DE MIGRACIÓN SEGURO (IDEMPOTENTE)
-- ==========================================
-- Este script no fallará si una tabla ya existe.
-- Añadirá lo que falte y actualizará las políticas.

-- 1. Tablas principales con IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('admin', 'jefe_ventas', 'comercial')) DEFAULT 'comercial',
  avatar_color text DEFAULT '03A7E1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Companies viewable by authenticated" ON public.companies;
DROP POLICY IF EXISTS "Companies insertable by authenticated" ON public.companies;
DROP POLICY IF EXISTS "Companies updatable by authenticated" ON public.companies;
CREATE POLICY "Companies viewable by authenticated" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Companies insertable by authenticated" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Companies updatable by authenticated" ON public.companies FOR UPDATE TO authenticated USING (true);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  linkedin_url text,
  job_title text,
  assigned_to uuid REFERENCES public.profiles(id),
  status text CHECK (status IN ('nuevo','agendado','cerrado','perdido','nevera')) DEFAULT 'nuevo',
  semana text,
  scheduled_date date,
  valor_potencial numeric,
  prioridad text CHECK (prioridad IN ('alta','media','baja')) DEFAULT 'media',
  tipo text DEFAULT 'Cliente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Nuevas columnas en Contacts (por si ya existía sin ellas)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS meeting_type text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS semana_date date;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS seguimiento_date date;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_elevated_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role IN ('admin', 'jefe_ventas'))
$$;

DROP POLICY IF EXISTS "Contacts: elevated roles see all" ON public.contacts;
DROP POLICY IF EXISTS "Contacts: authenticated can insert" ON public.contacts;
DROP POLICY IF EXISTS "Contacts: elevated or assigned can update" ON public.contacts;
DROP POLICY IF EXISTS "Contacts: elevated can delete" ON public.contacts;
CREATE POLICY "Contacts: elevated roles see all" ON public.contacts FOR SELECT TO authenticated USING (public.has_elevated_role(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Contacts: authenticated can insert" ON public.contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Contacts: elevated or assigned can update" ON public.contacts FOR UPDATE TO authenticated USING (public.has_elevated_role(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Contacts: elevated can delete" ON public.contacts FOR DELETE TO authenticated USING (public.has_elevated_role(auth.uid()));

-- Activities
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  type text CHECK (type IN ('nota','llamada','email','whatsapp','reunion','estado')) NOT NULL,
  content text,
  old_value text,
  new_value text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activities viewable by authenticated" ON public.activities;
DROP POLICY IF EXISTS "Activities insertable by authenticated" ON public.activities;
CREATE POLICY "Activities viewable by authenticated" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activities insertable by authenticated" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date,
  city text,
  type text,
  sector text,
  description text,
  website text,
  attending boolean DEFAULT false,
  notes text
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events viewable by authenticated" ON public.events;
DROP POLICY IF EXISTS "Events updatable by authenticated" ON public.events;
CREATE POLICY "Events viewable by authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Events updatable by authenticated" ON public.events FOR UPDATE TO authenticated USING (true);

-- Funciones y Triggers (Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime Subscriptions Seguras
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contacts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'activities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
EXCEPTION WHEN OTHERS THEN 
  -- Ignorar errores si la publicación no existe en absoluto
END $$;

ALTER TABLE public.contacts REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;

-- Funciones del Dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT json_build_object('total', COUNT(*), 'nuevo', COUNT(*) FILTER (WHERE status = 'nuevo'), 'agendado', COUNT(*) FILTER (WHERE status = 'agendado'), 'cerrado', COUNT(*) FILTER (WHERE status = 'cerrado'), 'perdido', COUNT(*) FILTER (WHERE status = 'perdido'), 'nevera', COUNT(*) FILTER (WHERE status = 'nevera')) FROM public.contacts;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_ranking()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT COALESCE(json_agg(row_data ORDER BY cerrados DESC, total DESC), '[]'::json) FROM (SELECT p.id, p.name, p.email, p.role, p.avatar_color, COUNT(c.id) AS total, COUNT(c.id) FILTER (WHERE c.status = 'cerrado') AS cerrados, COUNT(c.id) FILTER (WHERE c.status = 'agendado') AS agendados, COALESCE(SUM(c.valor_potencial), 0) AS valor FROM public.profiles p LEFT JOIN public.contacts c ON c.assigned_to = p.id GROUP BY p.id, p.name, p.email, p.role, p.avatar_color) row_data;
$$;

-- Seeds iniciales usando INSERT IGNORE / ON CONFLICT
INSERT INTO public.companies (id, name, sector) VALUES
  ('00000000-0000-0000-0000-000000000001', 'TRANSPORTES MARITIM', 'Logística'),
  ('00000000-0000-0000-0000-000000000002', 'COPISA', 'Construcción'),
  ('00000000-0000-0000-0000-000000000003', 'CALCONUT', 'Alimentación'),
  ('00000000-0000-0000-0000-000000000004', 'MIRAI', 'Tecnología')
ON CONFLICT (id) DO NOTHING;
