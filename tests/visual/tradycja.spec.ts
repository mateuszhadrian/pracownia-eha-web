// Widok /tradycja-i-ekologia/ (Etap 4.5 cz. 1) — regres wizualny:
// widok startowy (hero + kremowy pasek tone="dark"), pełna strona ze
// ZWINIĘTYMI akapitami (stan domyślny po uzbrojeniu collapsible.ts)
// oraz — tylko mobile — pełna strona z akapitami ROZWINIĘTYMI (desktop
// nie ma zwijania; ten zrzut pokazuje też DIAGRAM i kolek w stanach
// końcowych — bez maski: stany startowe to transitions, więc freeze.css
// sadza końcówki natychmiast po `.in` z przejazdu; analiza §2.8).
//
// Strażnik: usePreviewGuard wystarcza — widok NIE czyta kolekcji
// realizacji (zero zależności od fixture'u; analiza §3).
//
// Determinizm: prepareSweep (freeze.css zeruje animacje i przejścia
// CZASOWE; eager+decode zdjęć) + WSPÓLNY revealSweep z
// tests/helpers/visual.ts (selektor maruderów obejmuje też
// [data-diag]/[data-kolek] — rozszerzenie addytywne z tego PR-a).
// NIE emulujemy prefers-reduced-motion (bramka js-motion = martwa
// strona).
import { expect, test, type Page } from "@playwright/test";
import { TRADYCJA_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep, revealSweep } from "../helpers/visual";

usePreviewGuard();

const PATH = TRADYCJA_PATH;

// Maska wideo = kontrakt speców visual (na tej trasie wideo nie ma;
// zostaje, żeby przyszła zmiana treści nie musiała jej „pamiętać").
const mask = (page: Page) => [
  page.locator("video"),
  page.locator(".dt-poster"),
];

/** Budżet zrzutów fullPage tego widoku — klasa decyzji z 4.4:
 *  domyślne 5 s expectu nie mieści dwóch stabilizacyjnych przebiegów
 *  najcięższych fullPage (mix-blend-mode rycin/kolka + software raster
 *  runnera CI). */
const FULLPAGE_SHOT_TIMEOUT_MS = 20_000;

/** Tolerancja pikselowa zrzutów fullPage (klasa decyzji Mateusza
 *  z 4.4): WebKit przy dpr=2 pod równoległym obciążeniem sypie
 *  jednopikselowym szumem resamplingu na obszarach ZDJĘĆ — 0.001 daje
 *  zapas na szum, a realna regresja layoutu to TYSIĄCE px; globalny
 *  próg w playwright.config.ts zostaje 0.0005. */
const FULLPAGE_MAX_DIFF_RATIO = 0.001;

test("tradycja: widok startowy (hero + kremowy pasek) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  // Mikro-scroll tam i z powrotem: WebKit trzyma warstwę paska fixed
  // w niższej rasteryzacji do pierwszego przemalowania (wzorzec delung).
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("tradycja-top.png", {
    mask: mask(page),
  });
});

test("tradycja: pełna strona (akapity zwinięte) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  await revealSweep(page);
  await expect(page).toHaveScreenshot("tradycja-full.png", {
    fullPage: true,
    mask: mask(page),
    timeout: FULLPAGE_SHOT_TIMEOUT_MS,
    maxDiffPixelRatio: FULLPAGE_MAX_DIFF_RATIO,
  });
});

test("tradycja: pełna strona z rozwiniętymi akapitami (mobile)", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "desktop nie zwija akapitów — zrzut byłby duplikatem");
  await prepareSweep(page, PATH);
  // rozwiń wszystkie bloki (klik odsłania treść — w tym diagram i kolek
  // — pod przejazd rewealujący)
  const btns = page.locator('[data-clp-btn][aria-expanded="false"]');
  while ((await btns.count()) > 0) {
    const btn = btns.first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }
  await revealSweep(page);
  await expect(page).toHaveScreenshot("tradycja-full-open.png", {
    fullPage: true,
    mask: mask(page),
    timeout: FULLPAGE_SHOT_TIMEOUT_MS,
    maxDiffPixelRatio: FULLPAGE_MAX_DIFF_RATIO,
  });
});
