import type { ExerciseRef, ProgressPoint } from './history';
import { listExercises, progressPoints } from './history';
import { weightStepOf } from './library';
import { estimated1RM, formatNum, rirNum, roundTo } from './numbers';
import type { Library, Week } from './types';
import { doneWeeks, lastDoneWeekNumber } from './week';

export interface StagnantExercise {
  exercise: ExerciseRef;
  weeksWithoutProgress: number;
  best: ProgressPoint;
  last: ProgressPoint;
}

/** Ejercicios con 3 semanas o más sin superar su mejor serie (fuerza estimada +1 %). */
export const stagnantExercises = (weeks: Week[], flexible: boolean): StagnantExercise[] => {
  const out: StagnantExercise[] = [];
  const lastWeek = lastDoneWeekNumber(weeks);
  for (const ex of listExercises(weeks, flexible)) {
    const pts = progressPoints(weeks, ex.key, flexible).filter((p) => (p.kg ?? 0) > 0 && p.reps != null);
    if (pts.length < 4 || pts[pts.length - 1].week !== lastWeek) continue;
    let best = -1;
    let without = 0;
    let bestPoint = pts[0];
    for (const p of pts) {
      const r = estimated1RM(p.kg ?? 0, p.reps ?? 0, p.rir ?? 0);
      if (best < 0 || r > best * 1.01) {
        best = Math.max(best, r);
        without = 0;
        bestPoint = p;
      } else without++;
    }
    if (without >= 3) out.push({ exercise: ex, weeksWithoutProgress: without, best: bestPoint, last: pts[pts.length - 1] });
  }
  return out;
};

export const formatPoint = (p: ProgressPoint): string =>
  `${p.reps} reps · ${formatNum(p.kg)} kg${p.rir != null ? ` · RIR ${formatNum(p.rir)}` : ''}`;

/** Semanas seguidas entrenando sin descarga (un hueco sin datos reinicia la cuenta). */
export const weeksSinceDeload = (weeks: Week[]): number => {
  let n = 0;
  let prev: number | null = null;
  for (const w of doneWeeks(weeks)) {
    if (w.deload || (prev != null && w.number - prev > 1)) n = w.deload ? 0 : 1;
    else n++;
    prev = w.number;
  }
  return n;
};

export const DELOAD_AFTER_WEEKS = 5;

/**
 * Semana de descarga: mitad de series (redondeando hacia arriba), −10 % de peso
 * redondeado al salto del ejercicio y +2 de RIR (máximo 4). Mismos ejercicios.
 */
export const toDeload = (w: Week, lib: Library): Week => ({
  ...w,
  deload: true,
  days: w.days.map((d) => ({
    ...d,
    exercises: d.exercises.map((e) => {
      const step = weightStepOf(lib, e.name);
      return {
        ...e,
        sets: e.sets.slice(0, Math.max(1, Math.ceil(e.sets.length / 2))).map((s) => {
          const t = { ...s.target };
          if ((t.kg ?? 0) > 0) {
            t.kg = Math.max(step, roundTo((t.kg ?? 0) * 0.9, step));
            t.kgText = `${formatNum(t.kg)} kg`;
          }
          const q = rirNum(t.rir);
          if (q != null) t.rir = String(Math.min(4, q + 2));
          return { ...s, target: t };
        }),
      };
    }),
  })),
});

export type Period = 'all' | '3m' | '1m' | '1w';
export const PERIODS: Array<[Period, string]> = [
  ['all', 'Todo'],
  ['3m', '3 meses'],
  ['1m', 'Último mes'],
  ['1w', 'Última semana'],
];
const PERIOD_WEEKS: Record<Period, number> = { all: Infinity, '3m': 13, '1m': 4, '1w': 2 };
export const isPeriod = (v: unknown): v is Period => typeof v === 'string' && v in PERIOD_WEEKS;

export const inPeriod = (week: number, lastWeek: number, p: Period): boolean => week > lastWeek - PERIOD_WEEKS[p];

export const periodPhrase = (p: Period): string =>
  ({ all: 'desde que empezó', '3m': 'en los últimos 3 meses', '1m': 'en el último mes', '1w': 'frente a la semana anterior' })[p];
