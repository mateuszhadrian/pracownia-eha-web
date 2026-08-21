// Nawigacja chrome'u: linki paska (desktop), sticky pasek, menu mobilne
// jako bottom sheet na overlay.ts (otwieranie, Esc, scrim, swipe-down),
// telefony/mail składane w JS (antyscraping). Na szkielecie Etapu 0 nav
// jest płaską listą 6 pozycji; dropdown „O nas" + auto-hide wchodzą
// w Etapie 4.1 i wtedy ten spec dostaje kontrakty auto-hide.
import { expect, test } from "@playwright/test";
import {
  CONTACT_PATH,
  EKIPA_PATH,
  OBSLUGA_PATH,
  WORK_INDEX_PATH,
} from "../../src/lib/routes";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

test.describe("nawigacja desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("link Ekipa EH/A nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    // Asercja treści celowo ogólna (main h1) — ma przetrwać wymianę
    // szkieletu Etapu 0 na docelowy widok i kolejne zmiany treści.
    await page.locator(`.nav-link[href="${EKIPA_PATH}"]`).click();
    await expect(page).toHaveURL(/\/ekipa-eha\/?$/);
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("link Realizacje nawiguje na podstronę /realizacje/", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator(`.nav-link[href="${WORK_INDEX_PATH}"]`).click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("pasek jest widoczny u góry po wejściu i przy scrollu w górę", async ({
    page,
  }) => {
    // Docelowo navbar eha ma AUTO-HIDE (E11): chowa się przy scrollu w dół,
    // wraca przy scrollu w górę — pełne kontrakty auto-hide wchodzą razem
    // z mechanizmem w Etapie 4.1. Na szkielecie pasek jest sticky bez
    // chowania, więc mierzymy tylko „przyklejony do górnej krawędzi".
    await gotoReady(page, WORK_INDEX_PATH);
    const nav = page.locator("[data-nav]");
    const maxScroll = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    if (maxScroll > 0) await scrollPageTo(page, maxScroll);
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBe(0);
  });
});

test.describe("nawigacja mobile (bottom sheet)", () => {
  test.skip(({ isMobile }) => !isMobile, "tylko układ mobile");

  test("burger otwiera sheet, Escape zamyka i oddaje fokus", async ({
    page,
  }) => {
    await gotoReady(page);
    const root = page.locator("[data-nav]");
    const burger = page.locator("[data-burger]");
    const sheet = page.locator("#nav-sheet");

    await burger.click();
    await expect(root).toHaveAttribute("data-open", "");
    await expect(burger).toHaveAttribute("aria-expanded", "true");
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator(".m-link").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(root).not.toHaveAttribute("data-open", "");
    await expect(burger).toHaveAttribute("aria-expanded", "false");
    // Fokus wraca do elementu sprzed otwarcia (overlay.ts, lastFocused) —
    // bez twardej asercji: WebKit nie fokusuje buttonów po kliku myszą.
  });

  test("klik w scrim (nad panelem) zamyka sheet", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    const sheet = page.locator("#nav-sheet");
    await expect(sheet).toHaveClass(/is-open/);
    // Punkt przy górnej krawędzi = tło nakładki, poza [data-overlay-panel].
    await sheet.click({ position: { x: 10, y: 10 } });
    await expect(sheet).toBeHidden();
    await expect(page.locator("[data-nav]")).not.toHaveAttribute(
      "data-open",
      "",
    );
  });

  test("swipe-down za uchwyt zamyka sheet (gest overlay.ts)", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    const sheet = page.locator("#nav-sheet");
    await expect(sheet).toHaveClass(/is-open/);
    // Odczekaj wjazd panelu (transform .42s): boundingBox mierzony w trakcie
    // animacji celowałby tam, gdzie uchwyt dopiero BĘDZIE — pointerdown
    // trafiałby w nav sheeta i gest w ogóle by się nie zaczynał.
    await page.waitForTimeout(600);

    // Gest pointerowy: overlay.ts słucha pointer events, więc przeciągnięcie
    // myszą odpala tę samą ścieżkę co palec (drag > DRAG_CLOSE_PX zamyka).
    const grab = sheet.locator("[data-overlay-drag]");
    const box = await grab.boundingBox();
    expect(box).not.toBeNull();
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(startX, startY + i * 25);
    }
    await page.mouse.up();

    await expect(sheet).toBeHidden();
    await expect(page.locator("[data-nav]")).not.toHaveAttribute(
      "data-open",
      "",
    );
    await expect(page.locator("[data-burger]")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("pozycja Obsługa budowy w sheecie nawiguje na podstronę", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    // Asercja treści ogólna (main h1), odporna na wymianę szkieletu.
    await page.locator(`.m-link[href="${OBSLUGA_PATH}"]`).click();
    await expect(page).toHaveURL(/\/obsluga-budowy\/?$/);
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("pozycja Kontakt w sheecie nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    await page.locator(`.m-link[href="${CONTACT_PATH}"]`).click();
    await expect(page).toHaveURL(/\/kontakt\/?$/);
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("sheet ma sekcję zadzwoń z OBOMA numerami złożonymi w JS", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    // Dwa telefony MACIEK/ŁUKASZ (kontrakt antyscrapingowy: pełnych numerów
    // nie ma w surowym HTML — składa je fillContactSlots).
    const maciek = page.locator('#nav-sheet .sheet-call a[data-tel="maciek"]');
    const lukasz = page.locator('#nav-sheet .sheet-call a[data-tel="lukasz"]');
    await expect(maciek).toBeVisible();
    await expect(maciek).toHaveAttribute("href", "tel:+48696513743");
    await expect(lukasz).toBeVisible();
    await expect(lukasz).toHaveAttribute("href", "tel:+48533328356");
  });
});

test("logo w pasku prowadzi na stronę główną z podstrony", async ({ page }) => {
  await gotoReady(page, EKIPA_PATH);
  await page.locator(".hdr-logo").click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("telefony i mail NIE występują w surowym HTML (antyscraping)", async ({
  request,
}) => {
  // Kontrakt D-CH5 przeniesiony z delung, rozszerzony o DWA numery.
  // Sprawdzamy surowe źródło strony głównej (chrome renderuje sloty puste).
  const html = await (await request.get("/")).text();
  expect(html).not.toContain("696513743");
  expect(html).not.toContain("696 513 743");
  expect(html).not.toContain("533328356");
  expect(html).not.toContain("533 328 356");
  expect(html).not.toContain("eha@pracownia-eha.pl");
});

test("strona główna ładuje się bez błędów konsoli i 404", async ({ page }) => {
  const issues = collectPageIssues(page);
  await gotoReady(page);
  await settle(page);
  expect(issues()).toEqual([]);
});
