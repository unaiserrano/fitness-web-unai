/**
 * Alimentación: dieta por comidas y opciones, registro de alimentos y cálculo de calorías y macros.
 * Lee también el formato de la app anterior (claves en español), que es como se importa.
 */
import { normalize, slugify } from './text';

export interface Food {
  slug: string;
  name: string;
  brand: string;
  /** Por 100 g (o 100 ml). */
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  per: 'g' | 'ml';
  /** Gramos de una unidad (1 huevo, 1 lata…). */
  unitGrams: number | null;
  aliases: string[];
  source: 'Genérico' | 'Etiqueta';
}

export interface DietItem {
  /** Alimento (o el texto del subtítulo). */
  food: string;
  /** Cantidad tal cual: "120 g", "2 ud", "100 g + 1 plátano". */
  qty: string;
  sub?: boolean;
  /** Es alternativa al anterior: se cuenta solo uno. */
  alt?: boolean;
}

export interface DietOption {
  title: string;
  items: DietItem[];
  note: string;
}

export interface Meal {
  name: string;
  kcal: string;
  options: DietOption[];
}

export interface Diet {
  title: string;
  target: string;
  intro: string;
  meals: Meal[];
  tips: Array<{ title: string; text: string }>;
  savedAt?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;
const s = (v: unknown) => (v == null ? '' : String(v));
const n = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const x = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(x) ? x : null;
};

export const emptyDiet = (): Diet => ({
  title: 'Plan de alimentación',
  target: '',
  intro: 'Elige una opción de cada bloque cada día.',
  meals: ['Desayuno', 'Comida', 'Merienda', 'Cena'].map((name) => ({ name, kcal: '', options: [] })),
  tips: [],
});

/** Acepta el formato nuevo o el de la app anterior. */
export function toDiet(raw: Any): Diet {
  if (!raw || typeof raw !== 'object') return emptyDiet();
  if (Array.isArray(raw.meals)) return raw as Diet;
  return {
    title: s(raw.titulo) || 'Plan de alimentación',
    target: s(raw.objetivo),
    intro: s(raw.intro),
    meals: (raw.comidas ?? []).map((c: Any) => ({
      name: s(c?.nombre),
      kcal: s(c?.kcal),
      options: (c?.opciones ?? []).map((o: Any) => ({
        title: s(o?.titulo),
        note: s(o?.nota),
        items: (o?.items ?? []).map((it: Any) => ({ food: s(it?.a), qty: s(it?.c), ...(it?.sub ? { sub: true } : {}), ...(it?.alt ? { alt: true } : {}) })),
      })),
    })),
    tips: (raw.consejos ?? []).map((k: Any) => ({ title: s(k?.titulo), text: s(k?.texto) })),
    ...(raw.guardado ? { savedAt: s(raw.guardado) } : {}),
  };
}

export function toFood(slug: string, raw: Any): Food {
  if (raw && 'name' in raw) return { ...(raw as Food), slug };
  return {
    slug,
    name: s(raw?.nombre) || slug,
    brand: s(raw?.marca),
    kcal: n(raw?.kcal),
    protein: n(raw?.prot),
    carbs: n(raw?.hc),
    fat: n(raw?.grasa),
    per: raw?.por === 'ml' ? 'ml' : 'g',
    unitGrams: n(raw?.g_ud),
    aliases: Array.isArray(raw?.alias) ? raw.alias.map(s).filter(Boolean) : [],
    source: raw?.fuente === 'Etiqueta' ? 'Etiqueta' : 'Genérico',
  };
}

export const foodSlug = (name: string, brand = '') => slugify(`${name} ${brand}`.trim(), 'alimento');

/* ---------- Cálculo ---------- */

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}
const zero = (): Macros => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
const add = (a: Macros, b: Macros): Macros => ({ kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat });

export function findFood(foods: Food[], name: string): Food | null {
  const k = normalize(name).replace(/\s+/g, ' ').trim();
  if (!k) return null;
  const hits = foods.filter(
    (f) =>
      normalize(f.name) === k || (f.brand && normalize(`${f.name} ${f.brand}`) === k) || f.aliases.some((a) => normalize(a) === k),
  );
  hits.sort((a, b) => Number(b.kcal != null) - Number(a.kcal != null) || Number(b.source === 'Etiqueta') - Number(a.source === 'Etiqueta'));
  return hits[0] ?? null;
}

