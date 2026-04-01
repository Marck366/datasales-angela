import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function calcSemanaLabel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  let week: number;
  if (day <= 7) week = 1;
  else if (day <= 14) week = 2;
  else if (day <= 21) week = 3;
  else week = 4;
  const month = format(d, 'MMMM', { locale: es });
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1);
  return `Sem. ${week} · ${capitalized}`;
}

export function calcSeguimientoDate(activityType: string): string {
  const today = new Date();
  const days = activityType === 'reunion' ? 14 : 7;
  today.setDate(today.getDate() + days);
  return format(today, 'yyyy-MM-dd');
}
