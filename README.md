This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

Copy the .env.example file to .env and fill in the values.

```bash
npm install -g pnpm



pnpm install

mkdir -p public/files && chmod -R 755 public/files

### inicializar prisma
npx prisma generate --schema=./prisma/schema.prisma

### migrar
npx prisma migrate dev --name "initial_migration" --schema=./prisma/schema.prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma


pnpm run build

pnpm run start

```

npx prisma generate --schema=./prisma/schema.prisma

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Colas BullMQ y pipeline de procesamiento

Al subir un documento la petición responde al instante y el trabajo pesado corre en segundo plano sobre **tres colas BullMQ** (Redis), procesadas por workers dentro del propio proceso Next (arrancan desde `instrumentation.js`):

| Cola | Jobs | Concurrencia | Qué hace |
|---|---|---|---|
| `project-import` | `import-upload`, `import-sdlxliff`, `pipeline-review` | 2 | PDF→docx (LibreOffice), extracción y segmentación (Okapi Tikal + SRX), traducción DAAIT, persistencia de TUs; y la revisión LLM (`/content/post_edit`) |
| `mtqe-v1` | `pipeline-score` | 1 | Puntuación QE v1 de los segmentos nuevos — **el documento pasa a READY aquí** |
| `mtqe-v2` | `score-mtqe-v2` | 1 | Segunda puntuación (endpoint combined-score-with-references; requiere `MTQE_V2` + `MTQE_V2_API_KEY`, sin ellas se omite) |

Las colas MTQE van con concurrencia 1 a propósito: el servicio MTQE no tolera bien la puntuación en paralelo, y así el scoring nunca compite con la extracción/traducción de otros documentos.

### Cadena de jobs

```
import-upload / import-sdlxliff      [project-import]
        │
        ▼
pipeline-score  (QE v1 → READY)      [mtqe-v1]
        │
        ├──────────────► pipeline-review  (juez LLM)   [project-import]
        └──────────────► score-mtqe-v2   (QE v2)       [mtqe-v2]      (en paralelo)
```

### Reintentos (Attempts) y fallos

Todos los jobs comparten la misma política (`lib/queue.js`): **3 intentos con backoff exponencial desde 5s** (~5s, ~10s, ~20s). Un intento solo se consume si el handler lanza: dentro del scoring, un lote fallido se registra y se salta; el job entero solo reintenta ante una caída total del servicio (ningún segmento puntuado).

Al agotar los 3 intentos, cada tipo degrada distinto — **solo la fase de import puede dejar un documento en error**; todo lo posterior degrada sin bloquear la revisión humana:

| Job | Al agotar reintentos |
|---|---|
| `import-upload` / `import-sdlxliff` | Documento en estado de error (`FILE_ERROR`/`MTQE_ERROR` según causa) |
| `pipeline-score` | El documento se libera como **READY** igualmente (segmentos sin score = banda baja); el fallo queda en `pipelineStats.mtqeError` |
| `pipeline-review` | Solo se anota en `pipelineStats` (el documento ya estaba READY) |
| `score-mtqe-v2` | Solo informativo: `pipelineStats.mtqeV2Error`; la columna QE v2 muestra "—" |

### Monitor de colas

Los usuarios con rol **SUPER** tienen un monitor embebido en **`/dashboard/queues`** (entrada "Colas" del menú): pestaña por cola con contadores por estado, tabla de jobs con workspace/proyecto/documento por nombre, intentos, fechas y error, y acciones de **reintentar** (solo fallidos; los jobs de score/review son idempotentes — solo procesan segmentos sin resultado) y **eliminar** (nunca uno en ejecución). La API correspondiente (`/api/admin/queues*`) valida el rol en servidor.

## Cálculo de esfuerzo (panel "Effort" del editor)

Implementado en `lib/effort.js` (una sola fuente de verdad; el modal de la franja de stats y el contador "Weighted" del filtro la consumen).

**Por segmento:**

```
effortScore = min(QE v1, QE v2)        # si falta una métrica, se usa la que haya
discrepante = (ambas presentes) y |v1 − v2| ≥ 0.25
```

