'use client';

import { Wand2 } from 'lucide-react';
import type { CoachNotes } from '@/domain/types';
import { Button, Card, CardHeader } from '@/components/ui/primitives';
import { useRoutine } from './routine-context';

const FIELDS: Array<[keyof CoachNotes, string, string]> = [
  ['good', 'Lo que va bien', 'border-t-ok'],
  ['bad', 'Lo que ha fallado', 'border-t-bad'],
  ['mustNot', 'Lo que no puede fallar', 'border-t-brand'],
  ['remember', 'Recuerda', 'border-t-line'],
];

export function CoachNotesEditor({ notes, proposal }: { notes: CoachNotes; proposal: Pick<CoachNotes, 'good' | 'bad' | 'mustNot'> | null }) {
  const { mutate, athlete } = useRoutine();
  return (
    <Card>
      <CardHeader
        title={`Apuntes para ${athlete.name}`}
        subtitle="Salen en la última página del PDF. Una idea por línea."
        action={
          proposal ? (
            <Button
              size="sm"
              onClick={() =>
                mutate((w) => {
                  w.notes.good = proposal.good;
                  w.notes.bad = proposal.bad;
                  if (!w.notes.mustNot.length) w.notes.mustNot = proposal.mustNot;
                })
              }
            >
              <Wand2 aria-hidden className="size-4" /> Proponer con la semana pasada
            </Button>
          ) : null
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map(([k, label, border]) => (
          <label key={k} className={`flex flex-col gap-1.5 rounded-2xl border-t-4 bg-surface-2/60 p-3 ${border}`}>
            <span className="text-sm font-semibold">{label}</span>
            <textarea
              className="field min-h-28 text-sm"
              value={notes[k].join('\n')}
              onChange={(e) => mutate((w) => void (w.notes[k] = e.target.value.split('\n')))}
              onBlur={(e) => mutate((w) => void (w.notes[k] = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean)))}
            />
          </label>
        ))}
      </div>
    </Card>
  );
}
