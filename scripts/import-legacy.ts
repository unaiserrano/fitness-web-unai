/**
 * Importa los datos de la app anterior (artifact "Seguimiento de Imad").
 * Uso: npm run db:import            (lee data/legacy-export.json)
 *      npm run db:import -- otro.json
 * Se puede repetir: actualiza lo que ya existe, no duplica.
 */
import './env';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { legacyAthlete, legacyConfig, legacyLibraryItem, legacyWeek } from '../src/domain/legacy';

const IMAD = { nombre: 'Imad', sub: 'Recuperación de fractura de peroné y tobillo izquierdo', inicio: '2026-10-05' };

async function main() {
  const file = process.argv[2] ?? path.join(process.cwd(), 'data', 'legacy-export.json');
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const { getDb } = await import('../src/server/db/client');
  const { saveAthlete } = await import('../src/server/repositories/athletes');
  const { saveWeek } = await import('../src/server/repositories/weeks');
  const { saveLibraryItems } = await import('../src/server/repositories/library');
  const { milestones, foods, diets } = await import('../src/server/db/schema');
  const db = await getDb();

  const people: Array<[string, any, any, Record<string, any>]> = [
    ['imad', IMAD, raw.imad.config, raw.imad.semanas],
    ...Object.entries<any>(raw.atletas ?? {}).map(([id, o]) => [id, o.atleta, o.config ?? null, o.semanas] as [string, any, any, Record<string, any>]),
  ];
  let order = 0;
  let nWeeks = 0;
  for (const [id, a, cfg, ws] of people) {
    const athlete = legacyAthlete(id, a, legacyConfig(cfg, id === 'imad' ? 'Tobillo' : ''));
    await saveAthlete(athlete, order++);
    for (const w of Object.values(ws ?? {})) {
      await saveWeek(id, legacyWeek(w));
      nWeeks++;
    }
    console.log(`· ${athlete.name}: ${Object.keys(ws ?? {}).length} semanas`);
  }

  const lib = Object.entries<any>(raw.ejercicios ?? {}).map(([k, v]) => legacyLibraryItem(k, v));
  await saveLibraryItems(lib);

  for (const [id, h] of Object.entries<any>(raw.imad.hitos ?? {})) {
    const v = { id, athleteId: 'imad', week: h.semana ?? null, kind: h.tipo ?? 'hito', text: String(h.texto ?? '') };
    await db.insert(milestones).values(v).onConflictDoUpdate({ target: milestones.id, set: v });
  }
  for (const [slug, data] of Object.entries<any>(raw.alimentos ?? {})) {
    await db.insert(foods).values({ slug, data }).onConflictDoUpdate({ target: foods.slug, set: { data } });
  }
  if (raw.imad.dieta) {
    await db.insert(diets).values({ athleteId: 'imad', content: raw.imad.dieta }).onConflictDoUpdate({ target: diets.athleteId, set: { content: raw.imad.dieta } });
  }
  console.log(`Importado: ${people.length} personas, ${nWeeks} semanas, ${lib.length} ejercicios, ${Object.keys(raw.alimentos ?? {}).length} alimentos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
