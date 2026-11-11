import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from './cn';

/* ---------- Botón ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'lime';
type Size = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink shadow-[0_8px_20px_-10px_var(--brand)] hover:brightness-105 active:translate-y-px',
  secondary: 'border border-line bg-surface text-ink hover:border-ink/30 hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'text-bad hover:bg-bad-soft',
  lime: 'bg-lime text-lime-ink hover:brightness-95',
};
const sizes: Record<Size, string> = { sm: 'h-9 px-3.5 text-sm', md: 'h-11 px-5 text-[15px]' };

export const buttonClass = (v: Variant = 'secondary', s: Size = 'md', extra?: string) => cn(base, variants[v], sizes[s], extra);

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/* ---------- Tarjeta ---------- */
export function Card({ className, ...rest }: ComponentProps<'section'>) {
  return <section className={cn('min-w-0 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[0_1px_0_rgba(0,0,0,0.02),0_10px_30px_-22px_rgba(0,0,0,0.25)] sm:p-6', className)} {...rest} />;
}

export function CardHeader({ title, subtitle, action, as: H = 'h2' }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; as?: 'h2' | 'h3' }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <H className="text-lg font-bold leading-tight">{title}</H>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------- Etiquetas ---------- */
type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'brand' | 'lime' | 'info';
const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  brand: 'bg-brand-soft text-brand',
  lime: 'bg-lime text-lime-ink',
  info: 'bg-info-soft text-info',
};
export function Badge({ tone = 'neutral', className, ...rest }: ComponentProps<'span'> & { tone?: Tone }) {
  return <span className={cn('tnum inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)} {...rest} />;
}

/* ---------- Campo de formulario ---------- */
export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

/* ---------- Avisos ---------- */
export function Notice({ tone = 'neutral', title, children, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string }) {
  const bg: Record<Tone, string> = {
    neutral: 'bg-surface-2 border-line',
    ok: 'bg-ok-soft border-ok/25',
    warn: 'bg-warn-soft border-warn/25',
    bad: 'bg-bad-soft border-bad/25',
    brand: 'bg-brand-soft border-brand/25',
    lime: 'bg-lime/40 border-lime',
    info: 'bg-info-soft border-info/25',
  };
  return (
    <div role="note" className={cn('rounded-2xl border px-4 py-3 text-sm leading-relaxed', bg[tone], className)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-14 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {children ? <div className="max-w-md text-sm text-muted">{children}</div> : null}
      {action}
    </div>
  );
}

/* ---------- Título de página ---------- */
export function PageTitle({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <span aria-hidden className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime" />
        {subtitle ? <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------- Control segmentado con enlaces (periodo, medida, zona…) ---------- */
export function SegmentedLinks({ label, items, active }: { label: string; items: Array<{ value: string; label: string; href: string }>; active: string }) {
  return (
    <nav aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-full border border-line bg-surface p-0.5">
      {items.map((it) => (
        <Link
          key={it.value}
          href={it.href}
          scroll={false}
          aria-current={it.value === active ? 'true' : undefined}
          className={cn(
            'whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors sm:px-3.5 sm:text-sm',
            it.value === active ? 'bg-brand text-brand-ink' : 'text-muted hover:text-ink',
          )}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

/* ---------- Dato grande ---------- */
export function Stat({ label, value, detail, tone }: { label: string; value: ReactNode; detail?: ReactNode; tone?: Tone }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <span className="tnum font-display text-3xl font-extrabold leading-none tracking-tight">{value}</span>
      {detail ? <span className="text-sm">{tone ? <Badge tone={tone}>{detail}</Badge> : <span className="text-muted">{detail}</span>}</span> : null}
    </div>
  );
}
