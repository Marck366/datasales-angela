import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Profile, UserRole } from '@/types';

/**
 * Devuelve la lista de usuarios activos del equipo, derivada del endpoint
 * /dashboard/ranking (el backend no expone /users/). Mapea `user_id` → `id`
 * y rellena con placeholders los campos que ranking no incluye (email, role, created_at).
 */
export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const data = await dashboardApi.ranking();
      return data
        .map<Profile>((r) => ({
          id: r.user_id,
          name: r.name,
          email: '',
          role: (r.role as UserRole) || 'comercial',
          avatar_color: r.avatar_color || 'gray',
          created_at: '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
};
