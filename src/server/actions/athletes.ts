'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { athleteSchema } from '@/domain/schemas';
import { slugify } from '@/domain/text';
import type { Athlete } from '@/domain/types';
import { assertAuthorized } from '../auth/guard';
import { getAthlete, listAthletes, saveAthlete } from '../repositories/athletes';
import type { ActionResult } from './weeks';

export async function saveAthleteAction(raw: unknown, opts: { isNew?: boolean } = {}): Promise<ActionResult & { id?: string }> {
  try {
    await assertAuthorized();
    const input = raw as Partial<Athlete>;
    const candidate = { ...input, id: opts.isNew ? slugify(input.name ?? '', 'persona') : input.id };
    const a = athleteSchema.parse(candidate) as Athlete;
    if (opts.isNew) {
      let id = a.id;
      for (let i = 2; await getAthlete(id); i++) id = `${a.id}-${i}`;
      a.id = id;
      await saveAthlete(a, (await listAthletes()).length);
    } else {
      if (!(await getAthlete(a.id))) return { ok: false, message: 'Esa persona no existe.' };
      await saveAthlete(a);
    }
    revalidatePath('/', 'layout');
    return { ok: true, message: `${a.name} guardado.`, id: a.id };
  } catch (e) {
    return { ok: false, message: e instanceof z.ZodError ? (e.issues[0]?.message ?? 'Datos no válidos') : 'No se pudo guardar.' };
  }
}
