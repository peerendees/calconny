import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CalConny",
    short_name: "CalConny",
    description: "Kalender BERENT.AI",
    start_url: "/",
    display: "standalone",
    background_color: "#090806",
    theme_color: "#090806",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
