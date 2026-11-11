/**
 * Prepara los datos de la página de Progreso (todo serializable para los componentes de cliente).
 */
import {
  type Athlete,
  type Period,
  type Week,
  DELOAD_AFTER_WEEKS,
  blockType,
  doneWeeks,
  findExercise,
  formatNum,
  formatPoint,
  hasRehab,
  inPeriod,
  isDistance,
  lastDoneWeekNumber,
  numOf,
  listExercises,
  planWeek,
  progressPoints,
  rehabCount,
  repsDiff,
  rirNum,
  sessionsDone,
  sortWeeks,
  stagnantExercises,
  weeksSinceDeload,
} from '@/domain';
import type { ExerciseChartPoint } from '@/components/charts/exercise-chart';
import type { ChartTone } from '@/components/charts/scales';

export interface ExerciseCard {
  key: string;
  name: string;
  headline: string;
  delta: { text: string; tone: ChartTone | 'neutral' } | null;
  asked: string | null;
  isNew: boolean;
  since: number | null;
  points: ExerciseChartPoint[];
  plan: { week: number; value: number; label: string; rir: number | null; reps: string } | null;
}

export interface ProgressView {
  hasData: boolean;
  weeksShown: number[];
  planNumber: number | null;
  improved: { up: number; total: number };
  bodyWeight: Array<{ week: number; value: number | null }>;
  sessions: Array<{ week: number; value: number | null; tone: ChartTone }>;
  rehab: Array<{ week: number; value: number | null; tone: ChartTone }> | null;
  deload: { weeks: number; next: number } | null;
  stagnant: Array<{ name: string; group: string; weeks: number; best: string; bestWeek: number; last: string }>;
  groups: Array<{ title: string; subtitle: string; cards: ExerciseCard[] }>;
}

