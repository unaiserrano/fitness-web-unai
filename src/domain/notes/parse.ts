import { canonicalDay } from '../calendar';
import { formatNum, numOf, rangeOf, rirNum } from '../numbers';
import type { Day, SetResult, SetTarget, WorkSet } from '../types';
import { emptyDay } from '../week';

/** Serie leída de una nota. `fromPlan` = el objetivo hay que copiarlo de la rutina (nota sencilla). */
export interface ParsedSet extends WorkSet {
  fromPlan?: boolean;
}
export interface ParsedExercise {
  name: string;
  athleteNotes: string;
  sets: ParsedSet[];
}
export interface ParsedDay extends Omit<Day, 'exercises'> {
  exercises: ParsedExercise[];
}
export interface ParsedNote {
  week: number | null;
  rehabDays: string;
  bodyWeight: number | null;
  days: ParsedDay[];
  warnings: string[];
}

const emptyTarget = (): SetTarget => ({ reps: '', kg: null, kgText: '', rir: '' });
const emptyRes = (raw: string): SetResult => ({ raw, reps: null, repsText: '', kg: null, rir: null, status: 'empty' });
const DONE_WORDS = /^(ok|okay|si|sí|hecho|bien|igual|x|✓|✔)$/i;

/** Formato sencillo: "S1: 40 kg × 10 · RIR 2". */
export function parseSimpleSet(n: number, txt: string, warnings: string[], ctx: string): ParsedSet {
  const t = (txt || '').trim();
  const r = emptyRes(t);
  const base = { n, target: emptyTarget(), result: r, fromPlan: true };
  const clean = t.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!/\d/.test(clean)) {
    if (DONE_WORDS.test(clean) && clean.toLowerCase() !== 'x') r.status = 'as-planned';
    return base;
  }
  const N = (x: string) => numOf(x.replace(',', '.'));
  let kg: number | null = null;
  let reps: number | null = null;
  let rir: number | null = null;
  let m: RegExpMatchArray | null;
  if ((m = clean.match(/(\d+(?:[.,]\d+)?)\s*kg/i))) kg = N(m[1]);
  if (/sin peso|peso corporal/i.test(clean)) kg = 0;
  if (kg == null && (m = clean.match(/(\d+(?:[.,]\d+)?)\s*[×x*]\s*(\d+)/i))) {
    kg = N(m[1]);
    reps = N(m[2]);
  } else if ((m = clean.match(/[×x*]\s*(\d+)/i))) reps = N(m[1]);
  else if ((m = clean.match(/(\d+)\s*reps?/i))) reps = N(m[1]);
  if ((m = clean.match(/rir\s*(\d+(?:[.,]\d+)?)/i))) rir = N(m[1]);
  const nums = (clean.match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => N(x) as number);
  if (kg == null && reps == null) {
    if (nums.length >= 2) {
      kg = nums[0];
      reps = nums[1];
      if (nums.length >= 3 && rir == null) rir = nums[2];
    } else {
      r.status = 'error';
      warnings.push(`${ctx}: S${n} no se entiende "${t}". No se guarda esa serie.`);
      return base;
    }
  }
  if (rir == null && nums.length >= 3) rir = nums[2];
  if (rir != null && rir > 5) {
    warnings.push(`${ctx}: S${n} RIR ${rir}, parece un error. Se guarda sin RIR.`);
    rir = null;
  }
  Object.assign(r, { kg, reps, rir, status: reps != null ? 'done' : 'error' });
  if (r.status === 'error') warnings.push(`${ctx}: S${n} falta el número de repeticiones en "${t}". No se guarda esa serie.`);
  return base;
}

