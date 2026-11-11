import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), 'drizzle');

/**
 * Con DATABASE_URL (Vercel + Neon) se usa Postgres en Neon.
 * Sin ella (desarrollo), una base de datos Postgres local en un archivo (.data/pglite),
 * que se crea y migra sola: no hay que instalar nada.
 */
async function connect(): Promise<Database> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    return drizzle(neon(url), { schema }) as unknown as Database;
  }
  if (process.env.VERCEL) throw new Error('Falta DATABASE_URL: conecta una base de datos Neon en Vercel › Storage.');
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.data', 'pglite');
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Database;
}

const globalForDb = globalThis as unknown as { __db?: Promise<Database> };

export function getDb(): Promise<Database> {
  globalForDb.__db ??= connect();
  return globalForDb.__db;
}
