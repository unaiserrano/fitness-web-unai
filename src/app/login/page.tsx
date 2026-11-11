import type { Metadata } from 'next';
import { authConfigured } from '@/server/auth/session';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl font-extrabold tracking-tight">
          seguimiento<span className="text-brand">.</span>
        </p>
        <h1 className="mt-8 text-3xl font-extrabold">Hola de nuevo</h1>
        <p className="mt-2 text-muted">Entra para ver rutinas, notas y progreso.</p>
        {authConfigured() ? (
          <LoginForm next={next ?? '/'} />
        ) : (
          <p className="mt-6 rounded-2xl border border-warn/30 bg-warn-soft p-4 text-sm">
            Falta configurar la contraseña. Añade <code className="font-semibold">APP_PASSWORD</code> y <code className="font-semibold">AUTH_SECRET</code> en las
            variables de entorno de Vercel y vuelve a desplegar.
          </p>
        )}
      </div>
    </main>
  );
}
