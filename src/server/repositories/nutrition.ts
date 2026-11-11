import { asc, eq, sql } from 'drizzle-orm';
import { type Diet, type Food, toDiet, toFood } from '@/domain/diet';
import { getDb } from '../db/client';
import { diets, foods } from '../db/schema';

export async function getDiet(athleteId: string): Promise<Diet | null> {
  const db = await getDb();
  const [row] = await db.select({ content: diets.content }).from(diets).where(eq(diets.athleteId, athleteId)).limit(1);
  return row ? toDiet(row.content) : null;
}

export async function saveDiet(athleteId: string, diet: Diet): Promise<void> {
  const db = await getDb();
  const content = diet as unknown as Record<string, unknown>;
  await db
    .insert(diets)
    .values({ athleteId, content })
    .onConflictDoUpdate({ target: diets.athleteId, set: { content, updatedAt: sql`now()` } });
}

export async function listFoods(): Promise<Food[]> {
  const db = await getDb();
  const rows = await db.select().from(foods).orderBy(asc(foods.slug));
  return rows.map((r) => toFood(r.slug, r.data)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function saveFood(f: Food): Promise<void> {
  const db = await getDb();
  const data = f as unknown as Record<string, unknown>;
  await db
    .insert(foods)
    .values({ slug: f.slug, data })
    .onConflictDoUpdate({ target: foods.slug, set: { data, updatedAt: sql`now()` } });
}

export async function deleteFood(slug: string): Promise<void> {
  const db = await getDb();
  await db.delete(foods).where(eq(foods.slug, slug));
}
