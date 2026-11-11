import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite (solo en local) trae archivos WebAssembly: mejor no empaquetarlo.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Las letras del PDF se leen del disco en la ruta del PDF.
  outputFileTracingIncludes: {
    '/api/personas/[id]/semanas/[n]/pdf': ['./src/server/pdf/fonts/**/*'],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
