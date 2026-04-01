import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from '@/types';

const mapActivity = (row: any): Activity => ({
  id: row.id,
  contact_id: row.contact_id,
  type: row.type,
  content: row.content,
  old_value: row.old_value,
  new_value: row.new_value,
  created_by: row.created_by,
  created_by_profile: row.profiles ? { id: row.profiles.id, name: row.profiles.name, email: row.profiles.email, role: row.profiles.role, avatar_color: row.profiles.avatar_color, created_at: row.profiles.created_at } : undefined,
  created_at: row.created_at,
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
      return (data || []).map(mapActivity);
    },
  });
};

export const useAllActivities = () => {
  return useQuery({
    queryKey: ['activities', 'all'],
    staleTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*, profiles!activities_created_by_fkey(*), contacts(*, companies(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...mapActivity(row),
        contact: row.contacts ? {
          id: row.contacts.id,
          first_name: row.contacts.first_name,
          last_name: row.contacts.last_name,
          company: row.contacts.companies,
          status: row.contacts.status,
          prioridad: row.contacts.prioridad,
          seguimiento_date: row.contacts.seguimiento_date,
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
