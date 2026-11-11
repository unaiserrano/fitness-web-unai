'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type Diet, type Food, foodSlug } from '@/domain/diet';
import { assertAuthorized } from '../auth/guard';
import { getAthlete } from '../repositories/athletes';
import { deleteFood, listFoods, saveDiet, saveFood } from '../repositories/nutrition';
import type { ActionResult } from './weeks';

const t = (max: number) => z.string().max(max).default('');
const num = z.number().finite().min(0).max(100000).nullable();

const dietSchema = z.object({
  title: t(120),
  target: t(80),
  intro: t(500),
  meals: z
    .array(
      z.object({
        name: t(60),
        kcal: t(40),
        options: z
          .array(
            z.object({
              title: t(120),
              note: t(1000),
              items: z.array(z.object({ food: t(160), qty: t(80), sub: z.boolean().optional(), alt: z.boolean().optional() })).max(60),
            }),
          )
          .max(30),
      }),
    )
    .max(12),
  tips: z.array(z.object({ title: t(120), text: t(1500) })).max(20),
});

const foodSchema = z.object({
  name: z.string().trim().min(1, 'Pon el nombre del alimento').max(120),
  brand: t(80),
  kcal: num,
  protein: num,
  carbs: num,
  fat: num,
  per: z.enum(['g', 'ml']),
  unitGrams: num,
  aliases: z.array(z.string().trim().min(1).max(120)).max(20),
  source: z.enum(['Genérico', 'Etiqueta']),
});

const fail = (e: unknown): ActionResult => ({ ok: false, message: e instanceof z.ZodError ? (e.issues[0]?.message ?? 'Datos no válidos') : 'No se pudo guardar.' });

export async function saveDietAction(athleteId: string, raw: unknown): Promise<ActionResult> {
  try {
    await assertAuthorized();
    if (!(await getAthlete(athleteId))) return { ok: false, message: 'Esa persona no existe.' };
    const diet: Diet = { ...dietSchema.parse(raw), savedAt: new Date().toISOString() };
    await saveDiet(athleteId, diet);
    revalidatePath(`/personas/${athleteId}/dieta`);
    return { ok: true, message: 'Alimentación guardada.' };
  } catch (e) {
    return fail(e);
  }
}

/** Crea (slug vacío) o actualiza un alimento. */
export async function saveFoodAction(slug: string | null, raw: unknown): Promise<ActionResult & { slug?: string }> {
  try {
    await assertAuthorized();
    const f = foodSchema.parse(raw);
    let id = slug;
    if (!id) {
      id = foodSlug(f.name, f.brand);
      if ((await listFoods()).some((x) => x.slug === id)) return { ok: false, message: 'Ese alimento ya está.' };
    }
    const food: Food = { slug: id, ...f };
    await saveFood(food);
    revalidatePath('/alimentos');
    revalidatePath('/personas', 'layout');
    return { ok: true, message: `«${f.name}» guardado.`, slug: id };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteFoodAction(slug: string): Promise<ActionResult> {
  try {
    await assertAuthorized();
    await deleteFood(z.string().max(120).parse(slug));
    revalidatePath('/alimentos');
    return { ok: true, message: 'Alimento borrado.' };
  } catch (e) {
    return fail(e);
  }
}
