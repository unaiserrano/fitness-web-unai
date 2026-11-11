import { kgLabel, repsLabel } from '../format';
import { normalize } from '../text';
import type { Athlete, Week } from '../types';

/**
 * Nota de WhatsApp que el atleta rellena cada semana.
 * - standard: "S1 (12 reps · 40 kg · RIR 2): " y se apunta reps-kg-RIR.
 * - simple:   "S1: __ kg × __ · RIR __" (para principiantes).
 */
export function generateNote(week: Week, athlete: Athlete, opts: { hasRehab: boolean }): string {
  return athlete.noteStyle === 'simple' ? simpleNote(week) : standardNote(week, athlete, opts.hasRehab);
}

function simpleNote(w: Week): string {
  const L: string[] = [
    `Rutina S${w.number}`,
    '',
    'RIR = las repeticiones que te quedan en reserva al acabar la serie (RIR 2 = podrías haber hecho 2 más).',
    '',
  ];
  for (const d of w.days) {
    L.push(d.block ? `${d.day} · ${d.block}` : d.day, '');
    for (const e of d.exercises) {
      L.push(e.name.toUpperCase());
      for (const s of e.sets) L.push(`S${s.n}: __ kg × __ · RIR __`);
      L.push('Notas: ', '');
    }
    L.push('Observaciones generales:', '');
  }
  return `${L.join('\n').trim()}\n`;
}

function standardNote(w: Week, athlete: Athlete, rehab: boolean): string {
  const ankle = normalize(athlete.config.rehabZone) === 'tobillo';
  const flexible = athlete.flexibleDays;
  const L: string[] = [
    `Rutina S${w.number}`,
    '',
    'Cómo apuntar cada serie: reps-kg-RIR (ej.: 12-35-2)',
    '',
    ...(rehab ? ['Días de Rehabilitación: '] : []),
    ...(flexible ? ['Peso (en ayunas): '] : []),
    '',
  ];
  for (const d of w.days) {
    L.push(d.block ? `${d.day} · ${d.block}` : d.day, '');
    if (flexible) L.push('Día que lo hiciste: ');
    if (rehab) L.push('Rehab hoy (sí / no): ');
    if (ankle) L.push('Tobillo hoy (molestias o hinchazón): ');
    if (d.day === 'Sábado') L.push('Peso corporal (de esta mañana): ');
    L.push('');
    for (const e of d.exercises) {
      L.push(e.name.toUpperCase());
      for (const s of e.sets) {
        const parts = [repsLabel(s.target.reps), kgLabel(s.target)].filter(Boolean);
        if (s.target.rir !== '' && s.target.rir != null) parts.push(`RIR ${s.target.rir}`);
        L.push(`S${s.n} (${parts.join(' · ')}): `);
      }
      L.push('Notas: ', '');
    }
    L.push('Observaciones generales:', '');
  }
  return `${L.join('\n').trim()}\n`;
}
