import { linear, path } from './scales';

/** Minigráfica decorativa (el dato va escrito al lado). */
export function Sparkline({ values, color, width = 96, height = 28 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length < 2) return <span style={{ width, height }} className="inline-block" aria-hidden />;
  const x = linear([0, values.length - 1], [3, width - 3]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const y = linear(lo === hi ? [lo - 1, hi + 1] : [lo, hi], [height - 4, 4]);
  const last = values.length - 1;
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      <path d={path(values.map((v, i) => [x(i), y(v)]))} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r={3} fill={color} />
    </svg>
  );
}
