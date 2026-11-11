/**
 * PDF semanal con el diseño "deportivo" de siempre: portada negra con la franja naranja,
 * un día por página con su calentamiento, y una última página de apuntes.
 */
import path from 'node:path';
import { Document, Font, Link, Page, Path, Polygon, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import { blockType } from '@/domain/calendar';
import { findExercise } from '@/domain/history';
import { isDistance, kgLabel, repsLabel, tempoLabel } from '@/domain/format';
import { formatNum } from '@/domain/numbers';
import { exerciseKey, normalize, pad2 } from '@/domain/text';
import type { Athlete, Day, Week } from '@/domain/types';
import { isSetDone, rehabCount, sessionsDone, totalSets } from '@/domain/week';

const FONT_DIR = path.join(process.cwd(), 'src', 'server', 'pdf', 'fonts');
let registered = false;
function registerFonts() {
  if (registered) return;
  Font.register({
    family: 'Inter',
    fonts: [400, 700, 800, 900].map((w) => ({ src: path.join(FONT_DIR, `inter-latin-${w}-normal.woff`), fontWeight: w })),
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const mm = (v: number) => v * 2.8346;
const C = { ink: '#0e0e0e', orange: '#FF5A1F', grey: '#f1f1f1', line: '#dddddd', soft: '#eeeeee', muted: '#555555', faint: '#9a9a9a', red: '#d92d20', green: '#1e7a43' };

const s = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9.5, color: C.ink, paddingHorizontal: mm(14), paddingBottom: mm(14) },
  cover: { backgroundColor: C.ink, color: '#fff', marginHorizontal: mm(-14), paddingTop: mm(16), paddingHorizontal: mm(14), paddingBottom: mm(10), position: 'relative', overflow: 'hidden' },
  kicker: { fontWeight: 800, letterSpacing: 2.4, fontSize: 8, color: C.orange },
  coverName: { fontWeight: 900, fontSize: 60, lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: -2, marginTop: mm(3) },
  coverWeek: { fontWeight: 900, fontSize: 22, textTransform: 'uppercase', marginTop: mm(2) },
  coverDates: { color: '#bbbbbb', marginTop: mm(2) },
  days: { flexDirection: 'row', gap: mm(2.5), marginTop: mm(6) },
  dayCard: { flex: 1, borderWidth: 2, borderColor: C.ink, padding: mm(3) },
  dayCardSmall: { fontWeight: 800, fontSize: 7.5, textTransform: 'uppercase', color: C.orange },
  dayCardBig: { fontWeight: 900, fontSize: 14, textTransform: 'uppercase' },
  dayCardMeta: { fontSize: 8, color: C.muted },
  stats: { flexDirection: 'row', gap: mm(2.5), marginTop: mm(3) },
  stat: { flex: 1, backgroundColor: C.grey, padding: mm(3) },
  statBig: { fontWeight: 900, fontSize: 20 },
  statLabel: { fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: mm(4), paddingTop: mm(14), borderBottomWidth: 4, borderBottomColor: C.ink, paddingBottom: mm(2), marginBottom: mm(2) },
  headBig: { fontWeight: 900, fontSize: 36, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: -1 },
  headMeta: { fontWeight: 700, fontSize: 8.5, textTransform: 'uppercase', color: C.orange, paddingBottom: mm(1) },
  row: { flexDirection: 'row', gap: mm(3), paddingVertical: mm(3), borderBottomWidth: 1, borderBottomColor: C.line, alignItems: 'center' },
  num: { width: mm(14), fontWeight: 900, fontSize: 22, color: C.orange },
  main: { flex: 1 },
  name: { fontWeight: 800, fontSize: 11, textTransform: 'uppercase' },
  sub: { color: '#666666', fontSize: 8 },
  coach: { fontSize: 8, marginTop: mm(1), lineHeight: 1.35, borderLeftWidth: 3, borderLeftColor: C.orange, paddingLeft: mm(2), color: '#333333' },
  sets: { width: mm(72) },
  setWrap: { borderBottomWidth: 1, borderBottomColor: C.soft, paddingVertical: mm(0.8) },
  prev: { fontSize: 6.8, color: C.faint, paddingLeft: mm(7) },
  setRow: { flexDirection: 'row', alignItems: 'flex-end' },
  setN: { width: mm(7), fontWeight: 900, fontSize: 7.5, color: C.orange },
  setReps: { width: mm(22), fontWeight: 800 },
  setKg: { width: mm(20), fontWeight: 800 },
  setRir: { flex: 1, color: C.muted, fontSize: 8.5 },
  legend: { backgroundColor: C.grey, borderLeftWidth: 4, borderLeftColor: C.orange, paddingVertical: mm(2.4), paddingHorizontal: mm(3), fontSize: 8.2, lineHeight: 1.5, marginTop: mm(2), marginBottom: mm(1) },
  video: { marginTop: mm(1.4), alignSelf: 'flex-start', backgroundColor: C.orange, paddingVertical: mm(0.9), paddingHorizontal: mm(2.6), flexDirection: 'row', alignItems: 'center', gap: 3, textDecoration: 'none' },
  videoText: { color: '#fff', fontWeight: 800, fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 0.5 },
  badge: { fontSize: 6.5, fontWeight: 900, color: '#fff', backgroundColor: C.orange, paddingHorizontal: mm(1.6), paddingVertical: mm(0.5), marginLeft: mm(1.5), textTransform: 'uppercase' },
  warm: { backgroundColor: C.grey, borderLeftWidth: 4, borderLeftColor: C.ink, paddingTop: mm(2.4), paddingHorizontal: mm(3), paddingBottom: mm(1.6), marginVertical: mm(2) },
  warmTitle: { fontWeight: 900, textTransform: 'uppercase', fontSize: 8.5, letterSpacing: 0.3 },
  warmNote: { fontWeight: 400, textTransform: 'none', color: C.muted, fontSize: 8 },
  warmRow: { flexDirection: 'row', alignItems: 'center', gap: mm(2), paddingVertical: mm(1.1), borderBottomWidth: 1, borderBottomColor: '#e0e0e0', fontSize: 9 },
  kick: { fontWeight: 900, textTransform: 'uppercase', fontSize: 8.5, letterSpacing: 0.3, marginTop: mm(3) },
  boxes: { flexDirection: 'row', gap: mm(3) },
  box: { flex: 1, backgroundColor: C.grey, padding: mm(4), borderTopWidth: 5 },
  boxTitle: { fontWeight: 900, textTransform: 'uppercase', fontSize: 8.5, marginBottom: mm(2) },
  li: { flexDirection: 'row', marginBottom: mm(1.6), lineHeight: 1.4 },
  bullet: { width: mm(3) },
});

function VideoButton({ url }: { url: string }) {
  if (!url) return null;
  return (
    <Link src={url} style={s.video}>
      <Svg width={6} height={7} viewBox="0 0 6 7">
        <Polygon points="0,0 6,3.5 0,7" fill="#ffffff" />
      </Svg>
      <Text style={s.videoText}>Vídeo</Text>
    </Link>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={s.li} wrap={false}>
          <Text style={s.bullet}>•</Text>
          <Text style={{ flex: 1 }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/** Franja naranja girada de la portada (recortada por el propio dibujo). */
function CoverStripe() {
  // Igual que el PDF de siempre: cuadrado de 120 mm, 30 mm fuera por la derecha y 20 mm por arriba, girado 25°.
  const W = 595.28;
  const H = mm(140);
  const size = mm(120);
  const cx = W + mm(30) - size / 2;
  const cy = -mm(20) + size / 2;
  const a = (25 * Math.PI) / 180;
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, y]) => {
    const px = (x * size) / 2;
    const py = (y * size) / 2;
    return `${(cx + px * Math.cos(a) - py * Math.sin(a)).toFixed(1)},${(cy + px * Math.sin(a) + py * Math.cos(a)).toFixed(1)}`;
  });
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Path d={`M${corners.join(' L')} Z`} fill={C.orange} fillOpacity={0.95} />
    </Svg>
  );
}

