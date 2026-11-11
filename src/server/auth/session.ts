/**
 * Acceso con una sola contraseña (APP_PASSWORD), pensada para un único usuario.
 * La sesión es una cookie firmada (JWT HS256 con AUTH_SECRET) que dura 30 días.
 * Este módulo no usa APIs de Node para poder usarse también desde proxy.ts.
 */
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'fw_session';
export const SESSION_DAYS = 30;

export const authConfigured = (): boolean => !!process.env.APP_PASSWORD;

/** En producción (Vercel) la contraseña es obligatoria; en local se puede trabajar sin ella. */
export const authRequired = (): boolean => authConfigured() || !!process.env.VERCEL;

const secret = () => {
  const s = process.env.AUTH_SECRET || process.env.APP_PASSWORD;
  if (!s) throw new Error('Falta AUTH_SECRET');
  return new TextEncoder().encode(s);
};

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token || !authConfigured()) return false;
  try {
    await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

/** Compara la contraseña sin filtrar su longitud por el tiempo de respuesta. */
export async function passwordMatches(input: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD ?? '';
  if (!expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(input)), crypto.subtle.digest('SHA-256', enc.encode(expected))]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
