'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './primitives';
import { cn } from './cn';

export type Toast = { text: string; tone: 'ok' | 'bad' | 'neutral' } | null;

/** Mensaje temporal que leen también los lectores de pantalla. */
export function useToast() {
  const [toast, setToast] = useState<Toast>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((text: string, tone: 'ok' | 'bad' | 'neutral' = 'ok') => {
    setToast({ text, tone });
    clearTimeout(t.current);
    t.current = setTimeout(() => setToast(null), tone === 'bad' ? 7000 : 3500);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  return { toast, show };
}

export function ToastView({ toast }: { toast: Toast }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      {toast ? (
        <p
          className={cn(
            'pointer-events-auto rounded-sm px-5 py-2.5 text-sm font-semibold shadow-lg',
            toast.tone === 'ok' && 'bg-ink text-bg',
            toast.tone === 'bad' && 'bg-bad text-white',
            toast.tone === 'neutral' && 'bg-surface text-ink ring-1 ring-line',
          )}
        >
          {toast.text}
        </p>
      ) : null}
    </div>
  );
}

/** Botón que copia un texto al portapapeles. */
export function CopyButton({ text, label = 'Copiar', copiedLabel = 'Copiado', variant = 'primary' }: { text: string | (() => string); label?: string; copiedLabel?: string; variant?: 'primary' | 'secondary' | 'lime' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    const value = typeof text === 'function' ? text() : text;
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      window.prompt('Copia el texto:', value);
    }
  };
  return (
    <Button variant={variant} onClick={copy}>
      {done ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      {done ? copiedLabel : label}
    </Button>
  );
}

/** Botón que pide una segunda pulsación para confirmar (sin diálogos del navegador). */
export function ConfirmButton({
  onConfirm,
  children,
  confirmText = '¿Seguro? Pulsa otra vez',
  className,
  variant = 'danger',
  size = 'sm',
  'aria-label': ariaLabel,
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
  variant?: 'danger' | 'ghost' | 'secondary';
  size?: 'sm' | 'md';
  'aria-label'?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      aria-label={armed ? confirmText : ariaLabel}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmText : children}
    </Button>
  );
}
