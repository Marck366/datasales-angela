import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi, type ActivityOut } from '@/lib/api';
import { useContacts } from '@/hooks/useContacts';
import { Activity, ActivityType, ContactStatus, Priority, UserRole } from '@/types';

const mapActivity = (row: ActivityOut): Activity => ({
  id: row.id,
  contact_id: row.contact_id || '',
  type: (row.type as ActivityType) || 'nota',
  content: row.content || undefined,
  old_value: row.old_value || undefined,
  new_value: row.new_value || undefined,
  created_by: row.created_by || '',
  created_by_profile: row.creator
    ? {
        id: row.creator.id,
        name: row.creator.name,
        email: '',
        role: (row.creator.role as UserRole) || 'comercial',
        avatar_color: row.creator.avatar_color || 'gray',
        created_at: '',
      }
    : undefined,
  created_at: row.created_at || '',
});

export const useActivities = (contactId?: string) => {
  return useQuery({
    queryKey: ['activities', contactId],
    queryFn: async () => {
      const data = await activitiesApi.list(contactId);
      return data.map(mapActivity);
    },
  });
};

/**
 * Devuelve todas las actividades + un objeto `contact` resumido por cada una,
 * resuelto client-side cruzando con la cache de contactos (`useContacts`).
 */
export const useAllActivities = () => {
  const { data: contacts } = useContacts(null);

  const query = useQuery({
    queryKey: ['activities', 'all'],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: !!contacts,
    queryFn: async () => {
      const rows = await activitiesApi.list();
      return rows.map(mapActivity);
    },
  });

  const activitiesWithContacts = useMemo(() => {
    if (!query.data || !contacts) return undefined;
    const byId = new Map((contacts || []).map((c) => [c.id, c]));
    return query.data.map(act => {
      const c = byId.get(act.contact_id);
      return {
        ...act,
        contact: c ? {
            id: c.id,
            first_name: c.first_name,
            last_name: c.last_name,
            company: c.company,
            status: (c.status as ContactStatus) || 'nuevo',
            prioridad: (c.prioridad as Priority) || 'media',
            seguimiento_date: c.seguimiento_date || undefined,
        } : undefined
      };
    });
  }, [query.data, contacts]);

  return { ...query, data: activitiesWithContacts };
};

export const useCreateActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      contact_id: string;
      type: string;
      content?: string;
      old_value?: string;
      new_value?: string;
    }) => {
      await activitiesApi.create({
        contact_id: input.contact_id,
        type: input.type,
        content: input.content ?? null,
        old_value: input.old_value ?? null,
        new_value: input.new_value ?? null,
      });
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['activities', vars.contact_id] });
      qc.invalidateQueries({ queryKey: ['activities', 'all'] });
    },
  });
};
