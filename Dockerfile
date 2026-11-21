# syntax=docker/dockerfile:1
# CalConny – Entwurf für Docker/Coolify (siehe docs/deployment-coolify.md).
# Der Vercel-Betrieb nutzt dieses Dockerfile nicht.

ARG NODE_VERSION=24

# --- Abhängigkeiten (eigene Stufe, damit der Layer-Cache nur bei Lockfile-Änderung neu baut)
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build: erzeugt .next/standalone und den Service Worker (public/sw.js, public/workbox-*.js)
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Keine Secrets zur Build-Zeit: ICAL_FEED_* wird erst zur Laufzeit gelesen.
RUN npm run build

# --- Laufzeit: nur der Standalone-Server, ohne node_modules-Vollinstallation, als non-root
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

# Prüft nur, ob der Server antwortet – bewusst ohne /api/calendar (würde den Feed abrufen).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/manifest.webmanifest').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
