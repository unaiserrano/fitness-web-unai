import { notFound } from 'next/navigation';
import { cache } from 'react';
import { toLibrary } from '@/domain/library';
import type { Athlete, Library, LibraryExercise, Week } from '@/domain/types';
import { getAthlete, listAthletes } from '../repositories/athletes';
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
