'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, SESSION_DAYS, authConfigured, createSessionToken, passwordMatches } from '../auth/session';

export interface LoginState {
  error?: string;
}

const safeNext = (v: FormDataEntryValue | null): string => {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/';
};

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!authConfigured()) return { error: 'Falta configurar APP_PASSWORD en las variables de entorno.' };
  const password = String(form.get('password') ?? '');
  // Pequeña espera para que probar contraseñas a lo bruto sea lento.
  await new Promise((r) => setTimeout(r, 400));
  if (!(await passwordMatches(password))) return { error: 'Contraseña incorrecta.' };
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  redirect(safeNext(form.get('next')));
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/login');
}
