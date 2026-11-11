import { describe, expect, it } from 'vitest';
import { defaultConfig, generateNote, mergeNote, parseNote, parseSimpleSet, parseStandardSet, toLibrary } from '@/domain';
import type { Athlete, Week } from '@/domain';

const athlete = (over: Partial<Athlete> = {}): Athlete => ({
  id: 'iria',
  name: 'Iria',
  subtitle: '',
  startDate: '2026-11-16',
  targetSessions: 3,
  noteStyle: 'simple',
  flexibleDays: false,
  config: defaultConfig(),
  ...over,
});

const plan: Week = {
  number: 1,
  dates: '16 – 22 nov 2026',
  deload: false,
  intro: '',
  rehabText: '',
  rehabDays: '',
  bodyWeight: null,
  notes: { good: [], bad: [], mustNot: [], remember: [] },
  days: [
    {
      day: 'Lunes',
      block: 'Pierna A',
      warmup: [{ name: 'Gato-camello', dose: '8', videoUrl: '' }],
      warmupNote: '',
      rehab: '',
      ankle: '',
      energy: null,
      satisfaction: null,
      notes: '',
      exercises: [
        {
          name: 'Hip thrust',
          execution: '',
          coachNote: '',
          videoUrl: 'https://example.com/v',
          athleteNotes: '',
          sets: [1, 2].map((n) => ({
            n,
            target: { reps: '8-10', kg: null, kgText: '', rir: '2-3' },
            result: { raw: '', reps: null, repsText: '', kg: null, rir: null, status: 'empty' as const },
          })),
        },
      ],
    },
  ],
};

describe('nota sencilla', () => {
  it('lee kg × reps · RIR en varios formatos', () => {
    const w: string[] = [];
    expect(parseSimpleSet(1, '40 kg × 10 · RIR 3', w, '').result).toMatchObject({ kg: 40, reps: 10, rir: 3, status: 'done' });
    expect(parseSimpleSet(2, '40kg x 9 · RIR 2', w, '').result).toMatchObject({ kg: 40, reps: 9, rir: 2 });
    expect(parseSimpleSet(3, '40 x 8 x 2', w, '').result).toMatchObject({ kg: 40, reps: 8, rir: 2 });
    expect(parseSimpleSet(4, 'sin peso × 12 · RIR 3', w, '').result).toMatchObject({ kg: 0, reps: 12, rir: 3 });
    expect(parseSimpleSet(5, '__ kg × __ · RIR __', w, '').result.status).toBe('empty');
    expect(parseSimpleSet(6, 'ok', w, '').result.status).toBe('as-planned');
    expect(w).toEqual([]);
  });

  it('genera la nota con la explicación del RIR y sin vídeos', () => {
    const t = generateNote(plan, athlete(), { hasRehab: false });
    expect(t).toContain('Rutina S1');
    expect(t).toContain('RIR = las repeticiones');
    expect(t).toContain('HIP THRUST\nS1: __ kg × __ · RIR __\nS2: __ kg × __ · RIR __');
    expect(t).not.toContain('http');
  });

  it('al mezclar, copia lo pedido de la rutina y rellena "ok"', () => {
    const note = parseNote('Rutina S1\n\nLunes · Pierna A\n\nHIP THRUST\nS1: 40 kg × 10 · RIR 3\nS2: ok\nNotas: bien', (c) =>
      c === 'HIP THRUST' ? 'Hip thrust' : c,
    );
    expect(note.week).toBe(1);
    const { week, doneSets } = mergeNote(note, plan, 1, athlete(), toLibrary([]));
    expect(doneSets).toBe(2);
    const ex = week.days[0].exercises[0];
    expect(ex.videoUrl).toBe('https://example.com/v');
    expect(ex.athleteNotes).toBe('bien');
    expect(ex.sets[0].target.reps).toBe('8-10');
    expect(ex.sets[1].result).toMatchObject({ status: 'as-planned', reps: 8, rir: 2 });
    expect(week.days[0].warmup).toHaveLength(1);
  });
});

describe('nota estándar', () => {
  it('lee reps-kg-RIR y avisa de RIR raros', () => {
    const w: string[] = [];
    const s = parseStandardSet(1, '12 reps · 40 kg · RIR 2', '12-40-2', w, 'Lunes · X');
    expect(s.target).toMatchObject({ reps: '12', kg: 40, rir: '2' });
    expect(s.result).toMatchObject({ reps: 12, kg: 40, rir: 2, status: 'done' });
    const r = parseStandardSet(2, '10 reps · 12,5 kg · RIR 0', '10-12.5-10', w, 'Martes · Y');
    expect(r.result.rir).toBe(1);
    expect(w[0]).toContain('se guarda como RIR 1');
  });

  it('entiende "sin peso" con dos números (reps-RIR)', () => {
    const s = parseStandardSet(1, '12 reps · sin peso · RIR 2', '12-1', [], '');
    expect(s.result).toMatchObject({ reps: 12, kg: 0, rir: 1 });
  });

  it('genera las líneas de rehab, tobillo y peso para quien las tiene', () => {
    const a = athlete({ noteStyle: 'standard', config: { ...defaultConfig(), rehabZone: 'Tobillo' } });
    const t = generateNote({ ...plan, days: [{ ...plan.days[0], day: 'Sábado' }] }, a, { hasRehab: true });
    expect(t).toContain('Días de Rehabilitación: ');
    expect(t).toContain('Tobillo hoy (molestias o hinchazón): ');
    expect(t).toContain('Peso corporal (de esta mañana): ');
    expect(t).toContain('S1 (8-10 reps · RIR 2-3): ');
  });
});
