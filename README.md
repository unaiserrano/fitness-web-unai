# Seguimiento · fitness-web-unai

App para llevar a los clientes de entrenamiento: rutina semanal, nota de WhatsApp que rellenan, progreso, volumen por grupo muscular y PDF semanal.
Es la migración a un proyecto de verdad de la app «Seguimiento de Imad», con la misma lógica (comprobada con tests contra la app anterior).

## Stack

- **Next.js 16** (App Router, Server Components y Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS 4**, letras Inter y Plus Jakarta Sans, modo claro/oscuro/sistema
- **Postgres en Neon** con **Drizzle ORM** (en local, PGlite: Postgres en un archivo, sin instalar nada)
- **@react-pdf/renderer** para el PDF semanal en el servidor
- **Zod** para validar todo lo que se guarda, **Vitest** para los tests
- Acceso con una sola contraseña (cookie firmada con `jose`), pensado para un único usuario

## Estructura

```
src/
  domain/            Lógica pura, sin React ni base de datos (se puede testear sola)
    types.ts           Modelo: Athlete, Week, Day, Exercise, WorkSet…
    week.ts            Semanas: hechas, la que se pide, nueva semana a partir de otra…
    history.ts         Historia por ejercicio, puntos de progreso
    recommendation.ts  Recomendación de peso (Epley + RIR, redondeo al salto)
    volume.ts          Reparto de volumen por grupo muscular, fuerza estimada
    alerts.ts          Estancados, semanas sin descarga, convertir en descarga, periodos
    notes/             Nota de WhatsApp: generar, leer, mezclar con la semana, apuntes
    legacy.ts          Conversión desde la app anterior (importación)
    schemas.ts         Validación con Zod
  server/
    db/                Esquema Drizzle y conexión (Neon o PGlite)
    repositories/      Acceso a datos (personas, semanas, biblioteca)
    actions/           Server Actions (guardar semana, importar nota, biblioteca, personas, login)
    views/             Datos ya preparados para las páginas de Progreso y Volumen
    pdf/               PDF semanal (y sus letras)
    auth/              Sesión y comprobaciones de acceso
  components/          Interfaz: ui/, charts/, layout/, routine/, notes/, library/, athletes/
  app/                 Rutas: /, /personas/[id]/{progreso,volumen,rutina,nota,ajustes}, /biblioteca, /login
  proxy.ts             Protege todas las rutas con la contraseña
drizzle/               Migraciones SQL
scripts/               migrate.ts e import-legacy.ts
tests/                 Tests de la lógica
```

## En local

```bash
npm install
cp .env.example .env.local     # puedes dejarlo vacío para empezar
npm run db:import              # carga los datos de la app anterior (data/legacy-export.json)
npm run dev                    # http://localhost:3000
```

Sin `DATABASE_URL`, los datos se guardan en `.data/pglite`. Sin `APP_PASSWORD`, en local entras sin contraseña.

## Desplegar en Vercel

1. Importa el repo en Vercel (Add New › Project).
2. En el proyecto: **Storage › Create Database › Neon** y conéctala. Eso crea `DATABASE_URL`.
3. En **Settings › Environment Variables** añade `APP_PASSWORD` y `AUTH_SECRET`.
4. Despliega. El script `vercel-build` aplica las migraciones antes de compilar.
5. Para cargar los datos actuales en Neon, una sola vez desde tu ordenador:
   ```bash
   DATABASE_URL="(la de Neon)" npm run db:import
   ```

## Tests

```bash
npm test
```

`tests/domain/golden.test.ts` compara la lógica nueva con la app anterior usando los datos reales (`data/legacy-export.json` y `data/legacy-golden.json`).
Esos archivos llevan datos de clientes y **no se suben al repo** (están en `.gitignore`); si no están, ese test se salta.

## Fases

- **Fase 1 (esta):** personas, rutina con calentamiento y recomendaciones, biblioteca, nota de WhatsApp (generar y leer), PDF, progreso y volumen.
- **Fase 2:** alimentación (registro por marca, lectura de etiquetas), diario/hitos y fotos de físico. Los datos de alimentos, dieta e hitos ya se importan a la base de datos.
