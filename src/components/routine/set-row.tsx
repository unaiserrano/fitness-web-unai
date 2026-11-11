'use client';

import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { applyRecommendation, type Recommendation } from '@/domain/recommendation';
import { formatNum, rangeOf } from '@/domain/numbers';
import { isDistance, kgInputValue, parseKgInput } from '@/domain/format';
import { repsDiff, type lastDoneSet } from '@/domain/history';
import type { WorkSet } from '@/domain/types';
import { rirColor, rirInk } from '@/components/charts/scales';
import { cn } from '@/components/ui/cn';
import { useRoutine } from './routine-context';

type Last = ReturnType<typeof lastDoneSet>;

/** Una serie: lo que se pide (reps, kg, RIR) y, debajo, lo que hizo la última vez y mi recomendación. */
export function SetRow({
  set,
  di,
  ei,
  si,
  last,
  rec,
}: {
  set: WorkSet;
  di: number;
  ei: number;
  si: number;
  last: Last;
  rec: Recommendation | null;
}) {
  const { mutate, weekNumber } = useRoutine();
  const [why, setWhy] = useState(false);
  const upd = (fn: (s: WorkSet) => void) => mutate((w) => fn(w.days[di].exercises[ei].sets[si]));

  const r = last?.set.result;
  const dist = r ? isDistance(r.repsText) : false;
  const dd = r && !dist ? repsDiff(r.reps, rangeOf(last!.set.target.reps)) : null;
  const pk = last?.set.target.kg ?? null;
  const dk = r && pk != null && pk > 0 && r.kg != null ? Math.round((r.kg - pk) * 100) / 100 : 0;

  const input = 'field field-sm tnum text-center';
  return (
    <li className="rounded-2xl bg-surface-2/60 px-3 py-2.5">
      <div className="grid grid-cols-[2rem_1fr_1fr_4.25rem_2rem] items-center gap-2">
        <span className="text-xs font-bold text-brand">S{set.n}</span>
        <input
          className={input}
          aria-label={`Repeticiones de la serie ${set.n}`}
          value={set.target.reps}
          onChange={(e) => upd((s) => void (s.target.reps = e.target.value))}
          placeholder="reps"
        />
        <input
          className={input}
          aria-label={`Kilos de la serie ${set.n}`}
          defaultValue={kgInputValue(set.target)}
          key={`${set.target.kg}-${set.target.kgText}`}
          onBlur={(e) => upd((s) => Object.assign(s.target, parseKgInput(e.target.value)))}
          placeholder="kg"
        />
        <input
          className={input}
          aria-label={`RIR de la serie ${set.n}`}
          value={set.target.rir}
          onChange={(e) => upd((s) => void (s.target.rir = e.target.value))}
          placeholder="RIR"
        />
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full text-muted hover:bg-bad-soft hover:text-bad"
          aria-label={`Quitar la serie ${set.n}`}
          onClick={() => mutate((w) => void w.days[di].exercises[ei].sets.splice(si, 1))}
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-10 text-xs">
        {last && r ? (
          <>
            <button
              type="button"
              onClick={() => rec && setWhy((v) => !v)}
              aria-expanded={rec ? why : undefined}
              title={rec?.reason ?? 'Lo que hizo la última vez'}
              className="tnum inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-muted"
            >
              {last.week !== weekNumber - 1 ? <span className="font-semibold text-ink">S{last.week}</span> : null}
              {dist ? r.repsText : `${r.reps} reps`}
              {r.kg != null ? ` · ${r.kg === 0 ? 'sin peso' : `${formatNum(r.kg)} kg`}` : ''}
              {r.rir != null ? (
                <span className="grid size-4 place-items-center rounded-full text-[10px] font-bold" style={{ background: rirColor(r.rir), color: rirInk(r.rir) }}>
                  {formatNum(r.rir)}
                </span>
              ) : null}
            </button>
            {dd != null && (dd >= 3 || dd <= -2) ? (
              <span className={cn('rounded-full px-2 py-0.5 font-semibold', dd > 0 ? 'bg-ink text-bg' : 'border border-ink')}>{`${dd > 0 ? '+' : '−'}${Math.abs(dd)} reps`}</span>
            ) : null}
            {dk ? <span className={cn('rounded-full px-2 py-0.5 font-semibold', dk > 0 ? 'bg-ink text-bg' : 'border border-ink')}>{`${dk > 0 ? '+' : '−'}${formatNum(Math.abs(dk))} kg`}</span> : null}
            {dd != null && !(dd >= 3 || dd <= -2) && !dk ? <span className="font-semibold text-ok">bien</span> : null}
            {rec && !rec.same ? (
              <button
                type="button"
                className="tnum inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 font-semibold text-lime-ink hover:brightness-95"
                title={`Poner mi recomendación: ${rec.reason}`}
                onClick={() => upd((s) => Object.assign(s, applyRecommendation(s, rec)))}
              >
                <Sparkles aria-hidden className="size-3" />
                {rec.repsText} · {formatNum(rec.kg)} kg · RIR {rec.rir}
              </button>
            ) : rec ? (
              <span className="font-semibold text-ok" title="Coincide con mi recomendación">
                ✓
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-muted">Nueva</span>
        )}
      </div>
      {why && rec ? <p className="mt-1.5 pl-10 text-xs text-muted">{rec.reason}</p> : null}
    </li>
  );
}
