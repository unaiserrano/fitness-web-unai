/** Esqueleto de la pantalla de personas mientras llegan los datos. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="animate-pulse">
      <div className="mb-8 border-b border-ink/80 pb-5">
        <div className="h-3 w-12 rounded-sm bg-surface-2" />
        <div className="mt-3 h-11 w-64 rounded-sm bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface px-5 py-4">
            <div className="h-3 w-20 rounded-sm bg-surface-2" />
            <div className="mt-3 h-9 w-10 rounded-sm bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="mt-10 divide-y divide-line border-y border-ink/20">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 py-5">
            <div className="h-6 w-48 rounded-sm bg-surface-2" />
            <div className="mt-3 h-3 w-72 max-w-full rounded-sm bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
