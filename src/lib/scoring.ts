import { Contact, Activity } from '@/types';

export interface LeadScore {
  score: number;
  label: 'hot' | 'warm' | 'cold';
  color: string;
  bg: string;
}

/**
 * Score based on contact fields only — zero extra DB queries.
 * Safe to call on the Index page where we don't load activities.
 */
export const calcContactScore = (c: Contact): LeadScore => {
  let score = 50;

  // Prioridad
  if (c.prioridad === 'alta') score += 20;
  if (c.prioridad === 'baja') score -= 15;

  // Valor potencial
  if (c.valor_potencial) {
    if (c.valor_potencial >= 10_000) score += 20;
    else if (c.valor_potencial >= 3_000) score += 12;
    else score += 5;
  }

  // Status
  if (c.status === 'agendado') score += 10;
  if (c.status === 'cerrado') score += 25;
  if (c.status === 'perdido' || c.status === 'aplazado' || (c.status as string) === 'nevera') score -= 40;

  // Seguimiento date
  if (c.seguimiento_date) {
    const daysDiff = Math.floor(
      (new Date(c.seguimiento_date).getTime() - Date.now()) / 86_400_000
    );
    if (daysDiff < -14) score -= 25;
    else if (daysDiff < -7) score -= 15;
    else if (daysDiff < 0) score -= 8;
    else if (daysDiff <= 2) score += 5;
  } else {
    score -= 10;
  }

  // Perfil ESG: decision maker y tamaño empresa
  if (c.decision_maker) score += 8;
  if (c.empleados_empresa === '>250') score += 5;
  else if (c.empleados_empresa === '50-250') score += 3;

  return toLeadScore(score);
};

/**
 * Score v2 usando historial completo de actividades.
 * Pesos diferenciados por tipo + momentum + perfil ESG.
 */
export const calcFullScore = (c: Contact, contactActivities: Activity[]): LeadScore => {
  const base = calcContactScore(c);
  let score = base.score;

  const interactions = contactActivities.filter(a =>
    ['llamada', 'email', 'whatsapp', 'reunion'].includes(a.type)
  );

  // Pesos por tipo de interacción (reunión vale más que un email)
  const typeWeight: Record<string, number> = { reunion: 10, llamada: 6, whatsapp: 4, email: 2 };
  const touchpointBonus = Math.min(
    interactions.reduce((sum, a) => sum + (typeWeight[a.type] ?? 2), 0),
    25
  );
  score += touchpointBonus;

  // Momentum: comparar últimas 4 semanas vs 4 anteriores
  const now = Date.now();
  const ms30 = 30 * 86_400_000;
  const recentCount = interactions.filter(a => now - new Date(a.created_at).getTime() < ms30).length;
  const olderCount  = interactions.filter(a => {
    const age = now - new Date(a.created_at).getTime();
    return age >= ms30 && age < ms30 * 2;
  }).length;
  if (recentCount > olderCount && recentCount > 0) score += 10; // cliente activo, ganando momentum
  if (recentCount < olderCount && olderCount > 0) score -= 8;  // cliente enfriándose

  // Recencia del último contacto
  if (interactions.length > 0) {
    const lastMs = new Date(interactions[0].created_at).getTime();
    const daysSince = Math.floor((Date.now() - lastMs) / 86_400_000);
    if (daysSince > 30) score -= 20;
    else if (daysSince > 14) score -= 10;
    else if (daysSince <= 3) score += 8;
  }

  return toLeadScore(score);
};

const toLeadScore = (raw: number): LeadScore => {
  const score = Math.min(100, Math.max(0, raw));
  if (score >= 70)
    return { score, label: 'hot', color: 'text-lime-400 dark:text-lime-400', bg: 'bg-lime-500/30' };
  if (score >= 40)
    return { score, label: 'warm', color: 'text-status-agendado-fg', bg: 'bg-status-agendado-bg' };
  return { score, label: 'cold', color: 'text-destructive', bg: 'bg-destructive/10' };
};

/** Days since the most recent real interaction (calls, email, whatsapp, meeting). */
export const getDaysSinceLastContact = (activities: Activity[]): number | null => {
  const last = activities.find(a =>
    ['llamada', 'email', 'whatsapp', 'reunion'].includes(a.type)
  );
  if (!last) return null;
  return Math.floor((Date.now() - new Date(last.created_at).getTime()) / 86_400_000);
};

/** Count of each interaction type. */
export const getActivitySummary = (activities: Activity[]) => ({
  llamadas: activities.filter(a => a.type === 'llamada').length,
  emails: activities.filter(a => a.type === 'email').length,
  whatsapp: activities.filter(a => a.type === 'whatsapp').length,
  reuniones: activities.filter(a => a.type === 'reunion').length,
  total: activities.filter(a =>
    ['llamada', 'email', 'whatsapp', 'reunion'].includes(a.type)
  ).length,
});
