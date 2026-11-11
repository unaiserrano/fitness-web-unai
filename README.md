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
# …o, si no tienes esos datos:
npm run db:seed                # datos de prueba inventados (personas demo-*)
npm run dev                    # http://localhost:3000
```

Sin `DATABASE_URL`, los datos se guardan en `.data/pglite`. Sin `APP_PASSWORD`, en local entras sin contraseña.

PGlite solo admite un proceso a la vez: **para `npm run dev` antes de lanzar `db:import` o `db:seed`** contra la base local.

| Comando | Qué hace |
| --- | --- |
| `npm run db:seed` | Carga 2 personas de prueba (Laura y Marco), 11 semanas y 12 ejercicios. Se puede repetir. |
| `npm run db:seed:reset` | Igual, pero antes borra las personas `demo-*`. |
| `npm run check` | Typecheck + tests + build: lo mismo que fallaría en Vercel. |

Con `DATABASE_URL` apuntando a Neon, `db:seed` pide `-- --yes` para no llenar producción de datos demo por accidente.

## Desplegar en Vercel

1. Importa el repo en Vercel (Add New › Project).
2. En el proyecto: **Storage › Create Database › Neon** y conéctala. Eso crea `DATABASE_URL`.
3. En **Settings › Environment Variables** añade `APP_PASSWORD` y `AUTH_SECRET`.
4. Despliega. El script `vercel-build` aplica las migraciones antes de compilar.
5. Para cargar los datos actuales en Neon, una sola vez desde tu ordenador:
   ```bash
   DATABASE_URL="(la de Neon)" npm run db:import
   ```

### Desde la terminal (CLI de Vercel, ya incluido en devDependencies)

```bash
npm run vercel:link     # enlaza la carpeta con el proyecto de Vercel (una vez)
npm run vercel:env      # baja las variables de Vercel a .env.local
npm run deploy          # despliegue de prueba (URL de preview)
npm run deploy:prod     # despliegue a producción
```

Si en la integración de Neon activas las ramas para previews, cada preview tiene su propia copia de la base de datos y puedes probar sin tocar producción.

## Tests

```bash
npm test
```

`tests/domain/golden.test.ts` compara la lógica nueva con la app anterior usando los datos reales (`data/legacy-export.json` y `data/legacy-golden.json`).
Esos archivos llevan datos de clientes y **no se suben al repo** (están en `.gitignore`); si no están, ese test se salta.

## Fases

- **Fase 1:** personas, rutina con calentamiento y recomendaciones, biblioteca, nota de WhatsApp (generar y leer), PDF, progreso y volumen.
- **Fase 2 (hecha en parte):**
  - **Diario** (`/personas/[id]/diario`): hitos, avisos y cambios; récords de cada semana; comentarios de la persona con estrella (los de dolor o molestias se marcan solos); apuntes y rutina de cada semana.
  - **Comida** (`/personas/[id]/dieta`): dieta por comidas y opciones, con calorías y macros calculadas y alternativas («o»), editor e impresión a PDF desde el navegador.
  - **Alimentos** (`/alimentos`): registro por marca, compartido por todas las personas.
  - **Progreso:** gráfica de energía y satisfacción.
- **Pendiente:** fotos de físico (necesita almacenamiento de archivos, por ejemplo Vercel Blob) y lectura de etiquetas con IA.
