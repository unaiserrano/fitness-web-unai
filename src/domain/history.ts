import { blockType, dayIndex } from './calendar';
import { isDistance } from './format';
import { formatNum, rangeOf } from './numbers';
import { exerciseKey } from './text';
import type { Exercise, Week, WorkSet } from './types';
import { isSetDone, sortWeeks } from './week';

/**
 * Historia compacta de una persona: para cada ejercicio (por clave) las semanas en que hizo algo.
 * Es lo que necesita el editor para recomendar pesos sin cargar todas las semanas.
 */
export interface HistoryEntry {
  week: number;
  notes: string;
  sets: WorkSet[];
}
export type History = Record<string, HistoryEntry[]>;

export const findExercise = (w: Week | null | undefined, key: string, flexible: boolean): Exercise | null => {
  if (!w) return null;
  for (const d of w.days) for (const e of d.exercises) if (exerciseKey(d.day, e.name, flexible) === key) return e;
  return null;
};

export const buildHistory = (weeks: Week[], flexible: boolean): History => {
  const h: History = {};
  for (const w of sortWeeks(weeks)) {
    const seen = new Set<string>();
    for (const d of w.days) {
      for (const e of d.exercises) {
        // Si el ejercicio sale dos veces en la semana (días libres), cuenta la primera, como en la app anterior.
        const k = exerciseKey(d.day, e.name, flexible);
        if (seen.has(k)) continue;
        seen.add(k);
        if (!e.sets.some(isSetDone)) continue;
        (h[k] ??= []).push({ week: w.number, notes: e.athleteNotes, sets: e.sets });
      }
    }
  }
  return h;
};

/** Última serie n hecha de un ejercicio antes de una semana. */
export const lastDoneSet = (history: History, key: string, n: number, beforeWeek: number) => {
  const entries = history[key] ?? [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.week >= beforeWeek) continue;
    const s = e.sets.find((x) => x.n === n);
    if (s && isSetDone(s)) return { week: e.week, set: s, entry: e };
  }
  return null;
};

/** Última semana anterior en que hizo ese ejercicio (para mostrar sus notas). */
export const lastEntryBefore = (history: History, key: string, beforeWeek: number): HistoryEntry | null => {
  const entries = (history[key] ?? []).filter((e) => e.week < beforeWeek);
  return entries[entries.length - 1] ?? null;
};

export const repsDiff = (reps: number | null, r: [number, number] | null): number | null => {
  if (reps == null || !r) return null;
  if (reps > r[1]) return reps - r[1];
  if (reps < r[0]) return reps - r[0];
  return 0;
};

/** Punto de progreso de un ejercicio en una semana: su serie más pesada. */
export interface ProgressPoint {
  week: number;
  kg: number | null;
  reps: number | null;
  repsText: string;
  rir: number | null;
  targetRange: [number, number] | null;
  targetRir: string;
  variant: string;
  totalReps: number;
  detail: string[];
}

export const progressPoints = (weeks: Week[], key: string, flexible: boolean): ProgressPoint[] => {
  const byWeek = new Map<number, ProgressPoint>();
  const better = (a: ProgressPoint, b: ProgressPoint) =>
    (a.kg ?? -1) > (b.kg ?? -1) || ((a.kg ?? -1) === (b.kg ?? -1) && (a.reps ?? -1) > (b.reps ?? -1));
  for (const w of sortWeeks(weeks)) {
    for (const d of w.days) {
      for (const e of d.exercises) {
        if (exerciseKey(d.day, e.name, flexible) !== key) continue;
        const done = e.sets.filter(isSetDone);
        if (!done.length) continue;
        let best = done[0];
        for (const s of done) {
          const k = s.result.kg ?? -1;
          const r = s.result.reps ?? -1;
          if (k > (best.result.kg ?? -1) || (k === (best.result.kg ?? -1) && r > (best.result.reps ?? -1))) best = s;
        }
        const p: ProgressPoint = {
          week: w.number,
          kg: best.result.kg,
          reps: isDistance(best.result.repsText) ? null : best.result.reps,
          repsText: best.result.repsText,
          rir: best.result.rir,
          targetRange: rangeOf(best.target.reps),
          targetRir: best.target.rir,
          variant: e.variant ?? '',
          totalReps: done.reduce((t, s) => t + (s.result.reps ?? 0), 0),
          detail: e.sets
            .filter((s) => !s.ignored)
            .map(
              (s) =>
                `S${s.n}: ${
                  isSetDone(s)
                    ? `${s.result.kg != null ? `${formatNum(s.result.kg)} kg × ` : ''}${s.result.repsText || s.result.reps}${s.result.rir != null ? ` · RIR ${formatNum(s.result.rir)}` : ''}`
                    : 'no hecha'
                }`,
            ),
        };
        const prev = byWeek.get(w.number);
        if (!prev || better(p, prev)) byWeek.set(w.number, p);
      }
    }
  }
  return [...byWeek.values()].sort((a, b) => a.week - b.week);
};

export interface ExerciseRef {
  key: string;
  /** Día (o tipo de bloque si la persona entrena días libres). */
  group: string;
  block: string;
  name: string;
  order: number;
}

/** Lista de ejercicios de toda la historia, en el orden de la última semana. */
export const listExercises = (weeks: Week[], flexible: boolean): ExerciseRef[] => {
  const ordered = sortWeeks(weeks).reverse();
  const map = new Map<string, ExerciseRef>();
  ordered.forEach((w, wi) => {
    for (const d of w.days) {
      d.exercises.forEach((e, i) => {
        const key = exerciseKey(d.day, e.name, flexible);
        if (map.has(key)) return;
        map.set(key, {
          key,
          group: flexible ? blockType(d.block) || blockType(d.day) || d.day : d.day,
          block: flexible ? '' : d.block,
          name: e.name,
          order: i + (wi === 0 ? 0 : 100),
        });
      });
    }
  });
  return [...map.values()].sort((a, b) => dayIndex(a.group) - dayIndex(b.group) || a.order - b.order);
};
