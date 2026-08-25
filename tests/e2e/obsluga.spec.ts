// Widok /obsluga-budowy/ (Etap 4.5 cz. 2, docs/analiza-obsluga.md §3) —
// kontrakty: SSR bez JS (pełna treść; motto jest zduplikowane
// dOnly/mOnly, stąd asercje przez :visible), BRAK zwijanych akapitów
// (jedyny widok treściowy bez CollapsibleText — analiza §1c),
// navbar tone="dark" (progi z nav-config), hero + wstęp = dokładnie
// jeden ekran na desktopie (screenH eksportu), kadr sekcji podsumowania
// na PEŁNEJ szerokości sekcji (sonda układu — absolutne dziecko gridu
// z jawnym grid-area dostaje za blok zawierający swoją komórkę),
// zapas kadrów pod parallax (D-U1), CTA → kontakt, reveale za bramką
// js-motion, dryf tła (PaperBackdrop), strażnik natywnego scrolla (D-Q1)
// i kontrakt breakpointu CONTENT_DESKTOP_MIN_PX.
import { expect, test, type Page } from "@playwright/test";
import { NAV_SOLID_HERO_PAD_PX } from "../../src/components/navbar/nav-config";
import { CONTENT_DESKTOP_MIN_PX } from "../../src/components/sections/content-config";
import {
  PAPER_BG_SPEED,
  PLX_AMT,
} from "../../src/components/sections/home/home-config";
import { CONTACT_PATH, OBSLUGA_PATH } from "../../src/lib/routes";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import {
  collectPageIssues,
  usePreviewGuard,
  useChromium1920Only,
} from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

const PATH = OBSLUGA_PATH;

/** Wysokość hero ([data-navref]) w dokumencie. */
const heroH = (page: Page) =>
  page.evaluate(
    () => document.querySelector<HTMLElement>("[data-navref]")!.offsetHeight,
  );

// ── SSR: treść kompletna bez JS ──
test.describe("bez JS strona jest kompletna treściowo", () => {
  test.use({ javaScriptEnabled: false });

  test("h1, trzy nagłówki sekcji, akapity i CTA w SSR", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toHaveText("Obsługa budowy.");
    for (const h2 of [
      "Jeden punkt kontaktu. My przejmujemy chaos",
      "Przyjeżdżasz i patrzysz.",
      "Czas na Twój ruch",
    ]) {
      await expect(
        page.locator("main h2").filter({ hasText: h2 }),
      ).toBeVisible();
    }
    // motto istnieje w DWÓCH kopiach (hero dOnly + czoło wstępu mOnly) —
    // na każdym profilu widoczna jest dokładnie jedna
    await expect(
      page.locator("p:visible", { hasText: "Twój święty spokój." }),
    ).toHaveCount(1);
    // sekcje 03–05 idą JEDNYM markupem — treść bez duplikatów
    await expect(
      page.getByText("aż po doprowadzenie budynku do stanu surowego"),
    ).toBeVisible();
    await expect(
      page.getByText("przejrzystą komunikację z placu boju."),
    ).toBeVisible();
    await expect(page.locator(".cta-btn")).toHaveAttribute(
      "href",
      CONTACT_PATH,
    );
  });

  test("widok świadomie NIE MA zwijanych akapitów (analiza §1c)", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-clp]")).toHaveCount(0);
    await expect(page.locator("[data-clp-btn]")).toHaveCount(0);
  });
});

// ── meta i higiena strony (jeden profil desktop) ──
test.describe(`${PATH}: meta i higiena (jeden profil)`, () => {
  useChromium1920Only("higiena strony nie zależy od profilu");

  test("strona ładuje się bez błędów konsoli i 404", async ({ page }) => {
    const issues = collectPageIssues(page);
    await gotoReady(page, PATH);
    await settle(page);
    expect(issues()).toEqual([]);
  });
});

