'use client';

import { createContext, useContext } from 'react';
import type { History } from '@/domain/history';
import type { Athlete, Library, Week } from '@/domain/types';

export interface StagnantInfo {
  weeks: number;
  best: string;
  bestWeek: number;
}

export interface LibEdit {
  muscleGroup?: string;
  weightStep?: number;
}

export interface RoutineCtx {
  athlete: Pick<Athlete, 'id' | 'name' | 'flexibleDays' | 'config'>;
  weekNumber: number;
  history: History;
  library: Library;
  muscleGroups: string[];
  stagnant: Record<string, StagnantInfo>;
  libEdits: Record<string, LibEdit>;
  setLibEdit: (slug: string, edit: LibEdit) => void;
  mutate: (fn: (w: Week) => void) => void;
}

export const RoutineContext = createContext<RoutineCtx | null>(null);

export function useRoutine(): RoutineCtx {
  const c = useContext(RoutineContext);
  if (!c) throw new Error('useRoutine fuera del editor');
  return c;
}
