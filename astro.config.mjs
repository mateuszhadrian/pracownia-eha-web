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
    build: {
      // Fonty NIGDY nie wchodzą do CSS jako base64 (Etap 6). Domyślny
      // assetsInlineLimit Vite (4096 B) wciągał trzy polskie subsety
      // Plex Mono (2,6–3,4 KB) wprost do arkusza — czyli ~11,5 KB bajtów
      // kroju lądowało w CSS BLOKUJĄCYM RENDER, zamiast dogrywać się
      // asynchronicznie przez font-display: swap. LCP na „/" to element
      // tekstowy, więc każdy kilobajt w krytycznym CSS liczy się podwójnie.
      // Pozostałe assety (drobne obrazy) zachowują domyślne zachowanie.
      assetsInlineLimit: (filePath) =>
        filePath.endsWith(".woff2") ? false : undefined,
    },
  },
});
