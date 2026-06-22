# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project is managed with **pnpm** (version pinned to `10.20.0` in `packageManager`).

- **Development**: `pnpm dev` – starts Next.js dev server with Turbopack
- **Build**: `pnpm build`
- **Production**: `pnpm start` – PM2 is used in production (`ecosystem.config.cjs`); deploy via `./devops.sh`
- **Lint**: `pnpm lint` – runs `eslint .` (flat config in `eslint.config.mjs`)
- **Release**: `pnpm release` – semantic-release on `main` (conventional commits drive versioning + `CHANGELOG.md`)
- **React diagnostics**: `pnpm doctor`

> **No test infrastructure exists** – there is no jest/vitest/playwright config, no test scripts, and no `*.test.*` / `*.spec.*` files. Do not assume a test runner is available; verify changes manually or via `pnpm lint` / `pnpm build`.

### Database

- **Generate Prisma client**: `pnpm exec prisma generate --schema=./prisma/schema.prisma`
- **Migrate locally**: `pnpm exec prisma migrate dev --name <name> --schema=./prisma/schema.prisma`
- **Deploy migrations**: `pnpm exec prisma migrate deploy --schema=./prisma/schema.prisma`

### Setup for local development

1. Copy `env.example` to `.env` and fill values
2. Create upload directory: `mkdir -p public/files && chmod -R 755 public/files`
3. Run Prisma generate, then migrations
4. `pnpm dev` (app runs on `NEXTAUTH_URL`, default 3000)

### Production deployment

Deploy with `./devops.sh`, which: requires `.env`, runs `git pull --ff-only` (fast-forward only — no merge commits), `pnpm install`, `prisma generate` + `prisma migrate deploy`, ensures `public/files` (755), `pnpm build`, then `pm2 startOrRestart ecosystem.config.cjs --update-env`. The PM2 app is named `pecat-e` (fork mode, port 3000).

## High-level architecture

This is a **Next.js 16** application using the **App Router** (`app/` directory), **React 19**, and **Ant Design 5**. It follows a **domain-driven modular architecture** rather than the default Next.js “pages/api” pattern.

### Directory responsibilities

| Layer | Path | Role |
|---|---|---|
| HTTP handlers | `app/api/*` | Only parse requests, delegate to module services, format responses. Business logic must NOT live here. |
| Domain modules | `modules/<domain>/` | Business logic, persistence, validation (`service.js`, `repository.js`, `schemas.js`, `index.js` barrel). |
| Frontend services | `services/*.ts` | Axios HTTP clients used by React components to call internal `/api/*` endpoints. |
| UI | `components/` | React components (Ant Design + TailwindCSS). |
| Pages | `app/dashboard/*` and `app/auth/login/` | Next.js app-router pages. |
| State | `store/index.js` | Zustand stores (`userStore`, `tmStore`, `textTmStore`). |
| Infra clients | `lib/` | Prisma client, DAAIT HTTP client, env validation (`env.js`), utilities. |

### Domain modules (big picture)

`memory/` – Translation Memories and Glossaries, persisted in an **external DAAIT API** (not the local DB). Sub-domains `tm/` and `glossary/` each have identical layers:
`repository.js` (adapts to `lib/daait.js`) → `service.js` (CRUD / import / export) ← `tmx.js` / `glossary/*.service.js`.

`projects/` – Local projects, persisted in **MySQL via Prisma**. Contains `repository.js`, `service.js`, `import-service.js`, `logs-service.js`, and `schemas.js`.

`tus/` – **Translation Units inside a project** (Prisma model `Tu`, MySQL). Distinct from `modules/memory/tu`, which are **TUs inside a Translation Memory** stored in DAAIT. These are separate concepts despite the similar name.

`users/` / `workspaces/` / `files/` – Domain-specific modules following the same layout.

`shared/` – Cross-cutting concerns: `auth.js` (`requireAuthUser`), `http-error.js` (`HttpError`), `http.js` (`toErrorResponse`), `similarity.js`.

### Error handling convention

All route handlers should follow this pattern:

1. `await requireAuthUser()`
2. Validate payload with Joi schema imported from `modules/<domain>/schemas.js`
3. Call domain `service.js`
4. Return `Response.json(...)`
5. `catch (error) { return toErrorResponse(error); }`

`HttpError(status, message, code?)` + `toErrorResponse(error)` produce a consistent JSON:
- `{ code, message }` for custom errors
- `{ code: "VALIDATION_ERROR", message, details: [{ path, message }] }` for Joi
- `{ code: "INTERNAL_ERROR", message }` for everything else

### Design rules

1. Do not add business logic to `app/api/*` route files.
2. Validate input with Joi schemas from the module (`schemas.js`).
3. Centralize errors with `HttpError` + `toErrorResponse` (both use a stable `code`).
4. Reuse `requireAuthUser` for auth in APIs.
5. Avoid direct HTTP calls from React components; use `services/*`.
6. Always import with the `@/` alias.
7. Each module exposes its public API via `index.js` (barrel export).
8. Do not access infrastructure clients (`prisma`, `daaitClient`) directly from `service.js`; pass through `repository.js`.

### Technology stack highlights

- **Data** – Prisma 5 with MySQL; `lib/prisma.js` exports a singleton client
- **External API** – DAAIT for TM/Glossary storage (`lib/daait.js`)
- **Auth** – Next-Auth 4 configured in `app/api/auth/[...nextauth]/route.js`
- **Env** – `lib/env.js` validates all required environment variables with Joi at startup; the app refuses to start if any are missing or malformed
- **TypeScript** – `strict: false`; mixes `.js` and `.ts` files
- **Styling** – TailwindCSS 4 + Ant Design 5 (`primary: #98C441`)

### Important module boundaries

- `modules/memory/tu` – DAAIT-backed, associated to a TM
- `modules/tus` – Prisma-backed (`model Tu`), associated to a Project

### Data model (`prisma/schema.prisma`, MySQL)

Core models: `User`, `Account`, `Session`, `VerificationToken` (NextAuth), `Workspace` (org unit owning projects/TMs/glossaries/members), `Project`, `Tu` (project TU), `Tm` / `Glossary` (DAAIT-backed metadata mirrored locally), and the `ProjectTm` / `ProjectGlossary` join tables. Note: `Tm` and `Glossary` rows hold local metadata only — the actual TUs/entries live in DAAIT.

Key enums: `Role` (SUPER, ADMIN, USER), `Status` (segment review state: EDITED, ACCEPTED, TRANSLATED_MT, NOT_REVIEWED, REJECTED), `ProjectStatus` (UPLOADED, PROCESSING, OXIGEN_PROCESSING, MTQE_PROCESSING, READY, OXIGEN_ERROR, MTQE_ERROR).

### Environment variables

Required (app fails to start without): `DATABASE_URL` (must be a MySQL URI), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_BASE_URL`.
Optional: `DAAIT_API_HOST` (defaults to `https://api-priv.pangeanic.com/service/autope2`), `SEGMENTED_TEXTS_HOST`, `MT_TEXTS_HOST`, `OXIGEN_API_HOST`, `MINT_CLIENT_ID`, `MINT_CLIENT_SECRET`, `MTQE`.

### Further reading

`README-architecture.md` (Spanish) contains a deeper walkthrough of the modular design, the two distinct TU concepts, and the internal API route map.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