/** "120 g", "2 ud", "100-120 g", "150 g + 1 plátano" → cantidades. */
export function parseQty(text: string): Array<{ q: number; unit: 'g' | 'ml' | 'ud'; name: string | null }> {
  const out: Array<{ q: number; unit: 'g' | 'ml' | 'ud'; name: string | null }> = [];
  String(text || '')
    .toLowerCase()
    .split('+')
    .forEach((part, i) => {
      const m = part.match(/(\d+(?:[.,]\d+)?)(?:\s*-\s*(\d+(?:[.,]\d+)?))?\s*(kg|gr|g|ml|l|uds?|unidad(?:es)?|latas?|rebanadas?)?\b/);
      if (!m) return;
      let q = parseFloat(m[1].replace(',', '.'));
      if (m[2]) q = (q + parseFloat(m[2].replace(',', '.'))) / 2;
      const u = m[3] || '';
      let unit: 'g' | 'ml' | 'ud' = 'ud';
      if (u === 'kg') (q *= 1000), (unit = 'g');
      else if (u === 'l') (q *= 1000), (unit = 'ml');
      else if (u === 'g' || u === 'gr') unit = 'g';
      else if (u === 'ml') unit = 'ml';
      out.push({ q, unit, name: i > 0 ? part.replace(m[0], '').replace(/\s+/g, ' ').trim() : null });
    });
  return out;
}

export function itemMacros(it: DietItem, foods: Food[]): Macros & { missing: string[] } {
  const z = { ...zero(), missing: [] as string[] };
  if (it.sub) return z;
  for (const [i, x] of parseQty(it.qty).entries()) {
    const name = i === 0 ? it.food : (x.name ?? '');
    const f = findFood(foods, name);
    if (!f) {
      if (name) z.missing.push(name);
      continue;
    }
    const grams = x.unit === 'ud' ? (f.unitGrams ? x.q * f.unitGrams : null) : x.q;
    if (grams == null) {
      z.missing.push(`${name} (falta el peso de 1 unidad)`);
      continue;
    }
    const k = grams / 100;
    z.kcal += k * (f.kcal ?? 0);
    z.protein += k * (f.protein ?? 0);
    z.carbs += k * (f.carbs ?? 0);
    z.fat += k * (f.fat ?? 0);
  }
  return z;
}

export interface Range {
  lo: Macros;
  hi: Macros;
  missing: string[];
}

/** Calorías de una opción como rango: las alternativas («o») cuentan la menor y la mayor. */
export function optionMacros(o: DietOption, foods: Food[]): Range {
  type R = { lo: Macros; hi: Macros };
  const sections: Array<{ alt: boolean; items: DietItem[] }> = [{ alt: false, items: [] }];
  for (const it of o.items) {
    if (it.sub) sections.push({ alt: !!it.alt, items: [] });
    else sections[sections.length - 1].items.push(it);
  }
  const missing: string[] = [];
  const range = (alts: R[]): R => {
    if (!alts.length) return { lo: zero(), hi: zero() };
    return { lo: alts.reduce((m, x) => (x.lo.kcal < m.kcal ? x.lo : m), alts[0].lo), hi: alts.reduce((m, x) => (x.hi.kcal > m.kcal ? x.hi : m), alts[0].hi) };
  };
  const sum = (rs: R[]): R => rs.reduce((t, r) => ({ lo: add(t.lo, r.lo), hi: add(t.hi, r.hi) }), { lo: zero(), hi: zero() });
  const group = <T>(xs: Array<{ alt: boolean; v: T }>): T[][] => {
    const g: T[][] = [];
    for (const x of xs) if (x.alt && g.length) g[g.length - 1].push(x.v);
    else g.push([x.v]);
    return g;
  };
  const secR = sections.map((sc) => {
    const rs = sc.items.map((it) => {
      const z = itemMacros(it, foods);
      missing.push(...z.missing);
      return { alt: !!it.alt, v: { lo: z, hi: z } as R };
    });
    return sum(group(rs).map(range));
  });
  const total = sum(group(sections.map((sc, i) => ({ alt: sc.alt, v: secR[i] }))).map(range));
  return { ...total, missing: [...new Set(missing)] };
}

const r5 = (v: number) => Math.round(v / 5) * 5;
export const kcalLabel = (r: Range): string => {
  const a = r5(r.lo.kcal);
  const b = r5(r.hi.kcal);
  return a === b ? `${a} kcal` : `${a}–${b} kcal`;
};
export const macrosLabel = (r: Range): string => {
  const m = (k: keyof Macros) => Math.round((r.lo[k] + r.hi[k]) / 2);
  return `P ${m('protein')} g · HC ${m('carbs')} g · G ${m('fat')} g`;
};

export function mealRangeLabel(meal: Meal, foods: Food[]): string {
  const rs = meal.options.map((o) => optionMacros(o, foods)).filter((r) => r.hi.kcal > 0);
  if (!rs.length) return '';
  return `opciones: ${r5(Math.min(...rs.map((r) => r.lo.kcal)))}–${r5(Math.max(...rs.map((r) => r.hi.kcal)))} kcal`;
}

/** En qué comidas de la dieta sale un alimento. */
export function foodUses(diet: Diet | null, f: Food): string {
  if (!diet) return '';
  const names = [f.name, f.brand ? `${f.name} ${f.brand}` : '', ...f.aliases].filter(Boolean).map((x) => normalize(x));
  const meals = new Set<string>();
  for (const m of diet.meals) for (const o of m.options) for (const it of o.items) if (!it.sub && names.includes(normalize(it.food))) meals.add(m.name);
  return [...meals].join(', ');
}
