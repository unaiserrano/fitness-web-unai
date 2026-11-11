'use client';

import { Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import type { Food } from '@/domain/diet';
import { formatNum } from '@/domain/numbers';
import { normalize } from '@/domain/text';
import { Button, Card } from '@/components/ui/primitives';
import { ToastView, useToast } from '@/components/ui/feedback';
import { cn } from '@/components/ui/cn';
import { deleteFoodAction, saveFoodAction } from '@/server/actions/nutrition';

type Draft = Omit<Food, 'slug'>;
const blank = (): Draft => ({ name: '', brand: '', kcal: null, protein: null, carbs: null, fat: null, per: 'g', unitGrams: null, aliases: [], source: 'Etiqueta' });
const pf = (v: string): number | null => {
  const x = parseFloat(v.replace(',', '.'));
  return Number.isFinite(x) ? x : null;
};
const COLS = 'grid-cols-[minmax(150px,1.6fr)_minmax(90px,1fr)_repeat(4,64px)_76px_64px_minmax(120px,1.2fr)_100px_36px]';

export function FoodsManager({ foods, uses }: { foods: Food[]; uses: Record<string, string> }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [nw, setNw] = useState<Draft>(blank);
  const [pending, start] = useTransition();
  const { toast, show } = useToast();
  const list = useMemo(() => {
    const k = normalize(q);
    return foods.filter((f) => !k || normalize(`${f.name} ${f.brand} ${f.aliases.join(' ')}`).includes(k));
  }, [foods, q]);
  const labelled = foods.filter((f) => f.source === 'Etiqueta').length;

  const save = (slug: string | null, d: Draft, after?: () => void) =>
    start(async () => {
      const r = await saveFoodAction(slug, d);
      show(r.message, r.ok ? 'ok' : 'bad');
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  return (
    <div className="flex flex-col gap-5">
      <ToastView toast={toast} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Alimentos" value={foods.length} />
        <Tile label="Con etiqueta" value={labelled} />
        <Tile label="Valores genéricos" value={foods.length - labelled} />
      </div>

      <Card>
        <h2 className="text-lg font-bold">Añadir alimento</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Copia los valores «por 100 g» de la etiqueta. «g / ud» es lo que pesa 1 unidad (1 huevo, 1 lata…), solo si en la dieta lo pones por unidades.</p>
        <form
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[2fr_1.2fr_repeat(4,1fr)_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            save(null, nw, () => setNw(blank()));
          }}
        >
          <input className="field col-span-2 sm:col-span-2 lg:col-span-1" placeholder="Alimento" aria-label="Alimento nuevo" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} />
          <input className="field" placeholder="Marca" aria-label="Marca" value={nw.brand} onChange={(e) => setNw({ ...nw, brand: e.target.value })} />
          {(
            [
              ['kcal', 'kcal'],
              ['protein', 'Prot'],
              ['carbs', 'HC'],
              ['fat', 'Grasa'],
            ] as const
          ).map(([k, l]) => (
            <input key={k} className="field" inputMode="decimal" placeholder={l} aria-label={l} value={nw[k] ?? ''} onChange={(e) => setNw({ ...nw, [k]: pf(e.target.value) })} />
          ))}
          <select className="field" aria-label="Por 100" value={nw.per} onChange={(e) => setNw({ ...nw, per: e.target.value as 'g' | 'ml' })}>
            <option value="g">100 g</option>
            <option value="ml">100 ml</option>
          </select>
          <input className="field" inputMode="decimal" placeholder="g / ud" aria-label="Gramos de 1 unidad" value={nw.unitGrams ?? ''} onChange={(e) => setNw({ ...nw, unitGrams: pf(e.target.value) })} />
          <Button type="submit" variant="primary" disabled={pending || !nw.name.trim()}>
            <Plus aria-hidden className="size-4" /> Añadir
          </Button>
        </form>
      </Card>

      <Card className="p-0 sm:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <h2 className="text-lg font-bold">Registro ({foods.length})</h2>
          <label className="relative w-full max-w-xs">
            <span className="sr-only">Buscar alimento</span>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input className="field pl-10" type="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[1000px] px-5">
            <div className={cn('grid gap-2 border-b border-line pb-2 text-xs font-bold uppercase tracking-wider text-muted', COLS)}>
              {['Alimento', 'Marca', 'kcal', 'Prot', 'HC', 'Grasa', 'Por', 'g / ud', 'Otros nombres', 'Datos', ''].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
            {list.map((f) => (
              <FoodRow key={f.slug + JSON.stringify(f)} food={f} uses={uses[f.slug] ?? ''} onSave={(d) => save(f.slug, d)} onDeleted={(m) => (show(m), router.refresh())} />
            ))}
            {!list.length ? <p className="py-6 text-sm text-muted">{foods.length ? 'No hay ninguno con ese nombre.' : 'Todavía no hay alimentos.'}</p> : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

function FoodRow({ food, uses, onSave, onDeleted }: { food: Food; uses: string; onSave: (d: Draft) => void; onDeleted: (msg: string) => void }) {
  const { slug: _slug, ...rest } = food;
  const [d] = useState<Draft>(rest);
  const [armed, setArmed] = useState(false);
  const upd = (patch: Partial<Draft>) => onSave({ ...d, ...patch });
  const num = (k: 'kcal' | 'protein' | 'carbs' | 'fat' | 'unitGrams', label: string) => (
    <input
      className="field field-sm tnum"
      inputMode="decimal"
      aria-label={`${label} de ${food.name}`}
      defaultValue={d[k] != null ? formatNum(d[k]) : ''}
      onBlur={(e) => {
        const v = pf(e.target.value);
        if (v !== d[k]) upd({ [k]: v });
      }}
    />
  );
  return (
    <div className={cn('grid items-center gap-2 border-b border-line/60 py-2', COLS)}>
      <div className="min-w-0">
        <p className="truncate font-semibold">{food.name}</p>
        <p className="truncate text-xs text-muted">{uses ? `En la dieta: ${uses}` : 'No está en la dieta'}</p>
      </div>
      <input className="field field-sm" aria-label={`Marca de ${food.name}`} defaultValue={d.brand} onBlur={(e) => e.target.value.trim() !== d.brand && upd({ brand: e.target.value.trim() })} />
      {num('kcal', 'kcal')}
      {num('protein', 'Proteína')}
      {num('carbs', 'Hidratos')}
      {num('fat', 'Grasa')}
      <select className="field field-sm" aria-label={`Por 100 de ${food.name}`} defaultValue={d.per} onChange={(e) => upd({ per: e.target.value as 'g' | 'ml' })}>
        <option value="g">100 g</option>
        <option value="ml">100 ml</option>
      </select>
      {num('unitGrams', 'Gramos de 1 unidad')}
      <input
        className="field field-sm"
        aria-label={`Otros nombres de ${food.name}`}
        placeholder="Otros nombres"
        defaultValue={d.aliases.join(', ')}
        onBlur={(e) => {
          const a = e.target.value.split(',').map((x) => x.trim()).filter(Boolean);
          if (a.join('|') !== d.aliases.join('|')) upd({ aliases: a });
        }}
      />
      <select
        className={cn('field field-sm font-semibold', d.source === 'Etiqueta' ? 'text-ok' : 'text-muted')}
        aria-label={`De dónde salen los datos de ${food.name}`}
        defaultValue={d.source}
        onChange={(e) => upd({ source: e.target.value as Draft['source'] })}
      >
        <option>Genérico</option>
        <option>Etiqueta</option>
      </select>
      <button
        type="button"
        className={cn('grid h-8 place-items-center rounded-md text-xs font-semibold', armed ? 'bg-bad text-white' : 'text-muted hover:bg-bad-soft hover:text-bad')}
        aria-label={armed ? `Pulsa otra vez para borrar ${food.name}` : `Borrar ${food.name}`}
        onClick={async () => {
          if (!armed) {
            setArmed(true);
            setTimeout(() => setArmed(false), 4000);
            return;
          }
          const r = await deleteFoodAction(food.slug);
          onDeleted(r.message);
        }}
      >
        {armed ? '¿Sí?' : <X aria-hidden className="size-4" />}
      </button>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <p className="kicker">{label}</p>
      <p className="figure mt-2 text-4xl">{value}</p>
    </div>
  );
}

