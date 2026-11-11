import type { Metadata } from 'next';
import { defaultConfig } from '@/domain/types';
import { AthleteForm } from '@/components/athletes/athlete-form';
import { PageTitle } from '@/components/ui/primitives';

/** Siempre con datos al día (nunca se genera en el build). */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Nueva persona' };

/** Lunes de la semana que viene, como fecha de inicio por defecto. */
const nextMonday = () => {
  const d = new Date();
  const add = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0, 10);
};

export default function NewAthletePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Nueva persona" subtitle="Después podrás montar su rutina semana a semana." />
      <AthleteForm
        isNew
        initial={{ id: 'nueva', name: '', subtitle: '', startDate: nextMonday(), targetSessions: 3, noteStyle: 'standard', flexibleDays: false, config: defaultConfig() }}
      />
    </div>
  );
}
