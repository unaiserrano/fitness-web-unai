import Link from 'next/link';
import type { ReactNode } from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { ThemeToggle } from '@/components/ui/theme';
import { authConfigured } from '@/server/auth/session';
import { logout } from '@/server/actions/auth';
import { LogOut } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 bg-band/95 text-band-ink shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-xl font-extrabold tracking-tight">
            <span aria-hidden className="grid size-8 place-items-center rounded-xl bg-brand text-sm text-brand-ink shadow-[0_6px_16px_-6px_var(--brand)]">
              S
            </span>
            <span className="hidden sm:inline">
              seguimiento<span className="text-brand">.</span>
            </span>
          </Link>
          <MainNav />
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            {authConfigured() ? (
              <form action={logout}>
                <button type="submit" className="grid size-9 place-items-center rounded-full text-band-ink/70 hover:bg-white/10 hover:text-band-ink" title="Salir">
                  <LogOut aria-hidden className="size-4" />
                  <span className="sr-only">Salir</span>
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </header>
      <main id="contenido" className="rise mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pb-8 text-xs text-muted sm:px-6">
        <span>Seguimiento de entrenamiento</span>
        <div className="sm:hidden">
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}
