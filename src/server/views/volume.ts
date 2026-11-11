import {
  type Library,
  type Period,
  type Week,
  ZONES,
  type Zone,
  averageStrengthChange,
  complianceByWeek,
  groupVolume,
  inPeriod,
  lastDoneWeekNumber,
  sortWeeks,
  strengthByExercise,
  weekHasResults,
  zoneOf,
  zoneVolumeByWeek,
} from '@/domain';
import type { ChartTone } from '@/components/charts/scales';

export type Measure = 'series' | 'kilos';
export type ZoneChoice = Zone | 'Total';

export interface VolumeView {
  weeks: Array<{ number: number; done: boolean }>;
  selected: { number: number; done: boolean } | null;
  groups: Array<{ zone: string; rows: Array<{ group: string; planned: number; done: number; tone: ChartTone; diff: number | null }> }>;
  zoneSeries: Array<{ week: number; Pierna: number; Torso: number }>;
  zoneTotal: { value: number; week: number; changePct: number | null; fromWeek: number } | null;
  strength: {
    average: Array<{ week: number; v: number | null }>;
    last: number | null;
    exercises: Array<{ name: string; group: string; from: number; to: number; change: number; values: number[] }>;
  };
  compliance: Array<{ week: number; value: number | null; tone: ChartTone }>;
}

export function buildVolumeView(weeks: Week[], lib: Library, opts: { week?: number; measure: Measure; zone: ZoneChoice; period: Period }): VolumeView {
  const all = sortWeeks(weeks);
  const lastDone = lastDoneWeekNumber(all);
  const showWeek = (n: number) => inPeriod(n, lastDone, opts.period);
  const doneList = all.filter(weekHasResults);
  const sel = all.find((w) => w.number === opts.week) ?? doneList[doneList.length - 1] ?? all[all.length - 1] ?? null;

  // Series por grupo muscular de la semana elegida
  let groups: VolumeView['groups'] = [];
  if (sel) {
    const selDone = weekHasResults(sel);
    const prev = doneList.filter((w) => w.number < sel.number).slice(-1)[0];
    const prevMap = new Map(prev ? groupVolume(prev, lib).map((g) => [g.group, g.done]) : []);
    const rows = groupVolume(sel, lib)
      .filter((g) => g.planned > 0)
      .map((g) => {
        const ratio = g.done / g.planned;
        const tone: ChartTone = !selDone ? 'muted' : ratio >= 0.999 ? 'ok' : ratio >= 0.75 ? 'warn' : 'bad';
        const p = prevMap.get(g.group);
        return { group: g.group, planned: g.planned, done: g.done, tone, diff: selDone && p != null ? Math.round(g.done) - Math.round(p) : null };
      });
    const zones = [...(Object.keys(ZONES) as Zone[]), 'Otros'];
    groups = zones
      .map((z) => ({
        zone: z,
        rows: rows
          .filter((r) => (z === 'Otros' ? zoneOf(r.group) == null : zoneOf(r.group) === z))
          .sort((a, b) => (ZONES[z as Zone]?.indexOf(a.group) ?? 0) - (ZONES[z as Zone]?.indexOf(b.group) ?? 0)),
      }))
      .filter((z) => z.rows.length);
  }

  // Volumen por zona semana a semana
  const zv = zoneVolumeByWeek(all, lib).filter((o) => showWeek(o.week));
  const pick = (o: (typeof zv)[number], z: Zone) => Math.round(opts.measure === 'kilos' ? o.tonnage[z] : o.sets[z]);
  const zoneSeries = zv.map((o) => ({ week: o.week, Pierna: pick(o, 'Pierna'), Torso: pick(o, 'Torso') }));
  const tot = (o?: (typeof zoneSeries)[number]) => (o ? o.Pierna + o.Torso : 0);
  const a = zoneSeries[0];
  const b = zoneSeries[zoneSeries.length - 1];

  // Fuerza estimada
  const series = strengthByExercise(all, lib)
    .filter((s) => opts.zone === 'Total' || ZONES[opts.zone].includes(s.group))
    .map((s) => ({ ...s, points: s.points.filter((p) => showWeek(p.week)) }))
    .filter((s) => s.points.length);
  const average = averageStrengthChange(series).map((p) => ({ week: p.week, v: p.value }));
  const exercises = series
    .filter((s) => s.points.length > 1)
    .map((s) => ({
      name: s.name,
      group: s.group,
      from: s.points[0].week,
      to: s.points[s.points.length - 1].week,
      change: (s.points[s.points.length - 1].value / s.points[0].value - 1) * 100,
      values: s.points.map((p) => p.value),
    }))
    .sort((x, y) => y.change - x.change);

  return {
    weeks: all.map((w) => ({ number: w.number, done: weekHasResults(w) })),
    selected: sel ? { number: sel.number, done: weekHasResults(sel) } : null,
    groups,
    zoneSeries,
    zoneTotal: b ? { value: tot(b), week: b.week, fromWeek: a.week, changePct: zoneSeries.length > 1 && tot(a) ? Math.round((tot(b) / tot(a) - 1) * 100) : null } : null,
    strength: { average, last: average.length ? average[average.length - 1].v : null, exercises },
    compliance: complianceByWeek(all)
      .filter((c) => showWeek(c.week))
      .map((c) => ({ week: c.week, value: c.pct, tone: c.pct == null ? 'muted' : c.pct >= 70 ? 'ok' : c.pct >= 50 ? 'warn' : 'bad' })),
  };
}
