import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { loginAttempts } from '../db/schema';

const MAX_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000;

/** Segundos que faltan para poder reintentar; 0 si puede intentarlo. */
export async function lockedForSeconds(key: string): Promise<number> {
  const db = await getDb();
  const [row] = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key)).limit(1);
  if (!row) return 0;
  const left = row.windowStart.getTime() + WINDOW_MS - Date.now();
  if (left <= 0) return 0;
  return row.count >= MAX_ATTEMPTS ? Math.ceil(left / 1000) : 0;
}

export async function recordFailure(key: string): Promise<void> {
  const db = await getDb();
  const [row] = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key)).limit(1);
  if (!row || row.windowStart.getTime() + WINDOW_MS < Date.now()) {
    await db
      .insert(loginAttempts)
      .values({ key, count: 1, windowStart: new Date() })
      .onConflictDoUpdate({ target: loginAttempts.key, set: { count: 1, windowStart: new Date() } });
  } else {
    await db.update(loginAttempts).set({ count: sql`${loginAttempts.count} + 1` }).where(eq(loginAttempts.key, key));
  }
}

export async function clearFailures(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
}
