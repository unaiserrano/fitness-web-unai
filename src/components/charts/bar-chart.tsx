'use client';

import { TONE_COLOR, type ChartTone, formatValue, linear, type ValueFormat } from './scales';
import { useWidth } from './use-width';

/** Barras por semana con su valor encima y, si se pasa, una raya de objetivo. */
export function BarChart({
  data,
  height = 150,
  max,
  reference,
  format: fmt = 'int',
  label,
}: {
  data: Array<{ week: number; value: number | null; tone: ChartTone }>;
  height?: number;
  max?: number;
  reference?: number;
  format?: ValueFormat;
  label: string;
}) {
  const format = (v: number) => formatValue(v, fmt);
  const { ref, width: measured } = useWidth<HTMLDivElement>();
  const width = measured ?? 320;
  const m = { t: 22, r: 8, b: 26, l: 8 };
  const top = Math.max(max ?? 0, reference ?? 0, ...data.map((d) => d.value ?? 0), 1);
  const y = linear([0, top], [height - m.b, m.t]);
  const slot = (width - m.l - m.r) / Math.max(1, data.length);
  const bw = Math.min(34, slot * 0.62);
  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden" style={{ minHeight: height }}>
      {!data.length ? (
        <p className="py-8 text-center text-sm text-muted">Sin datos todavía.</p>
      ) : (
        measured == null ? null : <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label}: ${data.map((d) => `semana ${d.week} ${d.value == null ? 'sin dato' : format(d.value)}`).join(', ')}`}
          className="block"
        >
          {data.map((d, i) => {
            const cx = m.l + slot * i + slot / 2;
            const v = d.value ?? 0;
            return (
              <g key={d.week}>
                <rect x={cx - bw / 2} y={y(v)} width={bw} height={Math.max(0, y(0) - y(v))} rx={6} fill={TONE_COLOR[d.tone]} />
                <text x={cx} y={y(v) - 6} textAnchor="middle" className="tnum fill-[var(--ink)] text-[11px] font-semibold">
                  {d.value == null ? '—' : format(d.value)}
                </text>
                <text x={cx} y={height - 8} textAnchor="middle" className="fill-[var(--muted)] text-[11px]">
                  {data.length > 16 && i % 2 && i !== data.length - 1 ? '' : `S${d.week}`}
                </text>
              </g>
            );
          })}
          {reference != null ? (
            <line x1={m.l} x2={width - m.r} y1={y(reference)} y2={y(reference)} stroke="var(--ink)" strokeOpacity={0.45} strokeDasharray="4 4" />
          ) : null}
        </svg>
      )}
    </div>
  );
}
