import type { Metadata } from 'next';
import { AthleteForm } from '@/components/athletes/athlete-form';
import { loadAthleteContext } from '@/server/services/athlete-data';

export const metadata: Metadata = { title: 'Ajustes' };

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { athlete } = await loadAthleteContext(id);
  return <AthleteForm key={JSON.stringify(athlete)} initial={athlete} />;
}
