import type { Metadata } from 'next';
import { formatNum, isPeriod, periodPhrase, type Period } from '@/domain';
import { BarChart } from '@/components/charts/bar-chart';
import { LineChart } from '@/components/charts/line-chart';
import { TONE_COLOR } from '@/components/charts/scales';
import { Sparkline } from '@/components/charts/sparkline';
import { PeriodSwitch } from '@/components/layout/period-switch';
import { WeekSelect } from '@/components/layout/week-select';
import { Card, CardHeader, EmptyState, SegmentedLinks } from '@/components/ui/primitives';
import { loadAthleteContext } from '@/server/services/athlete-data';
import { buildVolumeView, type Measure, type ZoneChoice } from '@/server/views/volume';

export const metadata: Metadata = { title: 'Volumen' };

const ZONE_CHOICES: ZoneChoice[] = ['Pierna', 'Torso', 'Total'];

export default async function VolumePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string; semana?: string; medida?: string; zona?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const period: Period = isPeriod(sp.periodo) ? sp.periodo : '3m';
  const measure: Measure = sp.medida === 'kilos' ? 'kilos' : 'series';
  const zone: ZoneChoice = ZONE_CHOICES.includes(sp.zona as ZoneChoice) ? (sp.zona as ZoneChoice) : 'Pierna';
  const { weeks, library } = await loadAthleteContext(id);
  if (!weeks.length) return <EmptyState title="Todavía no hay semanas">Cuando haya semanas guardadas verás aquí el volumen por grupo muscular.</EmptyState>;

  const v = buildVolumeView(weeks, library, { week: sp.semana ? Number(sp.semana) : undefined, measure, zone, period });
  const base = `/personas/${id}/volumen`;
  const keep = { periodo: period, medida: measure, zona: zone, ...(sp.semana ? { semana: sp.semana } : {}) };
  const href = (over: Record<string, string>) => `${base}?${new URLSearchParams({ ...keep, ...over })}`;
  const maxPlanned = Math.max(1, ...v.groups.flatMap((g) => g.rows.map((r) => Math.max(r.planned, r.done))));
  const kilos = measure === 'kilos';

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-[15px] text-muted">
        Cada ejercicio cuenta 1 serie para su músculo principal y una parte para los que también trabaja (el press plano suma 0,5 a tríceps y a hombro). El reparto se
        cambia en la Biblioteca.
      </p>

      <Card>
        <CardHeader
          title="Series por grupo muscular"
          subtitle={
            v.selected?.done
              ? 'Hechas esa semana. Verde: todas las que tocaban · ámbar: faltó alguna · rojo: faltaron muchas.'
              : 'Las que le pides esa semana (todavía sin hacer).'
          }
          action={<WeekSelect weeks={v.weeks} value={v.selected?.number ?? null} param="semana" />}
        />
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {v.groups.map((g) => (
            <div key={g.zone}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">{g.zone}</h3>
              <ul className="flex flex-col gap-2.5">
                {g.rows.map((r) => {
                  const ped = Math.round(r.planned);
                  const hz = Math.round(r.done);
                  return (
                    <li key={r.group} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
                      <span className="font-semibold">{r.group}</span>
                      <span className="h-2.5 rounded-full bg-surface-2" style={{ width: `${(r.planned / maxPlanned) * 100}%` }}>
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${v.selected?.done ? Math.min(100, (r.done / r.planned) * 100) : 100}%`, background: TONE_COLOR[r.tone] }}
                        />
                      </span>
                      <span className="tnum min-w-16 text-right">
                        {v.selected?.done ? (hz === ped ? hz : `${hz} de ${ped}`) : ped}
                        {r.diff ? <span className={r.diff > 0 ? 'ml-1 text-ok' : 'ml-1 text-bad'}>{r.diff > 0 ? `▲${r.diff}` : `▼${-r.diff}`}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <PeriodSwitch base={base} period={period} params={{ medida: measure, zona: zone, ...(sp.semana ? { semana: sp.semana } : {}) }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Volumen semana a semana"
            subtitle={kilos ? 'Kilos movidos (peso × repeticiones) por zona.' : 'Series hechas en pierna y en torso.'}
            action={
              <SegmentedLinks
                label="Medida"
                active={measure}
                items={[
                  { value: 'series', label: 'Series', href: href({ medida: 'series' }) },
                  { value: 'kilos', label: 'Kilos', href: href({ medida: 'kilos' }) },
                ]}
              />
            }
          />
          {v.zoneTotal ? (
            <p className="mb-3 text-sm text-muted">
              <span className="tnum mr-1 font-display text-3xl font-extrabold text-ink">{kilos ? `${formatNum(Math.round(v.zoneTotal.value / 100) / 10)} t` : v.zoneTotal.value}</span>
              {kilos ? 'movidos' : 'series'} en la semana {v.zoneTotal.week}
              {v.zoneTotal.changePct != null ? ` · ${v.zoneTotal.changePct > 0 ? '+' : v.zoneTotal.changePct < 0 ? '−' : ''}${Math.abs(v.zoneTotal.changePct)} % desde la ${v.zoneTotal.fromWeek}` : ''}
            </p>
          ) : null}
          <div className="mb-2 flex gap-4 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-brand" /> Pierna
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: 'var(--rir3)' }} /> Torso
            </span>
          </div>
          <LineChart
            data={v.zoneSeries}
            series={[
              { key: 'Pierna', label: 'Pierna', color: 'var(--brand)' },
              { key: 'Torso', label: 'Torso', color: 'var(--rir3)' },
            ]}
            format={kilos ? 'tonnes' : 'int'}
            label="Volumen semana a semana"
          />
        </Card>

        <Card>
          <CardHeader
            title="Progreso de fuerza"
            subtitle="Fuerza estimada con la mejor serie de cada semana. 0 % es la primera semana del periodo."
            action={
              <SegmentedLinks label="Zona" active={zone} items={ZONE_CHOICES.map((z) => ({ value: z, label: z, href: href({ zona: z }) }))} />
            }
          />
          {v.strength.last != null ? (
            <p className="mb-3 text-sm text-muted">
              <span className="tnum mr-1 font-display text-3xl font-extrabold text-ink">
                {v.strength.last > 0 ? '+' : v.strength.last < 0 ? '−' : ''}
                {formatNum(Math.abs(v.strength.last))} %
              </span>
              de media en {zone === 'Total' ? 'todo el cuerpo' : zone.toLowerCase()} {periodPhrase(period)}
            </p>
          ) : null}
          <LineChart data={v.strength.average} series={[{ key: 'v', label: 'Cambio medio', color: 'var(--brand)' }]} reference={0} format="signed-pct" height={170} label="Progreso medio de fuerza" />
          {v.strength.exercises.length ? (
            <ul className="mt-4 divide-y divide-line">
              {v.strength.exercises.map((e) => {
                const col = e.change > 0.5 ? 'var(--ok)' : e.change < -0.5 ? 'var(--bad)' : 'var(--muted)';
                return (
                  <li key={e.name} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{e.name}</p>
                      <p className="text-xs text-muted">
                        {e.group} · sem {e.from}–{e.to}
                      </p>
                    </div>
                    <Sparkline values={e.values} color={col} />
                    <span className="tnum w-14 text-right text-sm font-bold" style={{ color: col }}>
                      {e.change > 0 ? '+' : e.change < 0 ? '−' : ''}
                      {Math.abs(Math.round(e.change))} %
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Card>
      </div>

      <Card>
        <CardHeader title="Series tal cual se pidieron" subtitle="Porcentaje de series con las repeticiones pedidas (±2)." />
        <BarChart data={v.compliance} max={100} format="pct" label="Porcentaje de series como se pidieron" />
      </Card>
    </div>
  );
}
