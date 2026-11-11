'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertAuthorized } from '../auth/guard';
import { getAthlete } from '../repositories/athletes';
import { addMilestone, deleteMilestone } from '../repositories/milestones';
import { getWeek, saveWeek } from '../repositories/weeks';
import type { ActionResult } from './weeks';

const milestoneInput = z.object({
  week: z.number().int().min(1).max(999).nullable(),
  kind: z.enum(['hito', 'aviso', 'cambio']),
  text: z.string().trim().min(1, 'Escribe el hito').max(500),
});

const done = (athleteId: string, message: string): ActionResult => {
  revalidatePath(`/personas/${athleteId}`, 'layout');
  return { ok: true, message };
};
const fail = (e: unknown): ActionResult => ({ ok: false, message: e instanceof z.ZodError ? (e.issues[0]?.message ?? 'Datos no válidos') : 'No se pudo guardar.' });

export async function addMilestoneAction(athleteId: string, raw: unknown): Promise<ActionResult> {
  try {
    await assertAuthorized();
    if (!(await getAthlete(athleteId))) return { ok: false, message: 'Esa persona no existe.' };
    const m = milestoneInput.parse(raw);
    await addMilestone(athleteId, { id: `h-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, ...m });
    return done(athleteId, 'Hito guardado.');
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMilestoneAction(athleteId: string, id: string): Promise<ActionResult> {
  try {
    await assertAuthorized();
    await deleteMilestone(athleteId, z.string().max(80).parse(id));
    return done(athleteId, 'Hito borrado.');
  } catch (e) {
    return fail(e);
  }
}

/** Marca o desmarca un comentario de la persona como importante. */
export async function toggleMarkAction(athleteId: string, weekNumber: number, key: string, value: boolean): Promise<ActionResult> {
  try {
    await assertAuthorized();
    const w = await getWeek(athleteId, z.number().int().parse(weekNumber));
    if (!w) return { ok: false, message: 'Esa semana no existe.' };
    await saveWeek(athleteId, { ...w, marks: { ...(w.marks ?? {}), [z.string().max(300).parse(key)]: !!value } });
    return done(athleteId, value ? 'Marcado como importante.' : 'Quitado de importantes.');
  } catch (e) {
    return fail(e);
  }
}
