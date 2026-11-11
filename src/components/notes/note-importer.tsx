'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { resultLabel, targetLabel } from '@/domain/format';
import { prettyName, toLibrary } from '@/domain/library';
import { mergeNote } from '@/domain/notes/merge';
import { parseNote, type ParsedNote } from '@/domain/notes/parse';
import type { Athlete, LibraryExercise, Week } from '@/domain/types';
import { Button, Card, CardHeader, Field, Notice } from '@/components/ui/primitives';
import { ToastView, useToast } from '@/components/ui/feedback';
import { importNoteAction } from '@/server/actions/weeks';

const days = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

/** Pegar la nota que devuelve el atleta, revisar lo leído y guardarlo. */
export function NoteImporter({
  athlete,
  weeks,
  libraryItems,
  defaultWeek,
}: {
  athlete: Athlete;
  weeks: Week[];
  libraryItems: LibraryExercise[];
  defaultWeek: number;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [num, setNum] = useState(defaultWeek);
  const [parsed, setParsed] = useState<ParsedNote | null>(null);
  const [pending, start] = useTransition();
  const { toast, show } = useToast();
  const lib = useMemo(() => toLibrary(libraryItems), [libraryItems]);
  const known = useMemo(() => weeks.flatMap((w) => w.days.flatMap((d) => d.exercises.map((e) => e.name))), [weeks]);

  const read = () => {
    const p = parseNote(text, (c) => prettyName(c, lib, known));
    if (p.week) setNum(p.week);
    setParsed(p);
  };
  const preview = useMemo(() => {
    if (!parsed || !parsed.days.length) return null;
    const saved = weeks.find((w) => w.number === num) ?? null;
    return { ...mergeNote(parsed, saved, num, athlete, lib), saved };
  }, [parsed, num, weeks, athlete, lib]);

  const save = () =>
    start(async () => {
      const res = await importNoteAction(athlete.id, num, text);
      show(res.message, res.ok ? 'ok' : 'bad');
      if (res.ok) {
        setText('');
        setParsed(null);
        router.push(`/personas/${athlete.id}/${preview?.doneSets ? 'progreso' : 'rutina'}`);
        router.refresh();
      }
    });

  return (
    <Card>
      <ToastView toast={toast} />
      <CardHeader title={`Pegar la nota de ${athlete.name}`} subtitle="Pega la nota tal cual te la manda. Puedes pegarla entera al final de la semana o día a día: lo ya guardado de otros días se mantiene." />
      <div className="flex flex-col gap-3">
        <textarea
          className="field min-h-56 font-mono text-[13px] leading-relaxed"
          aria-label="Nota de WhatsApp"
          placeholder={`Rutina S${defaultWeek}\n\nLunes · Pierna A\n\nHIP THRUST\nS1: 40 kg × 10 · RIR 3\n…`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setParsed(null);
          }}
        />
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Semana" className="w-28">
            <input className="field tnum" type="number" min={1} max={999} value={num} onChange={(e) => setNum(Number(e.target.value) || 1)} />
          </Field>
          <Button variant="primary" onClick={read} disabled={!text.trim()}>
            Leer la nota
          </Button>
        </div>
      </div>

      {parsed && !parsed.days.length ? (
        <Notice tone="warn" className="mt-4">
          No encuentro ningún día. Comprueba que la nota tenga líneas como «Lunes · Pierna A».
        </Notice>
      ) : null}

      {preview ? (
        <div className="mt-6 flex flex-col gap-4">
          <Notice tone={parsed?.warnings.length ? 'warn' : 'ok'}>
            {preview.doneSets
              ? `He leído ${days(parsed!.days.length)} y ${preview.doneSets} series hechas de la semana ${num}.`
              : `He leído ${days(parsed!.days.length)} sin datos de lo que hizo: se guardará como lo que le pides en la semana ${num}.`}
            {parsed!.bodyWeight != null ? ` Peso: ${parsed!.bodyWeight} kg.` : ''}
            {preview.saved ? (preview.kept.length ? ` Ya había datos de ${preview.kept.join(', ')} y se mantienen.` : ` Sustituye lo guardado de la semana ${num} en los días que traiga.`) : ''}
          </Notice>
          {parsed!.warnings.length ? (
            <Notice tone="warn" title="Revisa esto antes de guardar (puedes corregir el texto y volver a leer):">
              <ul className="mt-1 list-disc pl-5">
                {parsed!.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Notice>
          ) : null}
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Ejercicio</th>
                  <th scope="col" className="px-4 py-2.5">Lo que pides</th>
                  <th scope="col" className="px-4 py-2.5">Lo que hizo</th>
                </tr>
              </thead>
              {preview.week.days
                .filter((d) => parsed!.days.some((p) => p.day === d.day) && !preview.kept.includes(d.day))
                .map((d) => (
                  <tbody key={d.day} className="divide-y divide-line border-t border-line">
                    <tr>
                      <th colSpan={3} scope="colgroup" className="bg-surface px-4 py-2 text-left font-display font-bold">
                        {d.day}
                        {d.block ? ` · ${d.block}` : ''}
                      </th>
                    </tr>
                    {d.exercises.map((e) => (
                      <tr key={e.name} className="align-top">
                        <td className="px-4 py-2.5 font-semibold">
                          {e.name}
                          {e.athleteNotes ? <div className="mt-0.5 font-normal text-muted">“{e.athleteNotes}”</div> : null}
                        </td>
                        <td className="tnum px-4 py-2.5 text-muted">
                          {e.sets.map((s) => (
                            <div key={s.n}>
                              S{s.n} {targetLabel(s.target)}
                            </div>
                          ))}
                        </td>
                        <td className="tnum px-4 py-2.5">
                          {e.sets.map((s) => (
                            <div key={s.n} className={s.result.status === 'error' ? 'font-semibold text-bad' : ''}>
                              {resultLabel(s.result)}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                    {d.notes ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-muted">
                          Observaciones: {d.notes}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                ))}
            </table>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={save} disabled={pending}>
              {pending ? 'Guardando…' : `Guardar semana ${num}`}
            </Button>
            <Button variant="ghost" onClick={() => setParsed(null)}>
              Descartar
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
