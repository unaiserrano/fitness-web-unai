import { isDistance } from './format';
import { findInLibrary, muscleGroupOf } from './library';
import { estimated1RM, rangeOf } from './numbers';
import { exerciseNorm, normalize } from './text';
import type { Library, Week } from './types';
import { isSetDone, sortWeeks, weekHasResults } from './week';
import { repsDiff } from './history';

/**
 * Volumen: cada serie cuenta 1 para el músculo principal y una fracción para los que también trabajan.
 * El reparto se puede cambiar por ejercicio en la biblioteca.
 */
const DEFAULT_SPLIT: Array<[RegExp, Record<string, number>]> = [
  [/press (militar|de hombro|hombro)/, { Tríceps: 0.5 }],
  [/\bpress\b|fondos|flexiones/, { Tríceps: 0.5, Hombro: 0.5 }],
  [/remo alto|face pull|pajaros/, { Hombro: 0.5, Bíceps: 0.25 }],
  [/dominada|jalon|remo|pull ?over/, { Bíceps: 0.5 }],
  [/sentadilla|hack|belt squat/, { Glúteo: 0.5, Aductores: 0.25 }],
  [/prensa|zancada|bulgara|step ?up|subida al cajon/, { Glúteo: 0.5 }],
  [/peso muerto|buenos dias|hiperextension/, { Glúteo: 0.5, Espalda: 0.25 }],
  [/hip thrust|puente de gluteo/, { Isquios: 0.25 }],
];
const NO_SECONDARY = ['Gemelos', 'Bíceps', 'Tríceps', 'Aductores', 'Otros'];

export const ZONES: Record<'Pierna' | 'Torso', string[]> = {
  Pierna: ['Cuádriceps', 'Isquios', 'Glúteo', 'Aductores', 'Gemelos'],
  Torso: ['Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps'],
};
export type Zone = keyof typeof ZONES;
export const zoneOf = (group: string): Zone | null =>
  (Object.keys(ZONES) as Zone[]).find((z) => ZONES[z].includes(group)) ?? null;

export const secondaryGroups = (lib: Library, name: string): Record<string, number> => {
  const l = findInLibrary(lib, name);
  if (l?.volumeSplit) return l.volumeSplit;
  const g = muscleGroupOf(lib, name);
  if (NO_SECONDARY.includes(g)) return {};
  const n = exerciseNorm(name);
  for (const [re, split] of DEFAULT_SPLIT) {
    if (re.test(n)) return Object.fromEntries(Object.entries(split).filter(([k]) => k !== g));
  }
  return {};
};

export const volumeSplitOf = (lib: Library, name: string): Record<string, number> => ({
  [muscleGroupOf(lib, name)]: 1,
  ...secondaryGroups(lib, name),
});

export const splitToText = (r: Record<string, number> | null | undefined): string =>
  Object.entries(r ?? {})
    .map(([k, v]) => `${k} ${String(v).replace('.', ',')}`)
    .join(' · ');

export const splitFromText = (t: string, groups: string[]): Record<string, number> => {
  const o: Record<string, number> = {};
  const re = /([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t || ''))) {
    const g = groups.find((x) => normalize(x) === normalize(m![1])) ?? m[1];
    o[g] = parseFloat(m[2].replace(',', '.'));
  }
  return o;
};

export interface GroupVolume {
  group: string;
  planned: number;
  done: number;
}

/** Series por grupo muscular de una semana (pedidas y hechas). */
export const groupVolume = (week: Week, lib: Library): GroupVolume[] => {
  const t = new Map<string, GroupVolume>();
  for (const d of week.days) {
    for (const e of d.exercises) {
      for (const [g, f] of Object.entries(volumeSplitOf(lib, e.name))) {
        const row = t.get(g) ?? { group: g, planned: 0, done: 0 };
        for (const s of e.sets) {
          if (s.ignored) continue;
          row.planned += f;
          if (isSetDone(s)) row.done += f;
        }
        t.set(g, row);
      }
    }
  }
  return [...t.values()];
};

export interface ZoneVolumePoint {
  week: number;
  sets: Record<Zone, number>;
  tonnage: Record<Zone, number>;
}

