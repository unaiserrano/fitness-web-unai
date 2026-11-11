import { notFound } from 'next/navigation';
import { cache } from 'react';
import { toLibrary } from '@/domain/library';
import { DELOAD_AFTER_WEEKS, doneWeeks, planWeek, sessionsDone, stagnantExercises, weeksSinceDeload } from '@/domain';
import type { Athlete, AthleteSummary, Library, LibraryExercise, Week } from '@/domain/types';
import { getAthlete, listAthletes, readSummaries, writeSummary } from '../repositories/athletes';
import { listLibrary } from '../repositories/library';
import { listWeeks } from '../repositories/weeks';

export interface AthleteContext {
  athlete: Athlete;
  weeks: Week[];
  libraryItems: LibraryExercise[];
  library: Library;
}

/** Todo lo que necesitan las páginas de una persona. Se pide una vez por petición (cache). */
export const loadAthleteContext = cache(async (id: string): Promise<AthleteContext> => {
  const [athlete, weeks, libraryItems] = await Promise.all([getAthlete(id), listWeeks(id), listLibrary()]);
  if (!athlete) notFound();
  return { athlete, weeks, libraryItems, library: toLibrary(libraryItems) };
});

export const loadAthletes = cache(listAthletes);

/** Resumen de cada persona para la home: usa la caché y solo recalcula lo que cambió. */
export const loadSummaries = cache(async (athletes: Athlete[]): Promise<Map<string, AthleteSummary>> => {
  const cached = await readSummaries();
  const out = new Map<string, AthleteSummary>();
  await Promise.all(
    athletes.map(async (a) => {
      const hit = cached.get(a.id);
      if (hit?.trend) return void out.set(a.id, hit);
      const weeks = await listWeeks(a.id);
      const last = doneWeeks(weeks).at(-1);
      const summary: AthleteSummary = {
        plan: planWeek(weeks)?.number ?? null,
        last: last ? { number: last.number, sessions: sessionsDone(last) } : null,
        stagnant: stagnantExercises(weeks, a.flexibleDays).length,
        deload: weeksSinceDeload(weeks) >= DELOAD_AFTER_WEEKS,
        trend: doneWeeks(weeks).slice(-10).map(sessionsDone),
      };
      await writeSummary(a.id, summary);
      out.set(a.id, summary);
    }),
  );
  return out;
});
