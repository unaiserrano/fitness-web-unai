'use client';

import { BarChart3, BookOpenText, ClipboardList, Dumbbell, MessageSquareText, Salad, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/components/ui/cn';

const TABS = [
  { seg: 'progreso', label: 'Progreso', Icon: BarChart3 },
  { seg: 'volumen', label: 'Volumen', Icon: Dumbbell },
  { seg: 'rutina', label: 'Rutina', Icon: ClipboardList },
  { seg: 'nota', label: 'Nota', Icon: MessageSquareText },
  { seg: 'diario', label: 'Diario', Icon: BookOpenText },
  { seg: 'dieta', label: 'Comida', Icon: Salad },
  { seg: 'ajustes', label: 'Ajustes', Icon: Settings2 },
] as const;

/** Pestañas de una persona: arriba en escritorio, barra fija abajo en el móvil. */
export function AthleteTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const current = TABS.find((t) => pathname.startsWith(`/personas/${id}/${t.seg}`))?.seg ?? 'progreso';
  return (
    <>
      <nav aria-label="Secciones" className="mb-8 hidden sm:block">
        <ul className="flex flex-wrap gap-1.5 rounded-full border border-line bg-surface p-1.5 shadow-sm">
          {TABS.map((t) => (
            <li key={t.seg}>
              <Link
                href={`/personas/${id}/${t.seg}`}
                aria-current={current === t.seg ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-semibold transition-all',
                  current === t.seg ? 'bg-brand text-brand-ink shadow-[0_6px_18px_-8px_var(--brand)]' : 'text-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                <t.Icon aria-hidden className="size-4" />
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <ul className="grid grid-cols-7">
          {TABS.map((t) => (
            <li key={t.seg}>
              <Link
                href={`/personas/${id}/${t.seg}`}
                aria-current={current === t.seg ? 'page' : undefined}
                className={cn('flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold', current === t.seg ? 'text-brand' : 'text-muted')}
              >
                <t.Icon aria-hidden className="size-5" />
                {t.label}
              </Link>
            </li>
          ))}
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
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="sr-only">Cambiar de persona</span>
      <select
        className="field field-sm w-auto rounded-full pr-8 font-semibold"
        value={id}
        onChange={(e) => router.push(pathname.replace(`/personas/${id}`, `/personas/${e.target.value}`).replace(/\?.*$/, ''))}
      >
        {athletes.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </label>
  );
}
