/**
 * Compara la lógica nueva con la app anterior usando los datos reales exportados.
 * Se salta si data/legacy-export.json y data/legacy-golden.json no están (no se suben al repo).
 */
import { describe, expect, it } from 'vitest';
import {
  exerciseKey,
  buildHistory,
  generateNote,
  hasRehab,
  proposeCoachNotes,
  recommend,
  sortWeeks,
  stagnantExercises,
  volumeSplitOf,
  weeksSinceDeload,
} from '@/domain';
import { hasLegacyData, loadLegacy } from '../helpers/legacy-data';

describe.skipIf(!hasLegacyData)('igual que la app anterior (datos reales)', () => {
  const data = hasLegacyData ? loadLegacy() : null!;
  const ids = hasLegacyData ? Object.keys(data.golden) : [];

  it.each(ids)('%s: notas de WhatsApp idénticas', (id) => {
    const { athlete, weeks } = data.athletes[id];
    const rehab = hasRehab(athlete, weeks);
    for (const g of data.golden[id].notes) {
      const w = weeks.find((x) => x.number === g.week)!;
      expect(generateNote(w, athlete, { hasRehab: rehab })).toBe(g.text);
    }
  });

  it.each(ids)('%s: mismas recomendaciones de peso', (id) => {
    const { athlete, weeks } = data.athletes[id];
    const history = buildHistory(weeks, athlete.flexibleDays);
    for (const g of data.golden[id].recs) {
      const w = weeks.find((x) => x.number === g.week)!;
      const d = w.days.find((x) => x.day === g.day)!;
      const e = d.exercises.find((x) => x.name === g.name)!;
      const s = e.sets.find((x) => x.n === g.n)!;
      const r = recommend({ history, key: exerciseKey(d.day, e.name, athlete.flexibleDays), exerciseName: e.name, set: s, week: w.number, library: data.library });
      if (g.rec == null) expect(r).toBeNull();
      else expect({ kg: r?.kg, repsText: r?.repsText, rir: r?.rir, same: r?.same, reason: r?.reason }).toEqual(g.rec);
    }
  });

  it.each(ids)('%s: estancados y semanas sin descarga', (id) => {
    const { athlete, weeks } = data.athletes[id];
    expect(stagnantExercises(weeks, athlete.flexibleDays).map((x) => ({ name: x.exercise.name, weeks: x.weeksWithoutProgress }))).toEqual(
      data.golden[id].stagnant,
    );
    expect(weeksSinceDeload(weeks)).toBe(data.golden[id].sinceDeload);
  });

  it.each(ids)('%s: apuntes propuestos', (id) => {
    const { athlete, weeks } = data.athletes[id];
    const rehab = hasRehab(athlete, weeks);
    for (const g of data.golden[id].coach) {
      const p = proposeCoachNotes(sortWeeks(weeks), g.week, { targetSessions: athlete.targetSessions, hasRehab: rehab });
      // La app anterior no quitaba las líneas de rehab cuando no había semana previa; ahora siempre se quitan.
      const mustNot = rehab ? g.no_fallar : g.no_fallar.filter((t: string) => !/rehab|tobillo|pie se hincha/i.test(t));
      expect(p).toEqual({ good: g.bien, bad: g.fallado, mustNot });
    }
  });

  it('mismo reparto de volumen por ejercicio', () => {
    for (const g of data.golden.imad.splits) expect(volumeSplitOf(data.library, g.name)).toEqual(g.split);
  });
});
