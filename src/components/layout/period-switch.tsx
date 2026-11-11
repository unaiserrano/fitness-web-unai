import { PERIODS, type Period } from '@/domain/alerts';
import { SegmentedLinks } from '@/components/ui/primitives';

/** Selector de periodo (Todo · 3 meses · Último mes · Última semana) que conserva el resto de la URL. */
export function PeriodSwitch({ base, period, params = {} }: { base: string; period: Period; params?: Record<string, string> }) {
  return (
    <SegmentedLinks
      label="Periodo"
      active={period}
      items={PERIODS.map(([v, label]) => ({ value: v, label, href: `${base}?${new URLSearchParams({ ...params, periodo: v })}` }))}
    />
  );
}
