/** Escalas mínimas para las gráficas SVG (sin librerías). */
export const linear = (domain: [number, number], range: [number, number]) => {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => (d1 === d0 ? (r0 + r1) / 2 : r0 + (v - d0) * k);
};

export const points = <T>(items: T[], range: [number, number]) => {
  const n = items.length;
  const [a, b] = range;
  const step = n > 1 ? (b - a) / (n - 1) : 0;
  return (i: number) => (n > 1 ? a + i * step : (a + b) / 2);
};

export const padded = (values: number[], pct = 0.18, min = 1): [number, number] => {
  if (!values.length) return [0, 1];
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const p = lo === hi ? Math.max(min, Math.abs(lo) * 0.1) : (hi - lo) * pct;
  lo -= p;
  hi += p;
  return [lo, hi];
};

export const path = (pts: Array<[number, number]>) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

export const rirColor = (v: number | null | undefined): string =>
  v == null ? 'var(--rir-na)' : v <= 0 ? 'var(--rir0)' : v <= 1 ? 'var(--rir1)' : v <= 2 ? 'var(--rir2)' : 'var(--rir3)';
export const rirInk = (v: number | null | undefined): string => (v != null && v > 1 && v <= 2 ? '#2b2200' : '#ffffff');

export const TONE_COLOR = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', brand: 'var(--brand)', muted: 'var(--rir-na)' } as const;
export type ChartTone = keyof typeof TONE_COLOR;

/** Formatos de número que se pueden pasar desde el servidor (no se pueden pasar funciones). */
export type ValueFormat = 'int' | 'kg' | 'pct' | 'signed-pct' | 'tonnes';
const es = (v: number, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toString().replace('.', ',');
export const formatValue = (v: number, f: ValueFormat = 'int'): string => {
  switch (f) {
    case 'kg':
      return `${es(v, 2)}`;
    case 'pct':
      return `${Math.round(v)} %`;
    case 'signed-pct':
      return `${v > 0 ? '+' : v < 0 ? '−' : ''}${es(Math.abs(v))} %`;
    case 'tonnes':
      return `${es(v / 1000)} t`;
    default:
      return String(Math.round(v));
  }
};
