'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';

const LINKS = [
  { href: '/', label: 'Personas', match: (p: string) => p === '/' || p.startsWith('/personas') },
  { href: '/biblioteca', label: 'Biblioteca', match: (p: string) => p.startsWith('/biblioteca') },
  { href: '/alimentos', label: 'Alimentos', match: (p: string) => p.startsWith('/alimentos') },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="ml-1 flex min-w-0 items-center gap-0.5 overflow-x-auto sm:ml-6 sm:gap-1">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={cn('whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-semibold transition-colors sm:px-3 sm:text-sm', active ? 'bg-band-ink text-band' : 'text-band-ink/70 hover:text-band-ink')}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
