-- SEC-005: Limpieza de PII en Ranking de Comercial
-- Ocultamos el email para evitar la exportación de la base de datos de usuarios por parte de cualquier comercial.
CREATE OR REPLACE FUNCTION public.get_dashboard_ranking()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT COALESCE(json_agg(row_data ORDER BY cerrados DESC, total DESC), '[]'::json) 
  FROM (
    SELECT 
      p.id, 
      p.name, 
      -- p.email,  <-- ELIMINADO POR SEGURIDAD (PII)
      p.role, 
      p.avatar_color, 
      COUNT(c.id) AS total, 
      COUNT(c.id) FILTER (WHERE c.status = 'cerrado') AS cerrados, 
      COUNT(c.id) FILTER (WHERE c.status = 'agendado') AS agendados, 
      COALESCE(SUM(c.valor_potencial), 0) AS valor 
    FROM public.profiles p 
    LEFT JOIN public.contacts c ON c.assigned_to = p.id 
    GROUP BY p.id, p.name, p.role, p.avatar_color
  ) row_data;
$$;

-- SEC-006: Control de Inserción en Empresas
-- Evitamos que un atacante con acceso a la API pueda inyectar empresas basura.
-- Solo roles elevado pueden dar de alta empresas ahora.
DROP POLICY IF EXISTS "Companies insertable by authenticated" ON public.companies;

CREATE POLICY "Companies insertable by elevated roles"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.has_elevated_role(auth.uid()));

-- SEC-007: Blindaje de Eventos (Incluido por ser de alto impacto externo)
-- Evitamos que se pueda manipular o borrar la agenda de eventos.
DROP POLICY IF EXISTS "Events updatable by authenticated" ON public.events;

CREATE POLICY "Events updatable by elevated roles"
  ON public.events FOR UPDATE TO authenticated
  USING (public.has_elevated_role(auth.uid()));
