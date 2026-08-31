This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

Copy the .env.example file to .env and fill in the values.

```bash
npm install -g pnpm



pnpm install

mkdir -p public/files && chmod -R 755 public/files

### inicializar prisma
npx prisma generate --schema=./prisma/schema.prisma

### migrar
npx prisma migrate dev --name "initial_migration" --schema=./prisma/schema.prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma


pnpm run build

pnpm run start

```

npx prisma generate --schema=./prisma/schema.prisma

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Despliegue con Docker y persistencia de datos

El despliegue con Docker se hace con `./devops-docker.sh` (`docker compose build` + `up -d`). **Reconstruir la imagen o recrear el contenedor NO borra los archivos subidos**: `docker-compose.yml` guarda los datos en volúmenes con nombre, que viven fuera del contenedor y se vuelven a montar en cada arranque.

| Volumen | Punto de montaje | Contenido |
|---|---|---|
| `storage` | `/app/storage` | Carpetas de trabajo de documentos (original + XLIFF bilingüe, plantilla del export) |
| `uploads` | `/app/public/files` | Archivos subidos |
| `redis-data` | `/data` (servicio redis) | Cola BullMQ (AOF activado) |

La base de datos MySQL es **externa** (`DATABASE_URL`) y no forma parte del compose, así que ningún comando de Docker la afecta.

### ⚠️ Comandos que SÍ destruyen datos

Estos comandos eliminan los volúmenes y con ellos todos los documentos y archivos subidos. **No los ejecutes en producción** salvo que sea exactamente lo que quieres:

```bash
docker compose down -v          # el flag -v borra los volúmenes del proyecto
docker volume rm <volumen>      # borra un volumen concreto
docker volume prune             # borra todos los volúmenes no usados por un contenedor
docker system prune --volumes   # prune global incluyendo volúmenes
```

Un `docker compose down` **sin** `-v`, un `build`, un `up -d` o el `docker image prune -f` del script de deploy son seguros: solo tocan contenedores e imágenes, nunca los volúmenes.

Ten en cuenta que el contenido de `storage/` y `public/files` está referenciado desde la base de datos (p. ej. `Project.documentId` apunta a `storage/{documentId}/`): si se pierden los volúmenes, los proyectos existentes quedan huérfanos aunque la BD siga intacta — el XLIFF bilingüe es la plantilla estructural del export y no se puede regenerar.

### ⚠️ Base de datos compartida y sin backups

`DATABASE_URL` apunta a un MySQL remoto **compartido y sin backups automáticos**. Precauciones:

- Nunca uses `prisma migrate reset` ni `prisma db push --force-reset` contra esa BD.
- No configures `shadowDatabaseUrl` apuntando a una BD con datos reales: Prisma la **vacía** al validar migraciones (ya ocurrió una pérdida de datos por esto).
- Para migrar en producción usa solo `prisma migrate deploy` (es lo que hacen `devops.sh` y la imagen Docker al arrancar).
- Antes de una migración delicada, haz un dump manual: `mysqldump` de las tablas afectadas.

# pecat-europeana-v1
