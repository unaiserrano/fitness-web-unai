import { assertAuthorized } from '@/server/auth/guard';
import { listAthletes } from '@/server/repositories/athletes';
import { listLibrary } from '@/server/repositories/library';
import { listMilestones } from '@/server/repositories/milestones';
import { getDiet, listFoods } from '@/server/repositories/nutrition';
import { listWeeks } from '@/server/repositories/weeks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Copia de seguridad completa en JSON: personas, semanas, dietas, hitos, alimentos y biblioteca. */
export async function GET() {
  try {
    await assertAuthorized();
  } catch {
    return new Response('No autorizado', { status: 401 });
  }
  const athletes = await listAthletes();
  const people = await Promise.all(
    athletes.map(async (athlete) => ({
      athlete,
      weeks: await listWeeks(athlete.id),
      diet: await getDiet(athlete.id),
      milestones: await listMilestones(athlete.id),
    })),
  );
  const body = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), people, library: await listLibrary(), foods: await listFoods() }, null, 2);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="cuaderno-copia-${day}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
