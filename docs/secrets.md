# Variables de entorno

> **Verificado 2026-09-29** · Fuente: `lib/env.js`, los `process.env.*` de `lib/` y `modules/`, `env.example` y `Dockerfile`.
> Aquí solo van **nombres**, nunca valores. Los valores viven en el `.env` de cada host (no se commitea)
> y en el Environment de 1Password `DEV: pecat-europeana`.

`lib/env.js` valida las variables con Joi al arrancar: si falta una obligatoria, la app **no arranca**.

## Obligatorias

| Variable | Qué es |
|---|---|
| `DATABASE_URL` | URI MySQL (externa, compartida y sin backups) |
| `NEXTAUTH_SECRET` | Secreto de NextAuth |
| `NEXTAUTH_URL` | URL pública de la app |
| `NEXT_PUBLIC_API_BASE_URL` | URL base de la API; se **incrusta en el bundle al construir** (cambiarla exige rebuild) |

## Opcionales

| Variable | Por defecto | Qué es |
|---|---|---|
| `DAAIT_API_HOST` | `https://api-priv.pangeanic.com/service/autope2` | DAAIT (traducción, memorias, glosarios) |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis de BullMQ (en Docker: `redis://redis:6379`) |
| `TIKAL_BIN` | `tikal` | Okapi Tikal |
| `SOFFICE_BIN` | `soffice` | LibreOffice (solo PDF) |
| `STORAGE_DIR` | `./storage` | Carpetas de trabajo de los documentos |
| `MTQE_V2`, `MTQE_V2_API_KEY` | — | Puntuación QE v2, único score (sin ellas no se puntúa). `MTQE_V1*` / `MTQE` / `MTQE_API_KEY` ya no se leen (QE v1 retirado) |
| `DAAIT_CONTENT_TIMEOUT_MS`, `DAAIT_EXPORT_TIMEOUT_MS`, `DAAIT_LIST_TIMEOUT_MS` | 300000 / 55000 / 10000 | Timeouts de las llamadas a DAAIT |
| `TIKAL_TIMEOUT_MS`, `TIKAL_MAX_CONCURRENCY`, `SOFFICE_TIMEOUT_MS` | — | Límites de Okapi Tikal y LibreOffice |

`env.example` aún lista `NEXRELAY_*`, pero el código ya no las lee: la traducción va por DAAIT.
