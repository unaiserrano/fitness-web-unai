/**
 * Aplica las migraciones de /drizzle.
 * - Con DATABASE_URL (Neon): migra esa base de datos. Vercel lo ejecuta en cada despliegue (script vercel-build).
 * - Sin DATABASE_URL: crea/migra la base de datos local en .data/pglite.
 */
import './env';
import path from 'node:path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const { getDb } = await import('../src/server/db/client');
    await getDb();
    console.log('Base de datos local lista en .data/pglite');
    return;
  }
  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');
  const { migrate } = await import('drizzle-orm/neon-http/migrator');
  await migrate(drizzle(neon(url)), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  console.log('Migraciones aplicadas en Neon');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