export interface WeekPdfProps {
  athlete: Athlete;
  week: Week;
  previous: Week | null;
  hasRehab: boolean;
}

export function WeekPdf({ athlete, week, previous, hasRehab }: WeekPdfProps) {
  registerFonts();
  const cfg = athlete.config;
  const flex = athlete.flexibleDays;
  const days = week.days;
  const notes = week.notes;
  const remember = notes.remember.length ? notes.remember : cfg.remember;
  const rc = previous ? rehabCount(previous) : null;

  return (
    <Document title={`${athlete.name} · Semana ${week.number}`} author="Seguimiento" language="es">
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <CoverStripe />
          <Text style={s.kicker}>PLAN DE ENTRENAMIENTO</Text>
          <Text style={s.coverName}>{athlete.name}</Text>
          <Text style={s.coverWeek}>
            Semana {week.number}
            {week.deload ? ' · descarga' : ''}
          </Text>
          <Text style={s.coverDates}>{week.dates}</Text>
        </View>
        <View style={s.days}>
          {days.map((d) => (
            <View key={d.day} style={s.dayCard}>
              <Text style={s.dayCardSmall}>{d.day}</Text>
              <Text style={s.dayCardBig}>{d.block}</Text>
              <Text style={s.dayCardMeta}>
                {blockType(d.block) ? `${blockType(d.block)} · ` : ''}
                {totalSets(d)} series
              </Text>
            </View>
          ))}
        </View>
        {previous ? (
          <View style={s.stats}>
            {[
              ['Entrenamientos', `${sessionsDone(previous)} de ${athlete.targetSessions}`],
              ...(hasRehab ? [['Rehabilitación', rc == null ? '—' : `${rc} de 4`]] : []),
              ['Peso corporal', previous.bodyWeight != null ? `${formatNum(previous.bodyWeight)} kg` : '—'],
            ].map(([l, v]) => (
              <View key={l} style={s.stat}>
                <Text style={s.statBig}>{v}</Text>
                <Text style={s.statLabel}>{l}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {cfg.rehab.length ? (
          <View>
            <View style={[s.head, { paddingTop: mm(7) }]}>
              <Text style={s.headBig}>Rehab</Text>
              <Text style={s.headMeta}>{[cfg.rehabZone, cfg.rehabText].filter(Boolean).join(' · ')}</Text>
            </View>
            {cfg.rehab.map((r, i) => (
              <View key={i} style={s.row} wrap={false}>
                <Text style={s.num}>{pad2(i + 1)}</Text>
                <View style={s.main}>
                  <Text style={s.name}>{r.name}</Text>
                  <Text style={s.sub}>{tempoLabel(r.tempo)}</Text>
                  <VideoButton url={r.videoUrl} />
                </View>
                <View style={s.sets}>
                  {r.reps
                    .split('/')
                    .map((p) => p.trim())
                    .filter(Boolean)
                    .map((p, k) => (
                      <View key={k} style={[s.setRow, s.setWrap]}>
                        <Text style={s.setN}>S{k + 1}</Text>
                        <Text style={s.setReps}>{p} reps</Text>
                      </View>
                    ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Page>

      {days.map((d) => (
        <DayPage key={d.day} day={d} previous={previous} flexible={flex} />
      ))}

      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <Text style={s.headBig}>Apuntes</Text>
          <Text style={s.headMeta}>Semana {week.number}</Text>
        </View>
        <View style={s.boxes}>
          {[
            ['Lo que va bien', notes.good, C.green],
            ['Lo que ha fallado', notes.bad, C.red],
            ['Lo que no puede fallar', notes.mustNot, C.orange],
          ].map(([t, items, col]) => (
            <View key={t as string} style={[s.box, { borderTopColor: col as string }]}>
              <Text style={s.boxTitle}>{t as string}</Text>
              <Bullets items={items as string[]} />
            </View>
          ))}
        </View>
        {remember.length ? (
          <View>
            <Text style={[s.kick, { marginTop: mm(5), marginBottom: mm(2) }]}>Recuerda</Text>
            <Bullets items={remember} />
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

function DayPage({ day, previous, flexible }: { day: Day; previous: Week | null; flexible: boolean }) {
  const t0 = blockType(day.block);
  const tipo = t0 && !normalize(day.block).startsWith(normalize(t0)) ? t0 : '';
  const warm = day.warmup.filter((x) => x.name.trim());
  return (
    <Page size="A4" style={s.page}>
      <View style={s.head}>
        <Text style={s.headBig}>{day.day}</Text>
        <Text style={s.headMeta}>{[day.block, tipo, `${day.exercises.length} ejercicios`, `${totalSets(day)} series`].filter(Boolean).join(' · ')}</Text>
      </View>
      {warm.length ? (
        <View>
          <View style={s.warm} wrap={false}>
            <Text style={s.warmTitle}>
              Calentamiento{day.warmupNote ? <Text style={s.warmNote}>{`   ${day.warmupNote}`}</Text> : null}
            </Text>
            {warm.map((x, i) => (
              <View key={i} style={[s.warmRow, i === warm.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                <Text style={{ width: mm(6), fontWeight: 900, color: C.orange }}>{i + 1}</Text>
                <Text style={{ flex: 1, fontWeight: 800 }}>{x.name}</Text>
                <Text style={{ width: mm(34), fontWeight: 700, fontSize: 8.5, color: '#333333' }}>{x.dose}</Text>
                <View style={{ width: mm(20), alignItems: 'center' }}>{x.videoUrl ? <VideoButton url={x.videoUrl} /> : null}</View>
              </View>
            ))}
          </View>
          <Text style={s.kick}>Entrenamiento</Text>
        </View>
      ) : null}
      <View style={s.legend}>
        {previous ? (
          <Text>
            En cada serie tienes lo que te pido esta semana: repeticiones, kilos que te recomiendo y RIR.{' '}
            <Text style={{ fontWeight: 800 }}>Encima de cada serie, en gris, tienes lo que hiciste la semana pasada</Text>, para que veas de dónde vienes.
          </Text>
        ) : (
          <Text>
            En cada serie tienes las repeticiones y el RIR que te pido. <Text style={{ fontWeight: 800 }}>Los kilos, los que te dejen acabar la serie con ese RIR</Text>:
            apúntalos para que la semana que viene sepamos de dónde partes.
          </Text>
        )}
      </View>
      {day.exercises.map((e, i) => {
        const prevE = previous ? findExercise(previous, exerciseKey(day.day, e.name, flexible), flexible) : null;
        const isNew = !!previous && !prevE;
        const more = !!prevE && e.sets.length > prevE.sets.length;
        return (
          <View key={i} style={s.row} wrap={false}>
            <Text style={s.num}>{pad2(i + 1)}</Text>
            <View style={s.main}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={s.name}>{e.name}</Text>
                {isNew ? <Text style={s.badge}>Nuevo</Text> : more ? <Text style={s.badge}>+1 serie</Text> : null}
              </View>
              {e.execution ? <Text style={s.sub}>{tempoLabel(e.execution)}</Text> : null}
              {e.coachNote ? <Text style={s.coach}>{e.coachNote}</Text> : null}
              <VideoButton url={e.videoUrl} />
            </View>
            <View style={s.sets}>
              {e.sets.map((set, k) => {
                const ps = prevE?.sets.find((x) => x.n === set.n);
                let grey = '';
                if (ps && isSetDone(ps)) {
                  const r = ps.result;
                  grey = [isDistance(r.repsText) ? r.repsText : `${r.reps} reps`, r.kg == null ? '' : r.kg === 0 ? 'sin peso' : `${formatNum(r.kg)} kg`, r.rir != null ? `RIR ${formatNum(r.rir)}` : '']
                    .filter(Boolean)
                    .join(' · ');
                }
                return (
                  <View key={k} style={[s.setWrap, k === e.sets.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                    {grey ? <Text style={s.prev}>Sem. pasada: {grey}</Text> : null}
                    <View style={s.setRow}>
                      <Text style={s.setN}>S{set.n}</Text>
                      <Text style={s.setReps}>{repsLabel(set.target.reps)}</Text>
                      <Text style={s.setKg}>{kgLabel(set.target)}</Text>
                      <Text style={s.setRir}>{set.target.rir !== '' && set.target.rir != null ? `RIR ${set.target.rir}` : ''}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </Page>
  );
}
