import { and, asc, eq } from 'drizzle-orm';
import type { Milestone, MilestoneKind } from '@/domain/journal';
import { getDb } from '../db/client';
import { milestones } from '../db/schema';

const KINDS: MilestoneKind[] = ['hito', 'aviso', 'cambio'];

export async function listMilestones(athleteId: string): Promise<Milestone[]> {
  const db = await getDb();
  const rows = await db.select().from(milestones).where(eq(milestones.athleteId, athleteId)).orderBy(asc(milestones.createdAt));
  return rows.map((r) => ({ id: r.id, week: r.week, kind: KINDS.includes(r.kind as MilestoneKind) ? (r.kind as MilestoneKind) : 'hito', text: r.text }));
}

export async function addMilestone(athleteId: string, m: Milestone): Promise<void> {
  const db = await getDb();
  await db.insert(milestones).values({ id: m.id, athleteId, week: m.week, kind: m.kind, text: m.text });
}

export async function deleteMilestone(athleteId: string, id: string): Promise<void> {
  const db = await getDb();
  await db.delete(milestones).where(and(eq(milestones.athleteId, athleteId), eq(milestones.id, id)));
}
