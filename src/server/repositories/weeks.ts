import { and, asc, eq, sql } from 'drizzle-orm';
import type { Week } from '@/domain/types';
import { getDb } from '../db/client';
import { weeks } from '../db/schema';

export async function listWeeks(athleteId: string): Promise<Week[]> {
  const db = await getDb();
  const rows = await db.select({ content: weeks.content }).from(weeks).where(eq(weeks.athleteId, athleteId)).orderBy(asc(weeks.number));
  return rows.map((r) => r.content);
}

export async function getWeek(athleteId: string, number: number): Promise<Week | null> {
  const db = await getDb();
  const [row] = await db
    .select({ content: weeks.content })
    .from(weeks)
    .where(and(eq(weeks.athleteId, athleteId), eq(weeks.number, number)))
    .limit(1);
  return row?.content ?? null;
}

export async function saveWeek(athleteId: string, week: Week): Promise<void> {
  const db = await getDb();
  await db
    .insert(weeks)
    .values({ athleteId, number: week.number, content: week })
    .onConflictDoUpdate({ target: [weeks.athleteId, weeks.number], set: { content: week, updatedAt: sql`now()` } });
}

export async function deleteWeek(athleteId: string, number: number): Promise<void> {
  const db = await getDb();
  await db.delete(weeks).where(and(eq(weeks.athleteId, athleteId), eq(weeks.number, number)));
}
