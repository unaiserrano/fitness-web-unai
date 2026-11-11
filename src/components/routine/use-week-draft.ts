'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Week } from '@/domain/types';

/** Borrador editable de una semana con "cambios sin guardar" y deshacer. */
export function useWeekDraft(initial: Week | null) {
  const [saved, setSaved] = useState<Week | null>(initial);
  const [draft, setDraft] = useState<Week | null>(initial);

  const mutate = useCallback((fn: (w: Week) => void) => {
    setDraft((cur) => {
      if (!cur) return cur;
      const next = structuredClone(cur);
      fn(next);
      return next;
    });
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  return {
    draft,
    saved,
    dirty,
    mutate,
    /** Sustituye el borrador (semana nueva sin guardar). */
    replace: (w: Week | null) => setDraft(w),
    /** Marca el borrador como guardado. */
    markSaved: (w: Week) => {
      setSaved(w);
      setDraft(w);
    },
    reset: () => setDraft(saved),
    load: (w: Week | null) => {
      setSaved(w);
      setDraft(w);
    },
  };
}
