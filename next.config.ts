import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  // Eigene Regeln stehen vor den Standardregeln von next-pwa (erste passende Regel gewinnt).
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        // Ausdrückliches „Neu laden“: immer Netz, nie aus dem Cache und nie in den Cache.
        urlPattern: ({ sameOrigin, url }) =>
          sameOrigin && url.pathname === "/api/calendar" && url.searchParams.has("refresh"),
        handler: "NetworkOnly",
        method: "GET",
      },
      {
        // Termine: immer zuerst das Netz (ohne Timeout-Rückfall). Der Cache dient nur als
        // Offline-Stand; die Oberfläche kennzeichnet ihn über generatedAt als veraltet.
        urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname === "/api/calendar",
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "calconny-calendar",
          expiration: {
            maxEntries: 1,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Für Docker/Coolify: .next/standalone mit minimalem server.js. Vercel ignoriert die Option.
  output: "standalone",
  turbopack: {},
};

export default withPWA(nextConfig);
