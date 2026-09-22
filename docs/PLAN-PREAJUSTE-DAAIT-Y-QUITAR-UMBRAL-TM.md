# Plan — Preajuste de DAAIT en los perfiles + quitar el umbral de coincidencia de memorias

> **Estado:** aprobado en lo principal (2026-09-22); quedan abiertos los puntos de §5.
> **Rama:** `feature/documents-module`. Dos commits: (1) quitar el umbral, (2) preajuste en perfiles.
> **Entorno de prueba y despliegue:** `vssrv05.pangeanic.local`, `/home/a.armas/EUROPEANA/pecat-europeana-v1`.
> **Premisa:** el umbral que aplica DAAIT es el correcto; PECAT-E deja de tener umbral propio.

---

## 1. Qué hace DAAIT (verificado en su código, versión 2.3.49 = producción)

### 1.1 Preajuste (`llm_preset`)
- El perfil de DAAIT guarda **el nombre** de un preajuste: `POST /profile` y `PATCH /profile` con
  `llm_preset`. En el PATCH, un `null` explícito lo quita y omitir el campo no lo toca. Un nombre que no
  existe → `400 "No existe el preset …"`.
- Lo que aporta el preajuste lo resuelve DAAIT, no PECAT-E:
  - **modelos por rol y lotes**: se leen en cada petición (`/content/pecat` y `/content/post_edit`);
  - **nivel (`task_level`) y memoria volátil (`draft_mode`)**: se copian al perfil al guardarlo y ganan a lo
    que mande la petición;
  - un preajuste desactivado o borrado se ignora (con aviso en el log de DAAIT): la traducción sigue con lo
    que tenga el perfil, nunca falla por eso.
- Listado: `GET <DAAIT_API_HOST>/llm/presets` → `[{ name, description, active, available,
  unavailable_reason, roles[{role, model_name, status}], grouping, task_level, draft_mode }]`.
- En producción (2026-09-22) hay tres: `basic` (`pangeanic_llm`), `medium` (`gemini-3.7-flash`) y
  `advanced` (`gpt-5.4`). **Los tres fijan `task_level = MEDIUM`**; `basic` además fija memoria volátil
  `DOCUMENT`.

### 1.2 Umbral de memorias
- En `/content/pecat` el `tm_threshold` de la petición es **solo de presentación**: decide si la mejor
  coincidencia sale con `tm_match = true`. No filtra lo que ve el LLM. Si no se manda, vale **1.0**.
- Lo que ve el LLM lo decide el umbral del **perfil de DAAIT** (`memory_filter_threshold`, 0 en los perfiles
  que crea PECAT-E) más el suelo de la plataforma.
- PECAT-E solo bloquea un segmento como match de TM si `tm_match === true && tm_score === 1`. Con el 1.0 por
  defecto el resultado es idéntico → **quitar el umbral no cambia ni la traducción ni los bloqueos**.
- ⚠️ `tm_info` llega **sin filtrar** (DAAIT lo construye con las referencias antes de su filtro): sin el
  umbral de PECAT-E, la pestaña *TMs* del editor enseña todas las coincidencias, también las de nota baja.

---

## 2. Commit 1 — Quitar el umbral de coincidencia de memorias

**Backend**
| Fichero | Cambio |
|---|---|
| `lib/daait.js` (`pecatTranslate`) | No mandar `tm_threshold`. |
| `modules/documents/sdlxliff-service.js` (`enrichSdlxliffSegments`) | Quitar el parámetro `tmThreshold`. |
| `modules/documents/import-service.js` | Quitar `normalizeThreshold`, la lectura de `tm_threshold`, `tmThreshold` en `resolveDocumentAssets`, en `document.create` y en los payloads de los jobs. |
| `modules/projects/schemas.js` | Quitar `threshold` (aceptarlo y descartarlo con `.strip()` para no dar 400 a una pestaña con el frontend anterior). |
| `modules/projects/service.js`, `repository.js` | No escribir ni devolver `tmThreshold` (también en la SQL del listado). |
| `app/api/projects/[id]/documents/route.js` | Comentario. |

