import { Flag, MessageCircle, Repeat2, Trophy, TriangleAlert } from 'lucide-react';
import type { Metadata } from 'next';
import { doneWeeks, formatNum, hasRehab, rehabCount, sessionsDone, sortWeeks, weekComments, weekHasResults, weekRecords } from '@/domain';
import type { Milestone } from '@/domain/journal';
import { Badge, ButtonLink, Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { DeleteMilestone, MilestoneForm, StarToggle } from '@/components/journal/journal-controls';
import { cn } from '@/components/ui/cn';
import { listMilestones } from '@/server/repositories/milestones';
import { loadAthleteContext } from '@/server/services/athlete-data';

export const metadata: Metadata = { title: 'Diario' };

const KIND_STYLE: Record<Milestone['kind'], { label: string; cls: string; Icon: typeof Flag }> = {
  hito: { label: 'Hito', cls: 'border-ok/30 bg-ok-soft text-ok', Icon: Flag },
  aviso: { label: 'Aviso', cls: 'border-warn/30 bg-warn-soft text-warn', Icon: TriangleAlert },
  cambio: { label: 'Cambio', cls: 'border-info/30 bg-info-soft text-info', Icon: Repeat2 },
};

export default async function JournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ athlete, weeks }, milestones] = await Promise.all([loadAthleteContext(id), listMilestones(id)]);
  const all = sortWeeks(weeks).reverse();
  const flexible = athlete.flexibleDays;
  const withRehab = hasRehab(athlete, weeks);
  const zone = athlete.config.rehabZone || 'molestias';

  if (!all.length) {
    return (
      <EmptyState title={`Todavía no hay semanas de ${athlete.name}`} action={<ButtonLink href={`/personas/${id}/rutina`} variant="primary">Montar su rutina</ButtonLink>}>
        El diario se va llenando solo con cada semana: récords, comentarios e hitos.
      </EmptyState>
    );
  }

  const highlights: Array<{ week: number; node: React.ReactNode; key: string }> = [];
  for (const w of all) {
    for (const m of milestones.filter((x) => x.week === w.number && x.kind !== 'cambio')) {
      highlights.push({ week: w.number, key: m.id, node: <MilestoneRow m={m} athleteId={id} /> });
    }
    for (const c of weekComments(w, flexible, zone).filter((c) => c.important)) {
      highlights.push({
        week: w.number,
        key: `${w.number}-${c.key}`,
        node: (
          <div className="flex gap-3 rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3">
            <MessageCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
            <div className="min-w-0">
              <q className="text-[15px]">{c.text}</q>
              <p className="mt-1 text-xs text-muted">
                {athlete.name} · {c.who}
              </p>
            </div>
          </div>
        ),
      });
    }
  }
  const totalRecords = doneWeeks(weeks).reduce((t, w) => t + weekRecords(weeks, w, flexible).length, 0);

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-[15px] text-muted">
        Lo importante de cada semana: hitos, récords, lo que ha comentado {athlete.name} y lo que le mandaste. La estrella marca un comentario como importante (los que hablan de dolor, molestias o
        hinchazón se marcan solos).
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Semanas" value={all.length} tone="brand" />
        <MiniStat label="Récords" value={totalRecords} tone="lime" />
        <MiniStat label="Hitos y avisos" value={milestones.length} tone="info" />
      </div>

      <Card>
        <CardHeader title="Lo más importante" subtitle="Hitos y comentarios marcados, de lo más reciente a lo más antiguo." />
        {highlights.length ? (
          <ul className="flex flex-col gap-2">
            {highlights.slice(0, 12).map((h) => (
              <li key={h.key} className="flex items-start gap-3">
                <span className="tnum mt-2.5 w-12 shrink-0 text-xs font-bold uppercase tracking-wide text-muted">Sem {h.week}</span>
                <div className="min-w-0 flex-1">{h.node}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Todavía no hay nada marcado.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Apuntar un hito o un cambio" />
        <MilestoneForm athleteId={id} weeks={all.map((w) => w.number)} />
      </Card>

      <ol className="relative flex flex-col gap-5 before:absolute before:bottom-4 before:left-[27px] before:top-4 before:w-0.5 before:bg-gradient-to-b before:from-brand before:via-line before:to-transparent sm:before:left-[35px]">
        {all.map((w) => {
          const done = weekHasResults(w);
          const sessions = sessionsDone(w);
          const rc = rehabCount(w);
          const ms = milestones.filter((m) => m.week === w.number).sort((a) => (a.kind === 'hito' ? -1 : 1));
          const recs = done ? weekRecords(weeks, w, flexible) : [];
          const comments = weekComments(w, flexible, zone);
          const n = w.notes;
          return (
            <li key={w.number} id={`sem-${w.number}`} className="relative flex gap-3 sm:gap-5">
              <div
                className={cn(
                  'relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl text-center font-display font-extrabold shadow-sm sm:size-[72px]',
                  done ? 'bg-ink text-bg' : 'bg-brand text-brand-ink',
                )}
              >
                <div>
                  <div className="text-lg leading-none sm:text-2xl">S{w.number}</div>
                  {w.deload ? <div className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-80">Descarga</div> : null}
                </div>
              </div>
              <Card className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm font-semibold text-muted">{w.dates}</span>
                  {done ? (
                    <>
                      <Badge tone={sessions >= athlete.targetSessions ? 'ok' : 'warn'}>
                        Entrenos {sessions} de {athlete.targetSessions}
                      </Badge>
                      {withRehab ? rc == null ? <Badge>Rehab sin apuntar</Badge> : <Badge tone={rc >= 4 ? 'ok' : 'warn'}>Rehab {rc} de 4</Badge> : null}
                      {w.bodyWeight != null ? <Badge tone="info">Peso {formatNum(w.bodyWeight)} kg</Badge> : null}
                    </>
                  ) : (
                    <Badge tone="brand">Esta semana: lo que le pides</Badge>
                  )}
                </div>

                {ms.length ? (
                  <ul className="flex flex-col gap-2">
                    {ms.map((m) => (
                      <li key={m.id}>
                        <MilestoneRow m={m} athleteId={id} />
                      </li>
                    ))}
                  </ul>
                ) : null}

                {recs.length ? (
                  <div className="flex gap-3 rounded-2xl bg-gradient-to-r from-lime/50 to-lime/10 px-4 py-3">
                    <Trophy aria-hidden className="mt-0.5 size-5 shrink-0 text-lime-ink dark:text-lime" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-lime-ink dark:text-lime">Récords</p>
                      <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                        {recs.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {comments.length ? (
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">Lo que ha comentado {athlete.name}</p>
                    <ul className="flex flex-col divide-y divide-line">
                      {comments.map((c) => (
                        <li key={c.key} className="flex items-start gap-2 py-2">
                          <StarToggle athleteId={id} week={w.number} markKey={c.key} on={c.important} />
                          <div className="min-w-0 pt-1">
                            <q className="text-[15px]">{c.text}</q>
                            <p className="text-xs text-muted">{c.who}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {n.good.length + n.bad.length + n.mustNot.length ? (
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-semibold text-brand">Apuntes que le mandaste con esta rutina</summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <NoteBox title="Lo que va bien" items={n.good} cls="border-ok/30 bg-ok-soft" />
                      <NoteBox title="Lo que ha fallado" items={n.bad} cls="border-bad/30 bg-bad-soft" />
                      <NoteBox title="Lo que no puede fallar" items={n.mustNot} cls="border-brand/30 bg-brand-soft" />
                    </div>
                  </details>
                ) : null}

                {w.days.length ? (
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-brand">Rutina que le pasaste</summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {w.days.map((d) => (
                        <div key={d.day} className="rounded-2xl bg-surface-2 p-3">
                          <p className="mb-1.5 text-sm font-bold">
                            {d.day}
                            {d.block ? <span className="font-normal text-muted"> · {d.block}</span> : null}
                          </p>
                          <ul className="flex flex-col gap-0.5 text-sm">
                            {d.exercises.map((e, i) => (
                              <li key={i} className="flex justify-between gap-3">
                                <span className="min-w-0 truncate">{e.name}</span>
                                <span className="tnum shrink-0 text-muted">
                                  {e.sets
                                    .map((s) => `${s.target.kg === 0 ? 'sp' : s.target.kg != null ? formatNum(s.target.kg) : s.target.kgText || '—'}×${s.target.reps}`)
                                    .join(' · ')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MilestoneRow({ m, athleteId }: { m: Milestone; athleteId: string }) {
  const s = KIND_STYLE[m.kind];
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3', s.cls)}>
      <s.Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 text-ink">
        <span className="mr-2 text-xs font-bold uppercase tracking-wider opacity-80">{s.label}</span>
        <span className="text-[15px]">{m.text}</span>
      </div>
      <DeleteMilestone athleteId={athleteId} id={m.id} />
    </div>
  );
}

function NoteBox({ title, items, cls }: { title: string; items: string[]; cls: string }) {
  return (
    <div className={cn('rounded-2xl border p-3', cls)}>
      <p className="mb-1 text-sm font-bold">{title}</p>
      {items.length ? (
        <ul className="list-disc pl-5 text-sm">
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">—</p>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'brand' | 'lime' | 'info' }) {
  const cls = { brand: 'from-brand/15 text-brand', lime: 'from-lime/40 text-lime-ink dark:text-lime', info: 'from-info/15 text-info' }[tone];
  return (
    <div className={cn('rounded-[var(--radius-card)] border border-line bg-gradient-to-br to-surface p-5', cls)}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="tnum mt-1 font-display text-4xl font-extrabold text-ink">{value}</p>
    </div>
  );
}
