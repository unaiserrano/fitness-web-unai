import { ArrowRight, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DELOAD_AFTER_WEEKS, doneWeeks, planWeek, sessionsDone, stagnantExercises, weeksSinceDeload } from '@/domain';
import { Badge, ButtonLink, EmptyState, PageTitle } from '@/components/ui/primitives';
import { listWeeks } from '@/server/repositories/weeks';
import { loadAthletes } from '@/server/services/athlete-data';

/** Siempre con datos al día (nunca se genera en el build). */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Personas' };

export default async function HomePage() {
  const athletes = await loadAthletes();
  const cards = await Promise.all(
    athletes.map(async (a) => {
      const weeks = await listWeeks(a.id);
      const done = doneWeeks(weeks);
      const last = done[done.length - 1];
      const plan = planWeek(weeks);
      return {
        a,
        plan: plan?.number ?? null,
        last: last ? { number: last.number, sessions: sessionsDone(last) } : null,
        stagnant: stagnantExercises(weeks, a.flexibleDays).length,
        deload: weeksSinceDeload(weeks) >= DELOAD_AFTER_WEEKS,
      };
    }),
  );

  return (
    <>
      <PageTitle
        title="Personas"
        subtitle="Elige a quién quieres revisar. Desde su ficha preparas la rutina, le mandas la nota y ves su progreso."
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ a, plan, last, stagnant, deload }) => (
            <li key={a.id}>
              <Link
                href={`/personas/${a.id}/progreso`}
                className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_12px_32px_-18px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-extrabold">{a.name}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{a.subtitle || 'Sin descripción'}</p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 transition-colors group-hover:bg-lime group-hover:text-lime-ink">
                    <ArrowRight aria-hidden className="size-4" />
                  </span>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-semibold text-muted">Semana</dt>
                    <dd className="tnum font-display text-2xl font-extrabold">{plan ?? last?.number ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted">Entrenos última semana</dt>
                    <dd className="tnum font-display text-2xl font-extrabold">
                      {last ? `${last.sessions}/${a.targetSessions}` : '—'}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {plan ? <Badge tone="brand">Semana {plan} preparada</Badge> : <Badge>Sin semana preparada</Badge>}
                  {deload ? <Badge tone="warn">Toca descarga</Badge> : null}
                  {stagnant ? <Badge tone="warn">{stagnant} estancado{stagnant > 1 ? 's' : ''}</Badge> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
