export type UserRole = 'admin' | 'jefe_ventas' | 'comercial';
export type ContactStatus = 
  | 'nuevo' | 'agendado' | 'pendiente_propuesta' | 'propuesta_mandada' | 'aplazado' | 'perdido' | 'cerrado'
  | 'propuesta_solicitada' | 'propuesta_entregada' | 'aceptada' | 'prevision_cierre' | 'rechazada';
export type Priority = 'alta' | 'media' | 'baja';
export type ActivityType = 'nota' | 'llamada' | 'email' | 'whatsapp' | 'reunion' | 'estado';
export type PipelineType = 'captura' | 'cartera';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_color: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  sector?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  company?: Company;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  job_title?: string;
  assigned_to: string;
  assigned_profile?: Profile;
  pipeline: PipelineType;
  status: ContactStatus;
  semana?: string;
  semana_date?: string;
  scheduled_date?: string;
  meeting_type?: string;
  valor_potencial?: number;
  prioridad: Priority;
  tipo: string;
  seguimiento_date?: string;
  lost_reason?: string;
  status_changed_at?: string;
  last_activity_at?: string;
  // Campos ESG
  servicio_interes?: string;
  estado_certificacion?: string;
  empleados_empresa?: string;
  decision_maker?: boolean;
  // Sub-contactos
  is_primary: boolean;
  // Forecast
  probabilidad_cierre?: number;
  fecha_cierre_probable?: string;
  next_step?: string;
  score_ai?: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  contact_id: string;
  type: ActivityType;
  content?: string;
  old_value?: string;
  new_value?: string;
  created_by: string;
  created_by_profile?: Profile;
  created_at: string;
  // Campos opcionales para vistas con joins
  contact?: Partial<Contact> & { company?: Company };
}

export interface ESGEvent {
  id: string;
  name: string;
  date: string;
  city: string;
  type?: string;
  sector?: string;
  description?: string;
  website?: string;
  attending: boolean;
  notes?: string;
  price_per_attendee?: number;
}
