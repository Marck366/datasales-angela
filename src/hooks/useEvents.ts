import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { ESGEvent } from '@/types';

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const data = await eventsApi.list();
      return data.map((row) => ({
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
      await eventsApi.update(id, { attending });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<ESGEvent, 'id'>) => {
      await eventsApi.create(event);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
};
