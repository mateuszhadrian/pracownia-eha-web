// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://pracownia-eha.pl",
  output: "static",
  // Bez filtra sitemapy: wszystkie 8 tras ma własny canonical (mobile 1:1
  // desktop, bez redirectów — §9 analizy).
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