// ── navbar tone="dark": krem nad hero, atrament po stanie solid ──
test("navbar: kremowy nad hero, atramentowy po zjechaniu za próg", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  const hdr = page.locator("[data-nav]");
  // burger (mobile) i linki (desktop) dziedziczą --hdr-ink z .hdr —
  // odczyt przez expect.poll: krem↔atrament ma transition 0.3 s.
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
  await scrollPageTo(page, h - NAV_SOLID_HERO_PAD_PX - 24);
  await expect(hdr).not.toHaveAttribute("data-solid");
  await scrollPageTo(page, h - NAV_SOLID_HERO_PAD_PX + 24);
  await expect(hdr).toHaveAttribute("data-solid");
  await expect(page.locator(".hdr-bg")).toHaveCSS("opacity", "1");
  await expect.poll(inkOf).toBe("rgb(33, 29, 24)");
  await scrollPageTo(page, 0);
  await expect(hdr).not.toHaveAttribute("data-solid");
  await expect.poll(inkOf).toBe("rgb(245, 239, 227)");
});

// ── układ desktop ──
test.describe("układ desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("hero + wstęp mieszczą się DOKŁADNIE w jednym ekranie", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const m = await page.evaluate(() => {
      const top = document.querySelector<HTMLElement>(".obs-top")!;
      const hero = document.querySelector<HTMLElement>(".obs-hero")!;
      const intro = document.querySelector<HTMLElement>(".obs-intro")!;
      return {
        top: top.offsetHeight,
        sum: hero.offsetHeight + intro.offsetHeight,
        vh: window.innerHeight,
      };
    });
    expect(Math.abs(m.top - m.vh)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.sum - m.top)).toBeLessThanOrEqual(1);
  });

  test("kadr podsumowania kryje CAŁĄ sekcję (a nie kolumnę gridu)", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const m = await page.evaluate(() => {
      const sec = document.querySelector(".obs-s3")!.getBoundingClientRect();
      const ph = document.querySelector(".s3-ph")!.getBoundingClientRect();
      return {
        secW: sec.width,
        phW: ph.width,
        secH: sec.height,
        phH: ph.height,
      };
    });
    expect(Math.abs(m.phW - m.secW)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.phH - m.secH)).toBeLessThanOrEqual(1);
  });

  test("pas domykający i rycina wstępu są mobilne — na desktopie znikają", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await expect(page.locator(".obs-band")).toBeHidden();
    await expect(page.locator(".int-ryc")).toBeHidden();
    await expect(page.locator(".obs-hero-row")).toBeVisible();
  });
});

// ── D-U1: zapas kadru ≥ ruch parallaxu (testy wizualne tego nie łapią) ──
test("kadry [data-plx] mają zapas wysokości większy niż ruch parallaxu", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "parallax kadrów jest mobile-only (eksport)");
  await gotoReady(page, PATH);
  const rows = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-plx]")).map(
      (img) => ({
        img: img.offsetHeight,
        frame: (img.parentElement as HTMLElement).offsetHeight,
      }),
    ),
  );
  expect(rows.length).toBeGreaterThan(0);
  for (const r of rows) {
    // ruch = ±(PLX_AMT / 2) × wysokość kadru, więc zapas musi wynosić
    // co najmniej tyle po KAŻDEJ stronie
    expect(r.img).toBeGreaterThanOrEqual(Math.round(r.frame * (1 + PLX_AMT)));
  }
});

// ── reveal nagłówka po dojechaniu (bramka js-motion, mobile) ──
test("reveal kickera podsumowania odpala po dojechaniu scrollem", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "reveale [data-rev] istnieją tylko w układzie mobile");
  await gotoReady(page, PATH);
  const kick = page.locator(".s3-txt .obs-kick");
  await expect(kick).toHaveCSS("opacity", "0");
  await kick.scrollIntoViewIfNeeded();
  await settle(page, 400);
  await expect(kick).toHaveCSS("opacity", "1");
});

// ── dryf tła papieru (PaperBackdrop): jak pozostałe trasy treściowe ──
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
      band: ".obs-band",
      rule: ".s2-rule",
      heroRow: ".obs-hero-row",
    },
    { band: "block", rule: "none", heroRow: "none" },
    { band: "none", rule: "block", heroRow: "flex" },
  );
});
