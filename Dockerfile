# ---- Build stage -----------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# lib/env.js validates required vars at build time (and NEXT_PUBLIC_* values
# are inlined into the client bundle), so provide build-time values here.
# Override NEXT_PUBLIC_API_BASE_URL/NEXTAUTH_URL per environment.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
ARG NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=mysql://build:build@localhost:3306/build \
    NEXTAUTH_SECRET=build-time-placeholder \
    NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN pnpm exec prisma generate --schema=./prisma/schema.prisma \
    && pnpm build \
    && pnpm prune --prod

# ---- Runtime: Node + Java (Okapi Tikal) + LibreOffice (PDF -> docx) --------
FROM node:22-bookworm-slim
ARG OKAPI_VERSION=1.47.0

# libreoffice-writer + -draw: PDF -> docx conversion (draw provides PDF import)
# `apt-get upgrade` brings the Debian security updates the base image has not
# picked up yet (its tag is rebuilt less often than Debian publishes them).
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends default-jre-headless wget unzip \
       libreoffice-writer libreoffice-draw \
    && rm -rf /var/lib/apt/lists/*

# The container only runs `prisma` and `next` from /app/node_modules: npm and
# corepack (and the packages they bundle) are not needed at runtime.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
       /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Jackson is dropped from Okapi's lib: only its Microsoft MT connector uses it
# (net.sf.okapi.connectors.microsoft), Tikal's extract and merge never load it,
# and the bundled 2.16.0 has known vulnerabilities.
RUN wget -q "https://okapiframework.org/binaries/main/${OKAPI_VERSION}/okapi-apps_gtk2-linux-x86_64_${OKAPI_VERSION}.zip" -O /tmp/okapi.zip \
    && unzip -q /tmp/okapi.zip -d /opt/okapi \
    && rm /tmp/okapi.zip \
    && rm -f /opt/okapi/lib/jackson-annotations-*.jar /opt/okapi/lib/jackson-core-*.jar \
       /opt/okapi/lib/jackson-databind-*.jar \
    && printf '#!/bin/sh\nexec /opt/okapi/tikal.sh "$@"\n' > /usr/local/bin/tikal \
    && chmod +x /usr/local/bin/tikal /opt/okapi/tikal.sh

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/okapi ./okapi
COPY --from=build /app/package.json /app/next.config.mjs /app/instrumentation.js ./

# storage/: one working folder per document (original + XLIFF), must persist.
# uploads/: the uploaded originals, outside public/ so they are never served
# by URL (lib/uploads.js).
RUN mkdir -p /app/storage /app/uploads && chown -R node:node /app
USER node

ENV NODE_ENV=production \
    TIKAL_BIN=tikal \
    SOFFICE_BIN=soffice \
    STORAGE_DIR=/app/storage \
    UPLOADS_DIR=/app/uploads \
    PORT=3000

VOLUME ["/app/storage", "/app/uploads"]
EXPOSE 3000

# Apply pending migrations, then serve (the BullMQ worker starts with the
# server via instrumentation.js).
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && node_modules/.bin/next start -p ${PORT}"]
