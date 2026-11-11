/**
 * Diario semana a semana: récords, comentarios de la persona (con los importantes marcados)
 * y tipos de hito. Igual que la pestaña «Diario» de la app anterior.
 */
import { formatNum, rangeOf } from './numbers';
import { exerciseKey } from './text';
import { isDistance } from './format';
import { listExercises, repsDiff } from './history';
import { isSetDone, sortWeeks } from './week';
import type { Exercise, Week } from './types';

export type MilestoneKind = 'hito' | 'aviso' | 'cambio';
export const MILESTONE_KINDS: Array<[MilestoneKind, string]> = [
  ['hito', 'Hito (avance)'],
  ['aviso', 'Aviso (dolor, molestias…)'],
  ['cambio', 'Cambio en la rutina'],
];

export interface Milestone {
  id: string;
  week: number | null;
  kind: MilestoneKind;
  text: string;
}

/** Mejor serie «válida»: con peso y llegando (o quedándose a 1) de las repeticiones pedidas. */
export const bestValidSet = (e: Exercise): { kg: number; reps: number } | null => {
  let best: { kg: number; reps: number } | null = null;
  for (const s of e.sets) {
    if (!isSetDone(s) || !((s.result.kg ?? 0) > 0) || s.result.reps == null || isDistance(s.result.repsText)) continue;
    const d = repsDiff(s.result.reps, rangeOf(s.target.reps));
    if (d != null && d < -1) continue;
    const kg = s.result.kg as number;
    if (!best || kg > best.kg || (kg === best.kg && s.result.reps > best.reps)) best = { kg, reps: s.result.reps };
  }
  return best;
};

/** Récords de una semana frente a todo lo anterior: más kilos, o más reps con el mismo peso. */
export function weekRecords(weeks: Week[], week: Week, flexible: boolean): string[] {
  const ordered = sortWeeks(weeks);
  const out: string[] = [];
  for (const ex of listExercises(ordered, flexible)) {
    let prev: { kg: number; reps: number } | null = null;
    let cur: { kg: number; reps: number } | null = null;
    for (const w of ordered) {
      if (w.number > week.number) break;
      for (const d of w.days) {
        for (const e of d.exercises) {
          if (exerciseKey(d.day, e.name, flexible) !== ex.key) continue;
          const b = bestValidSet(e);
          if (!b) continue;
          if (w.number === week.number) cur = !cur || b.kg > cur.kg || (b.kg === cur.kg && b.reps > cur.reps) ? b : cur;
          else if (!prev || b.kg > prev.kg || (b.kg === prev.kg && b.reps > prev.reps)) prev = b;
        }
      }
    }
    if (!cur || !prev) continue;
    if (cur.kg > prev.kg) out.push(`${ex.name}: ${formatNum(cur.kg)} kg × ${cur.reps} (antes ${formatNum(prev.kg)} kg × ${prev.reps})`);
    else if (cur.kg === prev.kg && cur.reps > prev.reps) out.push(`${ex.name}: ${formatNum(cur.kg)} kg × ${cur.reps} (antes × ${prev.reps})`);
  }
  return out;
}

/** Palabras que hacen que un comentario se marque solo como importante. */
const IMPORTANT_RE = /hinch|dolor|dol[ií]|duel|molest|tobill|\bpie\b|bota|lesi|no he podido|no pude|mare|siguiente mancuerna|me mata|sin caj|cansad|pinchaz|cojea|crujid/i;
const NOTHING_RE = /^\s*(no|nada|bien|ninguna?|-)\s*$/i;

export interface AthleteComment {
  /** Clave estable (compatible con las marcas de la app anterior). */
  key: string;
  who: string;
  text: string;
  important: boolean;
}

export function weekComments(w: Week, flexible: boolean, zone = 'tobillo'): AthleteComment[] {
  const out: AthleteComment[] = [];
  for (const d of w.days) {
    if (d.ankle && !NOTHING_RE.test(d.ankle)) out.push({ key: `${d.day}|tobillo`, who: `${d.day} · ${zone.toLowerCase() || 'molestias'}`, text: d.ankle, important: false });
    for (const e of d.exercises) if (e.athleteNotes) out.push({ key: `${exerciseKey(d.day, e.name, flexible)}|notas`, who: `${d.day} · ${e.name}`, text: e.athleteNotes, important: false });
    if (d.notes) out.push({ key: `${d.day}|obs`, who: `${d.day} · observaciones`, text: d.notes, important: false });
  }
  const marks = w.marks ?? {};
  for (const c of out) c.important = c.key in marks ? !!marks[c.key] : IMPORTANT_RE.test(c.text);
  return out.sort((a, b) => Number(b.important) - Number(a.important));
}
