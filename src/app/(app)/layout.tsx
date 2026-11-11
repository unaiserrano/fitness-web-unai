import { DatabaseBackup, LogOut } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { ThemeToggle } from '@/components/ui/theme';
import { logout } from '@/server/actions/auth';
import { authConfigured } from '@/server/auth/session';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-ink/80 bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="font-display text-2xl font-semibold italic leading-none tracking-tight">
            cuaderno<span className="text-brand">.</span>
          </Link>
          <MainNav />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <a href="/api/backup" className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink" title="Descargar copia de seguridad">
              <DatabaseBackup aria-hidden className="size-4" />
              <span className="sr-only">Descargar copia de seguridad</span>
            </a>
            {authConfigured() ? (
              <form action={logout}>
                <button type="submit" className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink" title="Salir">
                  <LogOut aria-hidden className="size-4" />
                  <span className="sr-only">Salir</span>
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </header>
      <main id="contenido" className="rise mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
        {children}
      </main>
    </div>
  );
}