Se usa el **mínimo** (no la media) porque para estimar trabajo importa el riesgo: un segmento solo es "bueno" si ambos evaluadores coinciden. Un segmento **discrepante** cuenta como esfuerzo completo aunque una de las dos métricas sea alta — es el bucket "revisar primero". Un segmento **sin ninguna puntuación** cuenta como esfuerzo completo (peor caso hasta que llegue el score).

**Bandas y pesos** (α, sobre las palabras del texto origen):

| Banda (effortScore) | Peso α | Interpretación |
|---|---|---|
| ≥ 0.95 | 0.1 | lectura rápida |
| 0.85 – 0.94 | 0.3 | revisión ligera |
| 0.75 – 0.84 | 0.5 | revisión moderada |
| 0.50 – 0.74 | 0.8 | post-edición seria |
| < 0.50, sin score o discrepante | 1.0 | como traducir de cero |

**Por documento (o por corte filtrado):**

```
palabrasPonderadas = Σ (palabras_segmento × α_banda)
índiceEsfuerzo     = palabrasPonderadas / palabrasTotales × 100
horasEstimadas     = palabrasPonderadas / throughput      # 800 palabras ponderadas/hora por defecto
```

Las palabras son los tokens separados por espacios del literal origen (mismo criterio que la franja de stats). **Configurable por proyecto** vía `Project.settings.effort` (sin UI de momento):

```json
{ "weights": { "b95": 0.1, "b85": 0.3, "b75": 0.5, "b50": 0.8, "b0": 1, "disagree": 1 },
  "disagreement": 0.25,
  "throughputWph": 800 }
```

## Despliegue con Docker y persistencia de datos

El despliegue con Docker se hace con `./devops-docker.sh` (`docker compose build` + `up -d`). **Reconstruir la imagen o recrear el contenedor NO borra los archivos subidos**: `docker-compose.yml` guarda los datos en volúmenes con nombre, que viven fuera del contenedor y se vuelven a montar en cada arranque.

| Volumen | Punto de montaje | Contenido |
|---|---|---|
| `storage` | `/app/storage` | Carpetas de trabajo de documentos (original + XLIFF bilingüe, plantilla del export) |
| `uploads` | `/app/public/files` | Archivos subidos |
| `redis-data` | `/data` (servicio redis) | Cola BullMQ (AOF activado) |

La base de datos MySQL es **externa** (`DATABASE_URL`) y no forma parte del compose, así que ningún comando de Docker la afecta.

### ⚠️ Comandos que SÍ destruyen datos

Estos comandos eliminan los volúmenes y con ellos todos los documentos y archivos subidos. **No los ejecutes en producción** salvo que sea exactamente lo que quieres:

```bash
docker compose down -v          # el flag -v borra los volúmenes del proyecto
docker volume rm <volumen>      # borra un volumen concreto
docker volume prune             # borra todos los volúmenes no usados por un contenedor
docker system prune --volumes   # prune global incluyendo volúmenes
```

Un `docker compose down` **sin** `-v`, un `build`, un `up -d` o el `docker image prune -f` del script de deploy son seguros: solo tocan contenedores e imágenes, nunca los volúmenes.

Ten en cuenta que el contenido de `storage/` y `public/files` está referenciado desde la base de datos (p. ej. `Project.documentId` apunta a `storage/{documentId}/`): si se pierden los volúmenes, los proyectos existentes quedan huérfanos aunque la BD siga intacta — el XLIFF bilingüe es la plantilla estructural del export y no se puede regenerar.

### ⚠️ Base de datos compartida y sin backups

`DATABASE_URL` apunta a un MySQL remoto **compartido y sin backups automáticos**. Precauciones:

- Nunca uses `prisma migrate reset` ni `prisma db push --force-reset` contra esa BD.
- No configures `shadowDatabaseUrl` apuntando a una BD con datos reales: Prisma la **vacía** al validar migraciones (ya ocurrió una pérdida de datos por esto).
- Para migrar en producción usa solo `prisma migrate deploy` (es lo que hacen `devops.sh` y la imagen Docker al arrancar).
- Antes de una migración delicada, haz un dump manual: `mysqldump` de las tablas afectadas.

# pecat-europeana-v1
