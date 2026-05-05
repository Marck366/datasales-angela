import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { contactsApi, companiesApi, type ContactApiResponse } from '@/lib/api';
import { Contact, ContactStatus, PipelineType, Priority, UserRole } from '@/types';

/** Invalida caches de React Query afectadas por cambios en contactos. */
export function invalidateContactCaches(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['contacts'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['dashboard_stats'] });
  qc.invalidateQueries({ queryKey: ['dashboard_ranking'] });
}

const mapContact = (row: ContactApiResponse): Contact => ({
  id: row.id,
  company_id: row.company_id || '',
  company: row.company
    ? {
        id: row.company.id,
        name: row.company.name,
        sector: row.company.sector || undefined,
        created_at: '',
      }
    : undefined,
  first_name: row.first_name,
  last_name: row.last_name || '',
  email: row.email || undefined,
  phone: row.phone || undefined,
  linkedin_url: row.linkedin_url || undefined,
  job_title: row.job_title || undefined,
  assigned_to: row.assigned_to || '',
  assigned_profile: row.assignee
    ? {
        id: row.assignee.id,
        name: row.assignee.name,
        email: '',
        role: 'comercial' as UserRole,
        avatar_color: row.assignee.avatar_color || 'gray',
        created_at: '',
      }
    : undefined,
  status: (row.status as ContactStatus) || 'nuevo',
  pipeline: (row.pipeline as PipelineType) || 'captura',
  semana: row.semana || undefined,
  semana_date: row.semana_date || undefined,
  scheduled_date: row.scheduled_date || undefined,
  meeting_type: row.meeting_type || undefined,
  valor_potencial: row.valor_potencial || undefined,
  prioridad: (row.prioridad as Priority) || 'media',
  tipo: row.tipo || 'Cliente',
  seguimiento_date: row.seguimiento_date || undefined,
  lost_reason: row.lost_reason || undefined,
  status_changed_at: undefined,
  last_activity_at: undefined,
  servicio_interes: row.servicio_interes || undefined,
  estado_certificacion: row.estado_certificacion || undefined,
  empleados_empresa: row.empleados_empresa || undefined,
  decision_maker: row.decision_maker ?? false,
  is_primary: row.is_primary ?? false,
  probabilidad_cierre: row.probabilidad_cierre || undefined,
  fecha_cierre_probable: row.fecha_cierre_probable || undefined,
  next_step: row.next_step || undefined,
  score_ai: row.score_ai ?? 0,
  created_at: row.created_at || '',
  updated_at: row.updated_at || '',
});

export const useContacts = (filterByUserId?: string | null) => {
  return useQuery({
    queryKey: ['contacts', filterByUserId ?? 'all'],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const data = await contactsApi.list(
        filterByUserId ? { assigned_to: filterByUserId } : undefined
      );
      return data
        .map(mapContact)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    },
  });
};

export const useContact = (id: string | undefined) => {
  return useQuery({
    queryKey: ['contacts', id],
    enabled: !!id,
    queryFn: async () => {
      const data = await contactsApi.get(id!);
      return mapContact(data);
    },
  });
};

