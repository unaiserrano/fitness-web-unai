'use client';

import { ExternalLink, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { WEIGHT_STEPS } from '@/domain/library';
import { formatNum } from '@/domain/numbers';
import { exerciseNorm, slugify } from '@/domain/text';
import type { LibraryExercise } from '@/domain/types';
import { secondaryGroups, splitFromText, splitToText } from '@/domain/volume';
import { toLibrary } from '@/domain/library';
import { Badge, Button, Card, Field } from '@/components/ui/primitives';
import { ConfirmButton, ToastView, useToast } from '@/components/ui/feedback';
import { deleteLibraryItemAction, saveLibraryItemAction } from '@/server/actions/library';

const blank = (group: string): LibraryExercise => ({ slug: '', name: '', muscleGroup: group, execution: '', videoUrl: '', weightStep: 2.5, volumeSplit: null });

export function LibraryManager({ items, groups }: { items: LibraryExercise[]; groups: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast, show } = useToast();
  const lib = useMemo(() => toLibrary(items), [items]);
  const list = useMemo(() => {
    const n = exerciseNorm(q);
    return items.filter((l) => !n || exerciseNorm(l.name).includes(n) || exerciseNorm(l.muscleGroup).includes(n));
  }, [items, q]);

  return (
    <div className="flex flex-col gap-4">
      <ToastView toast={toast} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar en la biblioteca</span>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input className="field pl-10" type="search" placeholder="Buscar por nombre o grupo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Button variant="primary" onClick={() => setCreating((v) => !v)} aria-expanded={creating}>
          <Plus aria-hidden className="size-4" /> Nuevo ejercicio
        </Button>
      </div>

      {creating ? (
        <ItemEditor
          item={blank('Otros')}
          groups={groups}
          isNew
          onDone={(msg, ok) => {
            show(msg, ok ? 'ok' : 'bad');
            if (ok) {
              setCreating(false);
              router.refresh();
            }
          }}
        />
      ) : null}

      <p className="text-sm text-muted">
        {list.length} de {items.length} ejercicios
      </p>
      <ul className="flex flex-col gap-2">
        {list.map((l) => {
          const isOpen = open === l.slug;
          const split = secondaryGroups(lib, l.name);
          return (
            <li key={l.slug} className="rounded-2xl border border-line bg-surface">
              <button
                type="button"
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : l.slug)}
              >
                <span className="min-w-0 flex-1 font-semibold">{l.name}</span>
                <Badge>{l.muscleGroup}</Badge>
                {Object.keys(split).length ? <span className="hidden text-xs text-muted sm:inline">+ {splitToText(split)}</span> : null}
                {l.videoUrl ? <Badge tone="brand">Vídeo</Badge> : null}
              </button>
              {isOpen ? (
                <div className="border-t border-line px-4 pb-4 pt-3">
                  <ItemEditor
                    item={l}
                    groups={groups}
                    splitPlaceholder={splitToText(split)}
                    onDone={(msg, ok) => {
                      show(msg, ok ? 'ok' : 'bad');
                      if (ok) router.refresh();
                    }}
                    onDelete={async () => {
                      const r = await deleteLibraryItemAction(l.slug);
                      show(r.message, r.ok ? 'ok' : 'bad');
                      if (r.ok) {
                        setOpen(null);
                        router.refresh();
                      }
                    }}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ItemEditor({
  item,
  groups,
  isNew = false,
  splitPlaceholder,
  onDone,
  onDelete,
}: {
  item: LibraryExercise;
  groups: string[];
  isNew?: boolean;
  splitPlaceholder?: string;
  onDone: (msg: string, ok: boolean) => void;
  onDelete?: () => void;
}) {
  const [x, setX] = useState(item);
  const [splitText, setSplitText] = useState(item.volumeSplit ? splitToText(item.volumeSplit) : '');
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      const volumeSplit = splitText.trim() ? splitFromText(splitText, groups) : null;
      const res = await saveLibraryItemAction({ ...x, slug: isNew ? slugify(x.name) : x.slug, volumeSplit }, { isNew });
      onDone(res.message, res.ok);
    });
  const Wrap = isNew ? Card : 'div';
  return (
    <Wrap className={isNew ? 'p-4 sm:p-5' : undefined}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Nombre">
          <input className="field" value={x.name} disabled={!isNew} onChange={(e) => setX({ ...x, name: e.target.value })} />
        </Field>
        <Field label="Grupo muscular">
          <select className="field" value={x.muscleGroup} onChange={(e) => setX({ ...x, muscleGroup: e.target.value })}>
            {[...groups, 'Otros'].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Salto de peso">
          <select className="field" value={x.weightStep} onChange={(e) => setX({ ...x, weightStep: Number(e.target.value) })}>
            {WEIGHT_STEPS.map((s) => (
              <option key={s} value={s}>
                {formatNum(s)} kg
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ejecución">
          <input className="field" value={x.execution} placeholder="Controladas, tempo 0-1-3…" onChange={(e) => setX({ ...x, execution: e.target.value })} />
        </Field>
        <Field
          label={
            <span className="inline-flex items-center gap-2">
              Vídeo
              {x.videoUrl ? (
                <a href={x.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                  abrir <ExternalLink aria-hidden className="size-3" />
                </a>
              ) : null}
            </span>
          }
        >
          <input className="field" inputMode="url" value={x.videoUrl} onChange={(e) => setX({ ...x, videoUrl: e.target.value.trim() })} />
        </Field>
        <Field label="También cuenta para (volumen)" hint="Ej.: Tríceps 0,5 · Hombro 0,5. Vacío = reglas por defecto.">
          <input className="field" value={splitText} placeholder={splitPlaceholder || 'Solo su grupo'} onChange={(e) => setSplitText(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={save} disabled={pending || !x.name.trim()}>
          {pending ? 'Guardando…' : isNew ? 'Añadir a la biblioteca' : 'Guardar'}
        </Button>
        {onDelete ? (
          <ConfirmButton className="ml-auto" confirmText="¿Borrar? Pulsa otra vez" onConfirm={onDelete}>
            Borrar
          </ConfirmButton>
        ) : null}
      </div>
    </Wrap>
  );
}
