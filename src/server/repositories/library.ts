import { asc, eq, sql } from 'drizzle-orm';
import type { LibraryExercise } from '@/domain/types';
import { getDb } from '../db/client';
import { exercises } from '../db/schema';

type Row = typeof exercises.$inferSelect;

const toItem = (r: Row): LibraryExercise => ({
  slug: r.slug,
  name: r.name,
  muscleGroup: r.muscleGroup,
  execution: r.execution,
  videoUrl: r.videoUrl,
  weightStep: r.weightStep,
  volumeSplit: r.volumeSplit ?? null,
});

export async function listLibrary(): Promise<LibraryExercise[]> {
  const db = await getDb();
  const rows = await db.select().from(exercises).orderBy(asc(exercises.name));
  return rows.map(toItem);
}

export async function saveLibraryItems(items: LibraryExercise[]): Promise<void> {
  if (!items.length) return;
  const db = await getDb();
  for (const it of items) {
    await db
      .insert(exercises)
      .values(it)
      .onConflictDoUpdate({ target: exercises.slug, set: { ...it, updatedAt: sql`now()` } });
  }
}

export async function deleteLibraryItem(slug: string): Promise<void> {
  const db = await getDb();
  await db.delete(exercises).where(eq(exercises.slug, slug));
}
