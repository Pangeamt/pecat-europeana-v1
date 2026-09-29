# Desarrollo

> **Verificado 2026-09-29** · Fuente: `CLAUDE.md`, `README.md` y `package.json` de este repo.

## Puesta en marcha en local

Gestor de paquetes: **pnpm 10.20.0** (fijado en `packageManager`).

```bash
cp env.example .env                     # y rellenar valores (ver secrets.md)
pnpm install
mkdir -p public/files && chmod -R 755 public/files
pnpm exec prisma generate --schema=./prisma/schema.prisma
pnpm exec prisma migrate deploy --schema=./prisma/schema.prisma
pnpm dev                                # Next.js con Turbopack, puerto 3000
```

Hacen falta además **Redis**, **Java + Okapi Tikal** (`TIKAL_BIN`) y, para PDF, **LibreOffice**
(`SOFFICE_BIN`). La imagen Docker ya los trae.

!!! warning "Base de datos"
    Nunca `prisma migrate reset`, `prisma db push --force-reset` ni `shadowDatabaseUrl` contra una BD con
    datos reales: la MySQL es compartida y sin backups (ya hubo una pérdida de datos por esto).

## Validación

**No hay tests** en el repo. Los cambios se validan con:

```bash
pnpm lint     # eslint .
pnpm build
```

y con una prueba funcional en el entorno de pruebas (ver [Operación](operations.md)).

## Ramas

| Rama | Qué es |
|---|---|
| `stable` | Lo que se despliega en producción |
| `staging` | Integración |
| `feature/*` | Trabajo; PR a `staging` |

Flujo: `feature/*` → PR a `staging` → PR `staging → stable` al desplegar. `main`/`develop` están
desfasadas y no se usan.
