'use client';

import { ArrowUp, Plus, X } from 'lucide-react';
import type { Day } from '@/domain/types';
import { useRoutine } from './routine-context';

export function WarmupEditor({ day, di }: { day: Day; di: number }) {
  const { mutate } = useRoutine();
  const items = day.warmup;
  const upd = (fn: (d: Day) => void) => mutate((w) => fn(w.days[di]));
  return (
    <details className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 sm:px-5">
      <summary className="cursor-pointer select-none font-semibold">
        Calentamiento <span className="text-sm font-normal text-muted">· {items.length ? `${items.length} ejercicios, sale en el PDF antes del entrenamiento` : 'sin calentamiento'}</span>
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        <input
          className="field"
          aria-label="Frase antes del calentamiento"
          placeholder="Frase opcional. Ej.: Unos 10 minutos, sin prisa."
          value={day.warmupNote}
          onChange={(e) => upd((d) => void (d.warmupNote = e.target.value))}
        />
        <ol className="flex flex-col gap-2">
          {items.map((it, i) => (
            <li key={i} className="grid grid-cols-[1.5rem_1fr_2rem] items-start gap-2 sm:grid-cols-[1.5rem_3fr_1.2fr_2fr_auto]">
              <span className="pt-2.5 text-xs font-bold text-brand">{i + 1}</span>
              <input className="field field-sm" aria-label={`Ejercicio de calentamiento ${i + 1}`} placeholder="Ejercicio" value={it.name} onChange={(e) => upd((d) => void (d.warmup[i].name = e.target.value))} />
              <div className="col-start-3 row-start-1 flex sm:col-start-5">
                <button
                  type="button"
                  className="hidden size-8 place-items-center rounded-md text-muted hover:bg-surface-2 disabled:opacity-30 sm:grid"
                  aria-label="Subir"
                  disabled={i === 0}
                  onClick={() => upd((d) => void d.warmup.splice(i - 1, 0, d.warmup.splice(i, 1)[0]))}
                >
                  <ArrowUp aria-hidden className="size-4" />
                </button>
                <button type="button" className="grid size-8 place-items-center rounded-md text-muted hover:bg-bad-soft hover:text-bad" aria-label="Quitar" onClick={() => upd((d) => void d.warmup.splice(i, 1))}>
                  <X aria-hidden className="size-4" />
                </button>
              </div>
              <input className="field field-sm col-start-2 sm:col-start-3 sm:row-start-1" aria-label="Cuánto" placeholder="2 × 10" value={it.dose} onChange={(e) => upd((d) => void (d.warmup[i].dose = e.target.value))} />
              <input
                className="field field-sm col-start-2 sm:col-start-4 sm:row-start-1"
                aria-label="Vídeo"
                placeholder="Vídeo (enlace)"
                inputMode="url"
                value={it.videoUrl}
                onChange={(e) => upd((d) => void (d.warmup[i].videoUrl = e.target.value.trim()))}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 self-start rounded-sm px-3 py-1.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"
          onClick={() => upd((d) => void d.warmup.push({ name: '', dose: '', videoUrl: '' }))}
        >
          <Plus aria-hidden className="size-4" /> Ejercicio de calentamiento
        </button>
      </div>
    </details>
  );
}
