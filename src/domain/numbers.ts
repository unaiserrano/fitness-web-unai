/** Primer número de un texto ("12 reps" → 12, "2,5" → 2.5). */
export const numOf = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

/** Rango de un texto ("8-10" → [8, 10], "12" → [12, 12]). */
export const rangeOf = (v: unknown): [number, number] | null => {
  if (v == null || v === '') return null;
  const m = String(v).replace(/,/g, '.').match(/\d+(\.\d+)?/g);
  if (!m) return null;
  const a = m.map(Number);
  return [Math.min(...a), Math.max(...a)];
};

export const mid = (r: [number, number]): number => (r[0] + r[1]) / 2;

/** RIR como número (acepta "2", "2,5"; para "2-3" devuelve 2). */
export const rirNum = (v: unknown): number | null => {
  const f = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isNaN(f) ? null : f;
};

/** Formato español: 2.5 → "2,5"; null → "—". */
export const formatNum = (v: number | null | undefined): string =>
  v == null ? '—' : (Math.round(v * 100) / 100).toString().replace('.', ',');

export const roundTo = (v: number, step: number): number => Math.round(v / step) * step;

export const average = (values: Array<number | null | undefined>): number | null => {
  const v = values.filter((x): x is number => typeof x === 'number');
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

/** Fuerza estimada (Epley) contando el RIR como repeticiones posibles. */
export const estimated1RM = (kg: number, reps: number, rir: number): number => kg * (1 + (reps + rir) / 30);

/** Repeticiones posibles (reps + RIR) con un peso dado, según la fuerza estimada. */
export const capacityAt = (oneRM: number, kg: number): number => 30 * (oneRM / kg - 1);
