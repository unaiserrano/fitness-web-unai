'use client';

import { useEffect, useRef, useState } from 'react';

/** Ancho del contenedor (para que las gráficas se dibujen a su tamaño real y el texto no encoja). */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // null hasta medir: así la gráfica nunca empuja el ancho de la página.
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.max(200, Math.round(el.getBoundingClientRect().width)));
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}
