'use client';

import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { type Diet, type DietItem, type Food, itemMacros, kcalLabel, macrosLabel, optionMacros, parseQty } from '@/domain/diet';
import { Button, Card, Field } from '@/components/ui/primitives';
import { ConfirmButton, ToastView, useToast } from '@/components/ui/feedback';
import { cn } from '@/components/ui/cn';
import { saveDietAction } from '@/server/actions/nutrition';

export function DietEditor({ athleteId, initial, foods, onClose }: { athleteId: string; initial: Diet; foods: Food[]; onClose: () => void }) {
  const router = useRouter();
  const [d, setD] = useState<Diet>(() => structuredClone(initial));
  const [pending, start] = useTransition();
  const { toast, show } = useToast();
  /** Cambia una copia y la pone en el estado. */
  const edit = (fn: (x: Diet) => void) =>
    setD((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const save = () =>
    start(async () => {
      const r = await saveDietAction(athleteId, d);
      show(r.message, r.ok ? 'ok' : 'bad');
      if (r.ok) {
        router.refresh();
        onClose();
      }
    });

  return (
    <div className="flex flex-col gap-6 pb-20">
      <ToastView toast={toast} />
      <datalist id="ali-names">
        {foods.map((f) => (
          <option key={f.slug} value={f.name} label={[f.brand, f.kcal != null ? `${f.kcal} kcal/100` : ''].filter(Boolean).join(' · ')} />
        ))}
      </datalist>
      <div>
        <h2 className="text-2xl font-extrabold">Editar la alimentación</h2>
        <p className="mt-1 max-w-3xl text-[15px] text-muted">
          Cambia comidas, opciones, alimentos y cantidades. Las calorías se recalculan solas con los datos de Alimentos. Si un alimento es alternativa al anterior (patata o batata), pulsa la «o» de su
          izquierda y se cuenta solo uno.
        </p>
      </div>

      <Card className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <Field label="Título">
          <input className="field" value={d.title} onChange={(e) => edit((x) => void (x.title = e.target.value))} />
        </Field>
        <Field label="Objetivo">
          <input className="field" placeholder="2.850 kcal" value={d.target} onChange={(e) => edit((x) => void (x.target = e.target.value))} />
        </Field>
        <Field label="Frase de arriba" className="sm:col-span-2">
          <input className="field" value={d.intro} onChange={(e) => edit((x) => void (x.intro = e.target.value))} />
        </Field>
      </Card>

      {d.meals.map((m, mi) => (
        <section key={mi} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink pb-2">
            <input className="field w-44 font-bold" aria-label="Nombre de la comida" value={m.name} onChange={(e) => edit((x) => void (x.meals[mi].name = e.target.value))} />
            <input className="field w-40" aria-label="Calorías objetivo de la comida" placeholder="550-600 kcal" value={m.kcal} onChange={(e) => edit((x) => void (x.meals[mi].kcal = e.target.value))} />
            <ConfirmButton className="ml-auto" confirmText="¿Quitar la comida?" onConfirm={() => edit((x) => void x.meals.splice(mi, 1))}>
              Quitar comida
            </ConfirmButton>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {m.options.map((o, oi) => {
              const r = optionMacros(o, foods);
              const move = (k: number) =>
                edit((x) => {
                  const arr = x.meals[mi].options;
                  const j = oi + k;
                  if (j < 0 || j >= arr.length) return;
                  [arr[oi], arr[j]] = [arr[j], arr[oi]];
                });
              const setItem = (ii: number, patch: Partial<DietItem>) => edit((x) => void Object.assign(x.meals[mi].options[oi].items[ii], patch));
              return (
                <Card key={oi} className="flex flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 font-display text-xl font-extrabold text-brand">{oi + 1}</span>
                    <input
                      className="field font-bold"
                      aria-label="Nombre de la opción"
                      placeholder="Nombre de la opción"
                      value={o.title}
                      onChange={(e) => edit((x) => void (x.meals[mi].options[oi].title = e.target.value))}
                    />
                    <Button size="sm" variant="ghost" aria-label="Subir" onClick={() => move(-1)}>
                      <ArrowUp aria-hidden className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="Bajar" onClick={() => move(1)}>
                      <ArrowDown aria-hidden className="size-4" />
                    </Button>
                    <ConfirmButton aria-label="Quitar opción" confirmText="¿Quitar?" onConfirm={() => edit((x) => void x.meals[mi].options.splice(oi, 1))}>
                      <X aria-hidden className="size-4" />
                    </ConfirmButton>
                  </div>
                  {o.items.map((it, ii) => {
                    const z = it.sub ? null : itemMacros(it, foods);
                    return (
                      <div key={ii} className="grid grid-cols-[28px_1fr_110px_64px_32px] items-center gap-1.5">
                        {ii > 0 ? (
                          <button
                            type="button"
                            aria-pressed={!!it.alt}
                            title="Alternativa al anterior (se elige uno)"
                            className={cn('size-7 rounded-full text-xs font-bold', it.alt ? 'bg-brand text-brand-ink' : 'border border-line text-muted hover:border-brand')}
                            onClick={() => setItem(ii, { alt: !it.alt })}
                          >
                            o
                          </button>
                        ) : (
                          <span />
                        )}
                        <input
                          className={cn('field field-sm', it.sub && 'font-bold uppercase text-brand')}
                          list={it.sub ? undefined : 'ali-names'}
                          aria-label={it.sub ? 'Subtítulo' : 'Alimento'}
                          placeholder={it.sub ? 'Subtítulo (ej.: Elige base)' : 'Alimento'}
                          value={it.food}
                          onChange={(e) => setItem(ii, { food: e.target.value })}
                        />
                        {it.sub ? (
                          <span className="text-xs text-muted">subtítulo</span>
                        ) : (
                          <input className="field field-sm" aria-label="Cantidad" placeholder="120 g" value={it.qty} onChange={(e) => setItem(ii, { qty: e.target.value })} />
                        )}
                        <span
                          className={cn('tnum text-right text-xs font-semibold', z?.missing.length ? 'text-warn' : 'text-muted')}
                          title={z?.missing.length ? `Sin datos en Alimentos: ${z.missing.join(', ')}` : undefined}
                        >
                          {z ? (z.missing.length ? '?' : parseQty(it.qty).length ? `${Math.round(z.kcal)} kcal` : '—') : ''}
                        </span>
                        <Button size="sm" variant="danger" className="px-0" aria-label="Quitar" onClick={() => edit((x) => void x.meals[mi].options[oi].items.splice(ii, 1))}>
                          <X aria-hidden className="size-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                  {r.hi.kcal > 0 ? (
                    <p className="rounded-xl bg-surface-2 px-3 py-1.5 text-sm">
                      <b>≈ {kcalLabel(r)}</b> <span className="text-xs text-muted">{macrosLabel(r)}</span>
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => edit((x) => void x.meals[mi].options[oi].items.push({ food: '', qty: '' }))}>
                      <Plus aria-hidden className="size-4" /> Alimento
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => edit((x) => void x.meals[mi].options[oi].items.push({ food: '', qty: '', sub: true }))}>
                      <Plus aria-hidden className="size-4" /> Subtítulo
                    </Button>
                  </div>
                  <textarea
                    className="field field-sm"
                    rows={2}
                    placeholder="Cómo prepararlo (opcional)"
                    value={o.note}
                    onChange={(e) => edit((x) => void (x.meals[mi].options[oi].note = e.target.value))}
                  />
                </Card>
              );
            })}
          </div>
          <div>
            <Button onClick={() => edit((x) => void x.meals[mi].options.push({ title: '', items: [{ food: '', qty: '' }], note: '' }))}>
              <Plus aria-hidden className="size-4" /> Opción de {m.name || 'comida'}
            </Button>
          </div>
        </section>
      ))}

      <div>
        <Button onClick={() => edit((x) => void x.meals.push({ name: 'Nueva comida', kcal: '', options: [] }))}>
          <Plus aria-hidden className="size-4" /> Añadir comida
        </Button>
      </div>

      <Card className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">Consejos</h3>
        {d.tips.map((k, ki) => (
          <div key={ki} className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input className="field font-semibold" placeholder="Título" value={k.title} onChange={(e) => edit((x) => void (x.tips[ki].title = e.target.value))} />
              <Button variant="danger" aria-label="Quitar consejo" onClick={() => edit((x) => void x.tips.splice(ki, 1))}>
                <X aria-hidden className="size-4" />
              </Button>
            </div>
            <textarea className="field" rows={3} value={k.text} onChange={(e) => edit((x) => void (x.tips[ki].text = e.target.value))} />
          </div>
        ))}
        <div>
          <Button size="sm" variant="ghost" onClick={() => edit((x) => void x.tips.push({ title: '', text: '' }))}>
            <Plus aria-hidden className="size-4" /> Consejo
          </Button>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-line bg-surface/95 backdrop-blur-md sm:bottom-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-sm font-semibold text-warn">Editando</span>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancelar</Button>
            <Button variant="primary" disabled={pending} onClick={save}>
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
