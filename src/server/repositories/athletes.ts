import { asc, eq, sql } from 'drizzle-orm';
import type { Athlete, AthleteSummary } from '@/domain/types';
import { getDb } from '../db/client';
import { athletes } from '../db/schema';

type Row = typeof athletes.$inferSelect;

const toAthlete = (r: Row): Athlete => ({
  id: r.id,
  name: r.name,
  subtitle: r.subtitle,
  startDate: r.startDate,
  targetSessions: r.targetSessions,
  noteStyle: r.noteStyle,
  flexibleDays: r.flexibleDays,
  config: r.config,
});

export async function listAthletes(): Promise<Athlete[]> {
  const db = await getDb();
  const rows = await db.select().from(athletes).orderBy(asc(athletes.sortOrder), asc(athletes.name));
  return rows.map(toAthlete);
}

export async function getAthlete(id: string): Promise<Athlete | null> {
  const db = await getDb();
  const [row] = await db.select().from(athletes).where(eq(athletes.id, id)).limit(1);
  return row ? toAthlete(row) : null;
}

export async function saveAthlete(a: Athlete, sortOrder?: number): Promise<void> {
  const db = await getDb();
  const values = { ...a, ...(sortOrder != null ? { sortOrder } : {}) };
  await db
    .insert(athletes)
    .values(values)
    .onConflictDoUpdate({ target: athletes.id, set: { ...values, summary: null, updatedAt: sql`now()` } });
}

/** Crea la persona solo si el id está libre. Devuelve false si ya existía (sin carreras). */
export async function createAthlete(a: Athlete, sortOrder: number): Promise<boolean> {
  const db = await getDb();
  const rows = await db.insert(athletes).values({ ...a, sortOrder }).onConflictDoNothing().returning({ id: athletes.id });
  return rows.length > 0;
}

export async function readSummaries(): Promise<Map<string, AthleteSummary | null>> {
  const db = await getDb();
  const rows = await db.select({ id: athletes.id, summary: athletes.summary }).from(athletes);
  return new Map(rows.map((r) => [r.id, r.summary ?? null]));
}

export async function writeSummary(id: string, summary: AthleteSummary): Promise<void> {
  const db = await getDb();
  await db.update(athletes).set({ summary }).where(eq(athletes.id, id));
}

export async function deleteAthlete(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(athletes).where(eq(athletes.id, id));
}
