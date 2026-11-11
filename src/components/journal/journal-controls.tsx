'use client';

import { Plus, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MILESTONE_KINDS, type MilestoneKind } from '@/domain/journal';
import { Button } from '@/components/ui/primitives';
import { ToastView, useToast } from '@/components/ui/feedback';
import { cn } from '@/components/ui/cn';
import { addMilestoneAction, deleteMilestoneAction, toggleMarkAction } from '@/server/actions/journal';

export function MilestoneForm({ athleteId, weeks }: { athleteId: string; weeks: number[] }) {
  const router = useRouter();
  const [week, setWeek] = useState<number | null>(weeks[0] ?? null);
  const [kind, setKind] = useState<MilestoneKind>('hito');
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  const { toast, show } = useToast();
  const submit = () =>
    start(async () => {
      const r = await addMilestoneAction(athleteId, { week, kind, text });
      show(r.message, r.ok ? 'ok' : 'bad');
      if (r.ok) {
        setText('');
        router.refresh();
      }
    });
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) submit();
      }}
    >
      <ToastView toast={toast} />
      <div className="grid gap-3 sm:grid-cols-[160px_220px_1fr_auto]">
        <select className="field" aria-label="Semana" value={week ?? ''} onChange={(e) => setWeek(e.target.value ? Number(e.target.value) : null)}>
          {weeks.map((n) => (
            <option key={n} value={n}>
              Semana {n}
            </option>
          ))}
          <option value="">Sin semana</option>
        </select>
        <select className="field" aria-label="Tipo" value={kind} onChange={(e) => setKind(e.target.value as MilestoneKind)}>
          {MILESTONE_KINDS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <input className="field" aria-label="Texto del hito" placeholder="Ej.: Sentadilla sin cajón por primera vez" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
        <Button type="submit" variant="primary" disabled={pending || !text.trim()}>
          <Plus aria-hidden className="size-4" /> Añadir
        </Button>
      </div>
    </form>
  );
}

export function DeleteMilestone({ athleteId, id }: { athleteId: string; id: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={cn('shrink-0 rounded-full px-2 py-1 text-xs font-semibold transition-colors', armed ? 'bg-bad text-white' : 'text-muted hover:bg-bad-soft hover:text-bad')}
      aria-label={armed ? 'Pulsa otra vez para borrar' : 'Borrar hito'}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          setTimeout(() => setArmed(false), 4000);
          return;
        }
        start(async () => {
          await deleteMilestoneAction(athleteId, id);
          router.refresh();
        });
      }}
    >
      {armed ? '¿Borrar?' : <X aria-hidden className="size-3.5" />}
    </button>
  );
}

export function StarToggle({ athleteId, week, markKey, on }: { athleteId: string; week: number; markKey: string; on: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label={value ? 'Quitar de importantes' : 'Marcar como importante'}
      disabled={pending}
      className={cn('grid size-8 shrink-0 place-items-center rounded-full transition-all', value ? 'bg-warn-soft text-warn scale-105' : 'text-muted/60 hover:bg-surface-2 hover:text-warn')}
      onClick={() =>
        start(async () => {
          setValue(!value);
          const r = await toggleMarkAction(athleteId, week, markKey, !value);
          if (!r.ok) setValue(value);
          router.refresh();
        })
      }
    >
      <Star aria-hidden className={cn('size-4', value && 'fill-current')} />
    </button>
  );
}
