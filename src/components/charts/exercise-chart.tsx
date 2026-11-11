'use client';

import { linear, padded, path, points, rirColor, rirInk } from './scales';
import { useWidth } from './use-width';

export interface ExerciseChartPoint {
  week: number;
  value: number;
  label: string;
  rir: number | null;
  reps: string;
  /** Diferencia de reps con lo pedido (+3, −2…) o null. */
  diff: number | null;
  detail: string[];
}

/**
 * Progreso de un ejercicio: cada punto es su serie más pesada de la semana.
 * Arriba el peso, dentro el RIR (color), debajo las reps y si cuadran con lo pedido.
 * El último punto hueco es lo que se le pide esta semana.
 */
export function ExerciseChart({
  name,
  pts,
  plan,
}: {
  name: string;
  pts: ExerciseChartPoint[];
  plan: { week: number; value: number; label: string; rir: number | null; reps: string } | null;
}) {
  const { ref, width: measured } = useWidth<HTMLDivElement>();
  const width = measured ?? 320;
  const H = 190;
  const m = { t: 30, r: 16, b: 66, l: 16 };
  const xs = [...pts.map((p) => p.week), ...(plan && !pts.some((p) => p.week === plan.week) ? [plan.week] : [])];
  const x = points(xs, [m.l + 14, width - m.r - 14]);
  const xi = (w: number) => x(xs.indexOf(w));
  const y = linear(padded([...pts.map((p) => p.value), ...(plan ? [plan.value] : [])], 0.15), [H - m.b, m.t]);
  const last = pts[pts.length - 1];
  const dense = xs.length > Math.floor(width / 44);
  const aria = `${name}: ${pts.map((p) => `semana ${p.week}, ${p.label}${p.rir != null ? `, RIR ${p.rir}` : ''}`).join('; ')}${plan ? `; le pides ${plan.label}` : ''}`;

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden" style={{ minHeight: H }}>
      {measured == null ? null : (
      <svg width={width} height={H} role="img" aria-label={aria} className="block overflow-visible">
        <line x1={m.l} x2={width - m.r} y1={H - m.b + 8} y2={H - m.b + 8} stroke="var(--line)" />
        {pts.length > 1 ? (
          <path d={path(pts.map((p) => [xi(p.week), y(p.value)]))} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinejoin="round" />
        ) : null}
        {plan && last ? (
          <line x1={xi(last.week)} y1={y(last.value)} x2={xi(plan.week)} y2={y(plan.value)} stroke="var(--brand)" strokeWidth={1.5} strokeDasharray="3 4" />
        ) : null}
        {pts.map((p, i) => {
          const cx = xi(p.week);
          const cy = y(p.value);
          const isLast = p === last;
          const showTop = !dense || isLast || i === 0;
          return (
            <g key={p.week}>
              <title>{[`Semana ${p.week}`, ...p.detail].join('\n')}</title>
              {showTop ? (
                <text x={cx} y={cy - 15} textAnchor="middle" className="tnum fill-[var(--ink)] text-[12px]" fontWeight={isLast ? 700 : 500}>
                  {p.label}
                </text>
              ) : null}
              <circle cx={cx} cy={cy} r={10} fill={rirColor(p.rir)} stroke="var(--surface)" strokeWidth={2} />
              <text x={cx} y={cy} dy="0.35em" textAnchor="middle" fontWeight={700} className="text-[11px]" fill={rirInk(p.rir)}>
                {p.rir == null ? '–' : Math.round(p.rir)}
              </text>
              {!dense || isLast ? (
                <text x={cx} y={H - m.b + 24} textAnchor="middle" className="tnum fill-[var(--ink)] text-[11px]">
                  {p.reps}
                </text>
              ) : null}
              {p.diff != null && (!dense || isLast) ? (
                p.diff >= 3 || p.diff <= -2 ? (
                  <g transform={`translate(${cx},${H - m.b + 40})`}>
                    <rect x={-17} y={-9} width={34} height={18} rx={9} fill={p.diff > 0 ? 'var(--ink)' : 'none'} stroke={p.diff < 0 ? 'var(--ink)' : 'none'} />
                    <text textAnchor="middle" dy="0.35em" fontWeight={700} className="text-[11px]" fill={p.diff > 0 ? 'var(--bg)' : 'var(--ink)'}>
                      {p.diff > 0 ? `+${p.diff}` : `−${Math.abs(p.diff)}`}
                    </text>
                  </g>
                ) : (
                  <text x={cx} y={H - m.b + 40} dy="0.35em" textAnchor="middle" className="fill-[var(--ok)] text-[11px] font-semibold">
                    bien
                  </text>
                )
              ) : null}
              <text x={cx} y={H - 2} textAnchor="middle" className="fill-[var(--muted)] text-[10px]">
                {dense && !isLast && i % 2 ? '' : `S${p.week}`}
              </text>
            </g>
          );
        })}
        {plan ? (
          <g>
            <title>{`Lo que le pides en la semana ${plan.week}: ${plan.label} · ${plan.reps}`}</title>
            <text x={xi(plan.week)} y={y(plan.value) - 15} textAnchor="middle" fontWeight={700} className="tnum fill-[var(--ink)] text-[12px]">
              {plan.label}
            </text>
            <circle cx={xi(plan.week)} cy={y(plan.value)} r={10} fill="var(--surface)" stroke={rirColor(plan.rir)} strokeWidth={2.5} />
            <text x={xi(plan.week)} y={y(plan.value)} dy="0.35em" textAnchor="middle" fontWeight={700} className="fill-[var(--ink)] text-[11px]">
              {plan.rir == null ? '–' : Math.round(plan.rir)}
            </text>
            <text x={xi(plan.week)} y={H - m.b + 24} textAnchor="middle" className="tnum fill-[var(--muted)] text-[11px]">
              {plan.reps}
            </text>
            <text x={xi(plan.week)} y={H - 2} textAnchor="middle" className="fill-[var(--brand)] text-[10px] font-semibold">
              Pide
            </text>
          </g>
        ) : null}
      </svg>
      )}
    </div>
  );
}

export function RirLegend() {
  const items: Array<[string, string, number]> = [
    ['0', 'al fallo', 0],
    ['1', 'le quedaba 1', 1],
    ['2', 'le quedaban 2', 2],
    ['3', '3 o más', 3],
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted" aria-label="Leyenda del RIR">
      <li className="font-semibold text-ink">RIR</li>
      {items.map(([n, t, v]) => (
        <li key={n} className="inline-flex items-center gap-1.5">
          <span className="grid size-5 place-items-center rounded-full text-[10px] font-bold" style={{ background: rirColor(v), color: rirInk(v) }}>
            {n}
          </span>
          {t}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span className="rounded-full bg-ink px-1.5 text-[10px] font-bold text-bg">+4</span>reps de más
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="rounded-full border border-ink px-1.5 text-[10px] font-bold text-ink">−3</span>se quedó corto
      </li>
    </ul>
  );
}
