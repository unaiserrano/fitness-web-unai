'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from './cn';

import { THEME_KEY as KEY } from './theme-script';

export type ThemeChoice = 'light' | 'dark' | 'system';

const apply = (c: ThemeChoice) => {
  const dark = c === 'dark' || (c === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
};

const OPTIONS: Array<[ThemeChoice, string, typeof Sun]> = [
  ['light', 'Claro', Sun],
  ['dark', 'Oscuro', Moon],
  ['system', 'Como el sistema', Monitor],
];

export function ThemeToggle({ className }: { className?: string }) {
  const [choice, setChoice] = useState<ThemeChoice>('light');

  useEffect(() => {
    try {
      setChoice((localStorage.getItem(KEY) as ThemeChoice) || 'light');
    } catch {
      /* sin almacenamiento: claro */
    }
  }, []);

  useEffect(() => {
    if (choice !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => apply('system');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [choice]);

  const pick = (c: ThemeChoice) => {
    setChoice(c);
    apply(c);
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* se aplica igual, solo no se recuerda */
    }
  };

  return (
    <div role="radiogroup" aria-label="Tema" className={cn('inline-flex rounded-full border border-line bg-surface p-0.5', className)}>
      {OPTIONS.map(([c, label, Icon]) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={choice === c}
          title={label}
          onClick={() => pick(c)}
          className={cn(
            'grid size-8 place-items-center rounded-full transition-colors',
            choice === c ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
          )}
        >
          <Icon aria-hidden className="size-4" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
