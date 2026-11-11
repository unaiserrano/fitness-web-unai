'use client';

import { BarChart3, BookOpenText, ClipboardList, Dumbbell, Ellipsis, MessageSquareText, Salad, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/components/ui/cn';

const TABS = [
  { seg: 'progreso', label: 'Progreso', Icon: BarChart3, main: true },
  { seg: 'rutina', label: 'Rutina', Icon: ClipboardList, main: true },
  { seg: 'nota', label: 'Nota', Icon: MessageSquareText, main: true },
  { seg: 'dieta', label: 'Comida', Icon: Salad, main: true },
  { seg: 'volumen', label: 'Volumen', Icon: Dumbbell, main: false },
  { seg: 'diario', label: 'Diario', Icon: BookOpenText, main: false },
  { seg: 'ajustes', label: 'Ajustes', Icon: Settings2, main: false },
] as const;

/** Pestañas subrayadas en escritorio; en el móvil, 4 principales y «Más». */
export function AthleteTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const current = TABS.find((t) => pathname.startsWith(`/personas/${id}/${t.seg}`))?.seg ?? 'progreso';
  const secondary = TABS.filter((t) => !t.main);
  const inMore = secondary.some((t) => t.seg === current);
  return (
    <>
      <nav aria-label="Secciones" className="mb-8 hidden border-b border-line sm:block">
        <ul className="-mb-px flex gap-7">
          {TABS.map((t) => (
            <li key={t.seg}>
              <Link
                href={`/personas/${id}/${t.seg}`}
                aria-current={current === t.seg ? 'page' : undefined}
                className={cn(
                  'inline-flex border-b-2 pb-3 pt-1 text-[15px] font-medium transition-colors',
                  current === t.seg ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/80 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        {more ? (
          <ul className="grid grid-cols-3 border-b border-line">
            {secondary.map((t) => (
              <li key={t.seg}>
                <Link
                  href={`/personas/${id}/${t.seg}`}
                  onClick={() => setMore(false)}
                  aria-current={current === t.seg ? 'page' : undefined}
                  className={cn('flex items-center justify-center gap-2 py-3 text-sm font-medium', current === t.seg ? 'text-brand' : 'text-muted')}
                >
                  <t.Icon aria-hidden className="size-4" />
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="grid grid-cols-5">
          {TABS.filter((t) => t.main).map((t) => (
            <li key={t.seg}>
              <Link
                href={`/personas/${id}/${t.seg}`}
                onClick={() => setMore(false)}
                aria-current={current === t.seg ? 'page' : undefined}
                className={cn('flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium', current === t.seg ? 'text-brand' : 'text-muted')}
              >
                <t.Icon aria-hidden className="size-5" />
                {t.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-expanded={more}
              onClick={() => setMore((v) => !v)}
              className={cn('flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium', inMore || more ? 'text-brand' : 'text-muted')}
            >
              <Ellipsis aria-hidden className="size-5" />
              Más
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

/** Cambiar de persona manteniendo la sección. */
export function AthleteSwitcher({ id, athletes }: { id: string; athletes: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  if (athletes.length < 2) return null;
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">Cambiar de persona</span>
      <select
        className="field field-sm w-auto border-band-ink/30 bg-transparent pr-8 text-band-ink"
        value={id}
        onChange={(e) => router.push(pathname.replace(`/personas/${id}`, `/personas/${e.target.value}`).replace(/\?.*$/, ''))}
      >
        {athletes.map((a) => (
          <option key={a.id} value={a.id} className="text-ink">
            {a.name}
          </option>
        ))}
      </select>
    </label>
  );
}
