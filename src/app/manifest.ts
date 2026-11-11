import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cuaderno · seguimiento de entrenamiento',
    short_name: 'Cuaderno',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f1ea',
    theme_color: '#16140f',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
