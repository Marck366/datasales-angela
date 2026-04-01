CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'nuevo', COUNT(*) FILTER (WHERE status = 'nuevo'),
    'agendado', COUNT(*) FILTER (WHERE status = 'agendado'),
    'cerrado', COUNT(*) FILTER (WHERE status = 'cerrado'),
    'perdido', COUNT(*) FILTER (WHERE status = 'perdido'),
    'nevera', COUNT(*) FILTER (WHERE status = 'nevera')
  )
  FROM public.contacts;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_ranking()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(json_agg(row_data ORDER BY cerrados DESC, total DESC), '[]'::json)
  FROM (
    SELECT 
      p.id,
      p.name,
      p.email,
      p.role,
      p.avatar_color,
      COUNT(c.id) AS total,
      COUNT(c.id) FILTER (WHERE c.status = 'cerrado') AS cerrados,
      COUNT(c.id) FILTER (WHERE c.status = 'agendado') AS agendados,
      COALESCE(SUM(c.valor_potencial), 0) AS valor
    FROM public.profiles p
    LEFT JOIN public.contacts c ON c.assigned_to = p.id
    GROUP BY p.id, p.name, p.email, p.role, p.avatar_color
  ) row_data;
$$;