import { and, asc, desc, eq, lt, sql } from 'drizzle-orm';
import type { Week } from '@/domain/types';
import { getDb } from '../db/client';
import { athletes, weekRevisions, weeks } from '../db/schema';

/** Cuántas versiones anteriores se guardan por semana. */
const KEEP_REVISIONS = 15;

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

export class WeekConflictError extends Error {
  constructor() {
    super('Esta semana se guardó desde otro sitio mientras la editabas. Recarga la página para ver la última versión antes de guardar.');
  }
}

const invalidateSummary = async (athleteId: string) => {
  const db = await getDb();
  await db.update(athletes).set({ summary: null }).where(eq(athletes.id, athleteId));
};

/**
 * Guarda la semana. Si `expectedSavedAt` está definido (null = "no existía"), solo guarda
 * cuando lo que hay en la base de datos sigue siendo esa versión; si no, avisa del conflicto.
 * La versión que se sobrescribe se guarda en el historial.
 */
export async function saveWeek(athleteId: string, week: Week, opts: { expectedSavedAt?: string | null } = {}): Promise<void> {
  const db = await getDb();
  const current = await getWeek(athleteId, week.number);
  if (opts.expectedSavedAt !== undefined) {
    const have = current ? (current.savedAt ?? '') : null;
    const want = opts.expectedSavedAt === null ? null : opts.expectedSavedAt;
    if (current && want === null) throw new WeekConflictError();
    if (!current && want !== null) throw new WeekConflictError();
    if (current && have !== want && !(have === '' && want === '')) throw new WeekConflictError();
  }
  if (current && JSON.stringify(current) !== JSON.stringify(week)) {
    await db.insert(weekRevisions).values({ athleteId, number: week.number, content: current });
    const old = await db
      .select({ id: weekRevisions.id })
      .from(weekRevisions)
      .where(and(eq(weekRevisions.athleteId, athleteId), eq(weekRevisions.number, week.number)))
      .orderBy(desc(weekRevisions.id))
      .offset(KEEP_REVISIONS)
      .limit(1);
    if (old[0]) {
      await db.delete(weekRevisions).where(and(eq(weekRevisions.athleteId, athleteId), eq(weekRevisions.number, week.number), lt(weekRevisions.id, old[0].id + 1)));
    }
  }
  await db
    .insert(weeks)
    .values({ athleteId, number: week.number, content: week })
    .onConflictDoUpdate({ target: [weeks.athleteId, weeks.number], set: { content: week, updatedAt: sql`now()` } });
  await invalidateSummary(athleteId);
}

export async function deleteWeek(athleteId: string, number: number): Promise<void> {
  const db = await getDb();
  const current = await getWeek(athleteId, number);
  if (current) await db.insert(weekRevisions).values({ athleteId, number, content: current });
  await db.delete(weeks).where(and(eq(weeks.athleteId, athleteId), eq(weeks.number, number)));
  await invalidateSummary(athleteId);
}

export interface Revision {
  id: number;
  createdAt: string;
  content: Week;
}

export async function listRevisions(athleteId: string, number: number): Promise<Revision[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(weekRevisions)
    .where(and(eq(weekRevisions.athleteId, athleteId), eq(weekRevisions.number, number)))
    .orderBy(desc(weekRevisions.id))
    .limit(KEEP_REVISIONS);
  return rows.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), content: r.content }));
}
