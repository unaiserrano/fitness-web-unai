import { repsDiff } from '../history';
import { rangeOf } from '../numbers';
import type { CoachNotes, Week } from '../types';
import { doneWeeks, isSetDone, rehabCount, sessionsDone } from '../week';

/** Propone "lo que va bien / lo que ha fallado / lo que no puede fallar" con la semana anterior. */
export function proposeCoachNotes(
  weeks: Week[],
  forWeek: number,
  opts: { targetSessions: number; hasRehab: boolean },
): Pick<CoachNotes, 'good' | 'bad' | 'mustNot'> {
  const prev = doneWeeks(weeks).filter((w) => w.number < forWeek).slice(-1)[0];
  const good: string[] = [];
  const bad: string[] = [];
  const mustNot = [
    'Rehabilitación: mínimo 4 días a la semana, sí o sí.',
    'Si el pie se hincha, no hagas lo que carga el tobillo y avísame.',
    'Respeta el RIR que te pido en cada serie.',
    'Apunta el sábado tu peso corporal.',
  ].filter((t) => opts.hasRehab || !/rehab|tobillo|pie se hincha/i.test(t));
  if (!prev) return { good, bad, mustNot };

  const sessions = sessionsDone(prev);
  if (sessions >= opts.targetSessions) good.push(`Has entrenado ${sessions} días.`);
  else bad.push(`Entrenamientos: hiciste ${sessions} de ${opts.targetSessions}.`);
  const rc = rehabCount(prev);
  if (rc != null) {
    if (rc >= 4) good.push(`Has hecho la rehab ${rc} días.`);
    else bad.push(`Rehab: hiciste ${rc} de 4 sesiones.`);
  }
  for (const d of prev.days) {
    const dayHas = d.exercises.some((x) => x.sets.some(isSetDone));
    for (const e of d.exercises) {
      const ss = e.sets.filter((s) => !s.ignored);
      const diff = (s: (typeof ss)[number]) => repsDiff(s.result.reps, rangeOf(s.target.reps));
      const over = ss.filter((s) => isSetDone(s) && (diff(s) ?? 0) >= 3);
      const under = ss.filter((s) => isSetDone(s) && (diff(s) ?? 0) <= -2);
      const miss = ss.filter((s) => !isSetDone(s));
      const allOk = ss.length > 0 && ss.every((s) => isSetDone(s) && Math.abs(diff(s) ?? 0) <= 1);
      if (under.length)
        bad.push(
          `${e.name}: en la ${under.map((s) => `${s.n}.ª`).join(' y ')} te quedaste corto (${under.map((s) => `${s.result.reps} de ${s.target.reps}`).join(', ')}).`,
        );
      if (miss.length && miss.length < ss.length) bad.push(`${e.name}: ${ss.length - miss.length} series de ${ss.length}.`);
      else if (miss.length === ss.length && sessions > 0 && dayHas) bad.push(`${e.name}: no lo hiciste.`);
      if (over.length >= 2) bad.push(`${e.name}: te sobran muchas repeticiones con ese peso; esta semana sube.`);
      if (allOk) good.push(`${e.name}: clavaste lo que te pedía.`);
    }
  }
  return { good: good.slice(0, 7), bad: bad.slice(0, 7), mustNot };
}
