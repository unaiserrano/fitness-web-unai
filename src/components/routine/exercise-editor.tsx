'use client';

import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { exerciseKey, slugify } from '@/domain/text';
import { lastDoneSet, lastEntryBefore } from '@/domain/history';
import { findInLibrary, WEIGHT_STEPS } from '@/domain/library';
import { recommend } from '@/domain/recommendation';
import { emptyResult } from '@/domain/week';
import { formatNum } from '@/domain/numbers';
import type { Exercise } from '@/domain/types';
import { Badge, Field } from '@/components/ui/primitives';
import { useRoutine } from './routine-context';
import { SetRow } from './set-row';

export function ExerciseEditor({ ex, day, di, ei, count }: { ex: Exercise; day: string; di: number; ei: number; count: number }) {
  const { mutate, history, library, weekNumber, athlete, stagnant, muscleGroups, libEdits, setLibEdit } = useRoutine();
  const key = exerciseKey(day, ex.name, athlete.flexibleDays);
  const lib = findInLibrary(library, ex.name);
  const slug = slugify(ex.name);
  const group = libEdits[slug]?.muscleGroup ?? lib?.muscleGroup ?? 'Otros';
  const step = libEdits[slug]?.weightStep ?? lib?.weightStep ?? 2.5;
  const st = stagnant[key];
  const prev = lastEntryBefore(history, key, weekNumber);
  const upd = (fn: (e: Exercise) => void) => mutate((w) => fn(w.days[di].exercises[ei]));
  const move = (dir: -1 | 1) =>
    mutate((w) => {
      const list = w.days[di].exercises;
      const j = ei + dir;
      if (j < 0 || j >= list.length) return;
      [list[ei], list[j]] = [list[j], list[ei]];
    });

  return (
    <article className="rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="tnum font-display text-2xl font-semibold text-brand">{String(ei + 1).padStart(2, '0')}</span>
        <input
          className="field min-w-0 flex-1 font-semibold"
          list="library-names"
          aria-label="Nombre del ejercicio"
          defaultValue={ex.name}
          key={ex.name}
          onBlur={(e) => {
            const name = e.target.value.trim();
            if (!name || name === ex.name) return;
            const l = findInLibrary(library, name);
            upd((x) => {
              x.name = name;
              if (l && slugify(name) !== slug) {
                if (l.videoUrl) x.videoUrl = l.videoUrl;
                if (l.execution) x.execution = l.execution;
              }
            });
          }}
        />
        <div className="flex shrink-0 items-center">
          <button type="button" className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-2 disabled:opacity-30" disabled={ei === 0} aria-label="Subir ejercicio" onClick={() => move(-1)}>
            <ArrowUp aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-2 disabled:opacity-30"
            disabled={ei === count - 1}
            aria-label="Bajar ejercicio"
            onClick={() => move(1)}
          >
            <ArrowDown aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md text-muted hover:bg-bad-soft hover:text-bad"
            aria-label={`Quitar ${ex.name}`}
            onClick={() => mutate((w) => void w.days[di].exercises.splice(ei, 1))}
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-11 text-xs">
        <Badge>{group}</Badge>
        {ex.execution ? <span className="text-muted">{ex.execution}</span> : null}
        {ex.videoUrl ? (
          <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
            Vídeo <ExternalLink aria-hidden className="size-3" />
          </a>
        ) : null}
      </div>

      {st ? (
        <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-sm text-ink">
          <strong>Estancado: {st.weeks} semanas sin mejorar.</strong> Su mejor serie: {st.best} (sem {st.bestWeek}).
        </p>
      ) : null}
      {prev?.notes ? (
        <p className="mt-3 rounded-md border-l-4 border-brand bg-brand-soft/60 px-3 py-2 text-sm">
          <strong>
            {athlete.name} (sem {prev.week}):
          </strong>{' '}
          “{prev.notes}”
        </p>
      ) : null}

      <details className="group mt-3">
        <summary className="cursor-pointer select-none text-sm font-semibold text-muted hover:text-ink">
          Ejecución, vídeo, nota y grupo muscular{ex.coachNote ? ' · tiene nota' : ''}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Ejecución">
            <input className="field" value={ex.execution} placeholder="Controladas, tempo 0-1-3…" onChange={(e) => upd((x) => void (x.execution = e.target.value))} />
          </Field>
          <Field label="Vídeo">
            <input className="field" value={ex.videoUrl} placeholder="Enlace de TikTok, Instagram…" inputMode="url" onChange={(e) => upd((x) => void (x.videoUrl = e.target.value.trim()))} />
          </Field>
          <Field label="Grupo muscular" hint="Se guarda en la biblioteca.">
            <select className="field" value={group} onChange={(e) => setLibEdit(slug, { ...libEdits[slug], muscleGroup: e.target.value })}>
              {[...muscleGroups, 'Otros'].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Salto de peso" hint="Para redondear mis recomendaciones.">
            <select className="field" value={step} onChange={(e) => setLibEdit(slug, { ...libEdits[slug], weightStep: Number(e.target.value) })}>
              {WEIGHT_STEPS.map((s) => (
                <option key={s} value={s}>
                  {formatNum(s)} kg
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Nota para ${athlete.name} (sale en el PDF)`} className="sm:col-span-2">
            <textarea className="field min-h-20" value={ex.coachNote} onChange={(e) => upd((x) => void (x.coachNote = e.target.value))} />
          </Field>
        </div>
      </details>

      <div className="mt-4 max-w-2xl">
        <div className="mb-1.5 grid grid-cols-[2rem_1fr_1fr_4.25rem_2rem] gap-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted">
          <span />
          <span className="text-center">Reps</span>
          <span className="text-center">Kilos</span>
          <span className="text-center">RIR</span>
          <span />
        </div>
        <ul className="flex flex-col gap-2">
          {ex.sets.map((s, si) => {
            const set = { ...s, n: si + 1 };
            return (
              <SetRow
                key={si}
                set={set}
                di={di}
                ei={ei}
                si={si}
                last={lastDoneSet(history, key, set.n, weekNumber)}
                rec={recommend({ history, key, exerciseName: ex.name, set, week: weekNumber, library })}
              />
            );
          })}
        </ul>
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"
          onClick={() =>
            upd((x) => {
              const l = x.sets[x.sets.length - 1];
              x.sets.push({ n: x.sets.length + 1, target: l ? { ...l.target } : { reps: '10', kg: null, kgText: '', rir: '2' }, result: emptyResult() });
            })
          }
        >
          <Plus aria-hidden className="size-4" /> Serie
        </button>
      </div>
    </article>
  );
}
