import type { Metadata } from 'next';
import { DEFAULT_MUSCLE_GROUPS } from '@/domain/types';
import { LibraryManager } from '@/components/library/library-manager';
import { PageTitle } from '@/components/ui/primitives';
import { listLibrary } from '@/server/repositories/library';

/** Siempre con datos al día (nunca se genera en el build). */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Biblioteca' };

export default async function LibraryPage() {
  const items = await listLibrary();
  return (
    <>
      <PageTitle
        title="Biblioteca de ejercicios"
        subtitle="Compartida por todas las personas. Al escribir un ejercicio en una rutina se rellenan solos su vídeo, ejecución, grupo muscular y salto de peso."
      />
      <LibraryManager items={items} groups={[...DEFAULT_MUSCLE_GROUPS]} />
    </>
  );
}
