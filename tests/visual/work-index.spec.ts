// Podstrona /realizacje/ (Etap 4.3) — regres wizualny: widok startowy,
// pełna strona, stany detalu #work-detail (sheet na profilach mobile /
// modal 1920), podgląd pełnoekranowy i stan kadru wideo (1920).
//
// Strażnik useVisualFixtureGuard: build pod testem MUSI pochodzić
// z `pnpm build:visual` (zamrożony fixture 5 wpisów) — strażnik liczy
// <template data-work-detail>, które ta strona wreszcie renderuje.
// Obrazy z R2 na preview to znane 404 (/cdn-cgi/* istnieje tylko na
// produkcji) — kafle renderują ciemne tło deterministycznie.
//
// Determinizm: prepareSweep (freeze.css zeruje animacje CZASOWE, więc
// klasa .in sadza reveale/rysowanie w stanach końcowych; eager+decode
// zdjęć). Reveale odpala IO na scrollu dokumentu — przed zrzutem
// fullPage PRZEJAZD przez stronę z krokiem (wzorzec index.spec 4.2).
// WIDEO ZAWSZE POD MASKĄ (`video` + `.dt-poster` — klatka to loteria,
// testing.md). NIE emulujemy prefers-reduced-motion (bramka js-motion
// = martwa strona).
import { expect, test, type Page } from "@playwright/test";
import { useVisualFixtureGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/realizacje/";

useVisualFixtureGuard();

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

/** Otwiera detal pierwszego kafla i czeka na spoczynek nakładki. */
async function openFirstDetail(page: Page) {
  const card = page.locator(".wk-grid [data-work-slug]").first();
  await card.scrollIntoViewIfNeeded();
  await settle(page);
  await card.click();
  const detail = page.locator("#work-detail");
  await expect(detail).toHaveClass(/is-open/);
  await settle(page, 600);
  return detail;
}

test("realizacje: widok startowy (nagłówek + pasek) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  // Mikro-scroll tam i z powrotem: WebKit trzyma warstwę paska fixed
  // w niższej rasteryzacji do pierwszego przemalowania (wzorzec 4.2).
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("work-index-top.png");
});

test("realizacje: pełna strona vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await revealSweep(page);
  const mask = [page.locator("video"), page.locator(".dt-poster")];
  await expect(page).toHaveScreenshot("work-index-full.png", {
    fullPage: true,
    mask,
  });
});

test("realizacje: detal otwarty (sheet mobile / modal 1920)", async ({
  page,
}, testInfo) => {
  const isMobileProfile = Boolean(testInfo.project.use.isMobile);
  test.skip(
    !isMobileProfile && testInfo.project.name !== "chromium-1920",
    "sheet na profilach mobile, modal tylko na chromium-1920",
  );
  await prepareSweep(page, PATH);
  const detail = await openFirstDetail(page);
  await expect(detail).toHaveScreenshot("work-detail-open.png", {
    // maska na wideo w galerii + podłożona klatka .dt-poster (ten sam
    // kadr filmu co poster — równie niedeterministyczny)
    mask: [detail.locator("video"), detail.locator(".dt-poster")],
  });
});

test("realizacje: podgląd pełnoekranowy (sheet mobile / 1920)", async ({
  page,
}, testInfo) => {
  const isMobileProfile = Boolean(testInfo.project.use.isMobile);
  test.skip(
    !isMobileProfile && testInfo.project.name !== "chromium-1920",
    "podgląd na profilach mobile + chromium-1920",
  );
  await prepareSweep(page, PATH);
  const detail = await openFirstDetail(page);
  await detail.locator("[data-slide]").first().click();
  const lb = detail.locator("[data-lightbox]");
  await expect(lb).toBeVisible();
  await settle(page, 600);
  await expect(lb).toHaveScreenshot("work-detail-fullscreen.png", {
    mask: [lb.locator("video"), lb.locator(".dt-poster")],
  });
});

test("realizacje: kadr wideo w detalu (maska) — tylko 1920", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "stan po przełączeniu kadru — jeden profil wystarczy",
  );
  await prepareSweep(page, PATH);
  const detail = await openFirstDetail(page);
  if ((await detail.locator("video").count()) === 0) {
    // pierwszy projekt bez wideo — przejdź projnavem aż do wpisu z wideo
    for (let i = 0; i < 12; i++) {
      await detail.locator("[data-nextproj]").click();
      await settle(page, 700);
      if ((await detail.locator("video").count()) > 0) break;
    }
  }
  test.skip(
    (await detail.locator("video").count()) === 0,
    "brak wpisu z wideo w kolekcji",
  );
  // dojazd kadrów do slajdu z wideo strzałkami (dashes = mobile-only)
  const idx = await detail
    .locator("[data-slide]")
    .evaluateAll((slides) =>
      slides.findIndex((s) => s.querySelector("video") !== null),
    );
  for (let i = 0; i < idx; i++) {
    await detail.locator("[data-nextshot]").click();
  }
  await settle(page, 700);
  await expect(detail).toHaveScreenshot("work-detail-video.png", {
    mask: [detail.locator("video"), detail.locator(".dt-poster")],
  });
});
