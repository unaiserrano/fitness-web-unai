import { redirect } from 'next/navigation';

export default async function AthleteIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/personas/${id}/progreso`);
}
