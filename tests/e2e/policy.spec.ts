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
const EFFECTIVE_DATE = "25.08.2026";
const UPDATED_DATE = "29.08.2026";
const VERSION = "1.1";

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
  // sekcja 09 niesie datę TEJ redakcji — inną niż data obowiązywania
  // (dokument obowiązuje od pierwszej publikacji, tekst bywa poprawiany).
  await expect(page.locator(".pp-upd")).toHaveText(
    `OSTATNIA AKTUALIZACJA: ${UPDATED_DATE}`,
  );
});

test(`${POLICY_PATH}: data obowiązywania NIE jest z przyszłości`, async ({
  page,
}) => {
  // Pierwotne 01.09.2026 wyprzedzało stan faktyczny o tydzień: formularz
  // przetwarzał już dane od 26.08, a w Etapie 6 doszły Web Analytics
  // i indeksowanie. Opublikowany dokument, który „jeszcze nie obowiązuje",
  // to rozjazd kodu z dokumentem prawnym — ten kontrakt go łapie.
  await gotoReady(page, POLICY_PATH);
  const band = (await page.locator(".pp-date").innerText()).replace(
    /\s+/g,
    " ",
  );
  const [, d, m, y] = band.match(/OBOWIĄZUJE OD (\d{2})\.(\d{2})\.(\d{4})/)!;
  const effective = Date.UTC(Number(y), Number(m) - 1, Number(d));
  const today = new Date();
  const midnight = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  expect(
    effective,
    `polityka obowiązuje od ${d}.${m}.${y}, a serwis przetwarza dane JUŻ DZIŚ`,
  ).toBeLessThanOrEqual(midnight);
});

test(`${POLICY_PATH}: obowiązkowe elementy klauzuli informacyjnej RODO`, async ({
  page,
}) => {
  // Art. 13 RODO wylicza, co MUSI się znaleźć. Ten kontrakt pilnuje
  // elementów, które najłatwiej wypaść przy redakcji treści:
  //   13(1)(b) — inspektor ochrony danych „jeżeli ma to zastosowanie",
  //   13(2)(d) — prawo skargi do organu nadzorczego,
  //   21(4)    — prawo sprzeciwu JASNO i ODRĘBNIE od innych informacji.
  await gotoReady(page, POLICY_PATH);
  await expect(page.locator("#pp-01")).toContainText(
    "inspektora ochrony danych",
  );
  await expect(page.locator("#pp-07")).toContainText(
    "skargę do Prezesa Urzędu Ochrony Danych Osobowych",
  );
  // Sprzeciw ma stać we WŁASNYM, wyróżnionym akapicie — nie tylko jako
  // pozycja wyliczanki (art. 21 ust. 4 mówi wprost „odrębnie").
  const objection = page.locator("#pp-07 p", { hasText: "prawo sprzeciwu" });
  await expect(objection).toHaveCount(1);
  await expect(objection.locator("strong")).toBeVisible();
  await expect(objection).toContainText("art. 6 ust. 1 lit. f");
});

test(`${POLICY_PATH}: lista danych statystyki opisuje to, co Cloudflare realnie zbiera`, async ({
  page,
}) => {
  // Lista jest ZAMKNIĘTA słowem „wyłącznie", więc każdy wymiar Web
  // Analytics musi się w niej znaleźć. Cloudflare wystawia: Country, Host,
  // Path, Referer, Device type, Browser, Operating system, Navigation type
  // + odsłony/wizyty, page load time i Core Web Vitals (docs 2026-08-27).
  // Brakowało odsyłacza, systemu operacyjnego i pomiarów szybkości.
  await gotoReady(page, POLICY_PATH);
  const sec = page.locator("#pp-02");
  for (const needle of [
    "odsłony",
    "adresy podstron",
    "z której do nas trafiłeś",
    "kraj",
    "rodzaj urządzenia",
    "przeglądarka",
    "system operacyjny",
    "sposób wejścia",
    "szybkości",
  ]) {
    await expect(sec, `brak „${needle}" w wykazie statystyki`).toContainText(
      needle,
    );
  }
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
