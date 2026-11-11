'use client';

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'Georgia, serif', background: '#f4f1ea', color: '#16140f', margin: 0 }}>
        <main style={{ maxWidth: 480, margin: '15vh auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 40, lineHeight: 1, margin: 0 }}>Se ha caído la aplicación</h1>
          <p style={{ fontFamily: 'system-ui, sans-serif', color: '#5f5a4e', marginTop: 16 }}>Tus datos están a salvo. Prueba a recargar.</p>
          <button onClick={() => retry()} style={{ marginTop: 16, padding: '10px 18px', background: '#d9480f', color: '#fffaf5', border: 0, borderRadius: 6, fontSize: 15 }}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
