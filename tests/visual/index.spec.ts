// Strona główna (Etap 4.2) — regres wizualny: widok startowy (hero +
// przezroczysty pasek) i pełna strona na 6 profilach.
//
// Strażnik useVisualFixtureGuard (od 4.3 — wspólny): zajawka 02 czyta
// kolekcję realizacji (analiza H1), więc build pod testem MUSI
// pochodzić z `pnpm build:visual` (zamrożony fixture: 5 wpisów →
// „JESZCZE 2"); strażnik liczy <template data-work-detail> na
// /realizacje/, które widok 4.3 wreszcie renderuje. Okładki kart na
// preview to znany 404 transformacji Cloudflare — kafle renderują się
// jako ciemne karty z tekstem (deterministyczne; wzorzec delung).
//
// Determinizm: prepareSweep (freeze.css zeruje animacje CZASOWE, więc
// klasa .in sadza reveale/rysowanie od razu w stanach końcowych;
// eager+decode zdjęć). Reveale odpala IntersectionObserver na scrollu
// dokumentu — zrzut fullPage NIE scrolluje (captureBeyondViewport), więc
// przed nim robimy PRZEJAZD przez całą stronę z krokiem i settle
// (za szybki przelot gubi wpisy IO — zmierzone przy budowie widoku).
// Transformy parallaxu liczy pętla rAF przy każdej pozycji przejazdu —
// stała lista kroków ⇒ ten sam stan końcowy w każdym przebiegu.
// NIE emulujemy prefers-reduced-motion (bramka js-motion = martwa strona).
import { expect, test, type Page } from "@playwright/test";
import { useVisualFixtureGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

useVisualFixtureGuard();

const PATH = "/";

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

test("strona główna: widok startowy (hero + pasek) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  // Mikro-scroll tam i z powrotem: WebKit trzyma warstwę paska fixed
  // w niższej rasteryzacji do pierwszego przemalowania (wzorzec delung).
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("index-top.png");
});

test("strona główna: pełna strona vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await revealSweep(page);
  // Maska wideo = kontrakt speców visual (dziś na `/` wideo nie ma;
  // zostaje, żeby przyszła zmiana treści nie musiała jej „pamiętać").
  const mask = [page.locator("video"), page.locator(".dt-poster")];
  await expect(page).toHaveScreenshot("index-full.png", {
    fullPage: true,
    mask,
  });
});
