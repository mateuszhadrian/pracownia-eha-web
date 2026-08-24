// Widok /ekipa-eha/ (Etap 4.4 cz. 1, docs/analiza-ekipa.md §3) —
// kontrakty: SSR bez JS (PEŁNE akapity w HTML-u, przyciski zwijania
// ukryte), zwijane akapity mobile (CollapsibleText + collapsible.ts —
// rozwiń/zwiń, aria, maska, brak skoku scrolla przy „Zwiń"), navbar
// tone="dark" (krem nad ciemnym hero → atrament po stanie solid,
// progi z nav-config), CTA, reveale za bramką js-motion, dryf tła
// papieru (PaperBackdrop), strażnik natywnego scrolla (D-Q1)
// i kontrakt breakpointu CONTENT_DESKTOP_MIN_PX.
import { expect, test, type Page } from "@playwright/test";
import { NAV_SOLID_HERO_PAD_PX } from "../../src/components/navbar/nav-config";
import { CONTENT_DESKTOP_MIN_PX } from "../../src/components/sections/content-config";
import { PAPER_BG_SPEED } from "../../src/components/sections/home/home-config";
import { CONTACT_PATH, EKIPA_PATH } from "../../src/lib/routes";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import {
  collectPageIssues,
  usePreviewGuard,
  useChromium1920Only,
} from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

const PATH = EKIPA_PATH;

/** Wysokość hero ([data-navref]) w dokumencie. */
const heroH = (page: Page) =>
  page.evaluate(
    () => document.querySelector<HTMLElement>("[data-navref]")!.offsetHeight,
  );

// ── SSR: treść kompletna bez JS (zwijanie nie może zabierać treści) ──
test.describe("bez JS strona jest kompletna treściowo", () => {
  test.use({ javaScriptEnabled: false });

  test("h1, nagłówki i PEŁNE akapity w SSR; przyciski zwijania ukryte", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toHaveText("Ekipa EH/A.");
    for (const h2 of [
      "Od sieci korporacyjnych do sieci słupowo-ryglowych",
      "Geologiczna precyzja i zrozumienie materii",
      "Dolnośląskie dziedzictwo, zachodnia szkoła rzemiosła",
      "Im trudniej, tym lepiej",
      "Sprawdzona sieć mistrzów i absolutny spokój inwestora",
    ]) {
      await expect(
        page.locator("main h2").filter({ hasText: h2 }),
      ).toBeVisible();
    }
    // końcówki zwijanych bloków są widoczne w całości (bez maski/kapu)
    await expect(page.getByText("poznał Maćka.")).toBeVisible();
    await expect(page.getByText("pełnego zaopiekowania.")).toBeVisible();
    // wszystkie przyciski zwijania siedzą w SSR z atrybutem hidden
    const btns = page.locator("[data-clp-btn]");
    expect(await btns.count()).toBeGreaterThan(0);
    for (const btn of await btns.all()) {
      await expect(btn).toBeHidden();
    }
  });
});

// ── meta i higiena strony (jeden profil desktop) ──
test.describe(`${PATH}: meta i treść (jeden profil)`, () => {
  useChromium1920Only("meta i higiena strony nie zależą od profilu");

  test("strona ładuje się bez błędów konsoli i 404", async ({ page }) => {
    const issues = collectPageIssues(page);
    await gotoReady(page, PATH);
    await settle(page);
    expect(issues()).toEqual([]);
  });

  test("CTA nad stopką prowadzi na kontakt", async ({ page }) => {
    await gotoReady(page, PATH);
    await expect(page.locator(".eka-cta-in a")).toHaveAttribute(
      "href",
      CONTACT_PATH,
    );
  });
});

// ── navbar tone="dark": krem nad hero, atrament po stanie solid ──
test("navbar: kremowy nad ciemnym hero, atramentowy po zjechaniu za próg", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  const hdr = page.locator("[data-nav]");
  // burger (mobile) i linki (desktop) dziedziczą --hdr-ink z .hdr —
  // wystarczy zmierzyć kolor burgera (jest w DOM na obu progach)
  const inkOf = () =>
    page.evaluate(() =>
      getComputedStyle(document.querySelector(".mbtn")!).getPropertyValue(
        "color",
      ),
    );
  await expect(hdr).toHaveAttribute("data-tone", "dark");
  await expect(hdr).not.toHaveAttribute("data-solid");
  expect(await inkOf()).toBe("rgb(245, 239, 227)");

  const h = await heroH(page);
  // tuż PRZED progiem (heroH - pad) — wciąż przezroczysty krem
  await scrollPageTo(page, h - NAV_SOLID_HERO_PAD_PX - 24);
  await expect(hdr).not.toHaveAttribute("data-solid");
  // tuż ZA progiem — solid: papierowe tło + atramentowa treść paska
  await scrollPageTo(page, h - NAV_SOLID_HERO_PAD_PX + 24);
  await expect(hdr).toHaveAttribute("data-solid");
  await expect(page.locator(".hdr-bg")).toHaveCSS("opacity", "1");
  expect(await inkOf()).toBe("rgb(33, 29, 24)");
  // powrót na górę przywraca krem
  await scrollPageTo(page, 0);
  await expect(hdr).not.toHaveAttribute("data-solid");
  expect(await inkOf()).toBe("rgb(245, 239, 227)");
});

