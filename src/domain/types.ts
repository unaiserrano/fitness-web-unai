/**
 * Modelo de dominio de la app de seguimiento.
 * Todo lo que hay en `src/domain` es TypeScript puro: sin React, sin base de datos.
 */

export type SetStatus = 'empty' | 'done' | 'as-planned' | 'error';

/** Lo que el entrenador pide en una serie. */
export interface SetTarget {
  /** Repeticiones tal cual se escriben: "12", "8-10", "12 por pierna", "20 m". */
  reps: string;
  /** Kilos numéricos. 0 = sin peso, null = sin indicar. */
  kg: number | null;
  /** Texto libre cuando el peso no es un número ("goma roja", "barra vacía"). */
  kgText: string;
  /** RIR pedido como texto ("2", "2-3"). */
  rir: string;
  /** Objetivo original antes de aplicar una recomendación (reps y RIR). */
  base?: { reps: string; rir: string };
}

/** Lo que el atleta dice que hizo en esa serie. */
export interface SetResult {
  raw: string;
  reps: number | null;
  /** Texto de reps cuando no son un número (distancias: "20 m"). */
  repsText: string;
  kg: number | null;
  rir: number | null;
  status: SetStatus;
  warning?: string;
}

export interface WorkSet {
  n: number;
  target: SetTarget;
  result: SetResult;
  ignored?: boolean;
}

export interface Exercise {
  name: string;
  execution: string;
  coachNote: string;
  videoUrl: string;
  athleteNotes: string;
  variant?: string;
  sets: WorkSet[];
}

export interface WarmupItem {
  name: string;
  dose: string;
  videoUrl: string;
}

export interface Day {
  day: string;
  block: string;
  warmup: WarmupItem[];
  warmupNote: string;
  rehab: string;
  ankle: string;
  energy: number | null;
  satisfaction: number | null;
  notes: string;
  /** Día real en que lo hizo (personas con días libres). */
  doneOn?: string;
  exercises: Exercise[];
}

export interface CoachNotes {
  good: string[];
  bad: string[];
  mustNot: string[];
  remember: string[];
}

export interface Week {
  number: number;
  dates: string;
  deload: boolean;
  intro: string;
  rehabText: string;
  rehabDays: string;
  bodyWeight: number | null;
  notes: CoachNotes;
  days: Day[];
  savedAt?: string;
  source?: string;
}

export interface RehabItem {
  name: string;
  reps: string;
  tempo: string;
  videoUrl: string;
}

export type NoteStyle = 'standard' | 'simple';

export interface AthleteConfig {
  rehab: RehabItem[];
  rehabZone: string;
  rehabText: string;
  remember: string[];
  muscleGroups: string[];
}

export interface Athlete {
  id: string;
  name: string;
  subtitle: string;
  /** Fecha (YYYY-MM-DD) del lunes de la semana 1. */
  startDate: string;
  targetSessions: number;
  noteStyle: NoteStyle;
  /** Entrena los días que quiere: se agrupa por bloque, no por día de la semana. */
  flexibleDays: boolean;
  config: AthleteConfig;
}

export interface LibraryExercise {
  slug: string;
  name: string;
  muscleGroup: string;
  execution: string;
  videoUrl: string;
  /** Salto mínimo de peso en kg (1, 1.25, 2.5, 5). */
  weightStep: number;
  /** Reparto de volumen a otros grupos. null = reglas por defecto. */
  volumeSplit: Record<string, number> | null;
}

export type Library = ReadonlyMap<string, LibraryExercise>;

export const DEFAULT_MUSCLE_GROUPS = [
  'Cuádriceps',
  'Isquios',
  'Glúteo',
  'Aductores',
  'Gemelos',
  'Pecho',
  'Espalda',
  'Hombro',
  'Bíceps',
  'Tríceps',
] as const;

export const DEFAULT_REMEMBER = [
  'Ajusta sobre la marcha: si en una serie haces más repeticiones o te quedas con menos RIR, ajusta la siguiente para acercarte al RIR que te pido.',
  'Ve rellenando la nota durante cada sesión y mándamela al terminar.',
];

export const emptyNotes = (): CoachNotes => ({ good: [], bad: [], mustNot: [], remember: [] });

export const defaultConfig = (): AthleteConfig => ({
  rehab: [],
  rehabZone: '',
  rehabText: '',
  remember: [...DEFAULT_REMEMBER],
  muscleGroups: [...DEFAULT_MUSCLE_GROUPS],
});
