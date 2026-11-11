import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { doneWeeks, hasRehab } from '@/domain/week';
import { assertAuthorized } from '@/server/auth/guard';
import { WeekPdf } from '@/server/pdf/week-pdf';
import { getAthlete } from '@/server/repositories/athletes';
import { listWeeks } from '@/server/repositories/weeks';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  try {
    await assertAuthorized();
  } catch {
    return new Response('No autorizado', { status: 401 });
  }
  const { id, n } = await params;
  const number = Number(n);
  const [athlete, weeks] = await Promise.all([getAthlete(id), listWeeks(id)]);
  const week = weeks.find((w) => w.number === number);
  if (!athlete || !week) return new Response('No encontrado', { status: 404 });
  const previous = doneWeeks(weeks).filter((w) => w.number < number).slice(-1)[0] ?? null;
  const buffer = await renderToBuffer(createElement(WeekPdf, { athlete, week, previous, hasRehab: hasRehab(athlete, weeks) }) as Parameters<typeof renderToBuffer>[0]);
  const filename = `${athlete.name.replace(/\s+/g, '_')}_Semana_${number}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
