import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Athlete, Week } from '@/domain/types';

const dir = mkdtempSync(path.join(tmpdir(), 'cuaderno-test-'));
process.env.PGLITE_DIR = dir;
delete process.env.DATABASE_URL;

const athlete: Athlete = {
  id: 'prueba',
  name: 'Prueba',
  subtitle: '',
  startDate: '2026-01-05',
  targetSessions: 3,
  noteStyle: 'standard',
  flexibleDays: false,
  config: { rehabZone: '', rehabText: '', rehab: [], remember: [], muscleGroups: [] } as unknown as Athlete['config'],
};
const week = (n: number, intro = '', savedAt?: string): Week =>
  ({ number: n, dates: '', deload: false, intro, rehabText: '', rehabDays: '', bodyWeight: null, notes: { good: [], bad: [], mustNot: [], remember: [] }, days: [], ...(savedAt ? { savedAt } : {}) }) as Week;

let repo: typeof import('@/server/repositories/weeks');
let ath: typeof import('@/server/repositories/athletes');
let limit: typeof import('@/server/auth/rate-limit');

beforeAll(async () => {
  repo = await import('@/server/repositories/weeks');
  ath = await import('@/server/repositories/athletes');
  limit = await import('@/server/auth/rate-limit');
  expect(await ath.createAthlete(athlete, 0)).toBe(true);
}, 60_000);

afterAll(() => {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* PGlite aún tiene el archivo abierto: se limpia solo */
  }
});

describe('personas', () => {
  it('no crea dos personas con el mismo id', async () => {
    expect(await ath.createAthlete(athlete, 1)).toBe(false);
  });
});

describe('semanas', () => {
  it('guarda, conserva la versión anterior y detecta conflictos', async () => {
    await repo.saveWeek('prueba', week(1, 'a', 't1'), { expectedSavedAt: null });
    await repo.saveWeek('prueba', week(1, 'b', 't2'), { expectedSavedAt: 't1' });
    expect((await repo.getWeek('prueba', 1))?.intro).toBe('b');
    expect((await repo.listRevisions('prueba', 1)).map((r) => r.content.intro)).toEqual(['a']);
    await expect(repo.saveWeek('prueba', week(1, 'c', 't3'), { expectedSavedAt: 't1' })).rejects.toBeInstanceOf(repo.WeekConflictError);
    await expect(repo.saveWeek('prueba', week(1, 'd', 't4'), { expectedSavedAt: null })).rejects.toBeInstanceOf(repo.WeekConflictError);
  });

  it('al borrar una semana queda su última versión en el historial', async () => {
    await repo.saveWeek('prueba', week(2, 'x', 'u1'));
    await repo.deleteWeek('prueba', 2);
    expect(await repo.getWeek('prueba', 2)).toBeNull();
    expect((await repo.listRevisions('prueba', 2))[0]?.content.intro).toBe('x');
  });
});

describe('límite de intentos de entrada', () => {
  it('bloquea tras varios fallos y se limpia al acertar', async () => {
    for (let i = 0; i < 6; i++) await limit.recordFailure('1.2.3.4');
    expect(await limit.lockedForSeconds('1.2.3.4')).toBeGreaterThan(0);
    expect(await limit.lockedForSeconds('9.9.9.9')).toBe(0);
    await limit.clearFailures('1.2.3.4');
    expect(await limit.lockedForSeconds('1.2.3.4')).toBe(0);
  });
});