**Frontend**
| Fichero | Cambio |
|---|---|
| `components/Projects/add.jsx`, `EditProjectModal.jsx`, `detail.jsx` | Fuera el campo y la fila "Umbral de coincidencia de memorias". |
| `components/Documents/add.jsx` | Fuera el deslizador de umbral y `tm_threshold` del envío. |
| `components/Tus/list.jsx`, `tmTool.jsx` | Fuera `tmThreshold`, el filtro y el interruptor "Under Threshold" (ver §5, P1). |
| `components/Tus/statsTus.jsx` | Fuera las etiquetas "Mode" y "Threshold". |
| `services/project.services.ts` | Tipos. |
| `lib/i18n/locales/{en,es}.json` | Fuera `documents.add.thresholdLabel` y `projects.create.thresholdLabel`; reescribir `projects.subtitle`. Borrar `documents.add.step2Subtitle`, `projects.create.settingsSubtitle` y `documents.add.summaryTmMode`, que no usa ningún componente. |

**Base de datos:** sin migración. `client_projects.tmThreshold` y `projects.tmThreshold` se quedan (tienen
valor por defecto) y se marcan como obsoletas en `schema.prisma` (ver §5, P3).

**No cambia:** traducción, bloqueos por match exacto, referencias de MTQE v1/v2 (ya cogen las 2 primeras
de `tm_info`), columna *Fuzzy*, juez LLM, evaluación en vivo, esfuerzo, export.

---

## 3. Commit 2 — Preajuste de DAAIT en los perfiles

**Decisión:** el perfil **solo guarda el nombre** del preajuste; DAAIT aplica el resto.

**Base de datos:** migración aditiva
`prisma/migrations/2026092xxxxxxx_profile_llm_preset/migration.sql`:
`ALTER TABLE profiles ADD COLUMN llmPreset VARCHAR(64) NULL;` + `llmPreset String?` en `schema.prisma`.

**Backend**
| Fichero | Cambio |
|---|---|
| `lib/daait.js` | `listLlmPresets()` → `GET /llm/presets` (timeout de listado). `createProfile`/`updateProfile` mandan `llm_preset`; en el PATCH, `null` explícito para quitarlo. |
| `modules/profiles/daait-repository.js` | `llm_preset` en el payload del espejo. |
| `modules/profiles/schemas.js` | `llmPreset: string ≤ 64 \| null` en crear y editar. |
| `modules/profiles/service.js` | Guardar y devolver `llmPreset`. |
| `modules/profiles/…` + `app/api/profiles/presets/route.js` (nuevo) | `GET /api/profiles/presets`, solo ADMIN/SUPER: los preajustes de DAAIT (nombre, descripción, activo, disponible, nivel, memoria volátil, modelos por rol). |

**Frontend**
| Fichero | Cambio |
|---|---|
| `components/Profiles/add.jsx`, `detail.jsx` | Selector "Preajuste de DAAIT" con opción vacía ("ninguno"). Muestra el guardado **solo si sigue en la lista** de DAAIT; si se borró allí, el selector sale vacío. |
| `components/Profiles/list.jsx` | Etiqueta con el preajuste del perfil. |
| `services/profiles.services.ts` | Tipos + `listPresetsRequest`. |
| `lib/i18n/locales/{en,es}.json` | Textos. |

**Efecto:** los perfiles existentes no cambian (`llmPreset = null`). Un perfil con preajuste pasa a traducir
y revisar con los modelos del preajuste (cambian la calidad y el coste), y queda en nivel MEDIUM.

---

## 4. Prueba y despliegue

1. Local: `pnpm lint` y `pnpm build`.
2. vssrv05: `git status`/rama del checkout, `prisma migrate status` y copia (`mysqldump`) de la tabla
   `profiles` antes de migrar; después `./devops.sh` (o `./devops-docker.sh`, según cómo esté montado).
