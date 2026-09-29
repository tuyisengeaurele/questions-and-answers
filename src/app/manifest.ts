import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ikizamini",
    short_name: "Ikizamini",
    description: "Driving theory practice with the questions in Kinyarwanda.",
    start_url: "/",
    display: "standalone",
    background_color: "#131518",
    theme_color: "#131518",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
