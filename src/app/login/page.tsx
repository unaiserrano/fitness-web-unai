import type { Metadata } from 'next';
import { authConfigured } from '@/server/auth/session';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="font-display text-3xl font-semibold italic leading-none">
          cuaderno<span className="text-brand">.</span>
        </p>
        <div className="mt-10 border-t border-ink/80 pt-8">
          <p className="kicker">Acceso privado</p>
          <h1 className="mt-3 text-4xl leading-none">Hola de nuevo</h1>
          <p className="mt-3 text-muted">Entra para ver rutinas, notas y progreso.</p>
          {authConfigured() ? (
            <LoginForm next={next ?? '/'} />
          ) : (
            <p className="mt-6 rounded-md border-l-4 border-warn bg-warn-soft p-4 text-sm">
              Falta configurar la contraseña. Añade <code className="font-semibold">APP_PASSWORD</code> y <code className="font-semibold">AUTH_SECRET</code> en las
              variables de entorno y vuelve a desplegar.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
