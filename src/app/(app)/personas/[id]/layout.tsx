import type { ReactNode } from 'react';
import { AthleteSwitcher, AthleteTabs } from '@/components/layout/athlete-tabs';
import { loadAthleteContext, loadAthletes } from '@/server/services/athlete-data';

export default async function AthleteLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ athlete }, all] = await Promise.all([loadAthleteContext(id), loadAthletes()]);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Persona</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{athlete.name}</h1>
          {athlete.subtitle ? <p className="mt-1.5 text-[15px] text-muted">{athlete.subtitle}</p> : null}
        </div>
        <AthleteSwitcher id={id} athletes={all.map((a) => ({ id: a.id, name: a.name }))} />
      </div>
      <AthleteTabs id={id} />
      {children}
    </div>
  );
}
