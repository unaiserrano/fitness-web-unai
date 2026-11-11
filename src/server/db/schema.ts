import { boolean, integer, jsonb, pgTable, primaryKey, real, text, timestamp } from 'drizzle-orm/pg-core';
import type { AthleteConfig, Week } from '@/domain/types';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const athletes = pgTable('athletes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  startDate: text('start_date').notNull(),
  targetSessions: integer('target_sessions').notNull().default(4),
  noteStyle: text('note_style', { enum: ['standard', 'simple'] }).notNull().default('standard'),
  flexibleDays: boolean('flexible_days').notNull().default(false),
  config: jsonb('config').$type<AthleteConfig>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

/** Cada semana se guarda entera como documento JSON (días, ejercicios, series). */
export const weeks = pgTable(
  'weeks',
  {
    athleteId: text('athlete_id')
      .notNull()
      .references(() => athletes.id, { onDelete: 'cascade' }),
    number: integer('number').notNull(),
    content: jsonb('content').$type<Week>().notNull(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.athleteId, t.number] })],
);

/** Biblioteca de ejercicios, compartida por todas las personas. */
export const exercises = pgTable('exercises', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull().default('Otros'),
  execution: text('execution').notNull().default(''),
  videoUrl: text('video_url').notNull().default(''),
  weightStep: real('weight_step').notNull().default(2.5),
  volumeSplit: jsonb('volume_split').$type<Record<string, number> | null>(),
  ...timestamps,
});

/** Hitos del diario (fase 2). */
export const milestones = pgTable('milestones', {
  id: text('id').primaryKey(),
  athleteId: text('athlete_id')
    .notNull()
    .references(() => athletes.id, { onDelete: 'cascade' }),
  week: integer('week'),
  kind: text('kind').notNull().default('hito'),
  text: text('text').notNull(),
  ...timestamps,
});

/** Alimentos y dietas (fase 2): se guardan ya importados para no perder datos. */
export const foods = pgTable('foods', {
  slug: text('slug').primaryKey(),
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  ...timestamps,
});

export const diets = pgTable('diets', {
  athleteId: text('athlete_id')
    .primaryKey()
    .references(() => athletes.id, { onDelete: 'cascade' }),
  content: jsonb('content').$type<Record<string, unknown>>().notNull(),
  ...timestamps,
});
