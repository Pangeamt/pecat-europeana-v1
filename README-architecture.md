# Arquitectura del Proyecto

## Objetivo

Este proyecto usa una arquitectura modular por dominio para escalar sin concentrar toda la logica en `app/api/*` y en componentes de UI.

## Estructura base

```
app/
  api/                  handlers HTTP delgados (parseo, auth, invocacion de servicios, respuesta)
components/             UI React (Ant Design)
hooks/                  hooks compartidos
services/               clientes HTTP del frontend (axios) con tipos en types/
store/                  estado global (zustand)
types/                  DTOs compartidos
lib/
  env.js                validacion de variables de entorno con Joi
  daait.js              cliente HTTP para API DAAIT
  prisma.js             cliente Prisma
  utils.js              utilidades generales
modules/
  shared/               auth, HttpError, toErrorResponse, similarity
    index.js            barrel export
  memory/               dominio de memorias de traduccion (Prisma + DAAIT)
    tm/
      repository.js     adaptador de API DAAIT para memorias
      service.js        casos de uso CRUD de TM
      tmx.js            parser TMX para extraer metadatos
      import.service.js casos de uso de importacion (TMX -> DAAIT)
      export.service.js casos de uso de exportacion (DAAIT -> TMX)
      schemas.js        schemas Joi
      index.js          barrel export
    tu/
      repository.js     adaptador de API DAAIT para TUs dentro de una TM
      service.js        CRUD + similitud (usa modules/shared/similarity)
      schemas.js
      index.js          barrel export
  projects/             dominio de proyectos (Prisma + MySQL)
    repository.js / service.js / import-service.js / logs-service.js
    schemas.js
    index.js
  tus/                  dominio de Translation Units del proyecto (Prisma)
    repository.js / service.js / schemas.js / index.js
  users/                dominio de usuarios
  files/                dominio de descargas/compartir archivos
```

## Dos dominios con nombre parecido

- `modules/memory/tu`: Translation Unit **dentro de una memoria de traduccion**, persistida en DAAIT. Asociada a una TM.
- `modules/tus`: Translation Unit **dentro de un proyecto**, persistida en MySQL via Prisma (`model Tu`, tabla `tus`). Asociada a un Project.

Son conceptos distintos aunque tengan nombre similar.

## Reglas de diseño

1. No agregar logica de negocio nueva en `route.js`.
2. Validar entrada con schemas del modulo (`schemas.js`).
3. Centralizar errores con `HttpError` + `toErrorResponse` (ambos con `code` estable).
4. Reusar `requireAuthUser` para auth en APIs.
5. Evitar llamadas HTTP directas desde componentes; usar `services/*`.
6. Importar siempre con el alias `@/`.
7. Cada modulo expone su API publica por `index.js` (barrel).
8. No acceder directamente a clientes de infraestructura (`prisma`, `daaitClient`) desde `service.js`; pasar por `repository.js`.

## Patrón recomendado en API Route

1. `await requireAuthUser()`.
2. Validar payload/query con schema del modulo.
3. Llamar servicio de dominio.
4. Responder con `Response.json(...)`.
5. En catch: `return toErrorResponse(error)`.

## Validacion de entorno

`lib/env.js` valida con Joi todas las variables necesarias al arrancar y expone un objeto `env` tipado. Si faltan o estan mal formadas, la app no arranca. Actualmente exigidas:

- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_BASE_URL`
- La integracion de memorias usa `DAAIT_API_HOST` cuando se quiere sobreescribir el host por defecto.

Opcionales: `SEGMENTED_TEXTS_HOST`, `MT_TEXTS_HOST`, `OXIGEN_API_HOST`, `DAAIT_API_HOST`, `MINT_CLIENT_ID`, `MINT_CLIENT_SECRET`, `MTQE`.

## Errores

`HttpError(status, message, code?)` y `toErrorResponse(error)` devuelven siempre:

```json
{ "code": "NOT_FOUND", "message": "Translation memory not found" }
```

Para errores Joi incluye `details: [{ path, message }]`.

## TM/TU internalizado

La logica de Translation Memory y Translation Units esta en esta app (antes en `pecat-tm`).

- API interna TM:
  - `GET|POST|PATCH /api/tm`
  - `DELETE /api/tm/:id`
  - `POST /api/tm/import`
  - `GET /api/tm/export`
- API interna TU:
  - `GET|POST|PATCH|DELETE /api/tu`
  - `GET /api/tu/all`
- Backend DAAIT centralizado en `lib/daait.js`.

## Siguiente expansión sugerida

- Migrar `services/*` restantes (`project.services.ts`, `user.services.ts`) a DTOs tipados.
- Reemplazar `console.error` por un logger estructurado (p. ej. `pino`).
- Adoptar TanStack Query para cacheo en UI (`useTmList`, listados de proyectos).
- Tests de integracion por modulo con Vitest + `supertest` sobre handlers.
