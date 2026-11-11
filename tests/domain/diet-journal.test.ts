import { describe, expect, it } from 'vitest';
import { type Food, optionMacros, parseQty, toDiet, weekComments, weekRecords } from '@/domain';
import type { Week } from '@/domain';
import { emptyNotes } from '@/domain/types';

const food = (name: string, kcal: number, unitGrams: number | null = null): Food => ({
  slug: name,
  name,
  brand: '',
  kcal,
  protein: 10,
  carbs: 10,
  fat: 1,
  per: 'g',
  unitGrams,
  aliases: [],
  source: 'Genérico',
});
const foods = [food('Arroz', 350), food('Patata', 80), food('Pollo', 110), food('Huevo', 140, 50)];

describe('alimentación', () => {
  it('lee cantidades', () => {
    expect(parseQty('120 g')).toEqual([{ q: 120, unit: 'g', name: null }]);
    expect(parseQty('100-120 g')[0].q).toBe(110);
    expect(parseQty('2 ud')[0]).toMatchObject({ q: 2, unit: 'ud' });
    expect(parseQty('0,5 kg')[0]).toMatchObject({ q: 500, unit: 'g' });
  });

  it('cuenta las alternativas como rango y las unidades con su peso', () => {
    const r = optionMacros(
      {
        title: '',
        note: '',
        items: [
          { food: 'Arroz', qty: '100 g' },
          { food: 'Patata', qty: '100 g', alt: true },
          { food: 'Pollo', qty: '100 g' },
          { food: 'Huevo', qty: '2 ud' },
          { food: 'Desconocido', qty: '10 g' },
        ],
      },
      foods,
    );
    expect(Math.round(r.lo.kcal)).toBe(80 + 110 + 140);
    expect(Math.round(r.hi.kcal)).toBe(350 + 110 + 140);
    expect(r.missing).toEqual(['Desconocido']);
  });

  it('convierte la dieta de la app anterior', () => {
    const d = toDiet({ titulo: 'X', objetivo: '2000', comidas: [{ nombre: 'Cena', kcal: '', opciones: [{ titulo: 'A', items: [{ a: 'Arroz', c: '80 g', alt: true }] }] }], consejos: [] });
    expect(d.meals[0].options[0].items[0]).toEqual({ food: 'Arroz', qty: '80 g', alt: true });
  });
});

const wk = (n: number, kg: number, reps: number, notes = ''): Week => ({
  number: n,
  dates: '',
  deload: false,
  intro: '',
  rehabText: '',
  rehabDays: '',
  bodyWeight: null,
  notes: emptyNotes(),
  days: [
    {
      day: 'Lunes',
      block: 'Pierna',
      warmup: [],
      warmupNote: '',
      rehab: '',
      ankle: '',
      energy: null,
      satisfaction: null,
      notes,
      exercises: [
        {
          name: 'Sentadilla',
          execution: '',
          coachNote: '',
          videoUrl: '',
          athleteNotes: '',
          sets: [{ n: 1, target: { reps: '8', kg, kgText: '', rir: '2' }, result: { raw: '', reps, repsText: '', kg, rir: 2, status: 'done' } }],
        },
      ],
    },
  ],
});

describe('diario', () => {
  it('detecta récords de peso y de repeticiones', () => {
    const ws = [wk(1, 50, 8), wk(2, 55, 8), wk(3, 55, 9), wk(4, 55, 6)];
    expect(weekRecords(ws, ws[0], false)).toEqual([]);
    expect(weekRecords(ws, ws[1], false)[0]).toContain('55 kg × 8');
    expect(weekRecords(ws, ws[2], false)[0]).toContain('(antes × 8)');
    expect(weekRecords(ws, ws[3], false)).toEqual([]);
  });

  it('marca solos los comentarios de dolor y respeta las marcas a mano', () => {
    const w = wk(1, 50, 8, 'Me dolía la rodilla');
    expect(weekComments(w, false)[0].important).toBe(true);
    expect(weekComments({ ...w, marks: { 'Lunes|obs': false } }, false)[0].important).toBe(false);
  });
});
