import { findInLibrary } from '../library';
import { numOf, rirNum } from '../numbers';
import { exerciseNorm, normalize } from '../text';
import type { Athlete, Day, Exercise, Library, Week } from '../types';
import { emptyWeek, isSetDone, sortDays } from '../week';
import type { ParsedNote } from './parse';

export interface MergeResult {
  week: Week;
  /** Días que ya tenían datos y la nota no traía nada: se mantienen. */
  kept: string[];
  doneSets: number;
}

/**
 * Mezcla lo leído en la nota con la semana guardada:
 * copia del plan lo que la nota no trae (ejecución, nota del entrenador, vídeo y,
 * en la nota sencilla, lo que se pedía) y no pisa días ya rellenos con días vacíos.
 */
export function mergeNote(note: ParsedNote, saved: Week | null, n: number, athlete: Athlete, lib: Library): MergeResult {
  const res: Week = saved ? structuredClone(saved) : emptyWeek(athlete, n);
  res.number = n;
  if (note.rehabDays) res.rehabDays = note.rehabDays;
  if (note.bodyWeight != null) res.bodyWeight = note.bodyWeight;
  const kept: string[] = [];
  let doneSets = 0;

  for (const nd of note.days) {
    const od = res.days.find((d) => d.day === nd.day);
    const newHas = nd.exercises.some((e) => e.sets.some(isSetDone));
    const oldHas = !!od && od.exercises.some((e) => e.sets.some(isSetDone));
    if (!newHas && oldHas) {
      kept.push(nd.day);
      continue;
    }
    const exercises: Exercise[] = nd.exercises.map((e) => {
      const oe = od?.exercises.find((x) => exerciseNorm(x.name) === exerciseNorm(e.name));
      const entry = findInLibrary(lib, e.name);
      const coachNote = oe?.coachNote ?? '';
      let athleteNotes = e.athleteNotes;
      if (athleteNotes && coachNote && normalize(athleteNotes).includes(normalize(coachNote).slice(0, 25))) athleteNotes = '';
      return {
        name: e.name,
        execution: oe?.execution || entry?.execution || '',
        coachNote,
        videoUrl: oe?.videoUrl || entry?.videoUrl || '',
        athleteNotes,
        ...(oe?.variant ? { variant: oe.variant } : {}),
        sets: e.sets.map(({ fromPlan, ...s }) => {
          const set = structuredClone(s);
          if (fromPlan) {
            const os = oe?.sets.find((x) => x.n === s.n);
            if (os) set.target = structuredClone(os.target);
          }
          if (set.result.status === 'as-planned' && fromPlan) {
            set.result.reps = numOf(set.target.reps);
            set.result.kg = set.target.kg;
            set.result.rir = rirNum(set.target.rir);
          }
          if (isSetDone(set)) doneSets++;
          return set;
        }),
      };
    });
    const day: Day = { ...nd, block: nd.block || od?.block || '', warmup: od?.warmup ?? [], warmupNote: od?.warmupNote ?? '', exercises };
    if (od) Object.assign(od, day);
    else res.days.push(day);
  }
  res.days = sortDays(res.days);
  res.savedAt = new Date().toISOString();
  res.source = 'Nota';
  return { week: res, kept, doneSets };
}

