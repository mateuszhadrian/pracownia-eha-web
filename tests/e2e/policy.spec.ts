// Polityka prywatności — meta + linki. Docelowa treść (9 sekcji RODO,
// sticky spis treści, data obowiązywania, sloty antyscrapingowe) wchodzi
// w Etapie 4.6 — testy treści są na szkielecie pomijane z powodem
// (test.skip, wzorzec testing.md), a NIE skasowane: pilnują kontraktu od
// pierwszego builda widoku. Treść jest niezależna od profilu — jak
// seo.spec.ts biega tylko na chromium-1920. PL-only.
import { expect, test } from "@playwright/test";
import { CONTACT_PATH, POLICY_PATH } from "../../src/lib/routes";
import { useChromium1920Only } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

const SITE = "https://pracownia-eha.pl";

useChromium1920Only(
  "treść/meta polityki są niezależne od profilu — jeden projekt wystarczy",
);

test(`${POLICY_PATH}: lang, tytuł, canonical`, async ({ page }) => {
  await gotoReady(page, POLICY_PATH);
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page).toHaveTitle("Polityka prywatności — Pracownia EH/A");
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE}${POLICY_PATH}`,
  );
});

test(`${POLICY_PATH}: komplet 9 sekcji RODO (od Etapu 4.6)`, async ({
  page,
}) => {
  await gotoReady(page, POLICY_PATH);
  const sections = page.locator(".pp-sec");
  test.skip(
    (await sections.count()) === 0,
    "widok polityki wchodzi w Etapie 4.6 — na szkielecie brak treści",
  );
  // 9 punktów zakresu designu (polityka-prywatnosci.html) — strażnik przed
  // przypadkowym wycięciem sekcji przy edycji treści.
  await expect(sections).toHaveCount(9);
  // dane administratora (dokument prawny musi identyfikować podmiot)
  await expect(sections.first()).toContainText("527-244-99-69");
  // e-mail administratora składany w JS (antyscraping — sloty
  // lib/contact-details; pełnego adresu nie ma w surowym HTML)
  const mail = page.locator('.pp-sec a[href^="mailto:"]');
  await expect(mail).toHaveAttribute("href", "mailto:eha@pracownia-eha.pl");
  // link do formularza kontaktowego w treści
  await expect(
    page.locator(`.pp-sec a[href="${CONTACT_PATH}"]`).first(),
  ).toBeAttached();
});

test("link polityki w stopce jest na każdym szkielecie", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.locator(`.ft-nav a[href="${POLICY_PATH}"]`)).toBeAttached();
  await gotoReady(page, CONTACT_PATH);
  await expect(page.locator(`.ft-nav a[href="${POLICY_PATH}"]`)).toBeAttached();
});
