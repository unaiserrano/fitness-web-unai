import type { Metadata } from 'next';
import { DietView } from '@/components/nutrition/diet-view';
import { getDiet, listFoods } from '@/server/repositories/nutrition';
import { loadAthleteContext } from '@/server/services/athlete-data';

export const metadata: Metadata = { title: 'Alimentación' };

export default async function DietPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ athlete }, diet, foods] = await Promise.all([loadAthleteContext(id), getDiet(id), listFoods()]);
  return <DietView athleteId={id} athleteName={athlete.name} diet={diet} foods={foods} />;
}
