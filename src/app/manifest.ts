import type { MetadataRoute } from "next";
import { THEME_COLORS } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CalConny",
    short_name: "CalConny",
    description: "Kalender BERENT.AI",
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: THEME_COLORS.dark,
    theme_color: THEME_COLORS.dark,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
