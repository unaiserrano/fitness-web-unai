import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, authRequired, isValidSession } from '@/server/auth/session';

/** Todo pasa por aquí salvo la pantalla de entrada y los archivos estáticos. */
export async function proxy(request: NextRequest) {
  if (!authRequired()) return NextResponse.next();
  const ok = await isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== '/') url.searchParams.set('next', next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)'],
};