3. Pruebas en vssrv05:
   - crear un perfil con cada preajuste → en DAAIT `GET /profile/{id}` tiene `llm_preset` y nivel MEDIUM;
     cambiarlo a otro y quitarlo (`null`);
   - un preajuste que ya no está en la lista → el selector sale vacío;
   - subir un `.docx` y un `.sdlxliff` → la traducción no manda `tm_threshold`, los matches exactos siguen
     bloqueados y el juez LLM corre;
   - crear/editar un proyecto sin el campo de umbral; pestaña *TMs* de un documento antiguo y de uno nuevo.

**Cómo se revierte:** commit 1 → revert (las columnas siguen ahí). Commit 2 → revert; la columna
`llmPreset` puede quedarse (es nullable) y en DAAIT basta `PATCH /profile` con `llm_preset: null`.

---

## 5. Decisiones

| # | Punto | Decisión |
|---|---|---|
| P1 | Pestaña *TMs* sin umbral | ✅ Se enseña todo lo que devuelve DAAIT (ordenado por nota, con la nota visible). Sin interruptor. |
| P2 | "Modo TM" (`standard`/`smart`), que DAAIT ignora desde el 2026-09-10 | ✅ Se elimina en el commit 1: no se envía, no se guarda y desaparece de la pantalla. |
| P3 | Columnas `tmThreshold` / `tmMode` en MySQL | ⏳ Pendiente. Mientras tanto se quedan, marcadas como obsoletas en `schema.prisma`, sin leerse ni escribirse (conservan su valor por defecto). Borrarlas exige una migración y que ningún despliegue antiguo las siga usando. |
| P4 | Nivel del perfil (`task_level`) | ✅ PECAT-E deja de enviarlo, a DAAIT y en `/content/post_edit`, y se quita el selector de nivel del perfil. DAAIT aplica el suyo: MEDIUM por defecto o el que fije el preajuste. Los perfiles que ya existen en DAAIT conservan el nivel que tengan. Va en el commit 2. |
| P5 | Acceso a vssrv05 y a qué MySQL apunta su `.env` | ⏳ Pendiente del usuario. |

## 6. Propuesta pendiente — obligar a traducir siempre con perfil

Hoy PECAT-E traduce **sin perfil** en estos casos:
1. **Proyecto sin perfil.** Es opcional desde el commit `3dd24e9` (2026-09-02); también los proyectos
   "General" heredados.
2. **Documento con selección manual** de TMs/glosarios (interruptor "usar perfil del proyecto" apagado).
3. **Perfil antiguo con par fijo** que no coincide con el del documento.
4. **DAAIT responde 404 al perfil** (espejo inexistente o perfil borrado): se reintenta sin perfil.
5. **Se quita el perfil al editar el proyecto** (`profileId: null`).

Sin perfil no hay juez LLM (se salta) ni evaluación en vivo, y no se aplican las instrucciones, la formalidad
ni el preajuste.

**Cómo sería (opción recomendada):**
- **Proyecto:** perfil obligatorio al crear; al editar se puede cambiar, pero no quitar.
- **Subida:** siempre con el perfil del proyecto; desaparece la selección manual de TMs/glosarios. Con
  perfil, DAAIT solo busca en los recursos adjuntos al perfil, así que una TM elegida a mano fuera del perfil
  se ignoraría sin avisar.
- **Proyecto sin perfil (antiguos):** la subida se rechaza con un 409 que dice "asigna un perfil al proyecto".
- **Perfil que no encaja con el par o 404 en DAAIT:** error claro en vez de traducir sin perfil. Ante un 404,
  antes de fallar se puede recrear el espejo del perfil a partir del registro local y reintentar.
- **Borrar un perfil** que usa algún proyecto → 409.

**Qué afecta:**
- Los proyectos que hoy no tienen perfil: hay que asignárselo antes de poder subir documentos. Hay que
  contarlos en la BD.
- Revierte a propósito el commit `3dd24e9`.
- Cada workspace necesita al menos un perfil (y DAAIT disponible) antes de crear proyectos.
- No afecta a los documentos ya traducidos, al editor ni a la exportación.

Alternativas: (B) perfil obligatorio, pero la selección manual se queda limitada a un subconjunto de los
recursos del perfil; (C) perfil por documento (elegible al subir, por defecto el del proyecto), lo que exige
columna nueva y que el juez LLM use el perfil del documento.
