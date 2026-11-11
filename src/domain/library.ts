import { exerciseNorm, slugify } from './text';
import type { Library, LibraryExercise } from './types';

export const findInLibrary = (lib: Library, name: string): LibraryExercise | null => lib.get(slugify(name)) ?? null;

export const muscleGroupOf = (lib: Library, name: string): string => findInLibrary(lib, name)?.muscleGroup || 'Otros';

export const weightStepOf = (lib: Library, name: string): number => findInLibrary(lib, name)?.weightStep || 2.5;

/** Nombre "bonito" para un ejercicio escrito en mayúsculas en una nota. */
export const prettyName = (caps: string, lib: Library, known: string[] = []): string => {
  const n = exerciseNorm(caps);
  for (const l of lib.values()) if (exerciseNorm(l.name) === n) return l.name;
  for (const k of known) if (exerciseNorm(k) === n) return k;
  const s = caps.toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const toLibrary = (items: LibraryExercise[]): Library => new Map(items.map((x) => [x.slug, x]));

export const WEIGHT_STEPS = [1, 1.25, 2.5, 5] as const;