/** Series y kilos movidos por zona, semana a semana (solo semanas con datos). */
export const zoneVolumeByWeek = (weeks: Week[], lib: Library): ZoneVolumePoint[] =>
  sortWeeks(weeks)
    .filter(weekHasResults)
    .map((w) => {
      const o: ZoneVolumePoint = { week: w.number, sets: { Pierna: 0, Torso: 0 }, tonnage: { Pierna: 0, Torso: 0 } };
      for (const d of w.days) {
        for (const e of d.exercises) {
          const split = volumeSplitOf(lib, e.name);
          const mainZone = zoneOf(muscleGroupOf(lib, e.name));
          for (const s of e.sets) {
            if (!isSetDone(s)) continue;
            for (const [g, f] of Object.entries(split)) {
              const z = zoneOf(g);
              if (z) o.sets[z] += f;
            }
            if (mainZone && (s.result.kg ?? 0) > 0 && s.result.reps && !isDistance(s.result.repsText))
              o.tonnage[mainZone] += (s.result.kg ?? 0) * s.result.reps;
          }
        }
      }
      return o;
    });

export interface StrengthSeries {
  name: string;
  group: string;
  points: Array<{ week: number; value: number }>;
}

/** Fuerza estimada (mejor serie de cada semana) por ejercicio. */
export const strengthByExercise = (weeks: Week[], lib: Library): StrengthSeries[] => {
  const m = new Map<string, { name: string; group: string; pts: Map<number, number> }>();
  for (const w of sortWeeks(weeks).filter(weekHasResults)) {
    for (const d of w.days) {
      for (const e of d.exercises) {
        let best: number | null = null;
        for (const x of e.sets) {
          if (!isSetDone(x) || !((x.result.kg ?? 0) > 0) || x.result.reps == null || isDistance(x.result.repsText)) continue;
          const q = x.result.rir ?? (rangeOf(x.target.rir) ?? [0])[0];
          const rm = estimated1RM(x.result.kg ?? 0, x.result.reps, q);
          if (best == null || rm > best) best = rm;
        }
        if (best == null) continue;
        const k = exerciseNorm(e.name);
        const o = m.get(k) ?? { name: e.name, group: muscleGroupOf(lib, e.name), pts: new Map() };
        o.pts.set(w.number, Math.max(o.pts.get(w.number) ?? 0, best));
        m.set(k, o);
      }
    }
  }
  return [...m.values()].map((o) => ({
    name: o.name,
    group: o.group,
    points: [...o.pts.entries()].sort((a, b) => a[0] - b[0]).map(([week, value]) => ({ week, value })),
  }));
};

/** Cambio medio de fuerza (%) por semana, tomando como 0 % la primera semana de cada ejercicio. */
export const averageStrengthChange = (series: StrengthSeries[]): Array<{ week: number; value: number | null }> => {
  const weeks = [...new Set(series.flatMap((s) => s.points.map((p) => p.week)))].sort((a, b) => a - b);
  return weeks.map((week) => {
    const v = series
      .map((s) => {
        const p = s.points.find((q) => q.week === week);
        return p && s.points.length ? (p.value / s.points[0].value) * 100 - 100 : null;
      })
      .filter((x): x is number => x != null);
    return { week, value: v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null };
  });
};

/** % de series hechas con las repeticiones pedidas (±2) por semana. */
export const complianceByWeek = (weeks: Week[]): Array<{ week: number; pct: number | null }> =>
  sortWeeks(weeks)
    .filter(weekHasResults)
    .map((w) => {
      let ok = 0;
      let tot = 0;
      for (const d of w.days)
        for (const e of d.exercises)
          for (const s of e.sets) {
            if (!isSetDone(s)) continue;
            if (isDistance(s.result.repsText) || /m\b/.test(s.target.reps || '')) continue;
            const dd = repsDiff(s.result.reps, rangeOf(s.target.reps));
            if (dd != null) {
              tot++;
              if (dd > -2 && dd < 3) ok++;
            }
          }
      return { week: w.number, pct: tot ? Math.round((ok / tot) * 100) : null };
    });
