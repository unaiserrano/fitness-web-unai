import type { Metadata } from 'next';
import { generateNote, hasRehab, planWeek, sortWeeks, weekHasResults } from '@/domain';
import { WeekSelect } from '@/components/layout/week-select';
import { NoteImporter } from '@/components/notes/note-importer';
import { CopyButton } from '@/components/ui/feedback';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { loadAthleteContext } from '@/server/services/athlete-data';

export const metadata: Metadata = { title: 'Nota' };

export default async function NotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ semana?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { athlete, weeks, libraryItems } = await loadAthleteContext(id);
  const all = sortWeeks(weeks);
  const plan = planWeek(all);
  const chosen = (sp.semana ? all.find((w) => w.number === Number(sp.semana)) : undefined) ?? plan ?? all[all.length - 1] ?? null;
  const text = chosen ? generateNote(chosen, athlete, { hasRehab: hasRehab(athlete, all) }) : '';
  const defaultImport = plan?.number ?? (all.length ? all[all.length - 1].number + 1 : 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <Card>
        <CardHeader
          title="Nota para mandarle"
          subtitle={athlete.noteStyle === 'simple' ? 'Formato sencillo: kilos × reps · RIR, con el RIR explicado arriba.' : 'Cada serie con lo que le pides; apunta reps-kg-RIR.'}
          action={chosen ? <WeekSelect weeks={all.map((w) => ({ number: w.number, done: weekHasResults(w) }))} value={chosen.number} /> : null}
        />
        {chosen ? (
          <>
            <CopyButton text={text} label="Copiar la nota" copiedLabel="Nota copiada" />
            <pre className="mt-4 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-surface-2 p-4 font-mono text-[13px] leading-relaxed">{text}</pre>
          </>
        ) : (
          <EmptyState title="Sin semanas">Crea la primera semana en Rutina.</EmptyState>
        )}
      </Card>
      <NoteImporter athlete={athlete} weeks={all} libraryItems={libraryItems} defaultWeek={defaultImport} />
    </div>
  );
}
