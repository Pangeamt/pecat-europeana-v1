# Arquitectura del Proyecto

## Objetivo
Este proyecto usa una arquitectura modular por dominio para escalar sin concentrar toda la logica en `app/api/*` y en componentes de UI.

## Estructura base

- `modules/shared/`: autenticacion, errores HTTP, utilidades compartidas de backend.
- `modules/<domain>/`: logica de negocio por dominio (`users`, `projects`, etc.).
  - `schemas.js`: validaciones de entrada.
  - `repository.js`: acceso a Prisma/DB.
  - `service.js`: casos de uso de negocio.
  - `import-service.js` o `<feature>-service.js`: flujos especializados.
- `app/api/*/route.js`: handlers HTTP delgados (parseo, auth, invocacion de servicios, respuesta).
- `services/*.services.ts`: clientes HTTP del frontend para desacoplar componentes de `axios`.

## Reglas de diseño

1. No agregar logica de negocio nueva en `route.js`.
2. Validar entrada con schemas del modulo.
3. Centralizar errores con `HttpError` + `toErrorResponse`.
4. Reusar `requireAuthUser` para auth en APIs.
5. Evitar llamadas HTTP directas desde componentes; usar `services/*`.

## Patrón recomendado en API Route

1. `await requireAuthUser()`.
2. Validar payload/query con schema del modulo.
3. Llamar servicio de dominio.
4. Responder con `Response.json(...)`.
5. En catch: `return toErrorResponse(error)`.

## Siguiente expansión sugerida

- Modularizar `tus` y `tm` en `modules/tus` y `modules/tm`.
- Extraer procesos pesados de importacion/traduccion a jobs en background.
- Agregar tests de integración por modulo (`users`, `projects`, `tus`).

