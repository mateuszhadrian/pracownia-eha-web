// Widok /ekipa-eha/ (Etap 4.4 cz. 1) — regres wizualny: widok startowy
// (ciemne hero + kremowy pasek tone="dark"), pełna strona ze ZWINIĘTYMI
// akapitami (stan domyślny po uzbrojeniu collapsible.ts) oraz — tylko
// mobile — pełna strona z akapitami ROZWINIĘTYMI (desktop nie ma
// zwijania, zrzut byłby duplikatem).
//
// Strażnik: usePreviewGuard wystarcza — widok NIE czyta kolekcji
// realizacji (zero zależności od fixture'u; analiza §3).
//
// Determinizm: prepareSweep (freeze.css zeruje animacje CZASOWE, więc
// klasa .in sadza reveale/rysowanie od razu w stanach końcowych;
// eager+decode zdjęć). Reveale odpala IntersectionObserver na scrollu
// dokumentu — zrzut fullPage NIE scrolluje, więc przed nim PRZEJAZD
// przez stronę z krokiem i pauzą (wzorzec index.spec — szybszy przelot
// gubi wpisy IO). NIE emulujemy prefers-reduced-motion (bramka
// js-motion = martwa strona).
import { expect, test, type Page } from "@playwright/test";
import { EKIPA_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep, revealSweep } from "../helpers/visual";

usePreviewGuard();

const PATH = EKIPA_PATH;

// Maska wideo = kontrakt speców visual (na tej trasie wideo nie ma;
// zostaje, żeby przyszła zmiana treści nie musiała jej „pamiętać").
const mask = (page: Page) => [
  page.locator("video"),
  page.locator(".dt-poster"),
];

/** Budżet zrzutów fullPage tego widoku. Domyślne 5 s expectu NIE mieści
 *  dwóch stabilizacyjnych przebiegów zrzutu: to najcięższy fullPage
 *  w projekcie (~7000 px wysokości z rozległymi mix-blend-mode —
 *  luminosity hero, multiply płyt/rycin), a runner CI rasteryzuje
 *  programowo (incydent workflow baseline'ów 2026-08-24: „Timeout
 *  5000ms exceeded" w połowie DRUGIEGO zrzutu; darwin M-serii robi ten
 *  test 8,3 s vs 3,5 s dla -top). Progi pikselowe bez zmian. */
const FULLPAGE_SHOT_TIMEOUT_MS = 20_000;

test("ekipa: widok startowy (ciemne hero + kremowy pasek) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  // Mikro-scroll tam i z powrotem: WebKit trzyma warstwę paska fixed
  // w niższej rasteryzacji do pierwszego przemalowania (wzorzec delung).
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("ekipa-top.png", { mask: mask(page) });
});

test("ekipa: pełna strona (akapity zwinięte) vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await revealSweep(page);
  await expect(page).toHaveScreenshot("ekipa-full.png", {
    fullPage: true,
    mask: mask(page),
    timeout: FULLPAGE_SHOT_TIMEOUT_MS,
  });
});

test("ekipa: pełna strona z rozwiniętymi akapitami (mobile)", async ({
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
  await expect(page).toHaveScreenshot("ekipa-full-open.png", {
    fullPage: true,
    mask: mask(page),
    timeout: FULLPAGE_SHOT_TIMEOUT_MS,
  });
});
