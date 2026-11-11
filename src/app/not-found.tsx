import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md border-y border-ink/80 py-10">
        <p className="kicker">Error 404</p>
        <h1 className="mt-3 text-5xl leading-none">Página sin entrenar</h1>
        <p className="mt-4 text-muted">No encuentro lo que buscas. Puede que la persona o la semana ya no exista.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-md bg-ink px-5 font-medium text-bg">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
