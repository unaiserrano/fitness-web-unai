'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { WEEKDAYS } from '@/domain/calendar';
import { findInLibrary } from '@/domain/library';
import { newExercise, totalSets } from '@/domain/week';
import type { Day } from '@/domain/types';
import { Button } from '@/components/ui/primitives';
import { ConfirmButton } from '@/components/ui/feedback';
import { ExerciseEditor } from './exercise-editor';
import { useRoutine } from './routine-context';
import { WarmupEditor } from './warmup-editor';

export function DayEditor({ day, di }: { day: Day; di: number }) {
  const { mutate, library } = useRoutine();
  const [newName, setNewName] = useState('');
  const add = () => {
    const name = newName.trim();
    if (!name) return;
    const l = findInLibrary(library, name);
    mutate((w) => void w.days[di].exercises.push(newExercise(l?.name ?? name, l ?? undefined)));
    setNewName('');
  };
  return (
    <section aria-label={`${day.day} ${day.block}`} className="flex flex-col gap-3">
      <div className="sticky top-16 z-10 -mx-4 flex flex-wrap items-center gap-2 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <select className="field field-sm w-auto font-display text-base font-semibold" aria-label="Día" value={day.day} onChange={(e) => mutate((w) => void (w.days[di].day = e.target.value))}>
          {WEEKDAYS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <input className="field field-sm w-36" aria-label="Bloque" placeholder="Pierna A" value={day.block} onChange={(e) => mutate((w) => void (w.days[di].block = e.target.value))} />
        <span className="tnum text-sm text-muted">
          {day.exercises.length} ejercicios · {totalSets(day)} series
        </span>
        <ConfirmButton className="ml-auto" confirmText="¿Quitar el día?" onConfirm={() => mutate((w) => void w.days.splice(di, 1))}>
          Quitar día
        </ConfirmButton>
      </div>
      <WarmupEditor day={day} di={di} />
      {day.exercises.map((ex, ei) => (
        <ExerciseEditor key={`${ei}-${ex.name}`} ex={ex} day={day.day} di={di} ei={ei} count={day.exercises.length} />
      ))}
      <div className="flex gap-2">
        <input
          className="field min-w-0 flex-1"
          list="library-names"
          aria-label={`Ejercicio nuevo para el ${day.day}`}
          placeholder="Añadir ejercicio…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button onClick={add} disabled={!newName.trim()}>
          <Plus aria-hidden className="size-4" /> Añadir
        </Button>
      </div>
    </section>
  );
}
