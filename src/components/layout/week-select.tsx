'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** Desplegable de semana que cambia un parámetro de la URL. */
export function WeekSelect({
  weeks,
  value,
  param = 'semana',
  label = 'Semana',
  extra,
}: {
  weeks: Array<{ number: number; done: boolean }>;
  value: number | null;
  param?: string;
  label?: string;
  extra?: { value: number; label: string } | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const onChange = (v: string) => {
    const next = new URLSearchParams(sp.toString());
    next.set(param, v);
    router.push(`${pathname}?${next}`, { scroll: false });
  };
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="font-semibold text-muted">{label}</span>
      <select className="field field-sm w-auto rounded-full" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {extra ? <option value={extra.value}>{extra.label}</option> : null}
        {[...weeks].reverse().map((w) => (
          <option key={w.number} value={w.number}>
            Semana {w.number}
            {w.done ? '' : ' · la que le pides'}
          </option>
        ))}
      </select>
    </label>
  );
}
