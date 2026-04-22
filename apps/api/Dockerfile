# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache tini
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter @isp/api... --frozen-lockfile || pnpm install --filter @isp/api...

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api ./apps/api
RUN pnpm --filter @isp/api build

# ---- Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache tini && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
USER app
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
