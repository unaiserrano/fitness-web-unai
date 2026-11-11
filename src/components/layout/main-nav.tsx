'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';

const LINKS = [
  { href: '/', label: 'Personas', match: (p: string) => p === '/' || p.startsWith('/personas') },
  { href: '/biblioteca', label: 'Biblioteca', match: (p: string) => p.startsWith('/biblioteca') },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="ml-2 flex items-center gap-1 sm:ml-6">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={cn('rounded-full px-3 py-1.5 text-sm font-semibold transition-colors', active ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink')}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
