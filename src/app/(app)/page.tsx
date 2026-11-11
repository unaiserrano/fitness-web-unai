import { ArrowUpRight, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkline } from '@/components/charts/sparkline';
import { ButtonLink, EmptyState, PageTitle } from '@/components/ui/primitives';
import { loadAthletes, loadSummaries } from '@/server/services/athlete-data';

/** Siempre con datos al día (nunca se genera en el build). */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Personas' };

export default async function HomePage() {
  const athletes = await loadAthletes();
  const summaries = await loadSummaries(athletes);
  const cards = athletes.map((a) => ({ a, s: summaries.get(a.id)! }));

  const totals = [
    { label: 'Personas', value: cards.length },
    { label: 'Semanas preparadas', value: cards.filter((c) => c.s.plan).length },
    { label: 'Toca descarga', value: cards.filter((c) => c.s.deload).length },
    { label: 'Estancados', value: cards.reduce((t, c) => t + c.s.stagnant, 0) },
  ];

  return (
    <>
      <PageTitle
        kicker="Hoy"
        title="Personas"
        subtitle="Quién necesita algo esta semana. Desde su ficha preparas la rutina, le mandas la nota y ves cómo progresa."
        action={
          <ButtonLink href="/personas/nueva" variant="primary">
            <Plus aria-hidden className="size-4" /> Nueva persona
          </ButtonLink>
        }
      />
      {!cards.length ? (
        <EmptyState title="Todavía no hay nadie" action={<ButtonLink href="/personas/nueva" variant="primary">Añadir la primera persona</ButtonLink>}>
          Crea una persona para empezar a montar su rutina.
        </EmptyState>
      ) : (
        <>
          <dl className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-4">
            {totals.map((t) => (
              <div key={t.label} className="bg-surface px-5 py-4">
                <dt className="kicker">{t.label}</dt>
                <dd className="figure mt-2 text-4xl">{t.value}</dd>
              </div>
            ))}
          </dl>

          <ul className="divide-y divide-line border-y border-ink/80">
            {cards.map(({ a, s }) => {
              const week = s.plan ?? s.last?.number ?? null;
              const flags = [s.deload ? 'Toca descarga' : null, s.stagnant ? `${s.stagnant} estancado${s.stagnant > 1 ? 's' : ''}` : null].filter(Boolean);
              return (
                <li key={a.id}>
                  <Link
                    href={`/personas/${a.id}/progreso`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 py-5 transition-colors hover:bg-surface sm:grid-cols-[minmax(0,2fr)_6rem_7rem_minmax(0,1.2fr)_auto] sm:px-3"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate text-2xl leading-tight group-hover:text-brand">{a.name}</h2>
                      <p className="mt-1 line-clamp-1 text-sm text-muted">{a.subtitle || 'Sin descripción'}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="kicker">Semana</p>
                      <p className="figure mt-1 text-3xl">{week ?? '—'}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="kicker">Entrenos</p>
                      <p className="figure mt-1 text-3xl">{s.last ? `${s.last.sessions}/${a.targetSessions}` : '—'}</p>
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <Sparkline values={s.trend ?? []} color="var(--ink)" width={120} height={32} />
                      <p className={`mt-1 truncate text-xs ${flags.length ? 'font-medium text-warn' : 'text-muted'}`}>
                        {flags.length ? flags.join(' · ') : s.last ? 'Todo en marcha' : 'Sin semanas hechas'}
                      </p>
                    </div>
                    <ArrowUpRight aria-hidden className="size-5 text-muted transition-colors group-hover:text-brand" />
                    <p className="col-span-2 text-xs text-muted sm:hidden">
                      Semana {week ?? '—'} · {s.last ? `${s.last.sessions}/${a.targetSessions} entrenos` : 'sin semanas hechas'}
                      {flags.length ? <span className="font-medium text-warn"> · {flags.join(' · ')}</span> : null}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
