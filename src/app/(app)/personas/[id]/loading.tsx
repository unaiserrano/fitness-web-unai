/** Esqueleto de la ficha de una persona (cabecera, pestañas y contenido). */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="animate-pulse">
      <div className="mb-8 h-48 rounded-[var(--radius-card)] bg-band/90 sm:h-56" />
      <div className="mb-8 flex gap-7 border-b border-line pb-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-16 rounded-sm bg-surface-2" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-[var(--radius-card)] border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
