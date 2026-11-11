import type { Metadata } from 'next';
import { foodUses } from '@/domain/diet';
import { FoodsManager } from '@/components/nutrition/foods-manager';
import { PageTitle } from '@/components/ui/primitives';
import { listAthletes } from '@/server/repositories/athletes';
import { getDiet, listFoods } from '@/server/repositories/nutrition';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Alimentos' };

export default async function FoodsPage() {
  const [foods, athletes] = await Promise.all([listFoods(), listAthletes()]);
  const diets = (await Promise.all(athletes.map(async (a) => ({ a, d: await getDiet(a.id) })))).filter((x) => x.d);
  const uses: Record<string, string> = {};
  for (const f of foods) {
    const parts = diets.map(({ a, d }) => {
      const u = foodUses(d, f);
      return u ? (diets.length > 1 ? `${a.name} (${u})` : u) : '';
    });
    uses[f.slug] = parts.filter(Boolean).join(' · ');
  }
  return (
    <>
      <PageTitle
        title="Alimentos"
        subtitle="Valores por 100 g (o 100 ml), por marca. Con esto se calculan solas las calorías de cada opción de las dietas. Arroz, pasta, patata, carne y pescado van en crudo. Sirve para todas las personas."
      />
      <FoodsManager foods={foods} uses={uses} />
    </>
  );
}
