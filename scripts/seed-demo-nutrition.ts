/** Datos demo de alimentación e hitos (inventados), para scripts/seed-demo.ts. */
import type { Diet, Milestone } from '../src/domain';

/** nombre, marca, kcal, prot, hc, grasa (por 100 g/ml), gramos de 1 unidad */
export const FOODS: Array<[string, string, number, number, number, number, number | null]> = [
  ['Copos de avena', '', 372, 13.5, 58.7, 7, null],
  ['Leche semidesnatada', '', 46, 3.1, 4.7, 1.6, null],
  ['Plátano', '', 89, 1.1, 22.8, 0.3, 120],
  ['Huevo', '', 143, 12.6, 0.7, 9.5, 55],
  ['Pan integral', '', 247, 13, 41, 3.4, 35],
  ['Arroz', '', 354, 7, 79, 0.6, null],
  ['Pasta', '', 360, 12.5, 72, 1.5, null],
  ['Pechuga de pollo', '', 110, 23, 0, 1.6, null],
  ['Salmón', '', 208, 20, 0, 13, null],
  ['Patata', '', 77, 2, 17, 0.1, null],
  ['Aceite de oliva', '', 884, 0, 0, 100, null],
  ['Yogur griego natural', 'Hacendado', 97, 9, 4, 5, 125],
  ['Nueces', '', 654, 15, 14, 65, null],
  ['Verduras variadas', '', 30, 2, 5, 0.3, null],
];

export const LAURA_DIET: Diet = {
  title: 'Plan de alimentación',
  target: '2.100 kcal',
  intro: 'Elige una opción de cada bloque cada día.',
  meals: [
    {
      name: 'Desayuno',
      kcal: '450-500 kcal',
      options: [
        {
          title: 'Porridge',
          note: 'Cuece la avena con la leche 3 minutos.',
          items: [
            { food: 'Copos de avena', qty: '60 g' },
            { food: 'Leche semidesnatada', qty: '250 ml' },
            { food: 'Plátano', qty: '1 ud' },
          ],
        },
        {
          title: 'Tostadas con huevo',
          note: '',
          items: [
            { food: 'Pan integral', qty: '2 ud' },
            { food: 'Huevo', qty: '2 ud' },
            { food: 'Aceite de oliva', qty: '5 g' },
          ],
        },
      ],
    },
    {
      name: 'Comida',
      kcal: '700 kcal',
      options: [
        {
          title: 'Plato de pollo',
          note: 'Pesa el arroz y la pasta en crudo.',
          items: [
            { food: 'Elige base', qty: '', sub: true },
            { food: 'Arroz', qty: '80 g' },
            { food: 'Pasta', qty: '80 g', alt: true },
            { food: 'Patata', qty: '300 g', alt: true },
            { food: 'Y además', qty: '', sub: true },
            { food: 'Pechuga de pollo', qty: '150 g' },
            { food: 'Verduras variadas', qty: '200 g' },
            { food: 'Aceite de oliva', qty: '10 g' },
          ],
        },
        {
          title: 'Salmón con patata',
          note: '',
          items: [
            { food: 'Salmón', qty: '150 g' },
            { food: 'Patata', qty: '250 g' },
            { food: 'Verduras variadas', qty: '150 g' },
          ],
        },
      ],
    },
    {
      name: 'Merienda',
      kcal: '250 kcal',
      options: [
        {
          title: 'Yogur con nueces',
          note: '',
          items: [
            { food: 'Yogur griego natural', qty: '1 ud' },
            { food: 'Nueces', qty: '20 g' },
          ],
        },
      ],
    },
    {
      name: 'Cena',
      kcal: '550 kcal',
      options: [
        {
          title: 'Tortilla y pan',
          note: '',
          items: [
            { food: 'Huevo', qty: '3 ud' },
            { food: 'Pan integral', qty: '2 ud' },
            { food: 'Verduras variadas', qty: '200 g' },
          ],
        },
        {
          title: 'Pescado y arroz',
          note: '',
          items: [
            { food: 'Salmón', qty: '120 g' },
            { food: 'Arroz blanco', qty: '60 g' },
          ],
        },
      ],
    },
  ],
  tips: [
    { title: 'Agua', text: 'Al menos 2 litros al día, algo más los días de entreno.' },
    { title: 'Antes de entrenar', text: 'Come algo con hidratos 1-2 horas antes (plátano, tostada…).' },
    { title: 'Fines de semana', text: 'Una comida libre a la semana, sin agobios.' },
  ],
};

export const LAURA_MILESTONES: Milestone[] = [
  { id: 'demo-h1', week: 2, kind: 'hito', text: 'Primera sentadilla con 50 kg sin cajón' },
  { id: 'demo-h2', week: 3, kind: 'aviso', text: 'Tobillo algo hinchado: bajamos impacto esa semana' },
  { id: 'demo-h3', week: 5, kind: 'cambio', text: 'Cambiamos curl femoral tumbado por sentado' },
  { id: 'demo-h4', week: 6, kind: 'hito', text: 'Hip thrust con 95 kg' },
];
