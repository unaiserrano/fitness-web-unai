import { cookies } from 'next/headers';
import { SESSION_COOKIE, authRequired, isValidSession } from './session';

/** Segunda comprobación dentro de cada acción del servidor (además de proxy.ts). */
export async function assertAuthorized(): Promise<void> {
  if (!authRequired()) return;
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error('No autorizado');
}
