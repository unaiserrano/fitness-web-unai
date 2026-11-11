import type { Metadata } from 'next';
import { isPeriod, formatNum, type Period } from '@/domain';
import { BarChart } from '@/components/charts/bar-chart';
import { ExerciseChart, RirLegend } from '@/components/charts/exercise-chart';
import { LineChart } from '@/components/charts/line-chart';
import { PeriodSwitch } from '@/components/layout/period-switch';
import { Badge, ButtonLink, Card, CardHeader, EmptyState, Notice } from '@/components/ui/primitives';
import { loadAthleteContext } from '@/server/services/athlete-data';
import { buildProgressView } from '@/server/views/progress';

export const metadata: Metadata = { title: 'Progreso' };

export default async function ProgressPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ periodo?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const period: Period = isPeriod(sp.periodo) ? sp.periodo : '3m';
  const { athlete, weeks } = await loadAthleteContext(id);
  const v = buildProgressView(athlete, weeks, period);
  const base = `/personas/${id}/progreso`;

  if (!v.hasData) {
    return (
      <EmptyState title={`Todavía no hay semanas de ${athlete.name}`} action={<ButtonLink href={`/personas/${id}/rutina`} variant="primary">Montar su rutina</ButtonLink>}>
        Crea su primera semana en Rutina o pega su primera nota en Nota.
      </EmptyState>
    );
  }

  const lastWeight = v.bodyWeight[v.bodyWeight.length - 1];
  const firstWeight = v.bodyWeight[0];
  const weightDelta = lastWeight && firstWeight && v.bodyWeight.length > 1 ? Math.round(((lastWeight.value ?? 0) - (firstWeight.value ?? 0)) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[15px] text-muted">
          {v.weeksShown.length ? `Semanas ${v.weeksShown[0]} a ${v.weeksShown[v.weeksShown.length - 1]}. ` : ''}
          {v.improved.total ? (
            <>
              En <strong className="text-ink">{v.improved.up} de {v.improved.total}</strong> ejercicios con peso ya mueve más kilos que al principio del periodo.
            </>
          ) : null}
        </p>
        <PeriodSwitch base={base} period={period} />
      </div>

      {v.deload ? (
        <Notice tone="warn" title={`Lleva ${v.deload.weeks} semanas seguidas apretando sin descarga`}>
          Plantéate que la semana {v.deload.next} sea de descarga: en Rutina, pulsa «Convertir en descarga».
        </Notice>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader as="h3" title="Entrenamientos" subtitle={`Objetivo: ${athlete.targetSessions} por semana`} />
          <BarChart data={v.sessions} reference={athlete.targetSessions} max={athlete.targetSessions} label="Entrenamientos por semana" />
        </Card>
        {v.rehab ? (
          <Card>
            <CardHeader as="h3" title="Rehabilitación" subtitle="Días por semana · mínimo 4" />
            <BarChart data={v.rehab} reference={4} max={4} label="Días de rehabilitación por semana" />
          </Card>
        ) : null}
        <Card>
          <CardHeader
            as="h3"
            title="Peso corporal"
            subtitle={lastWeight ? `${formatNum(lastWeight.value)} kg la semana ${lastWeight.week}` : 'Sin datos'}
            action={weightDelta != null ? <Badge tone="neutral">{`${weightDelta >= 0 ? '+' : '−'}${formatNum(Math.abs(weightDelta))} kg`}</Badge> : null}
          />
          <LineChart data={v.bodyWeight.map((p) => ({ week: p.week, peso: p.value }))} series={[{ key: 'peso', label: 'Peso', color: 'var(--brand)' }]} height={150} format="kg" label="Peso corporal por semana" />
        </Card>
      </div>

      {v.stagnant.length ? (
        <details className="group rounded-[var(--radius-card)] border border-warn/30 bg-warn-soft px-5 py-4">
          <summary className="cursor-pointer list-none font-semibold marker:hidden">
            <span className="mr-2">⚠︎</span>
            {v.stagnant.length} ejercicio{v.stagnant.length > 1 ? 's' : ''} sin mejorar en 3 semanas o más
            <span className="ml-2 text-sm font-normal text-muted group-open:hidden">Ver cuáles</span>
          </summary>
          <p className="mt-2 text-sm text-muted">Se cuenta la mejor serie con peso, repeticiones y RIR. Puedes cambiar el rango de repeticiones, la variante o meter una descarga.</p>
          <ul className="mt-3 divide-y divide-warn/20">
            {v.stagnant.map((s) => (
              <li key={`${s.group}-${s.name}`} className="py-2.5 text-sm">
                <span className="font-semibold">{s.name}</span> <span className="text-muted">· {s.group} · {s.weeks} semanas</span>
                <div className="text-muted">
                  Su mejor: {s.best} (sem {s.bestWeek}) · última: {s.last}
                </div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="text-xl font-extrabold">Ejercicios</h2>
        <RirLegend />
      </div>

      {v.groups.map((g) => (
        <section key={g.title} aria-labelledby={`g-${g.title}`} className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3 border-b border-line pb-2">
            <h3 id={`g-${g.title}`} className="text-lg font-extrabold">
              {g.title}
            </h3>
            {g.subtitle ? <span className="text-sm text-muted">{g.subtitle}</span> : null}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {g.cards.map((c) => (
              <Card key={c.key} className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display text-base font-bold">{c.name}</h4>
                    <p className="tnum mt-0.5 font-display text-2xl font-extrabold tracking-tight">{c.headline}</p>
                  </div>
                  {c.isNew ? <Badge tone="lime">Nuevo</Badge> : c.delta ? <Badge tone={c.delta.tone === 'neutral' ? 'neutral' : c.delta.tone === 'ok' ? 'ok' : 'warn'}>{c.delta.text}</Badge> : null}
                </div>
                {c.asked && v.planNumber ? (
                  <p className="text-sm text-muted">
                    Le pides en la semana {v.planNumber}: <span className="font-semibold text-ink">{c.asked}</span>
                  </p>
                ) : null}
                <ExerciseChart name={c.name} pts={c.points} plan={c.plan} />
                {c.since ? <p className="text-xs text-muted">Desde la semana {c.since}</p> : null}
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