export function buildProgressView(athlete: Athlete, weeks: Week[], period: Period): ProgressView {
  const flexible = athlete.flexibleDays;
  const all = sortWeeks(weeks);
  const done = doneWeeks(all);
  const lastWeek = lastDoneWeekNumber(all);
  const plan = planWeek(all);
  const shown = done.filter((w) => inPeriod(w.number, lastWeek, period));
  const showWeek = (n: number) => inPeriod(n, lastWeek, period);
  const target = athlete.targetSessions;

  let up = 0;
  let total = 0;
  const groupsMap = new Map<string, { title: string; subtitle: string; cards: ExerciseCard[] }>();
  for (const ex of listExercises(all, flexible)) {
    const pts = progressPoints(all, ex.key, flexible).filter((p) => showWeek(p.week));
    const pe = plan ? findExercise(plan, ex.key, flexible) : null;
    if (!pts.length && !pe) continue;
    const kgPts = pts.filter((p) => p.kg != null);
    const withWeight = kgPts.filter((p) => (p.kg ?? 0) > 0);
    if (withWeight.length >= 2) {
      total++;
      if ((withWeight[withWeight.length - 1].kg ?? 0) > (withWeight[0].kg ?? 0)) up++;
    }
    const repsMode = pts.length > 0 && pts.every((p) => !((p.kg ?? 0) > 0));
    const value = (p: (typeof pts)[number]) => (repsMode ? p.totalReps : (p.kg ?? 0));

    let headline = 'Nuevo';
    let delta: ExerciseCard['delta'] = null;
    if (kgPts.length) {
      const a = kgPts[0];
      const b = kgPts[kgPts.length - 1];
      if ((a.kg ?? 0) > 0 || (b.kg ?? 0) > 0) {
        headline = a.kg !== b.kg ? `${formatNum(a.kg)} → ${formatNum(b.kg)} kg` : `${formatNum(b.kg)} kg`;
        const dk = (b.kg ?? 0) - (a.kg ?? 0);
        delta = dk > 0 ? { text: `+${formatNum(dk)} kg`, tone: 'ok' } : dk < 0 ? { text: `−${formatNum(-dk)} kg`, tone: 'warn' } : { text: 'mismo peso', tone: 'neutral' };
      } else {
        headline = `${pts[0].totalReps} → ${pts[pts.length - 1].totalReps} reps`;
        delta = { text: 'sin peso', tone: 'neutral' };
      }
    }

    let planPoint: ExerciseCard['plan'] = null;
    let asked: string | null = null;
    if (pe && plan) {
      const best = pe.sets.reduce((b, s) => ((s.target.kg ?? -1) > (b.target.kg ?? -1) ? s : b), pe.sets[0]);
      if (best) {
        const v = repsMode ? pe.sets.reduce((t, s) => t + (numOf(s.target.reps) ?? 0), 0) : best.target.kg;
        asked = [best.target.kg === 0 ? 'sin peso' : best.target.kg != null ? `${formatNum(best.target.kg)} kg` : best.target.kgText, best.target.reps && `${best.target.reps} reps`, best.target.rir && `RIR ${best.target.rir}`]
          .filter(Boolean)
          .join(' · ');
        if (v != null && (pts.length || v > 0)) {
          planPoint = {
            week: plan.number,
            value: v,
            label: repsMode ? String(v) : formatNum(v),
            rir: rirNum(best.target.rir),
            reps: repsMode ? '' : `×${best.target.reps}`,
          };
        }
      }
    }

    const card: ExerciseCard = {
      key: ex.key,
      name: ex.name,
      headline,
      delta,
      asked,
      isNew: !pts.length,
      since: pts.length && shown.length && pts[0].week > shown[0].number ? pts[0].week : null,
      points: pts.map((p) => ({
        week: p.week,
        value: value(p),
        label: repsMode ? String(p.totalReps) : formatNum(p.kg),
        rir: p.rir,
        reps: isDistance(p.repsText) ? p.repsText : p.reps != null ? `×${p.reps}` : '',
        diff: isDistance(p.repsText) ? null : repsDiff(p.reps, p.targetRange),
        detail: p.detail,
      })),
      plan: planPoint,
    };
    const groupKey = ex.group;
    const g = groupsMap.get(groupKey) ?? {
      title: ex.group,
      subtitle: flexible ? '' : [ex.block, blockType(ex.block)].filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).join(' · '),
      cards: [],
    };
    g.cards.push(card);
    groupsMap.set(groupKey, g);
  }

  const rehab = hasRehab(athlete, all);
  const since = weeksSinceDeload(all);
  const next = Math.max(0, ...all.map((w) => w.number)) + (plan ? 0 : 1);
  return {
    hasData: all.length > 0,
    weeksShown: shown.map((w) => w.number),
    planNumber: plan?.number ?? null,
    improved: { up, total },
    bodyWeight: all.filter((w) => w.bodyWeight != null && showWeek(w.number)).map((w) => ({ week: w.number, value: w.bodyWeight })),
    sessions: shown.map((w) => {
      const v = sessionsDone(w);
      return { week: w.number, value: v, tone: v >= target ? 'ok' : 'warn' };
    }),
    rehab: rehab
      ? shown.map((w) => {
          const v = rehabCount(w);
          return { week: w.number, value: v, tone: v == null ? 'muted' : v >= 4 ? 'ok' : 'warn' };
        })
      : null,
    deload: since >= DELOAD_AFTER_WEEKS ? { weeks: since, next: next || lastWeek + 1 } : null,
    stagnant: stagnantExercises(all, flexible).map((s) => ({
      name: s.exercise.name,
      group: s.exercise.group,
      weeks: s.weeksWithoutProgress,
      best: formatPoint(s.best),
      bestWeek: s.best.week,
      last: formatPoint(s.last),
    })),
    groups: [...groupsMap.values()],
  };
}

export const doneCount = (weeks: Week[]) => doneWeeks(weeks).length;
