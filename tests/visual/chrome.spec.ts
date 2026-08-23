// Chrome globalny — regres wizualny elementów wspólnych niezależnie od
// widoków: pasek `[data-nav]` (desktop), dropdown „O nas" otwarty (desktop),
// OTWARTY bottom sheet menu i sheet z rozwiniętym akordeonem „O nas"
// (mobile) — stany, których zrzut strony nie łapie. Zrzuty na /realizacje/
// (chrome jest wspólny, jeden widok wystarczy). Pasek po auto-hide
// weryfikują testy e2e (zrzut schowanego paska = pusty prostokąt).
// Determinizm: freeze.css (prepareSweep) zeruje przejścia, więc sheet
// otwiera się od razu w stanie końcowym (kaskada pozycji bez animacji),
// a akordeon rozwija się natychmiast.
import { expect, test } from "@playwright/test";
import { WORK_INDEX_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

usePreviewGuard();

test("chrome: pasek desktop vs baseline", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "pasek desktop — profile desktop");
  await prepareSweep(page, WORK_INDEX_PATH);
  await expect(page.locator("[data-nav]")).toHaveScreenshot("chrome-bar.png");
});

test("chrome: dropdown O nas otwarty vs baseline", async ({
  page,
  isMobile,
}) => {
  test.skip(!!isMobile, "dropdown — profile desktop");
  await prepareSweep(page, WORK_INDEX_PATH);
  await page.locator("[data-dropdown-toggle]").click();
  await expect(page.locator("[data-dropdown-panel]")).toBeVisible();
  await settle(page);
  // Panel wystaje poza obrys paska — zrzut górnego pasa strony (clip),
  // nie elementu (element screenshot przyciąłby panel do obrysu .hdr).
  await expect(page).toHaveScreenshot("chrome-dropdown.png", {
    clip: {
      x: 0,
      y: 0,
      width: page.viewportSize()!.width,
      height: 400,
    },
  });
});

test("chrome: otwarty bottom sheet menu vs baseline", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "bottom sheet — profile mobile");
  await prepareSweep(page, WORK_INDEX_PATH);
  await page.locator("[data-burger]").click();
  await expect(page.locator("#nav-sheet")).toHaveClass(/is-open/);
  // Sloty tel w stopce sheeta wypełnia JS — gotoReady czekał na
  // networkidle, więc numery są już złożone, nie puste.
  await settle(page);
  await expect(page).toHaveScreenshot("chrome-sheet.png");
});

test("chrome: sheet z rozwiniętym akordeonem O nas vs baseline", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "akordeon w sheecie — profile mobile");
  await prepareSweep(page, WORK_INDEX_PATH);
  await page.locator("[data-burger]").click();
  await expect(page.locator("#nav-sheet")).toHaveClass(/is-open/);
  await page.locator("#nav-sheet [data-acc-toggle]").click();
  await expect(page.locator("#nav-sheet .m-sub-link").first()).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot("chrome-sheet-akordeon.png");
});
