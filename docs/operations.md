# Operación y despliegue

> **Verificado 2026-09-29** (scripts y compose de este repo) · **No verificado:** el estado actual del
> host de producción (no hay acceso confirmado a él a esta fecha).

## Entornos

| Entorno | Dónde | Cómo corre |
|---|---|---|
| Producción | `https://ai4cpecat.pangeanic.com` (según `env.example`) | Host on-prem; acceso pendiente de confirmar |
| Pruebas | `vstest02` (`192.168.100.81:3010`, LAN/VPN) | Docker con un compose propio del host (`pecat-app` + `pecat-redis`) |

!!! danger "El entorno de pruebas usa el DAAIT de producción"
    `DAAIT_API_HOST` de pruebas apunta a `api-priv.pangeanic.com`: crear un perfil crea su espejo en el
    DAAIT real y subir un documento consume traducción de producción.

## Despliegue

Siempre desde la rama `stable`.

=== "PM2"

    ```bash
    git fetch origin && git checkout stable && ./devops.sh
    ```

    `devops.sh`: exige `.env`, `git pull --ff-only`, `pnpm install`, `prisma generate` +
    `prisma migrate deploy`, `pnpm build` y `pm2 startOrRestart` (app `pecat-e`, puerto 3000).

=== "Docker"

    ```bash
    git fetch origin && git checkout stable && ./devops-docker.sh
    ```

    `devops-docker.sh`: `docker compose build` + `up -d`, espera a que responda el 3000 y limpia imágenes
    colgantes. El contenedor aplica `prisma migrate deploy` al arrancar.

Antes de migrar en producción: `prisma migrate status` y un `mysqldump` de las tablas afectadas.

## Datos persistentes (Docker)

| Volumen | Montaje | Contenido |
|---|---|---|
| `storage` | `/app/storage` | Carpetas de trabajo de los documentos |
| `uploads` | `/app/public/files` | Ficheros subidos |
| `redis-data` | `/data` | Colas BullMQ (AOF) |

La MySQL es externa y ningún comando de Docker la toca.

!!! danger "Comandos que borran datos"
    `docker compose down -v`, `docker volume rm`, `docker volume prune` y `docker system prune --volumes`
    eliminan los volúmenes: los documentos quedan huérfanos y **no se pueden regenerar**.
    `down` sin `-v`, `build`, `up -d` e `image prune` son seguros.

## Comprobar que está vivo

No hay endpoint de healthcheck dedicado. `devops-docker.sh` comprueba que `http://localhost:3000` responda.
Las colas se ven en `/dashboard/queues` (rol `SUPER`).