/** Formato estándar: "S1 (12 reps · 40 kg · RIR 2): 12-40-2". */
export function parseStandardSet(n: number, inside: string, done: string, warnings: string[], ctx: string): ParsedSet {
  const target = emptyTarget();
  for (const p0 of inside.split('·')) {
    const p = p0.trim();
    if (!p) continue;
    if (/^rir/i.test(p)) target.rir = p.replace(/^rir\s*/i, '').trim();
    else if (/sin peso|peso corporal/i.test(p)) {
      target.kg = 0;
      target.kgText = 'sin peso';
    } else if (/kg/i.test(p)) {
      target.kg = numOf(p);
      target.kgText = p;
    } else if (!target.reps && (/reps?\b/i.test(p) || /\d\s*m\b/i.test(p) || /^\d+(\s*-\s*\d+)?$/.test(p)))
      target.reps = p.replace(/\s*reps?$/i, '').trim();
    else if (!target.kgText) target.kgText = p;
  }
  const t = (done || '').trim();
  const r = emptyRes(t);
  const out: ParsedSet = { n, target, result: r };
  if (!t) return out;
  const distance = /m\b/.test(target.reps);
  if (DONE_WORDS.test(t)) {
    Object.assign(r, {
      status: 'as-planned',
      reps: distance ? null : numOf(target.reps),
      repsText: distance ? target.reps : '',
      kg: target.kg,
      rir: rirNum(target.rir),
    });
    return out;
  }
  if (/^(no|nada|-|—)$/i.test(t)) return out;
  const toks = t
    .replace(/kg|reps?|rir/gi, '')
    .replace(/\s+/g, '')
    .split(/[-/x]/i)
    .filter(Boolean);
  const nums = toks.map(numOf);
  if (!toks.length || nums.some((v) => v == null)) {
    r.status = 'error';
    warnings.push(`${ctx}: S${n} no se entiende "${t}". No se guarda esa serie.`);
    return out;
  }
  const v = nums as number[];
  const noWeight = target.kg === 0;
  if (distance) {
    r.repsText = target.reps;
    r.kg = toks.length >= 2 ? v[1] : v[0] > 30 ? null : v[0];
    if (toks.length >= 3) r.rir = v[2];
    if (toks.length === 1 && r.kg == null) r.kg = target.kg;
  } else if (toks.length >= 3) {
    r.reps = v[0];
    r.kg = v[1];
    r.rir = v[2];
  } else if (toks.length === 2) {
    if (noWeight) {
      r.reps = v[0];
      r.kg = 0;
      r.rir = v[1];
    } else {
      r.reps = v[0];
      r.kg = v[1];
    }
  } else {
    r.reps = v[0];
    r.kg = target.kg;
  }
  r.status = 'done';
  if (r.rir != null && r.rir > 5) {
    if (r.rir % 10 === 0 && r.rir / 10 <= 5) {
      warnings.push(`${ctx}: S${n} RIR ${r.rir}, se guarda como RIR ${r.rir / 10}.`);
      r.warning = `Apuntó RIR ${r.rir}; se guarda como ${r.rir / 10}`;
      r.rir = r.rir / 10;
    } else {
      warnings.push(`${ctx}: S${n} RIR ${r.rir}, parece un error. Se guarda sin RIR.`);
      r.rir = null;
    }
  }
  const pr = rangeOf(target.reps);
  if (r.reps != null && pr && (r.reps > pr[1] * 2 || r.reps < pr[0] / 2))
    warnings.push(`${ctx}: S${n} ${r.reps} repeticiones (pedías ${target.reps}). Revisa que esté bien.`);
  if (r.kg != null && (target.kg ?? 0) > 0 && (r.kg > (target.kg ?? 0) * 1.6 || r.kg < (target.kg ?? 0) * 0.4))
    warnings.push(`${ctx}: S${n} ${formatNum(r.kg)} kg (pedías ${formatNum(target.kg)}). Revisa que esté bien.`);
  return out;
}

const DAY_RE =
  /^(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|torso(?: \d)?|pierna(?: \d)?|upper(?: \d)?|lower(?: \d)?|full ?body(?: \d)?|d[ií]a \d+)\s*(?:[·\-–:|]\s*(.*))?$/i;
