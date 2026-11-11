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
      <div className="band-glow relative mb-6 overflow-hidden rounded-[28px] px-5 pb-5 pt-6 text-band-ink shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] sm:mb-8 sm:px-8 sm:pb-7 sm:pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Seguimiento de</p>
            <h1 className="mt-1 break-words font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">{athlete.name}</h1>
            {athlete.subtitle ? <p className="mt-2 max-w-xl text-[15px] text-band-ink/70">{athlete.subtitle}</p> : null}
          </div>
          <AthleteSwitcher id={id} athletes={all.map((a) => ({ id: a.id, name: a.name }))} />
        </div>
        {stats.length ? (
          <dl className="mt-6 flex flex-wrap gap-2 sm:gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className={
                  s.accent
                    ? 'rounded-2xl bg-brand px-4 py-2.5 text-brand-ink shadow-[0_10px_24px_-12px_var(--brand)]'
                    : 'rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 backdrop-blur-sm'
                }
              >
                <dd className="tnum font-display text-2xl font-extrabold leading-none">{s.value}</dd>
                <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-75">{s.label}</dt>
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
