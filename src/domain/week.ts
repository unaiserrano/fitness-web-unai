import { WEEKDAYS, dayIndex, weekDates } from './calendar';
import { normalize } from './text';
import type { Athlete, Day, Exercise, SetResult, Week, WorkSet } from './types';
import { emptyNotes } from './types';

export const emptyResult = (): SetResult => ({ raw: '', reps: null, repsText: '', kg: null, rir: null, status: 'empty' });

export const isSetDone = (s: WorkSet | null | undefined): boolean =>
  !!s && !s.ignored && (s.result.status === 'done' || s.result.status === 'as-planned');

export const weekHasResults = (w: Week): boolean =>
  w.days.some((d) => d.exercises.some((e) => e.sets.some(isSetDone)));

export const sortWeeks = (weeks: Week[]): Week[] => [...weeks].sort((a, b) => a.number - b.number);

export const doneWeeks = (weeks: Week[]): Week[] => sortWeeks(weeks).filter(weekHasResults);

/** La semana que se le está pidiendo: la última, si todavía no tiene datos. */
export const planWeek = (weeks: Week[]): Week | null => {
  const o = sortWeeks(weeks);
  const last = o[o.length - 1];
  return last && !weekHasResults(last) ? last : null;
};

export const lastDoneWeekNumber = (weeks: Week[]): number => {
  const d = doneWeeks(weeks);
  return d.length ? d[d.length - 1].number : 0;
};

export const sessionsDone = (w: Week): number =>
  w.days.filter((d) => d.exercises.some((e) => e.sets.some(isSetDone))).length;

export const totalSets = (d: Day): number => d.exercises.reduce((t, e) => t + e.sets.length, 0);

/** Días de rehab de una semana; null si no se sabe. */
export const rehabCount = (w: Week): number | null => {
  const t = normalize(w.rehabDays);
  const set = new Set<string>();
  for (const d of WEEKDAYS) if (t.includes(normalize(d))) set.add(d);
  for (const d of w.days) if (/^s[ií]/i.test(d.rehab || '')) set.add(d.day);
  const known = !!t || w.days.some((d) => d.rehab);
  return known ? set.size : null;
};

export const hasRehab = (athlete: Athlete, weeks: Week[]): boolean =>
  athlete.config.rehab.length > 0 || weeks.some((w) => rehabCount(w) != null);

export const emptyDay = (day: string): Day => ({
  day,
  block: '',
  warmup: [],
  warmupNote: '',
  rehab: '',
  ankle: '',
  energy: null,
  satisfaction: null,
  notes: '',
  exercises: [],
});

export const emptyWeek = (athlete: Athlete, n: number): Week => ({
  number: n,
  dates: weekDates(athlete.startDate, n),
  deload: false,
  intro: '',
  rehabText: '',
  rehabDays: '',
  bodyWeight: null,
  notes: emptyNotes(),
  days: [],
});

export const newExercise = (name: string, base?: Partial<Exercise>): Exercise => ({
  name,
  execution: base?.execution ?? '',
  coachNote: '',
  videoUrl: base?.videoUrl ?? '',
  athleteNotes: '',
  sets: [1, 2, 3].map((n) => ({ n, target: { reps: '10', kg: null, kgText: '', rir: '2' }, result: emptyResult() })),
});

/** Nueva semana copiando la estructura de otra (sin resultados ni notas del atleta). */
export const newWeekFrom = (athlete: Athlete, base: Week, n: number): Week => ({
  number: n,
  dates: weekDates(athlete.startDate, n),
  deload: false,
  intro: base.intro,
  rehabText: base.rehabText,
  rehabDays: '',
  bodyWeight: null,
  notes: { good: [], bad: [], mustNot: [...base.notes.mustNot], remember: [...base.notes.remember] },
  days: base.days.map((d) => ({
    ...emptyDay(d.day),
    block: d.block,
    warmup: d.warmup.map((x) => ({ ...x })),
    warmupNote: d.warmupNote,
    exercises: d.exercises.map((e) => ({
      name: e.name,
      execution: e.execution,
      coachNote: '',
      videoUrl: e.videoUrl,
      athleteNotes: '',
      ...(e.variant ? { variant: e.variant } : {}),
      sets: e.sets.map((s) => ({ n: s.n, target: { ...s.target }, result: emptyResult() })),
    })),
  })),
});

export const sortDays = (days: Day[]): Day[] => [...days].sort((a, b) => dayIndex(a.day) - dayIndex(b.day));

export const renumberSets = (w: Week): Week => ({
  ...w,
  days: w.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e, sets: e.sets.map((s, i) => ({ ...s, n: i + 1 })) })) })),
});
