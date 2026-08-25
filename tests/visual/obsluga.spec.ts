// Widok /obsluga-budowy/ (Etap 4.5 cz. 2) — regres wizualny: widok
// startowy (hero + kremowy pasek tone="dark") i pełna strona po
// przejeździe rewealującym. BEZ zrzutu `*-full-open`: to jedyny widok
// treściowy bez zwijanych akapitów (skrypt eksportu nie ma cv() —
// docs/analiza-obsluga.md §1c), więc nie ma dwóch stanów treści.
//
// Strażnik: usePreviewGuard wystarcza — widok NIE czyta kolekcji
// realizacji (zero zależności od fixture'u; analiza §2 pkt 10).
//
// Determinizm: prepareSweep (freeze.css zeruje animacje i przejścia
// CZASOWE; eager+decode zdjęć) + WSPÓLNY revealSweep z
// tests/helpers/visual.ts. NIE emulujemy prefers-reduced-motion
// (bramka js-motion = martwa strona).
import { expect, test, type Page } from "@playwright/test";
import { OBSLUGA_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep, revealSweep } from "../helpers/visual";

usePreviewGuard();

const PATH = OBSLUGA_PATH;

// Maska wideo = kontrakt speców visual (na tej trasie wideo nie ma;
// zostaje, żeby przyszła zmiana treści nie musiała jej „pamiętać").
const mask = (page: Page) => [
  page.locator("video"),
  page.locator(".dt-poster"),
];

/** Budżet zrzutów fullPage tego widoku — klasa decyzji z 4.4:
 *  domyślne 5 s expectu nie mieści dwóch stabilizacyjnych przebiegów
 *  najcięższych fullPage (mix-blend-mode rycin + software raster
 *  runnera CI). */
const FULLPAGE_SHOT_TIMEOUT_MS = 20_000;

/** Tolerancja pikselowa zrzutów fullPage (klasa decyzji Mateusza
 *  z 4.4): WebKit przy dpr=2 pod równoległym obciążeniem sypie
 *  jednopikselowym szumem resamplingu na obszarach ZDJĘĆ — 0.001 daje
 *  zapas na szum, a realna regresja layoutu to TYSIĄCE px; globalny
 *  próg w playwright.config.ts zostaje 0.0005. */
const FULLPAGE_MAX_DIFF_RATIO = 0.001;

test("obsluga: widok startowy (hero + kremowy pasek) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  // Mikro-scroll tam i z powrotem: WebKit trzyma warstwę paska fixed
  // w niższej rasteryzacji do pierwszego przemalowania (wzorzec delung).
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("obsluga-top.png", {
    mask: mask(page),
  });
});

test("obsluga: pełna strona vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await revealSweep(page);
  await expect(page).toHaveScreenshot("obsluga-full.png", {
    fullPage: true,
    mask: mask(page),
    timeout: FULLPAGE_SHOT_TIMEOUT_MS,
    maxDiffPixelRatio: FULLPAGE_MAX_DIFF_RATIO,
  });
});
