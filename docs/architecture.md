# Arquitectura

> **Verificado 2026-09-29** · Fuente: `CLAUDE.md`, `README-architecture.md` y `README.md` de este repo.
> Detalle completo del diseño modular en `README-architecture.md`.

## Stack

- **Next.js 16** (App Router), **React 19**, **Ant Design 5** + TailwindCSS 4.
- **Prisma 5** sobre **MySQL** (externo). **NextAuth 4** para la autenticación.
- **BullMQ + Redis**: los workers arrancan dentro del propio proceso Next (`instrumentation.js`).
- **Okapi Tikal 1.47** (Java) y **LibreOffice** headless en el host o en la imagen Docker.

## Capas

| Capa | Ruta | Papel |
|---|---|---|
| Handlers HTTP | `app/api/*` | Solo parsean, validan, llaman al servicio y responden. Sin lógica de negocio. |
| Módulos de dominio | `modules/<dominio>/` | `service.js`, `repository.js`, `schemas.js` (Joi), `index.js` (barrel). |
| Clientes del frontend | `services/*.ts` | Axios contra la API interna `/api/*`. |
| UI | `components/`, `app/dashboard/*` | React + Ant Design. |
| Infraestructura | `lib/` | Prisma, cliente DAAIT, validación de entorno (`env.js`), colas (`queue.js`). |

**Ojo con dos nombres parecidos:** `modules/memory/tu` son TUs de una **memoria** (viven en DAAIT);
`modules/tus` son TUs de un **documento** del proyecto (MySQL, modelo `Tu`).

## Colas y pipeline

| Cola | Jobs | Concurrencia | Qué hace |
|---|---|---|---|
| `project-import` | `import-upload`, `import-sdlxliff`, `pipeline-review` | 2 | Extracción, traducción DAAIT y persistencia de TUs: el documento pasa a `READY` aquí (`pipeline-review` está retirado) |
| `mtqe-v2` | `score-mtqe-v2` | 1 | QE v2 por segmento, único score (sin `MTQE_V2` no se puntúa) |
| `mtqe-v1` | `pipeline-score` | 1 | **Retirada**: solo drena jobs antiguos (READY + encolar QE v2); se borra en la próxima release |

```
import-upload / import-sdlxliff   [project-import]  → READY
        └──► score-mtqe-v2   (QE v2)      [mtqe-v2]
```

Todos los jobs: **3 intentos** con backoff exponencial desde 5 s. Solo la fase de import puede dejar un
documento en error (`FILE_ERROR` / `MTQE_ERROR`); lo posterior degrada sin bloquear la revisión.
Los usuarios `SUPER` tienen un monitor de colas en `/dashboard/queues`.

## Documentos

Cada documento tiene una carpeta de trabajo `storage/{documentId}/` con el original y el XLIFF bilingüe,
que es la **plantilla estructural del export y no cambia nunca** tras la extracción. Cada descarga se
reconstruye en una copia desechable (`.merge/`). Si se pierde esa carpeta, el documento no se puede exportar.

### SDLXLIFF (Trados) — `modules/documents/sdlxliff/`

Desde el 2026-09-30 sigue el modelo de module-file-translate (`app/xliff/sdl_merge.py`). La comparación que lo
motivó está en `documentacion/pecat-e/COMPARATIVA-SDLXLIFF-PECATE-VS-MFT.md`.

- **Importar** (`reader.js`):
  - los segmentos son los `<mrk mtype="seg">` del `seg-source`, también los que van dentro de `<g>`;
  - `externalId` = `tu::mid`;
  - las etiquetas en línea se convierten en los **mismos marcadores que la ruta de Okapi** (`<gN>…</gN>`,
    `<xN/>`, `<bN/>`, `<eN/>`), así que el `TagEditor` las protege. Nada se aplana: un `mrk` que no es de
    segmento viaja como `<xN/>`;
  - el texto se guarda tal cual: el NBSP se conserva y solo se recortan los bordes;
  - los `locked` y `translate="no"` no se editan.
- **Exportar** (`writer.js`, con `xmltree.js`): **empalma** nuestras traducciones sobre el texto original, así
  que todo lo demás queda byte a byte (medido: 2037/2037 ficheros reales idénticos sin cambios). Reglas:
  - solo se escribe en `<mrk>` que ya existen; las etiquetas se copian del `seg-source`;
  - la firma de etiquetas tiene que coincidir en orden con la del origen; si no, el segmento se salta y se cuenta;
  - cada destino lleva su **propia** copia de `lockTU`;
  - `sdl:seg`: revisado → `ApprovedTranslation`/`interactive`; match exacto de TM → `Translated`/`tm`; MT →
    `Draft`/`mt`;
  - lo que el cliente ya traía y nadie tocó no se reconfirma;
  - la salida se valida (bien formada + invariantes de `lockTU`) antes de entregarse.
- **Descarga** (`GET /api/file`): la cabecera `X-Pecat-Skipped-Segments` dice cuántos segmentos con traducción
  no se escribieron. Un documento importado antes de esta versión no tiene marcadores, así que sus segmentos
  con etiquetas se saltan: hay que volver a subirlo.
- **Tests**: `npm test` (`node --test`, `tests/sdlxliff/`).

## Modelo de datos (MySQL)

`User`, `Workspace`, `Project`, `Tu`, `Tm` / `Glossary` (solo metadatos locales: el contenido vive en DAAIT)
y las tablas de unión. Enums: `Role` (SUPER, ADMIN, USER), `Status` del segmento y `ProjectStatus`
(UPLOADED → PROCESSING → … → READY, o FILE_ERROR / MTQE_ERROR).
