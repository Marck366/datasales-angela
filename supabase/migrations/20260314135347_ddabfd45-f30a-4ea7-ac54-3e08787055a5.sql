-- Create tables if they don't exist (safe version)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'comercial',
    avatar_color TEXT DEFAULT '03A7E1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sector TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    job_title TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'nuevo',
    semana TEXT,
    semana_date DATE,
    scheduled_date DATE,
    meeting_type TEXT,
    prioridad TEXT DEFAULT 'media',
    tipo TEXT DEFAULT 'Cliente',
    seguimiento_date DATE,
    valor_potencial NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT,
    old_value TEXT,
    new_value TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE,
    city TEXT,
    type TEXT,
    sector TEXT,
    description TEXT,
    website TEXT,
    attending BOOLEAN DEFAULT false,
    notes TEXT
);

-- Create/update functions
CREATE OR REPLACE FUNCTION public.has_elevated_role(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role IN ('admin', 'jefe_ventas'))
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT json_build_object(
    'total', COUNT(*), 'nuevo', COUNT(*) FILTER (WHERE status = 'nuevo'),
    'agendado', COUNT(*) FILTER (WHERE status = 'agendado'),
    'cerrado', COUNT(*) FILTER (WHERE status = 'cerrado'),
    'perdido', COUNT(*) FILTER (WHERE status = 'perdido'),
    'nevera', COUNT(*) FILTER (WHERE status = 'nevera')
  ) FROM public.contacts
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_ranking()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(json_agg(row_data ORDER BY cerrados DESC, total DESC), '[]'::json)
  FROM (
    SELECT p.id, p.name, p.email, p.role, p.avatar_color,
      COUNT(c.id) AS total, COUNT(c.id) FILTER (WHERE c.status = 'cerrado') AS cerrados,
      COUNT(c.id) FILTER (WHERE c.status = 'agendado') AS agendados,
      COALESCE(SUM(c.valor_potencial), 0) AS valor
    FROM public.profiles p LEFT JOIN public.contacts c ON c.assigned_to = p.id
    GROUP BY p.id, p.name, p.email, p.role, p.avatar_color
  ) row_data
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure consistency
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Companies viewable by authenticated" ON public.companies;
DROP POLICY IF EXISTS "Companies insertable by authenticated" ON public.companies;
DROP POLICY IF EXISTS "Companies updatable by authenticated" ON public.companies;
DROP POLICY IF EXISTS "Contacts: elevated roles see all" ON public.contacts;
DROP POLICY IF EXISTS "Contacts: authenticated can insert" ON public.contacts;
DROP POLICY IF EXISTS "Contacts: elevated or assigned can update" ON public.contacts;
DROP POLICY IF EXISTS "Contacts: elevated can delete" ON public.contacts;
DROP POLICY IF EXISTS "Activities viewable by authenticated" ON public.activities;
DROP POLICY IF EXISTS "Activities insertable by authenticated" ON public.activities;
DROP POLICY IF EXISTS "Events viewable by authenticated" ON public.events;
DROP POLICY IF EXISTS "Events updatable by authenticated" ON public.events;

-- Recreate policies
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Companies viewable by authenticated" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Companies insertable by authenticated" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Companies updatable by authenticated" ON public.companies FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Contacts: elevated roles see all" ON public.contacts FOR SELECT TO authenticated USING (has_elevated_role(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Contacts: authenticated can insert" ON public.contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Contacts: elevated or assigned can update" ON public.contacts FOR UPDATE TO authenticated USING (has_elevated_role(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Contacts: elevated can delete" ON public.contacts FOR DELETE TO authenticated USING (has_elevated_role(auth.uid()));

CREATE POLICY "Activities viewable by authenticated" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activities insertable by authenticated" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Events viewable by authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Events updatable by authenticated" ON public.events FOR UPDATE TO authenticated USING (true);
