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

const AVATAR = ['from-brand to-warn', 'from-info to-ok', 'from-ok to-lime', 'from-bad to-brand', 'from-warn to-lime', 'from-info to-brand'];
const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

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
        <>
          <section className="band-glow mb-6 grid grid-cols-2 gap-3 rounded-[28px] p-5 text-band-ink sm:grid-cols-4 sm:p-6">
            {[
              { label: 'Personas', value: cards.length },
              { label: 'Semanas preparadas', value: cards.filter((c) => c.plan).length },
              { label: 'Toca descarga', value: cards.filter((c) => c.deload).length },
              { label: 'Ejercicios estancados', value: cards.reduce((t, c) => t + c.stagnant, 0) },
            ].map((s, i) => (
              <div key={s.label} className={i === 0 ? 'rounded-2xl bg-brand p-4 text-brand-ink' : 'rounded-2xl border border-white/10 bg-white/[0.06] p-4'}>
                <p className="tnum font-display text-3xl font-black leading-none sm:text-4xl">{s.value}</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider opacity-75">{s.label}</p>
              </div>
            ))}
          </section>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ a, plan, last, stagnant, deload }, i) => {
              const pct = last ? Math.min(100, Math.round((last.sessions / Math.max(1, a.targetSessions)) * 100)) : 0;
              return (
                <li key={a.id}>
                  <Link
                    href={`/personas/${a.id}/progreso`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_22px_40px_-24px_var(--brand)]"
                  >
                    <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${AVATAR[i % AVATAR.length]}`} />
                    <div className="flex items-start gap-3">
                      <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br font-display text-lg font-black text-white shadow-sm ${AVATAR[i % AVATAR.length]}`}>
                        {initials(a.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-extrabold">{a.name}</h2>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{a.subtitle || 'Sin descripción'}</p>
                      </div>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 transition-colors group-hover:bg-brand group-hover:text-brand-ink">
                        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <dt className="text-xs font-semibold text-muted">Semana</dt>
                        <dd className="tnum font-display text-3xl font-extrabold">{plan ?? last?.number ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-muted">Entrenos última semana</dt>
                        <dd className="tnum font-display text-3xl font-extrabold">{last ? `${last.sessions}/${a.targetSessions}` : '—'}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="presentation">
                      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-ok' : 'bg-gradient-to-r from-brand to-warn'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {plan ? <Badge tone="brand">Semana {plan} preparada</Badge> : <Badge>Sin semana preparada</Badge>}
                      {deload ? <Badge tone="warn">Toca descarga</Badge> : null}
                      {stagnant ? <Badge tone="warn">{stagnant} estancado{stagnant > 1 ? 's' : ''}</Badge> : null}
                      {!deload && !stagnant && last ? <Badge tone="lime">Todo en marcha</Badge> : null}
                    </div>
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
