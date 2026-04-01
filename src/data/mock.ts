import { Profile, Company, Contact, Activity, ESGEvent } from '@/types';

export const mockProfiles: Profile[] = [
  { id: 'p1', name: 'Joaquín', email: 'joaquin@empresa.com', role: 'jefe_ventas', avatar_color: '03A7E1', created_at: '2026-01-01' },
  { id: 'p2', name: 'Raúl', email: 'raul@empresa.com', role: 'jefe_ventas', avatar_color: '8DC63F', created_at: '2026-01-01' },
  { id: 'p3', name: 'Marcos', email: 'mpop36@gmail.com', role: 'admin', avatar_color: 'F5A623', created_at: '2026-01-01' },
  { id: 'p4', name: 'Alba', email: 'albalopez@attrim.com', role: 'comercial', avatar_color: 'E84A4A', created_at: '2026-01-01' },
];

export const mockCompanies: Company[] = [
  { id: 'c1', name: 'TRANSPORTES MARITIM', sector: 'Logística', created_at: '2026-01-01' },
  { id: 'c2', name: 'COPISA', sector: 'Construcción', created_at: '2026-01-01' },
  { id: 'c3', name: 'CALCONUT', sector: 'Alimentación', created_at: '2026-01-01' },
  { id: 'c4', name: 'MIRAI', sector: 'Tecnología', created_at: '2026-01-01' },
  { id: 'c5', name: 'PLATOS TRADICIONALES', sector: 'Alimentación', created_at: '2026-01-01' },
  { id: 'c6', name: 'GRUPO AZA', sector: 'Industrial', created_at: '2026-01-01' },
];

export const mockContacts: Contact[] = [
  { id: 'ct1', company_id: 'c1', company: mockCompanies[0], first_name: 'María', last_name: 'Martín', email: 'maria@transportesmaritim.com', phone: '+34612345678', assigned_to: 'p1', assigned_profile: mockProfiles[0], status: 'nuevo', semana: 'Semana 4', prioridad: 'alta', tipo: 'Cliente', valor_potencial: 15000, created_at: '2026-01-15', updated_at: '2026-01-15' },
  { id: 'ct2', company_id: 'c2', company: mockCompanies[1], first_name: 'Carlos', last_name: 'Rubio', email: 'carlos@copisa.es', phone: '+34623456789', assigned_to: 'p2', assigned_profile: mockProfiles[1], status: 'agendado', semana: 'Semana 1', scheduled_date: '2026-03-18', prioridad: 'media', tipo: 'Cliente', valor_potencial: 22000, created_at: '2026-01-10', updated_at: '2026-02-20' },
  { id: 'ct3', company_id: 'c3', company: mockCompanies[2], first_name: 'Vicente', last_name: 'Ortiz', email: 'vicente@calconut.com', phone: '+34634567890', assigned_to: 'p1', assigned_profile: mockProfiles[0], status: 'nuevo', semana: 'Semana 1', prioridad: 'media', tipo: 'Cliente', valor_potencial: 8000, created_at: '2026-01-08', updated_at: '2026-01-08' },
  { id: 'ct4', company_id: 'c4', company: mockCompanies[3], first_name: 'Alberto', last_name: 'Bastida', email: 'alberto@mirai.tech', phone: '+34645678901', assigned_to: 'p3', assigned_profile: mockProfiles[2], status: 'nuevo', semana: 'Semana 4', prioridad: 'alta', tipo: 'Cliente', valor_potencial: 35000, created_at: '2026-01-20', updated_at: '2026-01-20' },
  { id: 'ct5', company_id: 'c5', company: mockCompanies[4], first_name: 'Jordi', last_name: 'Górriz', email: 'jordi@platostrad.com', phone: '+34656789012', assigned_to: 'p4', assigned_profile: mockProfiles[3], status: 'perdido', semana: 'Semana 1', prioridad: 'baja', tipo: 'Cliente', valor_potencial: 5000, created_at: '2026-01-05', updated_at: '2026-03-01' },
  { id: 'ct6', company_id: 'c6', company: mockCompanies[5], first_name: 'Toño', last_name: 'Martínez', email: 'tono@grupoaza.com', phone: '+34667890123', assigned_to: 'p4', assigned_profile: mockProfiles[3], status: 'pospuesto', semana: 'Semana 1', prioridad: 'baja', tipo: 'Cliente', valor_potencial: 12000, created_at: '2026-01-03', updated_at: '2026-02-15' },
];

export const mockActivities: Activity[] = [
  { id: 'a1', contact_id: 'ct1', type: 'nota', content: 'Primer contacto realizado. Interesados en auditoría ESG.', created_by: 'p1', created_at: '2026-01-15T10:30:00' },
  { id: 'a2', contact_id: 'ct2', type: 'llamada', content: 'Llamada de seguimiento. Reunión agendada para el 18/03.', created_by: 'p2', created_at: '2026-02-20T14:00:00' },
  { id: 'a3', contact_id: 'ct2', type: 'estado', old_value: 'nuevo', new_value: 'agendado', created_by: 'p2', created_at: '2026-02-20T14:05:00' },
  { id: 'a4', contact_id: 'ct4', type: 'email', content: 'Enviada primera propuesta con enfoque CSRD.', created_by: 'p3', created_at: '2026-01-22T09:00:00' },
  { id: 'a5', contact_id: 'ct5', type: 'estado', old_value: 'agendado', new_value: 'perdido', created_by: 'p4', created_at: '2026-03-01T16:00:00' },
];

export const mockEvents: ESGEvent[] = [
  { id: 'e1', name: 'Forum Sostenibilidad CV', date: '2026-03-12', city: 'Valencia', type: 'Forum', attending: true, description: 'Principal foro de sostenibilidad de la Comunidad Valenciana.', website: 'https://forumsostenibilidad.es' },
  { id: 'e2', name: 'Green Business Summit', date: '2026-03-25', city: 'Valencia', type: 'Summit', attending: false, description: 'Cumbre de negocios verdes y economía circular.' },
  { id: 'e3', name: 'Expo Circular Economy', date: '2026-04-08', city: 'Madrid', type: 'Expo', attending: false, description: 'Exposición sobre economía circular e innovación sostenible.' },
  { id: 'e4', name: 'ESG Reporting Day', date: '2026-04-22', city: 'Valencia', type: 'Jornada', attending: true, description: 'Jornada sobre reporting ESG y normativa CSRD.' },
  { id: 'e5', name: 'Smart Agro Valencia', date: '2026-05-06', city: 'Valencia', type: 'Expo', attending: false },
  { id: 'e6', name: 'Barcelona ESG Forum', date: '2026-05-20', city: 'Barcelona', type: 'Forum', attending: false },
  { id: 'e7', name: 'Jornada CSRD Empresas', date: '2026-06-03', city: 'Valencia', type: 'Jornada', attending: true },
  { id: 'e8', name: 'Green Startup Forum', date: '2026-06-17', city: 'Valencia', type: 'Forum', attending: false },
  { id: 'e9', name: 'Expo Eficiencia Energética', date: '2026-07-01', city: 'Madrid', type: 'Expo', attending: false },
  { id: 'e10', name: 'Forum RSC Levante', date: '2026-09-15', city: 'Alicante', type: 'Forum', attending: false },
  { id: 'e11', name: 'Valencia Tech Week', date: '2026-10-06', city: 'Valencia', type: 'Tech', attending: true },
  { id: 'e12', name: 'Congreso ESG España', date: '2026-10-20', city: 'Madrid', type: 'Congreso', attending: false },
];

// Current mock user
export const currentUser = mockProfiles[2]; // Marcos (admin)
