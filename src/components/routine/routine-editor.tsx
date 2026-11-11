'use client';

import { CalendarPlus, Download, Plus, Sparkles, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toDeload } from '@/domain/alerts';
import { WEEKDAYS, weekDates } from '@/domain/calendar';
import type { History } from '@/domain/history';
import { toLibrary } from '@/domain/library';
import { generateNote } from '@/domain/notes/generate';
import { applyRecommendation, recommend } from '@/domain/recommendation';
import { exerciseKey } from '@/domain/text';
import type { Athlete, CoachNotes, LibraryExercise, Week } from '@/domain/types';
import { emptyDay, emptyWeek, newWeekFrom, sortDays } from '@/domain/week';
import { Button, ButtonLink, Card, Field, Notice, buttonClass } from '@/components/ui/primitives';
import { ConfirmButton, CopyButton, ToastView, useToast } from '@/components/ui/feedback';
import { deleteWeekAction, saveWeekAction } from '@/server/actions/weeks';
import { CoachNotesEditor } from './coach-notes-editor';
import { DayEditor } from './day-editor';
import { type LibEdit, RoutineContext, type StagnantInfo } from './routine-context';
import { useWeekDraft } from './use-week-draft';

export interface RoutineEditorProps {
  athlete: Athlete;
  initial: Week | null;
  initialExists: boolean;
  initialDone: boolean;
  weekList: Array<{ number: number; done: boolean }>;
  base: Week | null;
  history: History;
  libraryItems: LibraryExercise[];
  stagnant: Record<string, StagnantInfo>;
  sinceDeload: number;
  hasRehab: boolean;
  proposals: Record<number, Pick<CoachNotes, 'good' | 'bad' | 'mustNot'>>;
}

