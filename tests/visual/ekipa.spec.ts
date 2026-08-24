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
import { prepareSweep } from "../helpers/visual";

usePreviewGuard();

const PATH = EKIPA_PATH;

/** Przejazd przez całą stronę (odpala IO revealów), powrót na górę. */
async function revealSweep(page: Page): Promise<void> {
  const total = await page.evaluate(
    () => document.body.scrollHeight - window.innerHeight,
  );
  const step = await page.evaluate(() => Math.round(window.innerHeight * 0.7));
  for (let y = step; y < total + step; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), Math.min(y, total));
    await page.waitForTimeout(140);
  }
  await scrollPageTo(page, 0);
  await settle(page, 400);
}

// Maska wideo = kontrakt speców visual (na tej trasie wideo nie ma;
// zostaje, żeby przyszła zmiana treści nie musiała jej „pamiętać").
const mask = (page: Page) => [
  page.locator("video"),
  page.locator(".dt-poster"),
];

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
  });
});
