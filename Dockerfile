# ==============================
# Stage 1 — Build Angular app
# ==============================
FROM node:24-alpine AS build

WORKDIR /app

# Install pnpm and copy dependency manifests first (better layer caching)
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy sources and build the production bundle
COPY . .

RUN pnpm exec ng build --configuration production

# ==============================
# Stage 2 — Serve with Nginx
# ==============================
FROM nginx:1.27-alpine AS serve

# SPA fallback config + gzip + cache headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static bundle built in stage 1
COPY --from=build /app/dist/health-kicks-app/browser /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
