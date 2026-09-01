// Widok /kompetencje-i-technologie/ (Etap 4.4 cz. 2,
// docs/analiza-kompetencje.md §3) — kontrakty: SSR bez JS (PEŁNE
// akapity w HTML-u — sekcje rzemiosł mają świadome duplikaty
// dOnly/mOnly, stąd asercje przez :visible; przyciski zwijania
// ukryte), zwijane akapity mobile (CollapsibleText + collapsible.ts —
// rozwiń/zwiń, aria, maska, brak skoku scrolla przy „Zwiń"), navbar
// tone="dark" (krem nad hero z górnym gradientem → atrament po stanie
// solid, progi z nav-config), CTA (karta fizyki → tradycja, granice →
// kontakt), reveale za bramką js-motion, dryf tła papieru
// (PaperBackdrop), strażnik natywnego scrolla (D-Q1) i kontrakt
// breakpointu CONTENT_DESKTOP_MIN_PX.
import { expect, test, type Page } from "@playwright/test";
import { NAV_SOLID_HERO_PAD_PX } from "../../src/components/navbar/nav-config";
import { CONTENT_DESKTOP_MIN_PX } from "../../src/components/sections/content-config";
import { PAPER_BG_SPEED } from "../../src/components/sections/home/home-config";
import {
  CONTACT_PATH,
  KOMPETENCJE_PATH,
  TRADYCJA_PATH,
} from "../../src/lib/routes";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import {
  collectPageIssues,
  usePreviewGuard,
  useChromium1920Only,
} from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

const PATH = KOMPETENCJE_PATH;

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
    await expect(page.locator("main h1")).toHaveText(
      "Kompetencje i technologie.",
    );
    // kicker+h2 sekcji są JEDNYM elementem na oba progi (analiza §2.5)
    for (const h2 of [
      "Drewno. Ciesielstwo bez dróg na skróty",
      "Cegła i kamień. Murarstwo z duszą",
      "Sklepienia. Korona naszego rzemiosła",
      "Fizyka budowli. Ekologia, która działa",
      "Współczesny krwiobieg w historycznym ciele",
      "Stan surowy zamknięty +",
    ]) {
      await expect(
        page.locator("main h2").filter({ hasText: h2 }),
      ).toBeVisible();
    }
    // końcówka zwijanego bloku granic (JEDNA kopia — wspólny markup)
    // widoczna w całości (bez maski/kapu)
    await expect(page.getByText("podłóg na legarach.")).toBeVisible();
    // końcówki treści rzemiosł istnieją w DWÓCH kopiach (mOnly w pudle
    // + dOnly w kolumnie desktop) — na każdym profilu widoczna jest
    // dokładnie jedna
    await expect(
      page.locator("p:visible", {
        hasText: "odpowiednio wyselekcjonowanym materiałem.",
      }),
    ).toHaveCount(1);
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

  test("CTA prowadzą na tradycję (karta fizyki) i kontakt (granice)", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await expect(page.locator(".eko-card a")).toHaveAttribute(
      "href",
      TRADYCJA_PATH,
    );
    await expect(page.locator(".gran-cta")).toHaveAttribute(
      "href",
      CONTACT_PATH,
    );
  });
});

