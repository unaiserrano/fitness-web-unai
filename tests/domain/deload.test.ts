import { describe, expect, it } from 'vitest';
import { toDeload, toLibrary } from '@/domain';
import type { Week } from '@/domain';

describe('semana de descarga', () => {
  it('mitad de series, −10 % redondeado al salto y +2 RIR (máx. 4)', () => {
    const w: Week = {
      number: 7, dates: '', deload: false, intro: '', rehabText: '', rehabDays: '', bodyWeight: null,
      notes: { good: [], bad: [], mustNot: [], remember: [] },
      days: [{ day: 'Lunes', block: '', warmup: [], warmupNote: '', rehab: '', ankle: '', energy: null, satisfaction: null, notes: '',
        exercises: [{ name: 'Prensa', execution: '', coachNote: '', videoUrl: '', athleteNotes: '',
          sets: [1, 2, 3].map((n) => ({ n, target: { reps: '10', kg: 100, kgText: '100 kg', rir: n === 3 ? '3' : '1' }, result: { raw: '', reps: null, repsText: '', kg: null, rir: null, status: 'empty' as const } })) }] }],
    };
    const d = toDeload(w, toLibrary([{ slug: 'prensa', name: 'Prensa', muscleGroup: 'Cuádriceps', execution: '', videoUrl: '', weightStep: 5, volumeSplit: null }]));
    expect(d.deload).toBe(true);
    const sets = d.days[0].exercises[0].sets;
    expect(sets).toHaveLength(2);
    expect(sets[0].target).toMatchObject({ kg: 90, rir: '3' });
  });
});
