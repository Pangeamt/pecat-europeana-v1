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
| `project-import` | `import-upload`, `import-sdlxliff`, `pipeline-review` | 2 | Extracción, traducción DAAIT, persistencia de TUs y revisión LLM |
| `mtqe-v1` | `pipeline-score` | 1 | QE v1: el documento pasa a `READY` aquí |
| `mtqe-v2` | `score-mtqe-v2` | 1 | QE v2 por segmento (se omite si no hay `MTQE_V2`) |

```
import-upload / import-sdlxliff   [project-import]
        │
        ▼
pipeline-score (QE v1 → READY)    [mtqe-v1]
        ├──► pipeline-review (juez LLM)   [project-import]
        └──► score-mtqe-v2   (QE v2)      [mtqe-v2]
```

Todos los jobs: **3 intentos** con backoff exponencial desde 5 s. Solo la fase de import puede dejar un
documento en error (`FILE_ERROR` / `MTQE_ERROR`); lo posterior degrada sin bloquear la revisión.
Los usuarios `SUPER` tienen un monitor de colas en `/dashboard/queues`.

## Documentos

Cada documento tiene una carpeta de trabajo `storage/{documentId}/` con el original y el XLIFF bilingüe,
que es la **plantilla estructural del export y no cambia nunca** tras la extracción. Cada descarga se
reconstruye en una copia desechable (`.merge/`). Si se pierde esa carpeta, el documento no se puede exportar.

## Modelo de datos (MySQL)

`User`, `Workspace`, `Project`, `Tu`, `Tm` / `Glossary` (solo metadatos locales: el contenido vive en DAAIT)
y las tablas de unión. Enums: `Role` (SUPER, ADMIN, USER), `Status` del segmento y `ProjectStatus`
(UPLOADED → PROCESSING → … → READY, o FILE_ERROR / MTQE_ERROR).
