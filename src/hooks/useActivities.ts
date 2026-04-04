import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, ActivityType, ContactStatus, Priority, UserRole } from '@/types';
import { Tables } from '@/integrations/supabase/types';

type ActivityRow = Tables<'activities'> & {
  profiles: Tables<'profiles'> | null;
  contacts?: (Tables<'contacts'> & { companies: Tables<'companies'> | null }) | null;
};

const mapActivity = (row: ActivityRow): Activity => ({
  id: row.id,
  contact_id: row.contact_id || '',
  type: (row.type as ActivityType) || 'nota',
  content: row.content || undefined,
  old_value: row.old_value || undefined,
  new_value: row.new_value || undefined,
  created_by: row.created_by || '',
  created_by_profile: row.profiles ? { 
    id: row.profiles.id, 
    name: row.profiles.name, 
    email: row.profiles.email, 
    role: (row.profiles.role as UserRole) || 'comercial', 
    avatar_color: row.profiles.avatar_color || 'gray', 
    created_at: row.profiles.created_at || '' 
  } : undefined,
  created_at: row.created_at || '',
});

export const useActivities = (contactId?: string) => {
  return useQuery({
    queryKey: ['activities', contactId],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select('*, profiles!activities_created_by_fkey(*)')
        .order('created_at', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as ActivityRow[] || []).map(mapActivity);
    },
  });
};

export const useAllActivities = () => {
  return useQuery({
    queryKey: ['activities', 'all'],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*, profiles!activities_created_by_fkey(*), contacts(*, companies(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const rows = data as ActivityRow[];
      return (rows || []).map((row) => ({
        ...mapActivity(row),
        contact: row.contacts ? {
          id: row.contacts.id,
          first_name: row.contacts.first_name,
          last_name: row.contacts.last_name,
          company: row.contacts.companies ? {
            id: row.contacts.companies.id,
            name: row.contacts.companies.name,
            sector: row.contacts.companies.sector || undefined,
            created_at: row.contacts.companies.created_at || ''
          } : undefined,
          status: (row.contacts.status as ContactStatus) || 'nuevo',
          prioridad: (row.contacts.prioridad as Priority) || 'media',
          seguimiento_date: row.contacts.seguimiento_date || undefined,
        } : undefined,
      }));
    },
  });
};

export const useCreateActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contact_id: string; type: string; content?: string; old_value?: string; new_value?: string; created_by: string }) => {
      const { error } = await supabase.from('activities').insert(input);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['activities', vars.contact_id] });
      qc.invalidateQueries({ queryKey: ['activities', 'all'] });
    },
  });
};
