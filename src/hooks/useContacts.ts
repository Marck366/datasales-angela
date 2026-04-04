import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contact, ContactStatus, PipelineType, Priority, UserRole } from '@/types';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Extend the auto-generated row types to match the real schema used in the app
type ContactRow = Tables<'contacts'> & {
  companies: Tables<'companies'> | null;
  profiles: Tables<'profiles'> | null;
  // Fields that might be missing from the auto-generated types but exist in DB
  pipeline?: string | null;
  prioridad?: string | null;
  lost_reason?: string | null;
  status_changed_at?: string | null;
  last_activity_at?: string | null;
  servicio_interes?: string | null;
  estado_certificacion?: string | null;
  empleados_empresa?: string | null;
  decision_maker?: boolean | null;
  probabilidad_cierre?: number | null;
  fecha_cierre_probable?: string | null;
  next_step?: string | null;
  score_ai?: number | null;
};

/** Invalidate React Query caches affected by contact changes. Call after create/update/delete. */
export function invalidateContactCaches(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['contacts'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['dashboard_stats'] });
  qc.invalidateQueries({ queryKey: ['dashboard_ranking'] });
}

const mapContact = (row: ContactRow): Contact => ({
  id: row.id,
  company_id: row.company_id || '',
  company: row.companies ? { 
    id: row.companies.id, 
    name: row.companies.name, 
    sector: row.companies.sector || undefined, 
    created_at: row.companies.created_at || '' 
  } : undefined,
  first_name: row.first_name,
  last_name: row.last_name,
  email: row.email || undefined,
  phone: row.phone || undefined,
  linkedin_url: row.linkedin_url || undefined,
  job_title: row.job_title || undefined,
  assigned_to: row.assigned_to || '',
  assigned_profile: row.profiles ? { 
    id: row.profiles.id, 
    name: row.profiles.name, 
    email: row.profiles.email, 
    role: (row.profiles.role as UserRole) || 'comercial', 
    avatar_color: row.profiles.avatar_color || 'gray', 
    created_at: row.profiles.created_at || '' 
  } : undefined,
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
  status_changed_at: row.status_changed_at || undefined,
  last_activity_at: row.last_activity_at || undefined,
  servicio_interes: row.servicio_interes || undefined,
  estado_certificacion: row.estado_certificacion || undefined,
  empleados_empresa: row.empleados_empresa || undefined,
  decision_maker: row.decision_maker ?? false,
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
      let query = supabase
        .from('contacts')
        .select('*, companies(*), profiles!contacts_assigned_to_fkey(*)');
      
      if (filterByUserId) {
        query = query.eq('assigned_to', filterByUserId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return ((data as unknown as ContactRow[]) || []).map(mapContact);
    },
  });
};

export const useContact = (id: string | undefined) => {
  return useQuery({
    queryKey: ['contacts', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, companies(*), profiles!contacts_assigned_to_fkey(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return mapContact(data as unknown as ContactRow);
    },
  });
};

export const useUpdateContactStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, scheduled_date, meeting_type, seguimiento_date, lost_reason, next_step }: { id: string; status: ContactStatus; scheduled_date?: string; meeting_type?: string; seguimiento_date?: string; lost_reason?: string; next_step?: string | null }) => {
      const updateData: TablesUpdate<'contacts'> & Record<string, unknown> = { 
        status, 
        scheduled_date: scheduled_date || null, 
        updated_at: new Date().toISOString() 
      };
      if (meeting_type !== undefined) updateData.meeting_type = meeting_type;
      if (seguimiento_date !== undefined) updateData.seguimiento_date = seguimiento_date;
      if (lost_reason !== undefined) updateData.lost_reason = lost_reason;
      if (next_step !== undefined) updateData.next_step = next_step;
      
      const { error } = await supabase.from('contacts').update(updateData).eq('id', id);
      if (error) throw error;
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
      if (input.empresa || input.pipeline) {
        // Cast to unknown first to bypass missing 'pipeline' in base generated types
        const { data: contact } = await (supabase
          .from('contacts')
          .select('company_id, pipeline')
          .eq('id', input.id)
          .single() as unknown as Promise<{ data: { company_id: string; pipeline: string } | null }>);
          
        if (input.empresa && contact?.company_id) {
          await supabase.from('companies').update({ name: input.empresa }).eq('id', contact.company_id);
        }
      }

      const updatePayload: TablesUpdate<'contacts'> & Record<string, unknown> = {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
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
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('contacts').update(updatePayload).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => invalidateContactCaches(qc),
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateContactCaches(qc),
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
    }) => {
      let company_id: string;
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', input.empresa)
        .maybeSingle();

      if (existing) {
        company_id = existing.id;
      } else {
        const { data: newCo, error: coErr } = await supabase
          .from('companies')
          .insert({ name: input.empresa })
          .select('id')
          .single();
        if (coErr) throw coErr;
        company_id = newCo.id;
      }

      const insertPayload: TablesInsert<'contacts'> & Record<string, unknown> = {
        company_id,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email || null,
        phone: input.phone || null,
        linkedin_url: input.linkedin_url || null,
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
      };

      const { error } = await supabase.from('contacts').insert(insertPayload);
      if (error) throw error;
    },
    onSuccess: () => invalidateContactCaches(qc),
  });
};
