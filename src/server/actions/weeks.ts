'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { findInLibrary, toLibrary } from '@/domain/library';
import { mergeNote } from '@/domain/notes/merge';
import { parseNote } from '@/domain/notes/parse';
import { prettyName } from '@/domain/library';
import { weekSchema } from '@/domain/schemas';
import { slugify } from '@/domain/text';
import type { LibraryExercise, Week } from '@/domain/types';
import { renumberSets } from '@/domain/week';
import { assertAuthorized } from '../auth/guard';
import { getAthlete } from '../repositories/athletes';
import { listLibrary, saveLibraryItems } from '../repositories/library';
import { WeekConflictError, deleteWeek, getWeek, listRevisions, listWeeks, saveWeek } from '../repositories/weeks';

export interface ActionResult {
  ok: boolean;
  message: string;
}

const libEditsSchema = z.record(z.string(), z.object({ muscleGroup: z.string().max(40).optional(), weightStep: z.number().positive().max(50).optional() }));

const fail = (e: unknown): ActionResult => {
  if (e instanceof z.ZodError) return { ok: false, message: `Revisa los datos: ${e.issues[0]?.message ?? 'formato no válido'}` };
  if (e instanceof WeekConflictError || (e instanceof Error && e.message === 'No autorizado')) return { ok: false, message: e.message };
  console.error('[acción]', e);
  return { ok: false, message: 'No se pudo guardar. Inténtalo de nuevo en unos segundos.' };
};

/**
 * Guarda una semana. De paso actualiza la biblioteca con el vídeo, la ejecución,
 * el grupo muscular y el salto de peso de cada ejercicio (como hacía la app anterior).
 */
export async function saveWeekAction(
  athleteId: string,
  rawWeek: unknown,
  rawLibEdits: unknown = {},
  expectedSavedAt?: string | null,
): Promise<ActionResult & { savedAt?: string }> {
  try {
    await assertAuthorized();
    if (!(await getAthlete(athleteId))) return { ok: false, message: 'Esa persona no existe.' };
    const week = renumberSets(weekSchema.parse(rawWeek) as Week);
    const edits = libEditsSchema.parse(rawLibEdits);
    week.savedAt = new Date().toISOString();
    await saveWeek(athleteId, week, { expectedSavedAt });

    const lib = toLibrary(await listLibrary());
    const writes = new Map<string, LibraryExercise>();
    for (const d of week.days) {
      for (const e of d.exercises) {
        const slug = slugify(e.name);
        const cur = findInLibrary(lib, e.name) ?? { slug, name: e.name, muscleGroup: 'Otros', execution: '', videoUrl: '', weightStep: 2.5, volumeSplit: null };
        const next: LibraryExercise = { ...cur, ...(writes.get(slug) ?? {}) };
        const ed = edits[slug];
        if (ed?.muscleGroup) next.muscleGroup = ed.muscleGroup;
        if (ed?.weightStep) next.weightStep = ed.weightStep;
        if (e.videoUrl) next.videoUrl = e.videoUrl;
        if (e.execution) next.execution = e.execution;
        if (JSON.stringify(next) !== JSON.stringify(cur)) writes.set(slug, next);
      }
    }
    await saveLibraryItems([...writes.values()]);
    revalidatePath(`/personas/${athleteId}`, 'layout');
    revalidatePath('/');
    return { ok: true, message: `Semana ${week.number} guardada.`, savedAt: week.savedAt };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWeekAction(athleteId: string, number: number): Promise<ActionResult> {
  try {
    await assertAuthorized();
    await deleteWeek(athleteId, z.number().int().min(1).parse(number));
    revalidatePath(`/personas/${athleteId}`, 'layout');
    revalidatePath('/');
    return { ok: true, message: `Semana ${number} borrada.` };
  } catch (e) {
    return fail(e);
  }
}

/** Lee la nota que manda el atleta, la mezcla con la semana guardada y la guarda. */
export async function importNoteAction(athleteId: string, number: number, text: string): Promise<ActionResult> {
  try {
    await assertAuthorized();
    const athlete = await getAthlete(athleteId);
    if (!athlete) return { ok: false, message: 'Esa persona no existe.' };
    const n = z.number().int().min(1).max(999).parse(number);
    const body = z.string().min(1).max(50_000).parse(text);
    const [lib, weeks, saved] = await Promise.all([listLibrary().then(toLibrary), listWeeks(athleteId), getWeek(athleteId, n)]);
    const known = weeks.flatMap((w) => w.days.flatMap((d) => d.exercises.map((e) => e.name)));
    const note = parseNote(body, (caps) => prettyName(caps, lib, known));
    if (!note.days.length) return { ok: false, message: 'No encuentro ningún día en la nota.' };
    const { week } = mergeNote(note, saved, n, athlete, lib);
    await saveWeek(athleteId, weekSchema.parse(week) as Week);
    revalidatePath(`/personas/${athleteId}`, 'layout');
    revalidatePath('/');
    return { ok: true, message: `Semana ${n} guardada con la nota.` };
  } catch (e) {
    return fail(e);
  }
}

/** Versiones anteriores de una semana, para poder volver atrás. */
export async function listRevisionsAction(athleteId: string, number: number) {
  await assertAuthorized();
  const revs = await listRevisions(athleteId, z.number().int().min(1).parse(number));
  return revs.map((r) => ({ id: r.id, createdAt: r.createdAt, week: r.content }));
}
