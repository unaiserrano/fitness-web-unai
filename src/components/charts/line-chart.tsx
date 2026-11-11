'use client';

import { formatValue, linear, padded, path, points, type ValueFormat } from './scales';
import { useWidth } from './use-width';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
}

/** Gráfica de líneas por semana. Pone el valor encima de cada punto si caben; si no, solo en el último. */
export function LineChart({
  data,
  series,
  height = 200,
  format: fmt = 'int',
  reference,
  label,
}: {
  data: Array<{ week: number } & Record<string, number | null>>;
  series: LineSeries[];
  height?: number;
  format?: ValueFormat;
  reference?: number;
  label: string;
}) {
  const format = (v: number) => formatValue(v, fmt);
  const { ref, width: measured } = useWidth<HTMLDivElement>();
  const width = measured ?? 320;
  const m = { t: 26, r: 22, b: 30, l: 22 };
  const vals = data.flatMap((d) => series.map((s) => d[s.key])).filter((v): v is number => v != null);
  if (reference != null) vals.push(reference);
  const x = points(data, [m.l + 8, width - m.r - 8]);
  const y = linear(padded(vals), [height - m.b, m.t]);
  const showAll = data.length <= Math.floor(width / 56);
  const summary = series
    .map((s) => `${s.label}: ${data.map((d) => `semana ${d.week} ${d[s.key] == null ? 'sin dato' : format(d[s.key] as number)}`).join(', ')}`)
    .join('. ');

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden" style={{ minHeight: height }}>
      {!vals.length ? (
        <p className="py-8 text-center text-sm text-muted">Sin datos todavía.</p>
      ) : (
        measured == null ? null : <svg width={width} height={height} role="img" aria-label={`${label}. ${summary}`} className="block overflow-visible">
          {reference != null ? (
            <line x1={m.l} x2={width - m.r} y1={y(reference)} y2={y(reference)} stroke="var(--muted)" strokeDasharray="3 5" strokeOpacity={0.6} />
          ) : null}
          <line x1={m.l} x2={width - m.r} y1={height - m.b + 6} y2={height - m.b + 6} stroke="var(--line)" />
          {data.map((d, i) => (
            <text key={d.week} x={x(i)} y={height - 8} textAnchor="middle" className="fill-[var(--muted)] text-[11px]">
              {data.length > 14 && i % 2 && i !== data.length - 1 ? '' : `S${d.week}`}
            </text>
          ))}
          {series.map((s, si) => {
            const pts = data.map((d, i) => [i, d[s.key]] as const).filter(([, v]) => v != null) as Array<[number, number]>;
            return (
              <g key={s.key}>
                <path d={path(pts.map(([i, v]) => [x(i), y(v)]))} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                {pts.map(([i, v], k) => {
                  const last = k === pts.length - 1;
                  return (
                    <g key={i}>
                      <circle cx={x(i)} cy={y(v)} r={last ? 5 : 3.5} fill={last ? s.color : 'var(--surface)'} stroke={s.color} strokeWidth={2} />
                      {showAll || last ? (
                        <text
                          x={x(i)}
                          y={y(v) + (si % 2 ? 18 : -10)}
                          textAnchor="middle"
                          className="tnum fill-[var(--ink)] text-[11px]"
                          fontWeight={last ? 700 : 500}
                        >
                          {format(v)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