export const useUpdateContactStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      scheduled_date,
      meeting_type,
      seguimiento_date,
      lost_reason,
      next_step,
    }: {
      id: string;
      status: ContactStatus;
      scheduled_date?: string;
      meeting_type?: string;
      seguimiento_date?: string;
      lost_reason?: string;
      next_step?: string | null;
    }) => {
      const payload: Partial<ContactApiResponse> = {
        status,
        scheduled_date: scheduled_date || null,
      };
      if (meeting_type !== undefined) payload.meeting_type = meeting_type;
      if (seguimiento_date !== undefined) payload.seguimiento_date = seguimiento_date;
      if (lost_reason !== undefined) payload.lost_reason = lost_reason;
      if (next_step !== undefined) payload.next_step = next_step;
      await contactsApi.update(id, payload);
    },
    onSuccess: () => invalidateContactCaches(qc),
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      empresa?: string;
      first_name: string;
      last_name: string;
      email?: string | null;
      phone?: string | null;
      tipo: string;
      prioridad: string;
      pipeline?: PipelineType;
      valor_potencial?: number | null;
      probabilidad_cierre?: number | null;
      fecha_cierre_probable?: string | null;
      servicio_interes?: string | null;
      estado_certificacion?: string | null;
      empleados_empresa?: string | null;
      decision_maker?: boolean;
      next_step?: string | null;
      score_ai?: number;
    }) => {
      // Si hay nombre de empresa nuevo, primero actualizar la empresa relacionada
      if (input.empresa) {
        const current = await contactsApi.get(input.id);
        if (current.company_id) {
          await companiesApi.update(current.company_id, { name: input.empresa });
        }
      }

      const payload: Partial<ContactApiResponse> = {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        tipo: input.tipo,
        prioridad: input.prioridad,
        pipeline: input.pipeline,
        valor_potencial: input.valor_potencial ?? null,
        probabilidad_cierre: input.probabilidad_cierre ?? null,
        fecha_cierre_probable: input.fecha_cierre_probable ?? null,
        servicio_interes: input.servicio_interes ?? null,
        estado_certificacion: input.estado_certificacion ?? null,
        empleados_empresa: input.empleados_empresa ?? null,
        decision_maker: input.decision_maker ?? false,
        next_step: input.next_step ?? null,
        score_ai: input.score_ai ?? 0,
      };

      await contactsApi.update(input.id, payload);
    },
    onSuccess: () => invalidateContactCaches(qc),
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await contactsApi.delete(id);
    },
    onSuccess: () => invalidateContactCaches(qc),
  });
};

export const useCompanyContacts = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['company_contacts', companyId],
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const data = await contactsApi.list({ company_id: companyId });
      const sorted = [...data].sort((a, b) => {
        // primary first, then by created_at asc
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return (a.created_at || '').localeCompare(b.created_at || '');
      });
      return sorted.map((c) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        job_title: c.job_title,
        is_primary: c.is_primary,
        phone: c.phone,
        email: c.email,
        last_activity_at: null as string | null, // backend no calcula este campo
      }));
    },
  });
};

export const useSetPrimaryContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, companyId }: { contactId: string; companyId: string }) => {
      // El backend ahora se encarga de quitarle el primary al resto de contactos de esta empresa
      await contactsApi.update(contactId, { is_primary: true });
    },
    onSuccess: (_, { contactId }) => {
      invalidateContactCaches(qc);
      qc.invalidateQueries({ queryKey: ['contacts', contactId] });
      qc.invalidateQueries({ queryKey: ['company_contacts'] });
    },
  });
};

export const useCreateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      empresa: string;
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      linkedin_url?: string;
      job_title?: string;
      pipeline?: string;
      status?: string;
      prioridad?: string;
      valor_potencial?: number;
      probabilidad_cierre?: number;
      semana?: string;
      semana_date?: string;
      tipo?: string;
      assigned_to?: string;
      servicio_interes?: string;
      estado_certificacion?: string;
      empleados_empresa?: string;
      decision_maker?: boolean;
      company_id?: string;
      is_primary?: boolean;
    }) => {
      let company_id: string;

      if (input.company_id) {
        company_id = input.company_id;
      } else {
        // Buscar empresa existente por nombre (case-insensitive)
        const companies = await companiesApi.list();
        const existing = companies.find(
          (c) => c.name.toLowerCase() === input.empresa.toLowerCase()
        );
        if (existing) {
          company_id = existing.id;
        } else {
          const created = await companiesApi.create({ name: input.empresa });
          company_id = created.id;
        }
      }

      await contactsApi.create({
        company_id,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email || null,
        phone: input.phone || null,
        linkedin_url: input.linkedin_url || null,
        job_title: input.job_title || null,
        pipeline: input.pipeline || 'captura',
        status: input.status || 'nuevo',
        prioridad: input.prioridad || 'media',
        valor_potencial: input.valor_potencial || null,
        probabilidad_cierre: input.probabilidad_cierre ?? null,
        semana: input.semana || null,
        semana_date: input.semana_date || null,
        tipo: input.tipo || 'Cliente',
        assigned_to: input.assigned_to || null,
        servicio_interes: input.servicio_interes || null,
        estado_certificacion: input.estado_certificacion || null,
        empleados_empresa: input.empleados_empresa || null,
        decision_maker: input.decision_maker ?? false,
        is_primary: input.is_primary ?? false,
      });
    },
    onSuccess: () => {
      invalidateContactCaches(qc);
      qc.invalidateQueries({ queryKey: ['company_contacts'] });
    },
  });
};
