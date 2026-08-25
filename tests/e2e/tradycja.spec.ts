// Widok /tradycja-i-ekologia/ (Etap 4.5 cz. 1, docs/analiza-tradycja.md
// §3) — kontrakty: SSR bez JS (PEŁNE akapity — sekcje fizyka/upcycling/
// trwałość mają świadome duplikaty dOnly/mOnly, stąd asercje przez
// :visible; DIAGRAM kompletny statycznie; przyciski zwijania ukryte),
// zwijane akapity mobile ×3 (CollapsibleText + collapsible.ts — aria,
// maska, brak skoku scrolla przy „Zwiń"), ANIMOWANY DIAGRAM i kolek po
// dojechaniu (tradycja-motion.ts, stany końcowe transitions), navbar
// tone="dark" (progi z nav-config), CTA → kontakt, reveale za bramką
// js-motion, dryf tła (PaperBackdrop), strażnik natywnego scrolla
// (D-Q1) i kontrakt breakpointu CONTENT_DESKTOP_MIN_PX.
import { expect, test, type Page } from "@playwright/test";
import { NAV_SOLID_HERO_PAD_PX } from "../../src/components/navbar/nav-config";
import { CONTENT_DESKTOP_MIN_PX } from "../../src/components/sections/content-config";
import { PAPER_BG_SPEED } from "../../src/components/sections/home/home-config";
import { CONTACT_PATH, TRADYCJA_PATH } from "../../src/lib/routes";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import {
  collectPageIssues,
  usePreviewGuard,
  useChromium1920Only,
} from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

const PATH = TRADYCJA_PATH;

/** Wysokość hero ([data-navref]) w dokumencie. */
const heroH = (page: Page) =>
  page.evaluate(
    () => document.querySelector<HTMLElement>("[data-navref]")!.offsetHeight,
  );

