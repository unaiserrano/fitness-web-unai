/**
 * Carga datos de prueba INVENTADOS para poder probar la app sin los datos reales.
 * Todo lo que crea lleva el prefijo "demo-" y se puede repetir sin duplicar.
 *
 * Uso:  npm run db:seed              (base de datos local .data/pglite, o la de DATABASE_URL)
 *       npm run db:seed -- --reset   (borra antes las personas demo-*)
 * Con DATABASE_URL (Neon) hay que añadir --yes para confirmar que quieres escribir ahí.
 */
import './env';
import { emptyNotes, defaultConfig, foodSlug, weekDates, slugify } from '../src/domain';
import type { Athlete, Day, Diet, Exercise, Food, LibraryExercise, Week, WorkSet } from '../src/domain';
import { FOODS, LAURA_DIET, LAURA_MILESTONES } from './seed-demo-nutrition';

const args = new Set(process.argv.slice(2));

/* ---------- Biblioteca ---------- */

const LIB: Array<[string, string, number, string]> = [
  ['Sentadilla trasera', 'Cuádriceps', 2.5, 'Baja controlando hasta romper el paralelo y sube empujando el suelo.'],
  ['Peso muerto rumano', 'Isquios', 2.5, 'Cadera atrás, espalda neutra, la barra roza los muslos.'],
  ['Hip thrust', 'Glúteo', 5, 'Pausa de un segundo arriba apretando glúteo.'],
  ['Prensa', 'Cuádriceps', 5, 'Pies a la anchura de la cadera, no despegues la zona lumbar.'],
  ['Curl femoral sentado', 'Isquios', 1.25, 'Baja en tres segundos.'],
  ['Elevación de gemelos de pie', 'Gemelos', 2.5, 'Rango completo con pausa abajo.'],
  ['Press banca', 'Pecho', 2.5, 'Escápulas juntas, la barra baja al esternón.'],
  ['Remo con barra', 'Espalda', 2.5, 'Torso a 45º, lleva la barra al ombligo.'],
  ['Press militar con mancuernas', 'Hombro', 1, 'Sin arquear la espalda.'],
  ['Jalón al pecho', 'Espalda', 2.5, 'Saca pecho y lleva los codos hacia los bolsillos.'],
  ['Curl de bíceps con mancuernas', 'Bíceps', 1, 'Sin balancear el cuerpo.'],
  ['Extensión de tríceps en polea', 'Tríceps', 1.25, 'Codos pegados al cuerpo.'],
];

const library: LibraryExercise[] = LIB.map(([name, muscleGroup, weightStep, execution]) => ({
  slug: slugify(name),
  name,
  muscleGroup,
  execution,
  videoUrl: '',
  weightStep,
  volumeSplit: null,
}));
const exec = (name: string) => library.find((l) => l.name === name)?.execution ?? '';

/* ---------- Generador de semanas ---------- */

const COMMENTS = [
  'Muy bien, la última serie costó.',
  'Me molestó un poco la rodilla en la bajada.',
  'Podría haber subido peso.',
  'Noté el glúteo como nunca.',
  'Algo de dolor lumbar al final, nada grave.',
];

/** Número pseudoaleatorio estable para que la demo salga siempre igual. */
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

interface Plan {
  name: string;
  reps: number;
  /** Peso de la semana 1. */
  kg: number;
  /** Lo que sube cada semana (0 = estancado a propósito). */
  inc: number;
  sets?: number;
}

const roundStep = (v: number, step: number) => Math.round(v / step) * step;

