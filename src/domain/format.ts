import { formatNum } from './numbers';
import type { SetResult, SetTarget } from './types';

/** "12" → "12 reps", "8-10" → "8-10 reps"; lo demás se deja igual. */
export const repsLabel = (r: unknown): string => {
  const s = String(r ?? '').trim();
  return /^\d+([.,]\d+)?$/.test(s) || /^\d+\s*-\s*\d+$/.test(s) ? `${s.replace(/\s/g, '')} reps` : s;
};

export const kgLabel = (t: Pick<SetTarget, 'kg' | 'kgText'>): string =>
  t.kg === 0 ? 'sin peso' : t.kg != null ? `${formatNum(t.kg)} kg` : t.kgText || '';

export const isDistance = (txt: string | undefined): boolean => /[a-z]/i.test(txt ?? '');

export const targetLabel = (t: SetTarget): string =>
  [repsLabel(t.reps), kgLabel(t), t.rir !== '' && t.rir != null ? `RIR ${t.rir}` : ''].filter(Boolean).join(' · ');

export const resultLabel = (r: SetResult): string => {
  if (r.status === 'empty') return '—';
  if (r.status === 'error') return `¿${r.raw}?`;
  return [
    isDistance(r.repsText) ? r.repsText : `${r.reps ?? '?'} reps`,
    r.kg == null ? '' : r.kg === 0 ? 'sin peso' : `${formatNum(r.kg)} kg`,
    r.rir != null ? `RIR ${formatNum(r.rir)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
};

/** "0 / 1 / 3" → "Tempo 0-1-3". */
export const tempoLabel = (t: string | undefined): string => {
  const s = String(t ?? '').trim();
  const p = s.replace(/\//g, ' ').split(/\s+/);
  return p.length === 3 && p.every((x) => /^\d+$/.test(x)) ? `Tempo ${p.join('-')}` : s;
};

/** Texto del campo "kilos" del editor → {kg, kgText}. */
export const parseKgInput = (t: string): Pick<SetTarget, 'kg' | 'kgText'> => {
  const s = String(t ?? '').trim();
  if (!s) return { kg: null, kgText: '' };
  if (/^(0|sin peso|peso corporal|sp)$/i.test(s)) return { kg: 0, kgText: 'sin peso' };
  const m = s.replace(',', '.').match(/-?\d+(\.\d+)?/);
  const n = m ? Number(m[0]) : null;
  if (n != null && /^\+?\d+([.,]\d+)?\s*(kg)?$/i.test(s)) return { kg: n, kgText: `${formatNum(n)} kg` };
  return { kg: n, kgText: s };
};

export const kgInputValue = (t: SetTarget): string =>
  t.kg === 0 ? 'sin peso' : t.kg != null ? formatNum(t.kg) : t.kgText || '';
