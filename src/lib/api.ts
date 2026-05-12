import axios, { AxiosError } from 'axios';

const CSRF_COOKIE = 'datasales_csrf';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export const hasSession = () => readCookie(CSRF_COOKIE) !== null;

export const clearClientSession = () => {
  document.cookie = `${CSRF_COOKIE}=; path=/; max-age=0`;
};

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Inject CSRF token header on mutating requests (cookie auth flow)
const UNSAFE_METHODS = new Set(['post', 'patch', 'put', 'delete']);
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (UNSAFE_METHODS.has(method)) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

// On 401, clear session and redirect to /login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearClientSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Types matching backend response shapes
// ============================================================================

export interface UserOut {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_color: string | null;
  is_active: boolean;
}

export interface CompanyNested {
  id: string;
  name: string;
  sector: string | null;
}

export interface AssigneeNested {
  id: string;
  name: string;
  avatar_color: string | null;
  role: string | null;
}

export interface ContactApiResponse {
  id: string;
  company_id: string | null;
  assigned_to: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  job_title: string | null;
  status: string;
  pipeline: string | null;
  prioridad: string | null;
  tipo: string | null;
  scheduled_date: string | null;
  seguimiento_date: string | null;
  semana: string | null;
  semana_date: string | null;
  valor_potencial: number | null;
  probabilidad_cierre: number | null;
  fecha_cierre_probable: string | null;
  meeting_type: string | null;
  lost_reason: string | null;
  next_step: string | null;
  score_ai: number | null;
  servicio_interes: string | null;
  estado_certificacion: string | null;
  empleados_empresa: string | null;
  decision_maker: boolean | null;
  is_primary: boolean;
  created_at: string | null;
  updated_at: string | null;
  status_changed_at: string | null;
  last_activity_at: string | null;
  company: CompanyNested | null;
  assignee: AssigneeNested | null;
}

export interface CompanyOut {
  id: string;
  name: string;
  sector: string | null;
  created_at: string | null;
}

export interface ActivityOut {
  id: string;
  contact_id: string;
  created_by: string;
  type: string;
  content: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string | null;
  creator: { id: string; name: string; avatar_color: string | null; role: string | null } | null;
}

export interface EventOut {
  id: string;
  name: string;
  date: string | null;
  city: string | null;
  type: string | null;
  sector: string | null;
  description: string | null;
  website: string | null;
  attending: boolean;
  notes: string | null;
  price_per_attendee: number | null;
  created_at: string | null;
}

export interface RankingEntry {
  user_id: string;
  name: string;
  role: string | null;
  avatar_color: string | null;
  total_contacts: number;
}

export interface DashboardStats {
  total_contacts: number;
  by_status: Record<string, number>;
  pipeline_value: number;
}

// ============================================================================
// Auth
// ============================================================================

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<{ ok: boolean; csrf_token: string }>(
      '/auth/login',
      { email, password }
    );
    return data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  me: async () => {
    const { data } = await api.get<{ user: UserOut }>('/auth/me');
    return data;
  },
};

// ============================================================================
// Contacts
// ============================================================================

export const contactsApi = {
  list: async (params?: { assigned_to?: string; company_id?: string }) => {
    const { data } = await api.get<ContactApiResponse[]>('/contacts/', { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<ContactApiResponse>(`/contacts/${id}`);
    return data;
  },
  create: async (payload: Partial<ContactApiResponse>) => {
    const { data } = await api.post<ContactApiResponse>('/contacts/', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ContactApiResponse>) => {
    const { data } = await api.patch<ContactApiResponse>(`/contacts/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/contacts/${id}`);
  },
};

// ============================================================================
// Companies
// ============================================================================

export const companiesApi = {
  list: async () => {
    const { data } = await api.get<CompanyOut[]>('/companies/');
    return data;
  },
  create: async (payload: { name: string; sector?: string | null }) => {
    const { data } = await api.post<CompanyOut>('/companies/', payload);
    return data;
  },
  update: async (id: string, payload: { name?: string; sector?: string | null }) => {
    const { data } = await api.patch<CompanyOut>(`/companies/${id}`, payload);
    return data;
  },
};

// ============================================================================
// Activities
// ============================================================================

export const activitiesApi = {
  list: async (contactId?: string) => {
    const { data } = await api.get<ActivityOut[]>('/activities/', {
      params: contactId ? { contact_id: contactId } : undefined,
    });
    return data;
  },
  create: async (payload: {
    contact_id: string;
    type: string;
    content?: string | null;
    old_value?: string | null;
    new_value?: string | null;
  }) => {
    const { data } = await api.post<ActivityOut>('/activities/', payload);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/activities/${id}`);
  },
};

// ============================================================================
// Events
// ============================================================================

export const eventsApi = {
  list: async () => {
    const { data } = await api.get<EventOut[]>('/events/');
    return data;
  },
  create: async (payload: Partial<EventOut>) => {
    const { data } = await api.post<EventOut>('/events/', payload);
    return data;
  },
  update: async (id: string, payload: Partial<EventOut>) => {
    const { data } = await api.patch<EventOut>(`/events/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/events/${id}`);
  },
};

// ============================================================================
// Dashboard
// ============================================================================

export const dashboardApi = {
  ranking: async () => {
    const { data } = await api.get<RankingEntry[]>('/dashboard/ranking');
    return data;
  },
  stats: async () => {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },
};

// ============================================================================
// AI
// ============================================================================

export const aiApi = {
  prepararReunion: async (contactId: string, recentActivities?: Array<{ type: string; content: string }>) => {
    const { data } = await api.post<{ briefing: string }>('/ai/preparar-reunion', {
      contact_id: contactId,
      recent_activities: recentActivities,
    });
    return data;
  },
};
