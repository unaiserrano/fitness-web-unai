import { isDistance } from './format';
import type { History } from './history';
import { lastDoneSet } from './history';
import { weightStepOf } from './library';
import { capacityAt, estimated1RM, formatNum, mid, rangeOf, rirNum, roundTo } from './numbers';
import type { Library, WorkSet } from './types';
import { isSetDone } from './week';

export interface Recommendation {
  kg: number;
  repsText: string;
  rir: number;
  oneRM: number;
  same: boolean;
  fromWeek: number;
  reason: string;
}

const rirOrTarget = (s: WorkSet): number => s.result.rir ?? (rangeOf(s.target.rir) ?? [1])[0];
const oneRMOf = (s: WorkSet): number => estimated1RM(s.result.kg ?? 0, s.result.reps ?? 0, rirOrTarget(s));
const usable = (s: WorkSet): boolean =>
  isSetDone(s) && (s.result.kg ?? 0) > 0 && s.result.reps != null && !isDistance(s.result.repsText);

/**
 * Recomendación de peso para una serie (método aprobado por Javier):
 * fuerza estimada (Epley con RIR) de la misma serie la última vez que la hizo,
 * y el peso que deja las repeticiones + RIR pedidos, redondeado al salto del ejercicio.
 */
export function recommend(args: {
  history: History;
  key: string;
  exerciseName: string;
  set: WorkSet;
  week: number;
  library: Library;
}): Recommendation | null {
  const { history, key, exerciseName, set, week, library } = args;
  const last = lastDoneSet(history, key, set.n, week);
  if (!last) return null;
  if (!usable(last.set)) return null;

  // Si esa serie fue mucho más ligera que la mejor de esa semana (calentamiento), se usa la mejor.
  let best: WorkSet | null = null;
  let maxKg = 0;
  for (const x of last.entry.sets) {
    if (!usable(x)) continue;
    if (!best || oneRMOf(x) > oneRMOf(best)) best = x;
    maxKg = Math.max(maxKg, x.result.kg ?? 0);
  }
  const light = !!best && (last.set.result.kg ?? 0) < maxKg && oneRMOf(last.set) < oneRMOf(best) * 0.9;
  const src = light && best ? best : last.set;
  const q = rirOrTarget(src);
  const rm = oneRMOf(src);
  const done = src.result;

  const goal = set.target.base ?? set.target;
  const repsRange = rangeOf(goal.reps) ?? rangeOf(last.set.target.reps);
  if (!repsRange) return null;
  const rirRange = rangeOf(goal.rir) ?? rangeOf(last.set.target.rir) ?? [1, 1];
  const reps = mid(repsRange);
  const rir = mid(rirRange);
  const step = weightStepOf(library, exerciseName);
  const diff = (done.reps ?? 0) + q - (reps + rir);
  const kg = Math.abs(diff) <= 1 ? (done.kg ?? 0) : Math.max(step, roundTo(rm / (1 + (reps + rir) / 30), step));
  const cap = capacityAt(rm, kg);

  let fixedReps: number | null = repsRange[0] === repsRange[1] ? Math.round(reps) : null;
  let rirOut = Math.round(cap - reps) || 0;
  let repsText = fixedReps != null ? String(fixedReps) : `${repsRange[0]}-${repsRange[1]}`;
  if (rirOut < 0) {
    fixedReps = Math.max(1, Math.floor(cap));
    rirOut = 0;
    repsText = String(fixedReps);
  }
  rirOut = Math.min(rirOut, 5);

  const same =
    set.target.kg === kg && String(set.target.reps).replace(/\s/g, '') === repsText && rirNum(set.target.rir) === rirOut;

  let why: string;
  if (Math.abs(diff) <= 1) why = kg === done.kg ? 'Lo clavó: mismo peso' : `Lo clavó con ${formatNum(done.kg)} kg: ${formatNum(kg)} kg`;
  else if (diff > 1)
    why =
      kg > (done.kg ?? 0)
        ? `Le sobraron ${Math.round(diff)}: subo a ${formatNum(kg)} kg`
        : `Le sobraron ${Math.round(diff)}, pero el siguiente salto de peso es mucho: mismo peso`;
  else why = kg < (done.kg ?? 0) ? `Se quedó corto (${Math.round(-diff)} menos): bajo a ${formatNum(kg)} kg` : 'Se quedó corto: mismo peso';
  if (fixedReps != null && fixedReps < Math.round(reps)) why += `; con ${formatNum(kg)} kg le saldrán unas ${fixedReps}, al fallo`;
  else if (rirOut !== Math.round(rir))
    why += rirOut === 1 ? `; con ${formatNum(kg)} kg le quedará 1 en reserva` : `; con ${formatNum(kg)} kg le quedarán unas ${rirOut} en reserva`;

  const fmt = (x: WorkSet) =>
    `${formatNum(x.result.kg)} kg × ${x.result.reps}${x.result.rir != null ? ` · RIR ${formatNum(x.result.rir)}` : ''}`;
  const asked = (x: WorkSet) => `pedías ${x.target.reps}${x.target.rir !== '' ? ` · RIR ${x.target.rir}` : ''}`;
  const reason = light
    ? `Sem ${last.week}: la S${last.set.n} fue ligera (${fmt(last.set)}); su mejor serie, ${fmt(src)} (${asked(src)}). ${why}.`
    : `Sem ${last.week}: ${fmt(last.set)} (${asked(last.set)}). ${why}.`;

  return { kg, repsText, rir: rirOut, oneRM: rm, same, fromWeek: last.week, reason };
}

/** Pone la recomendación en la serie guardando el objetivo original. */
export const applyRecommendation = (set: WorkSet, r: Recommendation): WorkSet => ({
  ...set,
  target: {
    ...set.target,
    base: set.target.base ?? { reps: set.target.reps, rir: set.target.rir },
    kg: r.kg,
    kgText: `${formatNum(r.kg)} kg`,
    reps: r.repsText,
    rir: String(r.rir),
  },
});

/** Con lo que se ha puesto a mano, qué RIR saldría (para avisar si no cuadra). */
export const predictedRir = (r: Recommendation, set: WorkSet): { rir: number; fails: boolean; capReps: number } | null => {
  const kg = set.target.kg;
  const tr = rangeOf(set.target.reps);
  if (!(kg && kg > 0) || !tr) return null;
  const cap = capacityAt(r.oneRM, kg);
  const pr = cap - mid(tr);
  return { rir: Math.max(0, Math.round(pr)), fails: pr < -0.5, capReps: Math.floor(cap) };
};
