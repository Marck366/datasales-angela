
-- 001: Añadir columna de estado si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 002: Limpieza de perfiles huérfanos (que no existen en auth.users)
-- Seteamos is_active = false para aquellos que no tengan correspondencia en la tabla de auth
-- Nota: La FK ON DELETE CASCADE debería haber hecho esto, pero esto asegura la limpieza de registros previos o fallidos.
UPDATE public.profiles p
SET is_active = false
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- 003: Actualizar RPC del Ranking para filtrar por usuarios activos
-- Esto asegura que tanto el Ranking como los filtros que dependen de él solo muestren gente real.
CREATE OR REPLACE FUNCTION public.get_dashboard_ranking()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT COALESCE(json_agg(row_data ORDER BY cerrados DESC, total DESC), '[]'::json)
  FROM (
    SELECT
      p.id,
      p.name,
      p.role,
      p.avatar_color,
      COUNT(c.id) AS total,
      COUNT(c.id) FILTER (WHERE c.status = 'cerrado') AS cerrados,
      COUNT(c.id) FILTER (WHERE c.status = 'agendado') AS agendados,
      COALESCE(SUM(c.valor_potencial), 0) AS valor
    FROM public.profiles p
    LEFT JOIN public.contacts c ON c.assigned_to = p.id
    WHERE p.is_active = true  -- <--- FILTRO DE ACTIVOS
    GROUP BY p.id, p.name, p.role, p.avatar_color
  ) row_data;
$$;
