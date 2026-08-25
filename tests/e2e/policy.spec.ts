// Polityka prywatności — META i TREŚĆ dokumentu. Plik powstał w Etapie 3
// z UŚPIONYM kontraktem „komplet 9 sekcji RODO"; od Etapu 4.6 kontrakt
// jest AKTYWNY (widok renderuje `.pp-sec`), więc `test.skip` przestaje
// wchodzić — zostaje jako strażnik na wypadek regresji budowania widoku.
//
// Podział względem tests/e2e/polityka.spec.ts (Etap 4.6): TUTAJ siedzi
// wszystko, co jest TREŚCIĄ albo META i nie zależy od profilu — jak
// seo.spec.ts biega tylko na chromium-1920. Zachowania profilozależne
// (skoki spisu treści pod paskiem, sticky desktop, sloty po JS, ruch,
// progi) są w spechu widoku. PL-only.
import { expect, test } from "@playwright/test";
import { CONTACT_PATH, POLICY_PATH } from "../../src/lib/routes";
import { useChromium1920Only } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

const SITE = "https://pracownia-eha.pl";

/** Data obowiązywania i wersja z pasma daty (decyzja Mateusza z 4.6 —
 *  docs/analiza-polityka.md §2 pkt 9). Kontrakt trzyma je tutaj, żeby
 *  zmiana daty była świadoma: dokument prawny nie zmienia daty „przy
 *  okazji" edycji treści. */
const EFFECTIVE_DATE = "01.09.2026";
const VERSION = "1.0";

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

test(`${POLICY_PATH}: spis treści opisuje dokładnie te sekcje, które są`, async ({
  page,
}) => {
  await gotoReady(page, POLICY_PATH);
  // Spis i nagłówki sekcji mają w widoku JEDNO źródło (stała SECS), ale
  // kontrakt sprawdza EFEKT: każda kotwica trafia w istniejące `id`,
  // a jej etykieta zgadza się z nagłówkiem sekcji.
  const links = page.locator(".pp-toc-l a");
  await expect(links).toHaveCount(9);
  for (const link of await links.all()) {
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^#pp-0[1-9]$/);
    const section = page.locator(`${href!}.pp-sec`);
    await expect(section).toHaveCount(1);
    // etykieta kotwicy = tytuł sekcji (bez numeru, który jest dekoracją)
    const label = (
      await link.locator("span:not(.pp-toc-n)").innerText()
    ).trim();
    await expect(section.locator("h2")).toHaveText(label);
  }
});

test(`${POLICY_PATH}: pasmo daty obowiązywania jest wypełnione`, async ({
  page,
}) => {
  await gotoReady(page, POLICY_PATH);
  await expect(page.locator(".pp-date")).toContainText(
    `OBOWIĄZUJE OD ${EFFECTIVE_DATE}`,
  );
  await expect(page.locator(".pp-date")).toContainText(`WERSJA ${VERSION}`);
  // sekcja 09 powtarza tę samą datę — w widoku z jednej stałej
  await expect(page.locator(".pp-upd")).toHaveText(
    `OSTATNIA AKTUALIZACJA: ${EFFECTIVE_DATE}`,
  );
});

test(`${POLICY_PATH}: żaden placeholder designu nie został w treści`, async ({
  page,
}) => {
  await gotoReady(page, POLICY_PATH);
  // Eksport designu miał świadome luki do uzupełnienia przy wdrożeniu
  // ([DOMENA], [DOSTAWCA POCZTY E-MAIL], [EOG / POZA EOG], [OKRES — …]).
  // Publikacja dokumentu prawnego z takim nawiasem = wpadka, więc
  // strażnik szuka WZORCA, nie konkretnych fraz.
  const text = await page.locator("main.pp").innerText();
  expect(text).not.toMatch(/\[[^\]]+\]/);
  // najczęstsze konkrety — komunikat czytelny, gdy wzorzec wróci
  expect(text).not.toContain("[DOMENA]");
  expect(text).toContain("pracownia-eha.pl");
});

test("link polityki w stopce jest na każdym szkielecie", async ({ page }) => {
  // Stopka 4.1 linkuje politykę dwa razy: kolumna O NAS + pas dolny.
  await gotoReady(page, "/");
  await expect(
    page.locator(`footer a[href="${POLICY_PATH}"]`).first(),
  ).toBeAttached();
  await gotoReady(page, CONTACT_PATH);
  await expect(
    page.locator(`footer a[href="${POLICY_PATH}"]`).first(),
  ).toBeAttached();
});
