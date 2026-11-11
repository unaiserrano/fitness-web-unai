'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { clearFailures, lockedForSeconds, recordFailure } from '../auth/rate-limit';
import { SESSION_COOKIE, SESSION_DAYS, authConfigured, createSessionToken, passwordMatches, secretConfigured } from '../auth/session';

export interface LoginState {
  error?: string;
}

const safeNext = (v: FormDataEntryValue | null): string => {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/';
};

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!authConfigured()) return { error: 'Falta configurar APP_PASSWORD en las variables de entorno.' };
  if (!secretConfigured()) return { error: 'Falta AUTH_SECRET (mínimo 32 caracteres) en las variables de entorno.' };
  const password = String(form.get('password') ?? '');
  const h = await headers();
  const key = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'local').trim();
  try {
    const wait = await lockedForSeconds(key);
    if (wait > 0) return { error: `Demasiados intentos. Espera ${Math.ceil(wait / 60)} min y vuelve a probar.` };
  } catch (e) {
    console.error('[login] límite de intentos no disponible', e);
  }
  // Pequeña espera para que probar contraseñas a lo bruto sea lento.
  await new Promise((r) => setTimeout(r, 400));
  if (!(await passwordMatches(password))) {
    await recordFailure(key).catch(() => {});
    return { error: 'Contraseña incorrecta.' };
  }
  await clearFailures(key).catch(() => {});
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
