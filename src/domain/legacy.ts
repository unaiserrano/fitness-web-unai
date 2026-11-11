/**
 * Conversión desde la app anterior (artifact "Seguimiento de Imad", campos en español)
 * al modelo nuevo. Solo lo usan el script de importación y los tests.
 */
import type {
  Athlete,
  AthleteConfig,
  Day,
  Exercise,
  LibraryExercise,
  SetResult,
  SetStatus,
  Week,
  WorkSet,
} from './types';
import { DEFAULT_MUSCLE_GROUPS, DEFAULT_REMEMBER } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

const str = (v: unknown): string => (v == null ? '' : String(v));
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const STATUS: Record<string, SetStatus> = { ok: 'done', igual: 'as-planned', vacío: 'empty', vacio: 'empty', error: 'error' };

export function legacySet(s: Any, i: number): WorkSet {
  const p = s?.pedido ?? {};
  const h = s?.hecho ?? {};
  const result: SetResult = {
    raw: str(h.texto),
    reps: numOrNull(h.reps),
    repsText: str(h.repsTxt),
    kg: numOrNull(h.kg),
    rir: numOrNull(h.rir),
    status: STATUS[str(h.estado)] ?? 'empty',
    ...(h.aviso ? { warning: str(h.aviso) } : {}),
  };
  const base = p._obj ? { reps: str(p._obj.reps), rir: str(p._obj.rir) } : undefined;
  return {
    n: numOrNull(s?.n) ?? i + 1,
    target: { reps: str(p.reps), kg: numOrNull(p.kg), kgText: str(p.kgTxt), rir: str(p.rir), ...(base ? { base } : {}) },
    result,
    ...(s?.ignorar ? { ignored: true } : {}),
  };
}

export function legacyExercise(e: Any): Exercise {
  return {
    name: str(e?.nombre),
    execution: str(e?.ejecucion),
    coachNote: str(e?.nota_coach),
    videoUrl: str(e?.video),
    athleteNotes: str(e?.notas),
    ...(e?.variante ? { variant: str(e.variante) } : {}),
    sets: (e?.series ?? []).map(legacySet),
  };
}

export function legacyDay(d: Any): Day {
  return {
    day: str(d?.dia),
    block: str(d?.bloque),
    warmup: (d?.calentamiento ?? []).map((x: Any) => ({ name: str(x?.nombre), dose: str(x?.dosis), videoUrl: str(x?.video) })),
    warmupNote: str(d?.cal_nota),
    rehab: str(d?.rehab),
    ankle: str(d?.tobillo),
    energy: numOrNull(d?.energia),
    satisfaction: numOrNull(d?.satis),
    notes: str(d?.obs),
    ...(d?.cuando ? { doneOn: str(d.cuando) } : {}),
    exercises: (d?.ejercicios ?? []).map(legacyExercise),
  };
}

export function legacyWeek(w: Any): Week {
  const a = w?.apuntes ?? {};
  return {
    number: Number(w?.semana),
    dates: str(w?.fechas),
    deload: !!w?.descarga,
    intro: str(w?.intro),
    rehabText: str(w?.rehab_texto),
    rehabDays: str(w?.rehab_dias),
    bodyWeight: numOrNull(w?.peso),
    notes: {
      good: (a.bien ?? []).map(str),
      bad: (a.fallado ?? []).map(str),
      mustNot: (a.no_fallar ?? []).map(str),
      remember: (a.recuerda ?? []).map(str),
    },
    days: (w?.dias ?? []).map(legacyDay),
    ...(w?.guardado ? { savedAt: str(w.guardado) } : {}),
    ...(w?.origen ? { source: str(w.origen) } : {}),
    ...(w?.marcas && typeof w.marcas === 'object' ? { marks: Object.fromEntries(Object.entries(w.marcas).map(([k, v]) => [k, !!v])) } : {}),
  };
}

export function legacyConfig(c: Any, fallbackZone = ''): AthleteConfig {
  return {
    rehab: (c?.rehab ?? []).map((r: Any) => ({ name: str(r?.nombre), reps: str(r?.reps), tempo: str(r?.tempo), videoUrl: str(r?.video) })),
    rehabZone: str(c?.rehab_zona) || fallbackZone,
    rehabText: str(c?.rehab_texto),
    remember: c?.recuerda?.length ? c.recuerda.map(str) : [...DEFAULT_REMEMBER],
    muscleGroups: c?.grupos?.length ? c.grupos.map(str) : [...DEFAULT_MUSCLE_GROUPS],
  };
}

export function legacyAthlete(id: string, a: Any, config: AthleteConfig): Athlete {
  return {
    id,
    name: str(a?.nombre) || id,
    subtitle: str(a?.sub),
    startDate: str(a?.inicio) || '2026-01-05',
    targetSessions: numOrNull(a?.obj_entrenos) ?? 4,
    noteStyle: a?.nota === 'simple' ? 'simple' : 'standard',
    flexibleDays: !!a?.libre,
    config,
  };
}

export function legacyLibraryItem(slug: string, l: Any): LibraryExercise {
  const split = l?.reparto && typeof l.reparto === 'object' ? (l.reparto as Record<string, number>) : null;
  return {
    slug,
    name: str(l?.nombre) || slug,
    muscleGroup: str(l?.grupo) || 'Otros',
    execution: str(l?.ejecucion),
    videoUrl: str(l?.video),
    weightStep: numOrNull(l?.salto) ?? 2.5,
    volumeSplit: split,
  };
}