function exercise(p: Plan, week: number, done: boolean, deload: boolean): Exercise {
  const step = library.find((l) => l.name === p.name)?.weightStep ?? 2.5;
  const kg = roundStep((p.kg + p.inc * (week - 1)) * (deload ? 0.8 : 1), step);
  const rir = deload ? 4 : 2;
  const sets: WorkSet[] = Array.from({ length: p.sets ?? 3 }, (_, i) => {
    const target = { reps: String(p.reps), kg, kgText: '', rir: String(rir) };
    if (!done) return { n: i + 1, target, result: { raw: '', reps: null, repsText: '', kg: null, rir: null, status: 'empty' } };
    const reps = p.reps + Math.round(rand() * 2 - (i === 2 ? 1.2 : 0.5));
    const gotRir = Math.max(0, rir + Math.round(rand() * 2 - 1) - (i === 2 ? 1 : 0));
    return {
      n: i + 1,
      target,
      result: { raw: `${reps}x${kg} rir ${gotRir}`, reps, repsText: '', kg, rir: gotRir, status: 'done' },
    };
  });
  const note = done && rand() > 0.85 ? COMMENTS[Math.floor(rand() * COMMENTS.length)] : '';
  return { name: p.name, execution: exec(p.name), coachNote: '', videoUrl: '', athleteNotes: note, sets };
}

function day(name: string, block: string, plans: Plan[], week: number, done: boolean, deload: boolean): Day {
  return {
    day: name,
    block,
    warmup: [
      { name: 'Bici suave', dose: '5 min', videoUrl: '' },
      { name: 'Movilidad de cadera', dose: '2 x 10', videoUrl: '' },
    ],
    warmupNote: '',
    rehab: '',
    ankle: done && week === 3 && name === 'Lunes' ? 'Un poco hinchado el tobillo después de entrenar' : '',
    energy: done ? 3 + Math.round(rand() * 2) : null,
    satisfaction: done ? 3 + Math.round(rand() * 2) : null,
    notes: done && rand() > 0.6 ? 'Buenas sensaciones hoy.' : '',
    exercises: plans.map((p) => exercise(p, week, done, deload)),
  };
}

function week(a: Athlete, n: number, days: Array<[string, string, Plan[]]>, opts: { done: boolean; deload?: boolean; bodyWeight?: number }): Week {
  return {
    number: n,
    dates: weekDates(a.startDate, n),
    deload: !!opts.deload,
    intro: n === 1 ? 'Primera semana: buscamos técnica y pesos de referencia.' : '',
    rehabText: '',
    rehabDays: '',
    bodyWeight: opts.done ? (opts.bodyWeight ?? null) : null,
    notes: emptyNotes(),
    days: days.map(([d, b, plans]) => day(d, b, plans, n, opts.done, !!opts.deload)),
    savedAt: new Date().toISOString(),
    source: 'demo',
  };
}

/** Lunes de hace `weeksAgo` semanas, en YYYY-MM-DD. */
function mondayWeeksAgo(weeksAgo: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}

/* ---------- Personas demo ---------- */

const laura: Athlete = {
  id: 'demo-laura',
  name: 'Laura (demo)',
  subtitle: 'Hipertrofia, 3 días por semana',
  startDate: mondayWeeksAgo(6),
  targetSessions: 3,
  noteStyle: 'standard',
  flexibleDays: false,
  config: defaultConfig(),
};

const LAURA_DAYS: Array<[string, string, Plan[]]> = [
  ['Lunes', 'Pierna', [
    { name: 'Sentadilla trasera', reps: 8, kg: 50, inc: 2.5, sets: 4 },
    { name: 'Peso muerto rumano', reps: 10, kg: 40, inc: 2.5 },
    { name: 'Elevación de gemelos de pie', reps: 12, kg: 30, inc: 0 }, // estancado a propósito
  ]],
  ['Miércoles', 'Torso', [
    { name: 'Press banca', reps: 8, kg: 35, inc: 1.25, sets: 4 },
    { name: 'Remo con barra', reps: 10, kg: 35, inc: 2.5 },
    { name: 'Press militar con mancuernas', reps: 10, kg: 10, inc: 0.5 },
  ]],
  ['Viernes', 'Pierna', [
    { name: 'Hip thrust', reps: 10, kg: 70, inc: 5 },
    { name: 'Prensa', reps: 12, kg: 90, inc: 5 },
    { name: 'Curl femoral sentado', reps: 12, kg: 25, inc: 1.25 },
  ]],
];

