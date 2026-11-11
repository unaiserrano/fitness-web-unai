import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
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
    { media: '(prefers-color-scheme: light)', color: '#f5f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1013' },
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