// ── navbar tone="dark": krem nad hero, atrament po stanie solid ──
test("navbar: kremowy nad hero, atramentowy po zjechaniu za próg", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  const hdr = page.locator("[data-nav]");
  // burger (mobile) i linki (desktop) dziedziczą --hdr-ink z .hdr —
  // wystarczy zmierzyć kolor burgera (jest w DOM na obu progach).
  // Odczyt przez expect.poll: krem↔atrament ma transition 0.3 s
  // (lekcja webkit-CI z 4.4 cz. 1 — jednorazowy odczyt łapał kolor
  // w połowie tranzycji).
  const inkOf = () =>
    page.evaluate(() =>
      getComputedStyle(document.querySelector(".mbtn")!).getPropertyValue(
        "color",
      ),
    );
  await expect(hdr).toHaveAttribute("data-tone", "dark");
  await expect(hdr).not.toHaveAttribute("data-solid");
  await expect.poll(inkOf).toBe("rgb(245, 239, 227)");

  const h = await heroH(page);
  // tuż PRZED progiem (heroH - pad) — wciąż przezroczysty krem
  await scrollPageTo(page, h - NAV_SOLID_HERO_PAD_PX - 24);
  await expect(hdr).not.toHaveAttribute("data-solid");
  // tuż ZA progiem — solid: papierowe tło + atramentowa treść paska
  await scrollPageTo(page, h - NAV_SOLID_HERO_PAD_PX + 24);
  await expect(hdr).toHaveAttribute("data-solid");
  await expect(page.locator(".hdr-bg")).toHaveCSS("opacity", "1");
  await expect.poll(inkOf).toBe("rgb(33, 29, 24)");
  // powrót na górę przywraca krem
  await scrollPageTo(page, 0);
  await expect(hdr).not.toHaveAttribute("data-solid");
  await expect.poll(inkOf).toBe("rgb(245, 239, 227)");
});

// ── zwijane akapity (mobile) ──
test.describe("zwijane akapity — układ mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "zwijanie istnieje tylko <1024");

  test("po uzbrojeniu: zwinięte z maską i „Czytaj dalej”; wysokości z eksportu", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const hosts = page.locator("[data-clp]");
    await expect(hosts).toHaveCount(4);
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
    // wysokości zwinięcia per instancja (eksport: rzemiosła 132 /
    // świadome granice 128)
    await expect(page.locator("#sec-ciesielstwo")).toHaveCSS(
      "max-height",
      "132px",
    );
    await expect(page.locator("#sec-granice")).toHaveCSS("max-height", "128px");
  });

  test("rozwinięcie odsłania całość, „Zwiń” wraca bez skoku scrolla", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const host = page.locator("[data-clp]", {
      has: page.locator("#sec-ciesielstwo"),
    });
    const btn = host.locator("[data-clp-btn]");
    const tail = host.getByText("odpowiednio wyselekcjonowanym materiałem.");

    await expect(tail).not.toBeInViewport();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(btn).toContainText("Zwiń");
    await expect(host).not.toHaveAttribute("data-collapsed");
    await expect(page.locator("#sec-ciesielstwo")).toHaveCSS(
      "max-height",
      "none",
    );
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
    // wspólne pudło granic renderuje na desktopie pełny tekst
    await expect(page.locator("#sec-granice")).toHaveCSS("max-height", "none");
    await expect(page.getByText("podłóg na legarach.")).toBeVisible();
    // treść rzemiosł pokazuje kopia dOnly (pudła mOnly są schowane)
    await expect(
      page.locator("p:visible", {
        hasText: "odpowiednio wyselekcjonowanym materiałem.",
      }),
    ).toHaveCount(1);
  });
});

// ── reveal płyty po dojechaniu (bramka js-motion, mobile) ──
// Sonda siedziała na kickerze „ŚWIADOME GRANICE"; po jego usunięciu
// (poprawki klienta) pierwszym [data-rev] płyty jest h2.
test("reveal nagłówka płyty granic odpala po dojechaniu scrollem", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "reveale [data-rev] istnieją tylko w układzie mobile");
  await gotoReady(page, PATH);
  const kick = page.locator(".gran-head h2");
  await expect(kick).toHaveCSS("opacity", "0");
  await kick.scrollIntoViewIfNeeded();
  await settle(page, 400);
  await expect(kick).toHaveCSS("opacity", "1");
});

// ── dryf tła papieru (PaperBackdrop): jak `/`, /realizacje/, /ekipa-eha/ ──
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
      plbg: ".cies-head .kmp-plbg",
      photo: ".cies-photo",
      two: ".kmp-two",
    },
    { plbg: "block", photo: "none", two: "none" },
    { plbg: "none", photo: "block", two: "block" },
  );
});
