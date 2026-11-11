'use client';

import { Flame, Pencil, Printer, Salad } from 'lucide-react';
import { useState } from 'react';
import { type Diet, type Food, emptyDiet, kcalLabel, macrosLabel, mealRangeLabel, optionMacros } from '@/domain/diet';
import { slugify } from '@/domain/text';
import { Button, Card, EmptyState } from '@/components/ui/primitives';
import { DietEditor } from './diet-editor';

const MEAL_COLORS = ['from-brand/20', 'from-lime/50', 'from-info/20', 'from-warn/20', 'from-ok/20', 'from-bad/15'];

export function DietView({ athleteId, athleteName, diet, foods }: { athleteId: string; athleteName: string; diet: Diet | null; foods: Food[] }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <DietEditor athleteId={athleteId} initial={diet ?? emptyDiet()} foods={foods} onClose={() => setEditing(false)} />;
  if (!diet) {
    return (
      <EmptyState
        title={`Todavía no hay dieta de ${athleteName}`}
        action={
          <Button variant="primary" onClick={() => setEditing(true)}>
            <Salad aria-hidden className="size-4" /> Crear dieta
          </Button>
        }
      >
        Monta sus comidas con varias opciones. Las calorías y macros se calculan solas con el registro de Alimentos.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold">{diet.title || 'Alimentación'}</h2>
          <p className="mt-1 max-w-2xl text-[15px] text-muted">
            {diet.intro}
            {diet.target ? (
              <>
                {' '}
                Objetivo aproximado: <strong className="text-ink">{diet.target}</strong>.
              </>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={() => window.print()}>
            <Printer aria-hidden className="size-4" /> Imprimir / PDF
          </Button>
          <Button variant="primary" onClick={() => setEditing(true)}>
            <Pencil aria-hidden className="size-4" /> Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {diet.meals.map((m, i) => (
          <a
            key={m.name + i}
            href={`#com-${slugify(m.name)}`}
            className={`group rounded-[var(--radius-card)] border border-line bg-gradient-to-br ${MEAL_COLORS[i % MEAL_COLORS.length]} to-surface p-4 transition-transform hover:-translate-y-0.5`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{m.name}</p>
            <p className="tnum mt-1 font-display text-2xl font-extrabold">{m.kcal || '—'}</p>
            <p className="text-xs text-muted">{m.options.length} opciones</p>
          </a>
        ))}
      </div>

      {diet.meals.map((m, mi) => (
        <section key={m.name + mi} id={`com-${slugify(m.name)}`} className="flex scroll-mt-24 flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-ink pb-2">
            <h3 className="text-xl font-extrabold">{m.name}</h3>
            <span className="text-sm text-muted">{[m.kcal ? `objetivo ${m.kcal}` : '', mealRangeLabel(m, foods)].filter(Boolean).join(' · ')}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {m.options.map((o, oi) => {
              const r = optionMacros(o, foods);
              return (
                <Card key={oi} className="flex flex-col gap-3 p-5 break-inside-avoid">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-2xl font-extrabold text-brand">{oi + 1}</span>
                    <h4 className="font-display text-base font-bold">{o.title || 'Opción'}</h4>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {o.items.map((it, ii) =>
                        it.sub ? (
                          <tr key={ii}>
                            <th colSpan={2} className="pt-2 text-left text-[11px] font-bold uppercase tracking-wider text-brand">
                              {it.alt ? 'o bien · ' : ''}
                              {it.food}
                            </th>
                          </tr>
                        ) : (
                          <tr key={ii} className="border-b border-line/60 last:border-0">
                            <td className="py-1">
                              {it.alt ? <span className="mr-1 text-xs font-bold text-muted">o</span> : null}
                              {it.food}
                            </td>
                            <td className="tnum py-1 text-right font-semibold whitespace-nowrap">{it.qty}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                  {r.hi.kcal > 0 ? (
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                      <span className="inline-flex items-center gap-1 font-bold">
                        <Flame aria-hidden className="size-4 text-brand" />≈ {kcalLabel(r)}
                      </span>
                      <span className="text-xs text-muted">{macrosLabel(r)}</span>
                    </div>
                  ) : null}
                  {r.missing.length ? <p className="text-xs text-warn">Sin datos en Alimentos: {r.missing.join(', ')}</p> : null}
                  {o.note ? <p className="text-sm text-muted">{o.note}</p> : null}
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {diet.tips.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {diet.tips.map((k, i) => (
            <div key={i} className="rounded-[var(--radius-card)] border border-brand/25 bg-brand-soft p-4">
              <p className="font-bold">{k.title}</p>
              <p className="mt-1 text-sm">{k.text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
