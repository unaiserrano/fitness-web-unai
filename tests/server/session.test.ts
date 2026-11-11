import { afterEach, describe, expect, it, vi } from 'vitest';
import { authConfigured, createSessionToken, isValidSession, passwordMatches, secretConfigured } from '@/server/auth/session';

afterEach(() => vi.unstubAllEnvs());

describe('sesión', () => {
  it('una sesión firmada con el secreto es válida y una manipulada no', async () => {
    vi.stubEnv('APP_PASSWORD', 'clave');
    vi.stubEnv('AUTH_SECRET', 'x'.repeat(40));
    const token = await createSessionToken();
    expect(await isValidSession(token)).toBe(true);
    expect(await isValidSession(token.slice(0, -2) + 'aa')).toBe(false);
    expect(await isValidSession(undefined)).toBe(false);
  });

  it('un token firmado con otro secreto se rechaza', async () => {
    vi.stubEnv('APP_PASSWORD', 'clave');
    vi.stubEnv('AUTH_SECRET', 'a'.repeat(40));
    const token = await createSessionToken();
    vi.stubEnv('AUTH_SECRET', 'b'.repeat(40));
    expect(await isValidSession(token)).toBe(false);
  });

  it('en producción exige un AUTH_SECRET largo', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', 'corto');
    expect(secretConfigured()).toBe(false);
    vi.stubEnv('AUTH_SECRET', 'x'.repeat(32));
    expect(secretConfigured()).toBe(true);
    vi.stubEnv('AUTH_SECRET', '');
    expect(secretConfigured()).toBe(false);
  });

  it('compara la contraseña correctamente', async () => {
    vi.stubEnv('APP_PASSWORD', 'clave-buena');
    expect(authConfigured()).toBe(true);
    expect(await passwordMatches('clave-buena')).toBe(true);
    expect(await passwordMatches('clave-mala')).toBe(false);
    expect(await passwordMatches('')).toBe(false);
  });
});
