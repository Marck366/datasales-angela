-- 20260403000000_rls_production_hardening.sql
-- Cierre de huecos de seguridad antes de producción
-- Referencia: auditoría pre-producción 2026-04-03

-- ============================================================
-- ACTIVITIES: añadir UPDATE y DELETE restringidos
-- El creador de la actividad puede editarla; solo roles elevados pueden borrar
-- ============================================================

DROP POLICY IF EXISTS "Activities updatable by creator or elevated" ON public.activities;
CREATE POLICY "Activities updatable by creator or elevated"
  ON public.activities FOR UPDATE TO authenticated
  USING (
    public.has_elevated_role(auth.uid()) OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Activities deletable by elevated" ON public.activities;
CREATE POLICY "Activities deletable by elevated"
  ON public.activities FOR DELETE TO authenticated
  USING (public.has_elevated_role(auth.uid()));

-- ============================================================
-- EVENTS: añadir INSERT y DELETE
-- Solo roles elevados (admin/jefe_ventas) gestionan la agenda de eventos
-- ============================================================

DROP POLICY IF EXISTS "Events insertable by elevated roles" ON public.events;
CREATE POLICY "Events insertable by elevated roles"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.has_elevated_role(auth.uid()));

DROP POLICY IF EXISTS "Events deletable by elevated roles" ON public.events;
CREATE POLICY "Events deletable by elevated roles"
  ON public.events FOR DELETE TO authenticated
  USING (public.has_elevated_role(auth.uid()));

-- ============================================================
-- PROFILES: bloquear INSERT directo (ya lo gestiona el trigger handle_new_user)
-- y bloquear DELETE desde cliente (solo service_role puede borrar usuarios)
-- ============================================================

DROP POLICY IF EXISTS "Profiles not directly insertable" ON public.profiles;
CREATE POLICY "Profiles not directly insertable"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Profiles not deletable by client" ON public.profiles;
CREATE POLICY "Profiles not deletable by client"
  ON public.profiles FOR DELETE TO authenticated
  USING (false);