export function RoutineEditor(props: RoutineEditorProps) {
  const { athlete, weekList, history, libraryItems, stagnant, sinceDeload, hasRehab, proposals } = props;
  const router = useRouter();
  const { draft, dirty, mutate, replace, reset, markSaved, saved } = useWeekDraft(props.initial);
  const [exists, setExists] = useState(props.initialExists);
  const [libEdits, setLibEdits] = useState<Record<string, LibEdit>>({});
  const [pending, start] = useTransition();
  const { toast, show } = useToast();

  // Biblioteca con los cambios de grupo/salto todavía sin guardar (para que las recomendaciones los usen ya).
  const library = useMemo(
    () =>
      toLibrary(
        libraryItems.map((l) => ({ ...l, ...(libEdits[l.slug]?.muscleGroup ? { muscleGroup: libEdits[l.slug].muscleGroup! } : {}), ...(libEdits[l.slug]?.weightStep ? { weightStep: libEdits[l.slug].weightStep! } : {}) })),
      ),
    [libraryItems, libEdits],
  );
  const nextNumber = Math.max(0, ...weekList.map((w) => w.number)) + 1;
  const anyDirty = dirty || Object.keys(libEdits).length > 0;

  useEffect(() => {
    if (!anyDirty) return;
    const onBefore = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [anyDirty]);

  const recs = useMemo(() => {
    if (!draft) return [];
    const out: Array<[number, number, number]> = [];
    draft.days.forEach((d, di) =>
      d.exercises.forEach((e, ei) =>
        e.sets.forEach((s, si) => {
          const r = recommend({ history, key: exerciseKey(d.day, e.name, athlete.flexibleDays), exerciseName: e.name, set: { ...s, n: si + 1 }, week: draft.number, library });
          if (r && !r.same) out.push([di, ei, si]);
        }),
      ),
    );
    return out;
  }, [draft, history, library, athlete.flexibleDays]);

  const applyAll = (w: Week) => {
    let k = 0;
    w.days.forEach((d) =>
      d.exercises.forEach((e) =>
        e.sets.forEach((s, si) => {
          const r = recommend({ history, key: exerciseKey(d.day, e.name, athlete.flexibleDays), exerciseName: e.name, set: { ...s, n: si + 1 }, week: w.number, library });
          if (r && !r.same) {
            e.sets[si] = applyRecommendation(s, r);
            k++;
          }
        }),
      ),
    );
    return k;
  };

  const goTo = (n: number) => {
    if (anyDirty && !window.confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return;
    router.push(`?semana=${n}`, { scroll: false });
  };

  const createNext = () => {
    if (anyDirty && !window.confirm('Tienes cambios sin guardar. ¿Descartarlos y crear la semana nueva?')) return;
    const src = (!exists && draft) || props.base;
    const w = src ? newWeekFrom(athlete, src, nextNumber) : emptyWeek(athlete, nextNumber);
    const k = applyAll(w);
    replace(w);
    setExists(false);
    show(src ? `Semana ${nextNumber} creada a partir de la ${src.number}, con ${k} recomendaciones puestas. Revisa y guarda.` : `Semana ${nextNumber} creada.`, 'neutral');
  };

  const save = () =>
    start(async () => {
      if (!draft) return;
      const res = await saveWeekAction(athlete.id, draft, libEdits);
      show(res.message, res.ok ? 'ok' : 'bad');
      if (res.ok) {
        markSaved(draft);
        setLibEdits({});
        setExists(true);
        router.replace(`?semana=${draft.number}`, { scroll: false });
        router.refresh();
      }
    });

  const remove = () =>
    start(async () => {
      if (!draft) return;
      const res = await deleteWeekAction(athlete.id, draft.number);
      show(res.message, res.ok ? 'ok' : 'bad');
      if (res.ok) {
        router.replace('?', { scroll: false });
        router.refresh();
      }
    });

  if (!draft) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-14 text-center">
        <p className="font-display text-lg font-bold">Todavía no hay ninguna semana de {athlete.name}</p>
        <p className="max-w-md text-sm text-muted">Empieza su rutina desde cero o pega su primera nota en la pestaña Nota.</p>
        <Button
          variant="primary"
          onClick={() => {
            replace({ ...emptyWeek(athlete, 1), days: [emptyDay('Lunes')] });
            setExists(false);
          }}
        >
          <Plus aria-hidden className="size-4" /> Empezar la semana 1
        </Button>
        <ToastView toast={toast} />
      </div>
    );
  }

  const isDone = exists && props.initialDone && saved?.number === draft.number;
  const freeDays = WEEKDAYS.filter((d) => !draft.days.some((x) => x.day === d));
  const muscleGroups = athlete.config.muscleGroups;

  return (
    <RoutineContext.Provider
      value={{
        athlete,
        weekNumber: draft.number,
        history,
        library,
        muscleGroups,
        stagnant,
        libEdits,
        setLibEdit: (slug, edit) => setLibEdits((cur) => ({ ...cur, [slug]: edit })),
        mutate,
      }}
    >
      <datalist id="library-names">
        {libraryItems.map((l) => (
          <option key={l.slug} value={l.name} label={[l.muscleGroup, l.execution].filter(Boolean).join(' · ')} />
        ))}
      </datalist>
      <ToastView toast={toast} />

      <div className="flex flex-col gap-5">
        <Card className="flex flex-wrap items-end gap-3 p-4 sm:p-5">
          <Field label="Semana que editas" className="w-full sm:w-auto">
            <select className="field sm:w-72" value={draft.number} onChange={(e) => goTo(Number(e.target.value))}>
              {!exists ? <option value={draft.number}>Semana {draft.number} · nueva, sin guardar</option> : null}
              {[...weekList].reverse().map((w) => (
                <option key={w.number} value={w.number}>
                  Semana {w.number}
                  {w.done ? ' · hecha' : ' · la que le pides'}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button onClick={createNext}>
              <CalendarPlus aria-hidden className="size-4" /> Crear semana {nextNumber}
            </Button>
            {!draft.deload ? (
              <Button
                variant="ghost"
                onClick={() => {
                  replace(toDeload(draft, library));
                  show('Convertida en descarga: mitad de series, −10 % de peso y +2 de RIR. Revisa y guarda.', 'neutral');
                }}
              >
                <TrendingDown aria-hidden className="size-4" /> Convertir en descarga
              </Button>
            ) : null}
          </div>
        </Card>

        {isDone ? (
          <Notice tone="warn">Esta semana ya tiene lo que hizo {athlete.name}. Puedes corregir lo que le pediste, pero lo normal es editar la semana que le vas a mandar.</Notice>
        ) : null}
        {draft.deload ? <Notice tone="brand" title="Semana de descarga">Mitad de series, −10 % de peso y +2 de RIR. Mismos ejercicios.</Notice> : null}
        {!draft.deload && sinceDeload >= 5 ? (
          <Notice tone="warn">
            Lleva {sinceDeload} semanas seguidas sin descarga. Si esta va a ser de descarga, pulsa «Convertir en descarga».
          </Notice>
        ) : null}

        <details className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 sm:px-5">
          <summary className="cursor-pointer select-none font-semibold">
            Datos de la semana <span className="text-sm font-normal text-muted">· {draft.dates || weekDates(athlete.startDate, draft.number)}</span>
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Fechas">
              <input className="field" value={draft.dates} onChange={(e) => mutate((w) => void (w.dates = e.target.value))} />
            </Field>
            <Field label="Frase de portada">
              <input className="field" value={draft.intro} placeholder="Novedad: la sentadilla ya es sin cajón." onChange={(e) => mutate((w) => void (w.intro = e.target.value))} />
            </Field>
            {hasRehab ? (
              <Field label="Cuándo hacer la rehab" className="sm:col-span-2">
                <textarea className="field min-h-16" value={draft.rehabText} onChange={(e) => mutate((w) => void (w.rehabText = e.target.value))} />
              </Field>
            ) : null}
          </div>
        </details>

        {recs.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-lime/35 px-4 py-3 sm:px-5">
            <p className="text-sm">
              <strong>{recs.length} series</strong> no coinciden con mi recomendación (según lo que hizo la última vez).
            </p>
            <Button
              size="sm"
              variant="lime"
              onClick={() =>
                mutate((w) => {
                  applyAll(w);
                })
              }
            >
              <Sparkles aria-hidden className="size-4" /> Poner mis {recs.length} recomendaciones
            </Button>
          </div>
        ) : null}

        {draft.days.map((d, di) => (
          <DayEditor key={`${di}-${d.day}`} day={d} di={di} />
        ))}

        {freeDays.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <select id="new-day" className="field w-auto" aria-label="Día nuevo" defaultValue={freeDays[0]}>
              {freeDays.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <Button
              onClick={() => {
                const v = (document.getElementById('new-day') as HTMLSelectElement | null)?.value ?? freeDays[0];
                mutate((w) => void (w.days = sortDays([...w.days, emptyDay(v)])));
              }}
            >
              <Plus aria-hidden className="size-4" /> Añadir día
            </Button>
          </div>
        ) : null}

        <CoachNotesEditor notes={draft.notes} proposal={proposals[draft.number] ?? null} />

        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold">Para mandarle</h2>
            <p className="mt-1 text-sm text-muted">La nota sale de lo que ves en pantalla. El PDF, de lo guardado.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={() => generateNote(draft, athlete, { hasRehab })} label="Copiar la nota de WhatsApp" copiedLabel="Nota copiada" />
            {exists && !anyDirty ? (
              <a className={buttonClass('secondary')} href={`/api/personas/${athlete.id}/semanas/${draft.number}/pdf`}>
                <Download aria-hidden className="size-4" /> Descargar el PDF
              </a>
            ) : (
              <span className={buttonClass('secondary', 'md', 'pointer-events-none opacity-45')} aria-disabled title="Guarda primero para descargar el PDF">
                <Download aria-hidden className="size-4" /> PDF (guarda primero)
              </span>
            )}
            <ButtonLink href={`/personas/${athlete.id}/nota?semana=${draft.number}`} variant="ghost">
              Ver la nota completa
            </ButtonLink>
          </div>
          {exists ? (
            <div className="border-t border-line pt-4">
              <ConfirmButton confirmText={`¿Borrar la semana ${draft.number}? Pulsa otra vez`} onConfirm={remove}>
                Borrar la semana {draft.number}
              </ConfirmButton>
            </div>
          ) : null}
        </Card>
      </div>

      {/* Barra fija para guardar (encima de la barra de pestañas en el móvil) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 sm:bottom-6">
        <div
          className={`pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface/95 py-1.5 pl-5 pr-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur transition-all ${anyDirty || !exists ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
        >
          <span className="text-sm font-semibold">{exists ? 'Cambios sin guardar' : `Semana ${draft.number} sin guardar`}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (!exists) {
                router.refresh();
                replace(saved);
                setExists(!!saved);
              } else reset();
              setLibEdits({});
            }}
          >
            Deshacer
          </Button>
          <Button size="sm" variant="primary" onClick={save} disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </RoutineContext.Provider>
  );
}
