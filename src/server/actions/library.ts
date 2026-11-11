'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { libraryExerciseSchema } from '@/domain/schemas';
import { slugify } from '@/domain/text';
import { assertAuthorized } from '../auth/guard';
import { deleteLibraryItem, listLibrary, saveLibraryItems } from '../repositories/library';
import type { ActionResult } from './weeks';

export async function saveLibraryItemAction(raw: unknown, opts: { isNew?: boolean } = {}): Promise<ActionResult> {
  try {
    await assertAuthorized();
    const item = libraryExerciseSchema.parse(raw);
    if (opts.isNew) {
      item.slug = slugify(item.name);
      const exists = (await listLibrary()).find((x) => x.slug === item.slug);
      if (exists) return { ok: false, message: `«${exists.name}» ya está en la biblioteca.` };
    }
    await saveLibraryItems([item]);
    revalidatePath('/', 'layout');
    return { ok: true, message: `«${item.name}» guardado.` };
  } catch (e) {
    return { ok: false, message: e instanceof z.ZodError ? (e.issues[0]?.message ?? 'Datos no válidos') : 'No se pudo guardar.' };
  }
}

export async function deleteLibraryItemAction(slug: string): Promise<ActionResult> {
  try {
    await assertAuthorized();
    await deleteLibraryItem(z.string().min(1).parse(slug));
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Ejercicio borrado de la biblioteca.' };
  } catch {
    return { ok: false, message: 'No se pudo borrar.' };
  }
}
