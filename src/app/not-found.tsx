import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display text-6xl font-extrabold text-brand">404</p>
        <h1 className="mt-3 text-2xl font-extrabold">No encuentro esta página</h1>
        <p className="mt-2 text-muted">Puede que la persona o la semana ya no exista.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 font-semibold text-bg">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
