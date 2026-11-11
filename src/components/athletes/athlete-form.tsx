'use client';

import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Athlete, RehabItem } from '@/domain/types';
import { Button, Card, CardHeader, Field } from '@/components/ui/primitives';
import { ToastView, useToast } from '@/components/ui/feedback';
import { saveAthleteAction } from '@/server/actions/athletes';

/** Datos de una persona: nombre, inicio, objetivo, tipo de nota y rehabilitación. */
export function AthleteForm({ initial, isNew = false }: { initial: Athlete; isNew?: boolean }) {
  const router = useRouter();
  const [a, setA] = useState<Athlete>(initial);
  const [pending, start] = useTransition();
  const { toast, show } = useToast();
  const set = <K extends keyof Athlete>(k: K, v: Athlete[K]) => setA((x) => ({ ...x, [k]: v }));
  const setCfg = <K extends keyof Athlete['config']>(k: K, v: Athlete['config'][K]) => setA((x) => ({ ...x, config: { ...x.config, [k]: v } }));
  const setRehab = (i: number, patch: Partial<RehabItem>) => setCfg('rehab', a.config.rehab.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const moveRehab = (i: number, d: -1 | 1) => {
    const list = [...a.config.rehab];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setCfg('rehab', list);
  };

  const save = () =>
    start(async () => {
      const res = await saveAthleteAction(a, { isNew });
      show(res.message, res.ok ? 'ok' : 'bad');
      if (res.ok) {
        if (isNew && res.id) router.push(`/personas/${res.id}/rutina`);
        router.refresh();
      }
    });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <ToastView toast={toast} />
      <Card>
        <CardHeader title="Datos" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <input className="field" required value={a.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Descripción" hint="Sale debajo del nombre.">
            <input className="field" value={a.subtitle} placeholder="Glúteo y femoral · 3 días" onChange={(e) => set('subtitle', e.target.value)} />
          </Field>
          <Field label="Lunes de la semana 1" hint="Sirve para poner las fechas de cada semana.">
            <input className="field" type="date" required value={a.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field label="Entrenamientos por semana (objetivo)">
            <input className="field tnum" type="number" min={1} max={7} value={a.targetSessions} onChange={(e) => set('targetSessions', Number(e.target.value) || 1)} />
          </Field>
          <Field label="Nota de WhatsApp">
            <select className="field" value={a.noteStyle} onChange={(e) => set('noteStyle', e.target.value as Athlete['noteStyle'])}>
              <option value="standard">Completa: lo que le pides en cada serie, apunta reps-kg-RIR</option>
              <option value="simple">Sencilla: «S1: __ kg × __ · RIR __» con el RIR explicado</option>
            </select>
          </Field>
          <Field label="Días de entrenamiento">
            <select className="field" value={a.flexibleDays ? 'free' : 'fixed'} onChange={(e) => set('flexibleDays', e.target.value === 'free')}>
              <option value="fixed">Días fijos (lunes, miércoles…)</option>
              <option value="free">Libres: entrena cuando puede (se agrupa por bloque)</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Rehabilitación" subtitle="Si tiene, sale en la portada del PDF y en su nota. Es la misma todas las semanas hasta que la cambies." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Zona">
            <input className="field" value={a.config.rehabZone} placeholder="Tobillo" onChange={(e) => setCfg('rehabZone', e.target.value)} />
          </Field>
          <Field label="Frecuencia">
            <input className="field" value={a.config.rehabText} placeholder="Mínimo 4 días a la semana" onChange={(e) => setCfg('rehabText', e.target.value)} />
          </Field>
        </div>
        <ol className="mt-4 flex flex-col gap-3">
          {a.config.rehab.map((r, i) => (
            <li key={i} className="rounded-2xl bg-surface-2/60 p-3">
              <div className="flex items-center gap-2">
                <span className="tnum font-display text-lg font-extrabold text-brand">{String(i + 1).padStart(2, '0')}</span>
                <input className="field min-w-0 flex-1 font-semibold" aria-label="Ejercicio de rehab" value={r.name} onChange={(e) => setRehab(i, { name: e.target.value })} />
                <button type="button" className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface disabled:opacity-30" aria-label="Subir" disabled={i === 0} onClick={() => moveRehab(i, -1)}>
                  <ArrowUp aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface disabled:opacity-30"
                  aria-label="Bajar"
                  disabled={i === a.config.rehab.length - 1}
                  onClick={() => moveRehab(i, 1)}
                >
                  <ArrowDown aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-full text-muted hover:bg-bad-soft hover:text-bad"
                  aria-label="Quitar"
                  onClick={() => setCfg('rehab', a.config.rehab.filter((_, j) => j !== i))}
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <input className="field field-sm" aria-label="Repeticiones por serie" placeholder="12 / 12 / 12" value={r.reps} onChange={(e) => setRehab(i, { reps: e.target.value })} />
                <input className="field field-sm" aria-label="Tempo o cómo hacerlo" placeholder="0 / 2 / 2" value={r.tempo} onChange={(e) => setRehab(i, { tempo: e.target.value })} />
                <input className="field field-sm" aria-label="Vídeo" placeholder="Vídeo (enlace)" value={r.videoUrl} onChange={(e) => setRehab(i, { videoUrl: e.target.value.trim() })} />
              </div>
            </li>
          ))}
        </ol>
        <Button className="mt-3" size="sm" variant="ghost" onClick={() => setCfg('rehab', [...a.config.rehab, { name: '', reps: '12 / 12 / 12', tempo: '', videoUrl: '' }])}>
          <Plus aria-hidden className="size-4" /> Ejercicio de rehab
        </Button>
      </Card>

      <Card>
        <CardHeader title="Recuerda" subtitle="Consejos fijos que salen al final del PDF si la semana no trae los suyos. Uno por línea." />
        <textarea
          className="field min-h-28 text-sm"
          value={a.config.remember.join('\n')}
          onChange={(e) => setCfg('remember', e.target.value.split('\n'))}
          onBlur={(e) => setCfg('remember', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
        />
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Guardando…' : isNew ? 'Crear persona' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
