-- SEC-001: Blindaje de Actividades
-- Paso 1: Eliminar la política insegura
DROP POLICY IF EXISTS "Activities viewable by authenticated" ON public.activities;

-- Paso 2: Crear política de acceso restringido
-- Solo pueden ver actividades si el usuario tiene rol elevado o es el asignado al contacto
CREATE POLICY "Activities viewable by assigned or elevated"
  ON public.activities FOR SELECT TO authenticated
  USING (
    public.has_elevated_role(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE id = activities.contact_id AND assigned_to = auth.uid()
    )
  );

-- SEC-003: Restricción de Empresas
-- Paso 3: Asegurar que solo roles elevados o creadores pueden modificar empresas
DROP POLICY IF EXISTS "Companies updatable by authenticated" ON public.companies;

CREATE POLICY "Companies updatable by elevated roles"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.has_elevated_role(auth.uid()));

-- Opcional: Permitir inserción a todos pero lectura global (ya está en la migración original)
