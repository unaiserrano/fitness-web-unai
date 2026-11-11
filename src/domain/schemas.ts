/** Validación (zod) de todo lo que llega del navegador antes de guardarlo. */
import { z } from 'zod';

const text = (max = 2000) => z.string().max(max).default('');
const nullableNum = z.number().finite().nullable();

export const setTargetSchema = z.object({
  reps: text(60),
  kg: nullableNum,
  kgText: text(60),
  rir: text(20),
  base: z.object({ reps: text(60), rir: text(20) }).optional(),
});

export const setResultSchema = z.object({
  raw: text(200),
  reps: nullableNum,
  repsText: text(60),
  kg: nullableNum,
  rir: nullableNum,
  status: z.enum(['empty', 'done', 'as-planned', 'error']),
  warning: z.string().max(300).optional(),
});

export const workSetSchema = z.object({
  n: z.number().int().min(1).max(50),
  target: setTargetSchema,
  result: setResultSchema,
  ignored: z.boolean().optional(),
});

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, 'Falta el nombre de un ejercicio').max(120),
  execution: text(200),
  coachNote: text(1000),
  videoUrl: text(500),
  athleteNotes: text(2000),
  variant: z.string().max(120).optional(),
  sets: z.array(workSetSchema).max(20),
});

export const warmupItemSchema = z.object({ name: text(160), dose: text(60), videoUrl: text(500) });

export const daySchema = z.object({
  day: z.string().min(1).max(40),
  block: text(60),
  warmup: z.array(warmupItemSchema).max(30).default([]),
  warmupNote: text(200),
  rehab: text(60),
  ankle: text(300),
  energy: nullableNum,
  satisfaction: nullableNum,
  notes: text(3000),
  doneOn: z.string().max(60).optional(),
  exercises: z.array(exerciseSchema).max(30),
});

const lines = z.array(z.string().max(500)).max(30).default([]);

export const weekSchema = z.object({
  number: z.number().int().min(1).max(999),
  dates: text(80),
  deload: z.boolean().default(false),
  intro: text(500),
  rehabText: text(500),
  rehabDays: text(200),
  bodyWeight: nullableNum,
  notes: z.object({ good: lines, bad: lines, mustNot: lines, remember: lines }),
  days: z.array(daySchema).max(7),
  savedAt: z.string().optional(),
  source: z.string().max(40).optional(),
});

export const rehabItemSchema = z.object({ name: text(160), reps: text(80), tempo: text(200), videoUrl: text(500) });

export const athleteConfigSchema = z.object({
  rehab: z.array(rehabItemSchema).max(20),
  rehabZone: text(60),
  rehabText: text(200),
  remember: lines,
  muscleGroups: z.array(z.string().min(1).max(40)).min(1).max(30),
});

export const athleteSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Identificador no válido'),
  name: z.string().trim().min(1, 'Pon el nombre').max(80),
  subtitle: text(160),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida (AAAA-MM-DD)'),
  targetSessions: z.number().int().min(1).max(7),
  noteStyle: z.enum(['standard', 'simple']),
  flexibleDays: z.boolean(),
  config: athleteConfigSchema,
});

export const libraryExerciseSchema = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().trim().min(1, 'Pon el nombre del ejercicio').max(120),
  muscleGroup: z.string().min(1).max(40),
  execution: text(200),
  videoUrl: text(500),
  weightStep: z.number().positive().max(50),
  volumeSplit: z.record(z.string(), z.number().min(0).max(1)).nullable(),
});
