import type { ReactNode } from 'react';
import { doneWeeks, formatNum, hasRehab, planWeek, rehabCount, sessionsDone, sortWeeks } from '@/domain';
import { AthleteSwitcher, AthleteTabs } from '@/components/layout/athlete-tabs';
import { loadAthleteContext, loadAthletes } from '@/server/services/athlete-data';

export default async function AthleteLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ athlete, weeks }, all] = await Promise.all([loadAthleteContext(id), loadAthletes()]);
  const done = doneWeeks(weeks);
  const last = done[done.length - 1];
  const plan = planWeek(weeks);
  const weights = sortWeeks(weeks).filter((w) => w.bodyWeight != null);
  const stats: Array<{ label: string; value: string; accent?: boolean }> = [];
  if (last) stats.push({ label: 'Última hecha', value: `S${last.number}` });
  if (plan) stats.push({ label: 'Le pides', value: `S${plan.number}`, accent: true });
  if (last) stats.push({ label: 'Entrenos', value: `${sessionsDone(last)}/${athlete.targetSessions}` });
  if (weights.length) stats.push({ label: 'Peso (kg)', value: formatNum(weights[weights.length - 1].bodyWeight) });
  if (last && hasRehab(athlete, weeks) && rehabCount(last) != null) stats.push({ label: 'Rehab', value: `${rehabCount(last)}/4` });

  return (
    <div>
      <div className="band-glow mb-8 rounded-[var(--radius-card)] px-5 py-6 text-band-ink sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="kicker !text-band-ink/60">Seguimiento de</p>
            <h1 className="mt-2 break-words text-4xl leading-none sm:text-6xl">{athlete.name}</h1>
            {athlete.subtitle ? <p className="mt-3 max-w-xl text-[15px] text-band-ink/70">{athlete.subtitle}</p> : null}
          </div>
          <AthleteSwitcher id={id} athletes={all.map((a) => ({ id: a.id, name: a.name }))} />
        </div>
        {stats.length ? (
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-4 border-t border-band-ink/20 pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="kicker !text-band-ink/60">{s.label}</dt>
                <dd className={`figure mt-1.5 text-3xl ${s.accent ? 'text-brand' : ''}`}>{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <AthleteTabs id={id} />
      {children}
    </div>
  );
}
