# PECAT-E

> **Verificado 2026-09-29** · Fuente: el código de este repo (`README.md`, `CLAUDE.md`,
> `README-architecture.md`, `env.example`, `Dockerfile`, `docker-compose.yml`, `devops*.sh`).

PECAT-E es la plataforma web de **post-edición asistida** de Pangeanic para el proyecto Europeana.
Repo: [`Pangeamt/pecat-europeana-v1`](https://github.com/Pangeamt/pecat-europeana-v1).

## Qué hace

1. El usuario sube un documento (Office, PDF, SDLXLIFF…) dentro de un proyecto con un **perfil**.
2. Se extrae y segmenta con **Okapi Tikal** (SRX propio; PDF → docx con LibreOffice).
3. Se traduce con **DAAIT** (`/content/pecat`), aplicando las memorias y glosarios del perfil.
4. Se puntúa con **MTQE v1** (el documento pasa a `READY`) y, en paralelo, con **MTQE v2** y un
   **juez LLM** (`/content/post_edit`), que aprueba o propone una corrección por segmento.
5. El revisor humano edita segmento a segmento; el panel *Effort* estima el trabajo restante.
6. Se descarga el documento reconstruido (merge de Okapi) o el `.sdlxliff`.

## Dependencias externas

| Servicio | Para qué | Variable |
|---|---|---|
| DAAIT (`api-priv.pangeanic.com/service/autope2`) | Traducción, memorias y glosarios | `DAAIT_API_HOST` |
| MTQE v1 / v2 | Puntuación de calidad | `MTQE_V1*`, `MTQE_V2*` |
| MySQL (externo, **compartido y sin backups**) | Datos de la app (Prisma) | `DATABASE_URL` |
| Redis | Colas BullMQ | `REDIS_URL` |

## Páginas

- [Arquitectura](architecture.md): módulos, colas y modelo de datos.
- [Desarrollo](development.md): puesta en marcha en local y ramas.
- [Operación y despliegue](operations.md): entornos, despliegue y comandos peligrosos.
- [Variables de entorno](secrets.md): nombres de las variables (sin valores).