const marco: Athlete = {
  id: 'demo-marco',
  name: 'Marco (demo)',
  subtitle: 'Torso / pierna, entrena los días que puede',
  startDate: mondayWeeksAgo(3),
  targetSessions: 2,
  noteStyle: 'simple',
  flexibleDays: true,
  config: { ...defaultConfig(), rehabZone: 'Hombro', rehab: [{ name: 'Rotación externa con goma', reps: '2 x 15', tempo: '', videoUrl: '' }] },
};

const MARCO_DAYS: Array<[string, string, Plan[]]> = [
  ['Martes', 'Torso', [
    { name: 'Jalón al pecho', reps: 10, kg: 55, inc: 2.5 },
    { name: 'Press banca', reps: 6, kg: 70, inc: 2.5, sets: 4 },
    { name: 'Curl de bíceps con mancuernas', reps: 12, kg: 12, inc: 0 },
    { name: 'Extensión de tríceps en polea', reps: 12, kg: 20, inc: 1.25 },
  ]],
  ['Jueves', 'Pierna', [
    { name: 'Sentadilla trasera', reps: 6, kg: 90, inc: 2.5, sets: 4 },
    { name: 'Peso muerto rumano', reps: 8, kg: 80, inc: 2.5 },
  ]],
];

/* ---------- Guardar ---------- */

async function main() {
  const url = process.env.DATABASE_URL;
  if (url && !args.has('--yes')) {
    const host = (() => { try { return new URL(url).host; } catch { return '(DATABASE_URL)'; } })();
    console.error(`Vas a cargar datos demo en ${host}. Repite con --yes para confirmarlo:\n  npm run db:seed -- --yes`);
    process.exit(1);
  }

  const { getDb } = await import('../src/server/db/client');
  const { saveAthlete, deleteAthlete, listAthletes } = await import('../src/server/repositories/athletes');
  const { saveWeek } = await import('../src/server/repositories/weeks');
  const { saveLibraryItems } = await import('../src/server/repositories/library');
  await getDb();

  if (args.has('--reset')) {
    for (const a of await listAthletes()) if (a.id.startsWith('demo-')) await deleteAthlete(a.id);
    console.log('· Personas demo borradas');
  }

  await saveLibraryItems(library);
  const { saveFood, saveDiet } = await import('../src/server/repositories/nutrition');
  const { listMilestones, addMilestone } = await import('../src/server/repositories/milestones');
  const foods: Food[] = FOODS.map(([name, brand, kcal, protein, carbs, fat, unitGrams], i) => ({
    slug: foodSlug(name, brand),
    name,
    brand,
    kcal,
    protein,
    carbs,
    fat,
    per: name.startsWith('Leche') ? 'ml' : 'g',
    unitGrams,
    aliases: name === 'Arroz' ? ['Arroz blanco'] : [],
    source: i % 3 === 0 ? 'Etiqueta' : 'Genérico',
  }));
  for (const f of foods) await saveFood(f);
  const order = (await listAthletes()).filter((a) => !a.id.startsWith('demo-')).length;

  // Laura: 6 semanas hechas sin descarga (salta el aviso de descarga) + la semana 7 por hacer.
  await saveAthlete(laura, order);
  for (let n = 1; n <= 6; n++) await saveWeek(laura.id, week(laura, n, LAURA_DAYS, { done: true, bodyWeight: 62 - n * 0.2 }));
  await saveWeek(laura.id, week(laura, 7, LAURA_DAYS, { done: false }));
  await saveDiet(laura.id, LAURA_DIET as Diet);
  if (!(await listMilestones(laura.id)).length) for (const m of LAURA_MILESTONES) await addMilestone(laura.id, m);

  // Marco: 3 semanas, la 3 de descarga, y la 4 por hacer.
  await saveAthlete(marco, order + 1);
  for (let n = 1; n <= 3; n++) await saveWeek(marco.id, week(marco, n, MARCO_DAYS, { done: true, deload: n === 3, bodyWeight: 81 }));
  await saveWeek(marco.id, week(marco, 4, MARCO_DAYS, { done: false }));

  console.log(`Datos demo listos: 2 personas (Laura, Marco), 11 semanas, ${library.length} ejercicios, ${foods.length} alimentos, una dieta y ${LAURA_MILESTONES.length} hitos.`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
