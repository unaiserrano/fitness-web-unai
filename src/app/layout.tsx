import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { THEME_SCRIPT } from '@/components/ui/theme-script';

export const metadata: Metadata = {
  title: { default: 'Seguimiento', template: '%s · Seguimiento' },
  description: 'Rutinas, notas semanales y progreso de tus clientes.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#12110e' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Pone el tema antes de pintar para que no parpadee. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
