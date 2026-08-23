// Chrome globalny — regres wizualny elementów wspólnych niezależnie od
// widoków: pasek `[data-nav]` (desktop) i OTWARTY bottom sheet menu
// (mobile) — stany, których zrzut strony nie łapie. Zrzuty na /realizacje/
// (chrome jest wspólny, jeden widok wystarczy). W Etapie 4.1 dochodzą
// stany: dropdown „O nas" otwarty (desktop), akordeon „O nas" w sheecie,
// pasek po auto-hide (schowany/odsłonięty) — ten plik je przyjmie.
// Determinizm: freeze.css (prepareSweep) zeruje przejścia, więc sheet
// otwiera się od razu w stanie końcowym (kaskada pozycji bez animacji).
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

test("chrome: otwarty bottom sheet menu vs baseline", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "bottom sheet — profile mobile");
  await prepareSweep(page, WORK_INDEX_PATH);
  await page.locator("[data-burger]").click();
  await expect(page.locator("#nav-sheet")).toHaveClass(/is-open/);
  // Sloty tel/mail w stopce sheeta wypełnia JS — gotoReady czekał na
  // networkidle, więc numery są już złożone, nie puste.
  await settle(page);
  await expect(page).toHaveScreenshot("chrome-sheet.png");
});
