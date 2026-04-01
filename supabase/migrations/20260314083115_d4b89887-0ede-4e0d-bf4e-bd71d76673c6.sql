
-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('admin', 'jefe_ventas', 'comercial')) DEFAULT 'comercial',
  avatar_color text DEFAULT '03A7E1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies viewable by authenticated"
  ON public.companies FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Companies insertable by authenticated"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Companies updatable by authenticated"
  ON public.companies FOR UPDATE TO authenticated
  USING (true);

-- Contacts table
CREATE TABLE public.contacts (
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

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_elevated_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role IN ('admin', 'jefe_ventas')
  )
$$;

CREATE POLICY "Contacts: elevated roles see all"
  ON public.contacts FOR SELECT TO authenticated
  USING (
    public.has_elevated_role(auth.uid()) OR assigned_to = auth.uid()
  );

CREATE POLICY "Contacts: authenticated can insert"
  ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Contacts: elevated or assigned can update"
  ON public.contacts FOR UPDATE TO authenticated
  USING (
    public.has_elevated_role(auth.uid()) OR assigned_to = auth.uid()
  );

CREATE POLICY "Contacts: elevated can delete"
  ON public.contacts FOR DELETE TO authenticated
  USING (public.has_elevated_role(auth.uid()));

-- Activities table
CREATE TABLE public.activities (
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

CREATE POLICY "Activities viewable by authenticated"
  ON public.activities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Activities insertable by authenticated"
  ON public.activities FOR INSERT TO authenticated
  WITH CHECK (true);

-- Events table
CREATE TABLE public.events (
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

CREATE POLICY "Events viewable by authenticated"
  ON public.events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Events updatable by authenticated"
  ON public.events FOR UPDATE TO authenticated
  USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for contacts and activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
