import { capitalize, normalize } from './text';

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const canonicalDay = (s: string): string => WEEKDAYS.find((d) => normalize(d) === normalize(s)) ?? capitalize(s);

export const dayIndex = (s: string): number => {
  const i = WEEKDAYS.findIndex((d) => normalize(d) === normalize(s));
  return i < 0 ? 99 : i;
};

/** "Pierna A" → Pierna, "Upper 1" → Torso. */
export const blockType = (block: string | undefined): '' | 'Pierna' | 'Torso' =>
  /lower|pierna/i.test(block ?? '') ? 'Pierna' : /upper|torso/i.test(block ?? '') ? 'Torso' : '';

const parseDate = (iso: string): Date => {
  const m = String(iso).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(Date.UTC(2026, 0, 5));
};

/** Texto de fechas de la semana n: "9 – 15 nov 2026". */
export const weekDates = (startDate: string, n: number): string => {
  const a = new Date(parseDate(startDate).getTime() + (n - 1) * 7 * 864e5);
  const b = new Date(a.getTime() + 6 * 864e5);
  const ma = MONTHS[a.getUTCMonth()];
  const mb = MONTHS[b.getUTCMonth()];
  return ma === mb
    ? `${a.getUTCDate()} – ${b.getUTCDate()} ${mb} ${b.getUTCFullYear()}`
    : `${a.getUTCDate()} ${ma} – ${b.getUTCDate()} ${mb} ${b.getUTCFullYear()}`;
};

/** Número de semana que toca hoy según la fecha de inicio. */
export const weekNumberAt = (startDate: string, today = new Date()): number => {
  const diff = today.getTime() - parseDate(startDate).getTime();
  return Math.max(1, Math.floor(diff / (7 * 864e5)) + 1);
};
