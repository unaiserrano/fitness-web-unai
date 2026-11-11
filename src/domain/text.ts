/** Normaliza texto para comparar: sin tildes, minúsculas y espacios simples. */
export const normalize = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Nombres que en realidad son el mismo ejercicio. */
const ALIASES: Record<string, string> = { 'sentadilla a cajon': 'sentadilla' };

export const exerciseNorm = (name: string): string => {
  const n = normalize(name);
  return ALIASES[n] ?? n;
};

export const slugify = (s: string, fallback = 'ejercicio'): string =>
  exerciseNorm(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || fallback;

/** Clave estable de un ejercicio dentro de la historia de una persona. */
export const exerciseKey = (day: string, name: string, flexibleDays: boolean): string =>
  `${flexibleDays ? '*' : normalize(day)}|${exerciseNorm(name)}`;

export const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

export const pad2 = (n: number): string => String(n).padStart(2, '0');
