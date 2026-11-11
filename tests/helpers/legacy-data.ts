import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Athlete, Library, Week } from '@/domain';
import { legacyAthlete, legacyConfig, legacyLibraryItem, legacyWeek, toLibrary } from '@/domain';

const EXPORT = resolve(__dirname, '../../data/legacy-export.json');
const GOLDEN = resolve(__dirname, '../../data/legacy-golden.json');

/** Los datos reales no se suben al repo: los tests que los usan se saltan si no están. */
export const hasLegacyData = existsSync(EXPORT) && existsSync(GOLDEN);

export interface LegacyFixture {
  athletes: Record<string, { athlete: Athlete; weeks: Week[] }>;
  library: Library;
  golden: Record<string, any>;
}

export function loadLegacy(): LegacyFixture {
  const raw = JSON.parse(readFileSync(EXPORT, 'utf8'));
  const golden = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  const library = toLibrary(Object.entries(raw.ejercicios).map(([k, v]) => legacyLibraryItem(k, v)));
  const athletes: LegacyFixture['athletes'] = {};
  const imadCfg = legacyConfig(raw.imad.config, 'Tobillo');
  athletes.imad = {
    athlete: legacyAthlete('imad', { nombre: 'Imad', inicio: '2026-10-05' }, imadCfg),
    weeks: Object.values(raw.imad.semanas).map(legacyWeek),
  };
  for (const [id, o] of Object.entries<any>(raw.atletas)) {
    athletes[id] = {
      athlete: legacyAthlete(id, o.atleta, legacyConfig(null)),
      weeks: Object.values(o.semanas).map(legacyWeek),
    };
  }
  return { athletes, library, golden };
}