// ── zwijane akapity (mobile) ──
test.describe("zwijane akapity — układ mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "zwijanie istnieje tylko <1024");

  test("po uzbrojeniu: zwinięte z maską i „Czytaj dalej”; wysokości z eksportu", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const hosts = page.locator("[data-clp]");
    await expect(hosts).toHaveCount(5);
    for (const host of await hosts.all()) {
      await expect(host).toHaveAttribute("data-collapsed", "");
      const btn = host.locator("[data-clp-btn]");
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute("aria-expanded", "false");
      await expect(btn).toContainText("Czytaj dalej");
      // maska gradientowa wygasza dół zwiniętej treści
      const mask = await host
        .locator(".clp-body")
        .evaluate(
          (el) =>
            getComputedStyle(el).maskImage ||
            getComputedStyle(el).webkitMaskImage,
        );
      expect(mask).toContain("linear-gradient");
    }
    // wysokości zwinięcia per instancja (biogram 98 / sekcja 112)
    await expect(page.locator("#bio-lukasz")).toHaveCSS("max-height", "98px");
    await expect(page.locator("#sec-korzenie")).toHaveCSS(
      "max-height",
      "112px",
    );
  });

  test("rozwinięcie odsłania całość, „Zwiń” wraca bez skoku scrolla", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const host = page.locator("[data-clp]", {
      has: page.locator("#bio-lukasz"),
    });
    const btn = host.locator("[data-clp-btn]");
    const tail = page.getByText("poznał Maćka.");

    await expect(tail).not.toBeInViewport();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(btn).toContainText("Zwiń");
    await expect(host).not.toHaveAttribute("data-collapsed");
    await expect(page.locator("#bio-lukasz")).toHaveCSS("max-height", "none");
    await tail.scrollIntoViewIfNeeded();
    await expect(tail).toBeInViewport();

    // „Zwiń" z dołu rozwiniętej treści: przycisk zostaje pod palcem
    // (korekta scrollBy w collapsible.ts — kontrakt „brak skoku")
    await btn.scrollIntoViewIfNeeded();
    await settle(page, 200);
    const before = await btn.evaluate((el) => el.getBoundingClientRect().top);
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(host).toHaveAttribute("data-collapsed", "");
    const after = await btn.evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
  });
});

// ── desktop: pełny tekst bez zwijania ──
test.describe("desktop pokazuje pełny tekst", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("przyciski zwijania niewidoczne, treść bez kapu wysokości", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    for (const btn of await page.locator("[data-clp-btn]").all()) {
      await expect(btn).toBeHidden();
    }
    await expect(page.locator("#bio-lukasz")).toHaveCSS("max-height", "none");
    await expect(page.getByText("poznał Maćka.")).toBeVisible();
  });
});

// ── reveal płyty po dojechaniu (bramka js-motion, mobile) ──
test("reveal kickera płyty odpala po dojechaniu scrollem", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "reveale [data-rev] istnieją tylko w układzie mobile");
  await gotoReady(page, PATH);
  const kick = page.locator(".eka-plate-siec .eka-kick");
  await expect(kick).toHaveCSS("opacity", "0");
  await kick.scrollIntoViewIfNeeded();
  await settle(page, 400);
  await expect(kick).toHaveCSS("opacity", "1");
});

// ── dryf tła papieru (PaperBackdrop): jak `/` i /realizacje/ ──
test("tło papieru dryfuje wolniej niż treść (desktop)", async ({
  page,
  isMobile,
}) => {
  test.skip(
    !!isMobile,
    "dryf tła jest desktop-only — mobile scrolluje 1:1 z treścią (eksport)",
  );
  await gotoReady(page, PATH);
  await scrollPageTo(page, 600);
  const drift = await page.evaluate((speed) => {
    const tex = document.querySelector<HTMLElement>("[data-paper-tex]")!;
    const m = new DOMMatrixReadOnly(getComputedStyle(tex).transform);
    const period = window.innerWidth * Number(tex.dataset.ratio);
    return {
      ty: m.m42,
      expected: -((window.scrollY * speed) % period),
      fixed: getComputedStyle(tex).position,
    };
  }, PAPER_BG_SPEED);
  expect(drift.fixed).toBe("fixed");
  expect(Math.abs(drift.ty - drift.expected)).toBeLessThanOrEqual(1);
});

// ── strażnik D-Q1: scroll natywny, bez wygładzacza ──
test("scroll jest natywny — bez biblioteki wygładzającej", async ({
  page,
  isMobile,
}) => {
  test.skip(!!isMobile, "mouse.wheel nie istnieje w profilach dotykowych");
  await gotoReady(page, PATH);
  await settle(page, 300);
  expect(await page.evaluate(() => "__lenis" in window)).toBe(false);

  const before = await page.evaluate(() => Math.round(window.scrollY));
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 600);
  await settle(page, 250);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(
    before,
  );
});

// ── kontrakt progu (sections.md: stała + @media w parze) ──
test("próg desktopowy: warianty przełączają się dokładnie na CONTENT_DESKTOP_MIN_PX", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "kontrakt progu — jeden profil desktop (test sam zmienia szerokość)",
  );
  await gotoReady(page, PATH);
  await expectBreakpointFlip(
    page,
    CONTENT_DESKTOP_MIN_PX,
    {
      rycM: ".eka-int-rycm",
      rycD: ".eka-int-ryc1",
      trudP1: ".trud-p1",
    },
    { rycM: "block", rycD: "none", trudP1: "none" },
    { rycM: "none", rycD: "block", trudP1: "block" },
  );
});
