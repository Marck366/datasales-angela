import { isValid, parseISO, isBefore, startOfDay } from 'date-fns';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string): string | null => {
  if (!value) return null;
  if (!EMAIL_RE.test(value.trim())) return 'Email no válido';
  if (value.length > 255) return 'Email demasiado largo';
  return null;
};

export const validatePhone = (value: string): string | null => {
  if (!value) return null;
  if (value.length > 50) return 'Teléfono demasiado largo';
  if (!/^[+\d\s().-]+$/.test(value)) return 'Teléfono solo admite dígitos y +()-';
  return null;
};

export const validatePercent = (value: number | string | null | undefined): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 'Debe ser un número';
  if (n < 0 || n > 100) return 'Debe estar entre 0 y 100';
  return null;
};

export const validatePositiveNumber = (value: number | string | null | undefined): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 'Debe ser un número';
  if (n < 0) return 'No puede ser negativo';
  return null;
};

export const validateDateString = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (!isValid(parseISO(value))) return 'Fecha no válida';
  return null;
};

export const validateFutureDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return 'Fecha no válida';
  if (isBefore(parsed, startOfDay(new Date()))) return 'La fecha debe ser futura';
  return null;
};

export const validateMaxLength = (value: string | null | undefined, max: number): string | null => {
  if (!value) return null;
  if (value.length > max) return `Máximo ${max} caracteres`;
  return null;
};

/**
 * Ejecuta varios validadores y devuelve el primer mensaje de error, o null si todos pasan.
 */
export const firstError = (...checks: (string | null)[]): string | null =>
  checks.find((e) => e !== null) ?? null;
