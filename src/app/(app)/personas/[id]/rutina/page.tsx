import type { Metadata } from 'next';
import {
  buildHistory,
  formatPoint,
  hasRehab,
  planWeek,
  proposeCoachNotes,
  sortWeeks,
  stagnantExercises,
  weekHasResults,
  weeksSinceDeload,
} from '@/domain';
import { RoutineEditor } from '@/components/routine/routine-editor';
import { loadAthleteContext } from '@/server/services/athlete-data';

export const metadata: Metadata = { title: 'Rutina' };

export default async function RoutinePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ semana?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { athlete, weeks, libraryItems } = await loadAthleteContext(id);
  const all = sortWeeks(weeks);
  const plan = planWeek(all);
  const requested = sp.semana ? all.find((w) => w.number === Number(sp.semana)) : undefined;
  const initial = requested ?? plan ?? all[all.length - 1] ?? null;
  const rehab = hasRehab(athlete, all);
  const stagnant = Object.fromEntries(
    stagnantExercises(all, athlete.flexibleDays).map((s) => [s.exercise.key, { weeks: s.weeksWithoutProgress, best: formatPoint(s.best), bestWeek: s.best.week }]),
  );
  const nextNumber = Math.max(0, ...all.map((w) => w.number)) + 1;
  const proposals = Object.fromEntries(
    [...new Set([initial?.number, nextNumber].filter((n): n is number => n != null))].map((n) => [
      n,
      proposeCoachNotes(all, n, { targetSessions: athlete.targetSessions, hasRehab: rehab }),
    ]),
  );

  return (
    <RoutineEditor
      key={initial?.number ?? 0}
      athlete={athlete}
      initial={initial}
      initialExists={!!initial}
      initialDone={initial ? weekHasResults(initial) : false}
      weekList={all.map((w) => ({ number: w.number, done: weekHasResults(w) }))}
      base={plan ?? all[all.length - 1] ?? null}
      history={buildHistory(all, athlete.flexibleDays)}
      libraryItems={libraryItems}
      stagnant={stagnant}
      sinceDeload={weeksSinceDeload(all)}
      hasRehab={rehab}
      proposals={proposals}
    />
  );
}
