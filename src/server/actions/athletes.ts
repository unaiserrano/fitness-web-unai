'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { athleteSchema } from '@/domain/schemas';
import { slugify } from '@/domain/text';
import type { Athlete } from '@/domain/types';
import { assertAuthorized } from '../auth/guard';
import { createAthlete, getAthlete, listAthletes, saveAthlete } from '../repositories/athletes';
import type { ActionResult } from './weeks';

export async function saveAthleteAction(raw: unknown, opts: { isNew?: boolean } = {}): Promise<ActionResult & { id?: string }> {
  try {
    await assertAuthorized();
    const input = z.object({ name: z.string().max(120).optional(), id: z.string().max(80).optional() }).passthrough().parse(raw);
    const candidate = { ...input, id: opts.isNew ? slugify(input.name ?? '', 'persona') : input.id };
    const a = athleteSchema.parse(candidate) as Athlete;
    if (opts.isNew) {
      const base = a.id;
      const order = (await listAthletes()).length;
      for (let i = 1; ; i++) {
        if (i > 50) return { ok: false, message: 'No se pudo crear: ya hay demasiadas personas con ese nombre.' };
        a.id = i === 1 ? base : `${base}-${i}`;
        if (await createAthlete(a, order)) break;
      }
    } else {
      if (!(await getAthlete(a.id))) return { ok: false, message: 'Esa persona no existe.' };
      await saveAthlete(a);
    }
    revalidatePath('/', 'layout');
    return { ok: true, message: `${a.name} guardado.`, id: a.id };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, message: e.issues[0]?.message ?? 'Datos no válidos' };
    if (e instanceof Error && e.message === 'No autorizado') return { ok: false, message: e.message };
    console.error('[athletes]', e);
    return { ok: false, message: 'No se pudo guardar. Inténtalo de nuevo en unos segundos.' };
  }
}