// ── SSR: treść kompletna bez JS (zwijanie nie może zabierać treści) ──
test.describe("bez JS strona jest kompletna treściowo", () => {
  test.use({ javaScriptEnabled: false });

  test("h1, nagłówki, PEŁNE akapity i statyczny diagram w SSR; przyciski ukryte", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toHaveText("Tradycja i ekologia.");
    for (const h2 of [
      "Fizyka budowli. Dom, który naprawdę oddycha",
      "Upcycling na wielką skalę. Drugie życie architektury",
      "Trwałość. Prawdziwa miara ekologii",
      "Zdrowy mikroklimat i bezpieczna przystań",
    ]) {
      await expect(
        page.locator("main h2").filter({ hasText: h2 }),
      ).toBeVisible();
    }
    // końcówki treści istnieją w DWÓCH kopiach (mOnly w pudle + dOnly
    // w gridzie desktop) — na każdym profilu widoczna jest dokładnie jedna
    await expect(
      page.locator("p:visible", {
        hasText: "potężnym siłom naprężeń przez setki lat.",
      }),
    ).toHaveCount(1);
    // mikroklimat = jeden markup (bez duplikacji)
    await expect(
      page.getByText("na optymalnym dla człowieka poziomie."),
    ).toBeVisible();
    // diagram kompletny statycznie: widoczna dokładnie jedna kopia
    // z pięcioma warstwami (druga kopia siedzi w drzewie drugiego progu)
    await expect(page.locator(".dg-box:visible")).toHaveCount(1);
    await expect(page.locator(".dg-box:visible .dg-lay")).toHaveCount(5);
    await expect(
      page.locator(".dg-lay:visible", { hasText: "MUR HISTORYCZNY" }),
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

  test("CTA prowadzi na kontakt", async ({ page }) => {
    await gotoReady(page, PATH);
    await expect(page.locator(".cta-btn")).toHaveAttribute(
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
  // Odczyt przez expect.poll: krem↔atrament ma transition 0.3 s.
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
    await expect(hosts).toHaveCount(3);
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
    // wysokość zwinięcia (eksport: fz/up/tw = 132 px, ×3)
    for (const id of ["#sec-fizyka", "#sec-upcycling", "#sec-trwalosc"]) {
      await expect(page.locator(id)).toHaveCSS("max-height", "132px");
    }
  });

  test("rozwinięcie odsłania całość, „Zwiń” wraca bez skoku scrolla", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const host = page.locator("[data-clp]", {
      has: page.locator("#sec-upcycling"),
    });
    const btn = host.locator("[data-clp-btn]");
    const tail = host.getByText("najwyższa możliwa forma szacunku");

    await expect(tail).not.toBeInViewport();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(btn).toContainText("Zwiń");
    await expect(host).not.toHaveAttribute("data-collapsed");
    await expect(page.locator("#sec-upcycling")).toHaveCSS(
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

// ── desktop: pełny tekst bez zwijania, diagram statycznie kompletny ──
test.describe("desktop pokazuje pełny tekst", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("przyciski zwijania niewidoczne, treść bez kapu wysokości", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    for (const btn of await page.locator("[data-clp-btn]").all()) {
      await expect(btn).toBeHidden();
    }
    // treść pokazują kopie dOnly (pudła mOnly są schowane)
    await expect(
      page.locator("p:visible", {
        hasText: "potężnym siłom naprężeń przez setki lat.",
      }),
    ).toHaveCount(1);
  });

  test("diagram desktopowy jest statyczny i kompletny (bez uzbrojenia)", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const box = page.locator(".dg-box:visible");
    await expect(box).toHaveCount(1);
    // kopia desktopowa nie ma [data-diag] — warstwy widoczne bez `.in`
    await expect(page.locator(".trd-diag:visible")).not.toHaveAttribute(
      "data-diag",
      "",
    );
    const lay = box.locator(".dg-lay").first();
    await expect(lay).toHaveCSS("opacity", "1");
    // strzałka bez transformu startowego scaleX(0)
    const arwT = await box
      .locator(".dg-arw")
      .evaluate((el) => getComputedStyle(el).transform);
    expect(arwT).toBe("none");
  });
});

// ── animowany diagram (mobile, tradycja-motion.ts) ──
test("diagram: po rozwinięciu fizyki i dojechaniu warstwy wjeżdżają do stanów końcowych", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "animacja diagramu jest mobile-only (eksport)");
  await gotoReady(page, PATH);
  const diag = page.locator("[data-diag]");
  // uzbrojony przed dojechaniem: warstwy przezroczyste, strzałka scaleX(0)
  await expect(diag.locator(".dg-lay").first()).toHaveCSS("opacity", "0");
  // rozwiń pudło fizyki (diagram siedzi pod oknem 132 px)
  const btn = page
    .locator("[data-clp]", { has: page.locator("#sec-fizyka") })
    .locator("[data-clp-btn]");
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await diag.scrollIntoViewIfNeeded();
  await expect(diag).toHaveClass(/\bin\b/);
  // stany końcowe (kaskada: warstwy → strzałka .42 s → groty 1.3+0.4 s)
  const cssOf = (sel: string, prop: string) =>
    page.evaluate(
      ([s, p]) =>
        getComputedStyle(document.querySelector(s)!).getPropertyValue(p),
      [sel, prop] as const,
    );
  await expect
    .poll(() => cssOf("[data-diag] .dg-lay:last-of-type", "opacity"), {
      timeout: 10_000,
    })
    .toBe("1");
  await expect
    .poll(() => cssOf("[data-diag] .dg-arw", "transform"), { timeout: 10_000 })
    .toBe("matrix(1, 0, 0, 1, 0, 0)");
  await expect
    .poll(() => cssOf("[data-diag] .dg-arwh-r", "opacity"), {
      timeout: 10_000,
    })
    .toBe("1");
});

// ── kolek (mobile): wjazd znaku wodnego do opacity .14 ──
test("kolek wjeżdża po dojechaniu do sekcji trwałości", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "kolek istnieje tylko w układzie mobile");
  await gotoReady(page, PATH);
  const kolek = page.locator("[data-kolek]");
  await expect(kolek).toHaveCSS("opacity", "0");
  // kolek jest przycięty zwiniętym pudłem, ale trigger (threshold .01)
  // odpala także dla elementów przyciętych — kontrakt analizy §2.8
  await page
    .locator("#sec-trwalosc")
    .evaluate((el) =>
      window.scrollTo(
        0,
        el.getBoundingClientRect().top +
          window.scrollY -
          window.innerHeight / 2,
      ),
    );
  await expect(kolek).toHaveClass(/\bin\b/);
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            getComputedStyle(document.querySelector("[data-kolek]")!).opacity,
        ),
      { timeout: 10_000 },
    )
    .toBe("0.14");
});

// ── reveal nagłówka po dojechaniu (bramka js-motion, mobile) ──
test("reveal kickera mikroklimatu odpala po dojechaniu scrollem", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "reveale [data-rev] istnieją tylko w układzie mobile");
  await gotoReady(page, PATH);
  const kick = page.locator(".mik-head .trd-kick");
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
      band: ".trd-band",
      photo: ".fiz-photo",
      grid: ".up-g2",
    },
    { band: "block", photo: "none", grid: "none" },
    { band: "none", photo: "block", grid: "grid" },
  );
});
