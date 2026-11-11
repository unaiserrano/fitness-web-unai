/** Carga .env.local / .env para los scripts (Next.js lo hace solo; tsx no). */
for (const f of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* no existe: se ignora */
  }
}
