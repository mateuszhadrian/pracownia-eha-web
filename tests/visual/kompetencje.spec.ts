// Widok /kompetencje-i-technologie/ (Etap 4.4 cz. 2) — regres wizualny:
// widok startowy (hero z górnym gradientem + kremowy pasek tone="dark"),
// pełna strona ze ZWINIĘTYMI akapitami (stan domyślny po uzbrojeniu
// collapsible.ts) oraz — tylko mobile — pełna strona z akapitami
// ROZWINIĘTYMI (desktop nie ma zwijania, zrzut byłby duplikatem).
//
// Strażnik: usePreviewGuard wystarcza — widok NIE czyta kolekcji
// realizacji (zero zależności od fixture'u; analiza §3).
//
// Determinizm: prepareSweep (freeze.css zeruje animacje CZASOWE, więc
// klasa .in sadza reveale/rysowanie od razu w stanach końcowych;
// eager+decode zdjęć) + WSPÓLNY revealSweep z tests/helpers/visual.ts
// (pełne settle na dole strony, dociśnięcie maruderów IO, wymuszony
// przemalunek rAF po powrocie — lekcje webkit-CI z 4.4 cz. 1).
// NIE emulujemy prefers-reduced-motion (bramka js-motion = martwa
// strona).
import { expect, test, type Page } from "@playwright/test";
import { KOMPETENCJE_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep, revealSweep } from "../helpers/visual";

usePreviewGuard();

const PATH = KOMPETENCJE_PATH;

// Maska wideo = kontrakt speców visual (na tej trasie wideo nie ma;
// zostaje, żeby przyszła zmiana treści nie musiała jej „pamiętać").
const mask = (page: Page) => [
  page.locator("video"),
  page.locator(".dt-poster"),
];

/** Budżet zrzutów fullPage tego widoku — klasa decyzji z 4.4 cz. 1
 *  (ekipa): domyślne 5 s expectu nie mieści dwóch stabilizacyjnych
 *  przebiegów najcięższych fullPage (rozległe mix-blend-mode płyt
 *  i rycin + software raster runnera CI). */
const FULLPAGE_SHOT_TIMEOUT_MS = 20_000;

/** Tolerancja pikselowa zrzutów fullPage (klasa decyzji Mateusza
 *  z 4.4 cz. 1): WebKit przy dpr=2 pod równoległym obciążeniem sypie
 *  jednopikselowym szumem resamplingu na obszarach ZDJĘĆ — 0.001 daje
 *  zapas na szum, a realna regresja layoutu to TYSIĄCE px; globalny
 *  próg w playwright.config.ts zostaje 0.0005. */
const FULLPAGE_MAX_DIFF_RATIO = 0.001;
/** Tolerancja zrzutu *-full-open (decyzja Mateusza, 4.5 cz. 1): na
 *  webkit-iphone-14 rozwinięte akapity wydłużają stronę o ~2 ekrany
 *  i do kadru wchodzi KOMPLET kadrów [data-plx] — pętla parallaxu
 *  potrafi wylądować o jedną klatkę rAF inaczej i wtedy KAŻDE zdjęcie
 *  dostaje subpikselowe przesunięcie (zachowanie dwustanowe: czysto
 *  albo ~0.002, nigdy pomiędzy; rzadki rozsyp ~8–10 px na wiersz po
 *  krawędziach detalu, nie zwarte bloki). 0.0025 daje zapas na ten
 *  stan; realna regresja layoutu to zwarte bloki rzędu dziesiątek
 *  tysięcy px. Zrzuty *-full zostają na FULLPAGE_MAX_DIFF_RATIO,
 *  globalny próg w playwright.config.ts na 0.0005. */
const FULLOPEN_MAX_DIFF_RATIO = 0.0025;

test("kompetencje: widok startowy (hero + kremowy pasek) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  // Mikro-scroll tam i z powrotem: WebKit trzyma warstwę paska fixed
  // w niższej rasteryzacji do pierwszego przemalowania (wzorzec delung).
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("kompetencje-top.png", {
    mask: mask(page),
  });
});

test("kompetencje: pełna strona (akapity zwinięte) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  await revealSweep(page);
  await expect(page).toHaveScreenshot("kompetencje-full.png", {
    fullPage: true,
    mask: mask(page),
    timeout: FULLPAGE_SHOT_TIMEOUT_MS,
    maxDiffPixelRatio: FULLPAGE_MAX_DIFF_RATIO,
  });
});

test("kompetencje: pełna strona z rozwiniętymi akapitami (mobile)", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "desktop nie zwija akapitów — zrzut byłby duplikatem");
  await prepareSweep(page, PATH);
  // rozwiń wszystkie bloki (klik odsłania treść pod przejazd rewealujący)
  const btns = page.locator('[data-clp-btn][aria-expanded="false"]');
  while ((await btns.count()) > 0) {
    const btn = btns.first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }
  await revealSweep(page);
  await expect(page).toHaveScreenshot("kompetencje-full-open.png", {
    fullPage: true,
    mask: mask(page),
    timeout: FULLPAGE_SHOT_TIMEOUT_MS,
    maxDiffPixelRatio: FULLOPEN_MAX_DIFF_RATIO,
  });
});