const isCaps = (l: string) => /[A-ZÁÉÍÓÚÑ]{3}/.test(l) && l === l.toUpperCase() && !/^S\d/.test(l);

/** Lee la nota de WhatsApp. `prettyName` convierte "HIP THRUST" en el nombre de la biblioteca. */
export function parseNote(txt: string, prettyName: (caps: string) => string): ParsedNote {
  const out: ParsedNote = { week: null, rehabDays: '', bodyWeight: null, days: [], warnings: [] };
  let day: ParsedDay | null = null;
  let ex: ParsedExercise | null = null;
  let last: 'notes' | 'obs' | null = null;
  for (const raw of txt.replace(/\r/g, '').split('\n')) {
    const l = raw.replace(/ /g, ' ').trim();
    if (!l) continue;
    let m: RegExpMatchArray | null;
    if (!out.days.length && !/^s\d\s*\(/i.test(l) && (m = l.match(/^(?:rutina\s+)?(?:s|semana)\s*(\d{1,2})\b/i))) {
      out.week = Number(m[1]);
      continue;
    }
    if ((m = l.match(/^d[ií]as de rehabilitaci[oó]n\s*:?\s*(.*)$/i))) {
      out.rehabDays = m[1].trim();
      continue;
    }
    if ((m = l.match(/^peso\b[^:]*:\s*(.*)$/i))) {
      const v = numOf(m[1]);
      if (v) out.bodyWeight = v;
      continue;
    }
    if (l.length < 48 && (m = l.match(DAY_RE))) {
      day = { ...emptyDay(canonicalDay(m[1])), block: (m[2] ?? '').trim(), exercises: [] };
      out.days.push(day);
      ex = null;
      last = null;
      continue;
    }
    if (!day) continue;
    const ctx = () => `${day!.day} · ${ex?.name ?? ''}`;
    if ((m = l.match(/^rehab hoy[^:]*:\s*(.*)$/i))) {
      day.rehab = m[1].trim();
      last = null;
    } else if ((m = l.match(/^tobillo hoy[^:]*:\s*(.*)$/i))) {
      day.ankle = m[1].trim();
      last = null;
    } else if ((m = l.match(/^d[ií]a que lo hiciste\s*:\s*(.*)$/i))) {
      day.doneOn = m[1].trim();
      last = null;
    } else if ((m = l.match(/^energ[ií]a[^:]*:\s*(.*)$/i))) {
      day.energy = numOf(m[1]);
      last = null;
    } else if ((m = l.match(/^satisfacci[oó]n[^:]*:\s*(.*)$/i))) {
      day.satisfaction = numOf(m[1]);
      last = null;
    } else if ((m = l.match(/^observaciones generales\s*:?\s*(.*)$/i))) {
      day.notes = m[1].trim();
      ex = null;
      last = 'obs';
    } else if ((m = l.match(/^notas\s*:?\s*(.*)$/i))) {
      if (ex) {
        ex.athleteNotes = m[1].trim();
        last = 'notes';
      }
    } else if ((m = l.match(/^s(\d)\s*:\s*(.*)$/i))) {
      if (ex) ex.sets.push(parseSimpleSet(Number(m[1]), m[2], out.warnings, ctx()));
      last = null;
    } else if ((m = l.match(/^s(\d)\s*\(([^)]*)\)\s*:?\s*(.*)$/i))) {
      if (ex) ex.sets.push(parseStandardSet(Number(m[1]), m[2], m[3], out.warnings, ctx()));
      last = null;
    } else if (isCaps(l)) {
      ex = { name: prettyName(l), athleteNotes: '', sets: [] };
      day.exercises.push(ex);
      last = null;
    } else if (last === 'notes' && ex) ex.athleteNotes = `${ex.athleteNotes} ${l}`.trim();
    else if (last === 'obs') day.notes = `${day.notes} ${l}`.trim();
  }
  return out;
}
