'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/primitives';

export default function SectionError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-lg border-y border-ink/80 py-12">
      <p className="kicker">Algo ha fallado</p>
      <h1 className="mt-3 text-4xl leading-none">No he podido cargar esta pantalla</h1>
      <p className="mt-4 text-muted">
        Normalmente es la conexión con la base de datos y se arregla al reintentar. Tus datos no se han tocado.
      </p>
      <div className="mt-6 flex gap-2">
        <Button variant="primary" onClick={() => retry()}>
          Reintentar
        </Button>
        <ButtonLink href="/">Ir al inicio</ButtonLink>
      </div>
    </div>
  );
}
