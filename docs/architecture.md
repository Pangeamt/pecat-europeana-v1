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
| `mtqe-v2` | `score-mtqe-v2` | 1 | QE v2 en tandas de hasta 50 segmentos, único score (sin `MTQE_V2` no se puntúa) |

```
import-upload / import-sdlxliff   [project-import]  → READY
        └──► score-mtqe-v2   (QE v2)      [mtqe-v2]
```

Todos los jobs: **3 intentos** con backoff exponencial desde 5 s. Solo la fase de import puede dejar un
documento en error (`FILE_ERROR` / `MTQE_ERROR`); lo posterior degrada sin bloquear la revisión.
Los usuarios `SUPER` tienen un monitor de colas en `/dashboard/queues`.

### Contrato con MTQE v2 (`/score-segments`)

Verificado 2026-10-05 contra `mtqe-v2-api` 2.6.5 · Fuente: `lib/mtqe-v2.js`, `tests/mtqe/mtqe-v2.test.mjs`.

`MTQE_V2` es la URL del servicio (`http://<host>:8800/mtqe/v2`); PECAT-E llama siempre a su
`POST /score-segments` con la cabecera `X-API-Key` (`MTQE_V2_API_KEY`).

```json
{
  "segments": [{ "source": "...", "target": "..." }],
  "source_language": "en-us",
  "target_language": "es-es",
  "ape": false,
  "tm_id": ["<id de memoria>"],
  "glossary_id": ["<id de glosario>"]
}
```

- **De 1 a 50 segmentos por petición** (51 → `422`). Un documento se parte en tandas de 50, una detrás de otra.
- **`ape` es obligatorio** (sin él → `422`); PECAT-E solo puntúa, así que va siempre a `false`.
- `tm_id` / `glossary_id` son las memorias y glosarios del documento (ids de DAAIT); el servicio busca él
  las referencias de cada segmento. Se omiten si el documento no tiene. Un id que no existe no rompe la llamada.
- Respuesta: una entrada por segmento **en el mismo orden**, con `score` de 0 a 100 (se guarda de 0 a 1) o
  `score: null` + `error` si ese segmento no se pudo puntuar. Sin clave → `401`.
- **El servicio no tiene callback.** Lo asíncrono lo pone PECAT-E: el documento ya está en `READY`, el job
  `score-mtqe-v2` guarda las notas de cada tanda en cuanto responde, y el editor abierto las recoge cada 5 s
  mientras `pipelineStats.stage` es `SCORING`.
- Las mismas llamadas (con un solo segmento) sirven para repuntuar al guardar un borrador y al aprobar.

Prueba contra el servicio real: `MTQE_V2_LIVE=http://<host>:8800/mtqe/v2 MTQE_V2_LIVE_KEY=<clave> npm test`.

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
- **Descarga** (`GET /api/file` y `GET /api/documents/<id>/export`): la cabecera `X-Pecat-Skipped-Segments` dice
  cuántos segmentos con traducción no se escribieron. Un documento importado antes de esta versión no tiene
  marcadores, así que sus segmentos con etiquetas se saltan: hay que volver a subirlo.
- **Tipo de las etiquetas** (`Tu.tagInfo`, JSON, desde 2026-10-01): las fichas enseñan el **tipo** como Trados
  (`glossary`, `unit`, `&deg;`…) y, al pasar el ratón, el código original. Mismo formato para todos los
  orígenes, `{ "<marcador>": { name, detail?, close?, equiv?, locked?, lockedText? } }`:
  - **SDLXLIFF**: `sdlxliff/tagdefs.js` lee `<tag-defs>` de la cabecera (tipo + código por `id`) y, para las
    referencias a contenido bloqueado (`<x xid="lockTU_…">`), el texto del `lockTU`. Se construye desde el mismo
    mapa de claves que los marcadores;
  - **Tikal/XLIFF** (`.xlf`, `.docx`…): `extraction/tag-info.js` usa `ctype`, `equiv-text` y el código del
    `<ph>/<bpt>/<ept>`;
  - sin información (tipo desconocido, o documento importado antes): la ficha se ve como siempre.
  Solo se muestra: ni las reglas de etiquetas ni el escritor lo leen.
- **Etiquetas en el orden del origen** (`modules/documents/tag-check.js`, `tagIssue`): una sola comprobación para el
  servidor y el editor. En SDLXLIFF exige el mismo conjunto **y el mismo orden**; en los demás formatos, el conjunto.
  - al importar, una MT con etiquetas que faltan, sobran o están **reordenadas** queda en `VALIDATION_FAILED`
    (no se autobloquea con TM ni pasa por el juez LLM) y el editor lo avisa;
  - guardar da 422 `INLINE_TAGS_MISMATCH` con el motivo;
  - el export no escribe un segmento cuyas etiquetas no coinciden (la puerta de `writer.js`, igual que el MFT);
  - **«Fix tags»** (`TagEditor/tag-rules.js`, `fixTags`): propone el destino con las etiquetas del origen, en su
    orden y colocadas por posición relativa; no se aplica solo y tiene «Undo fix».
- **XLIFF plano (`.xlf`, `.xliff`, desde 2026-10-01)**: misma cadena y mismo lector/escritor que SDLXLIFF
  (`isSpliceFormat`, `lib/splice-formats.js`), **sin Tikal**: medido en ficheros reales que una ida y vuelta por Tikal
  rellena los targets vacíos con el origen, reformatea y corrompe los no-ASCII (no pasa `-ie/-oe UTF-8`). Solo XLIFF 1.2 y UTF-8.
  - un `trans-unit` sin `<mrk mtype="seg">` es el segmento; su `<target>` se crea tras `<source>` si falta y lleva `state`
    (`signed-off` revisado, `needs-review-translation` MT, `translated` TM);
  - del cliente (no se pisa ni se edita): `approved="yes"` o `state` `signed-off`/`final`; un target con `state`
    `new`/`needs-translation` cuenta como vacío; un target con texto no se sobrescribe;
  - varios `<file>` repiten los `id`: con más de uno la clave del segmento lleva la posición del `<file>` (`2:7`);
  - detalle y mediciones: `documentacion/pecat-e/XLIFF-XLF-PROCESADO.md`.
  - **XLIFF 2.0** también: el `<segment>` es la unidad, el `state` va en el `<segment>`, y `pc/ph/sc/ec/sm/em/mrk` se tratan como los inline de 1.2;
  - **los vacíos de `.xlf`/`.xliff` también se traducen con DAAIT** (`translatesEmptiesOnImport`, decisión 2026-10-02; antes se dejaban vacíos). `.sdlxliff`, `.xlf`/`.xliff` y Tikal traducen, en **tandas de 50 en secuencia**
    (`DAAIT_PECAT_BATCH_SIZE`) con `document_id` y `last_batch` en cada petición. `document_id` lleva el id del filestore cuando el fichero lo tiene (Okapi/Tikal) y el id del documento si no (.sdlxliff/.xlf); DAAIT ≥ 2.3.52 lo usa como clave de la memoria volátil y de la sesión de Langfuse, y borra el borrador al llegar `last_batch`.
- **Tests**: `npm test` (`node --test`, `tests/sdlxliff/`, `tests/tags/`).

## Modelo de datos (MySQL)

`User`, `Workspace`, `Project`, `Tu`, `Tm` / `Glossary` (solo metadatos locales: el contenido vive en DAAIT)
y las tablas de unión. Enums: `Role` (SUPER, ADMIN, USER), `Status` del segmento y `ProjectStatus`
(UPLOADED → PROCESSING → … → READY, o FILE_ERROR / MTQE_ERROR).
