import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ESGEvent } from '@/types';

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => ({
        ...row,
        date: row.date ?? '',
        city: row.city ?? '',
        attending: row.attending ?? false,
      })) as ESGEvent[];
    },
  });
};

export const useToggleEventAttending = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, attending }: { id: string; attending: boolean }) => {
      const { error } = await supabase.from('events').update({ attending }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
};
