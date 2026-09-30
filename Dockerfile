# ==============================================================================
# Stage 1 — Build stage: Compile Angular 19 production bundle
# ==============================================================================
FROM node:24-alpine AS build

WORKDIR /app

# Enable pnpm via corepack and copy dependency manifests for layer caching
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application sources and build production bundle
COPY . .
RUN pnpm exec ng build --configuration production

# ==============================================================================
# Stage 2 — Serve stage: Minimal unprivileged Nginx (runs non-root as UID 101)
# ==============================================================================
FROM nginxinc/nginx-unprivileged:alpine-slim AS serve

# Copy SPA Nginx configuration (configured to listen on unprivileged port 8080)
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from build stage (stripping Node.js and build tools)
COPY --from=build --chown=101:101 /app/dist/health-kicks-app/browser /usr/share/nginx/html

# Expose unprivileged non-root port
EXPOSE 8080

USER 101

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
