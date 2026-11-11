'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';

const LINKS = [
  { href: '/', label: 'Personas', match: (p: string) => p === '/' || p.startsWith('/personas') },
  { href: '/biblioteca', label: 'Ejercicios', match: (p: string) => p.startsWith('/biblioteca') },
  { href: '/alimentos', label: 'Alimentos', match: (p: string) => p.startsWith('/alimentos') },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex min-w-0 items-center gap-4 overflow-x-auto sm:gap-6">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap border-b-2 py-[15px] text-sm font-medium transition-colors',
              active ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
