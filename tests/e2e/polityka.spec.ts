// Widok /polityka-prywatnosci/ (Etap 4.6, docs/analiza-polityka.md §3) —
// kontrakty PROFILOZALEŻNE i BEHAWIORALNE; treść i meta dokumentu siedzą
// w tests/e2e/policy.spec.ts (jeden profil desktop, plik z Etapu 3).
//
// Zakres: SSR bez JS (pełna treść, spis treści = zwykłe kotwice, sloty
// kontaktu z czytelnym fallbackiem), skok ze spisu ląduje POD nakładkowym
// paskiem (kontrakt scroll-margin-top — bez niego nagłówek chowa się za
// paskiem FIXED), sticky spis na desktopie, PIERWSZA trasa widokowa BEZ
// [data-navref] (stan solid z fallbacku nav-config), sloty antyscrapingowe
// (D-CH5), zakres widoku (brak zwijanych akapitów i kadrów z parallaxem),
// CTA, reveale za bramką js-motion, dryf tła (PaperBackdrop), strażnik
// natywnego scrolla (D-Q1) i kontrakt breakpointu CONTENT_DESKTOP_MIN_PX.
import { expect, test } from "@playwright/test";
import {
  NAV_SOLID_FALLBACK_PX,
  NAV_TOP_ALWAYS_PX,
} from "../../src/components/navbar/nav-config";
import { CONTENT_DESKTOP_MIN_PX } from "../../src/components/sections/content-config";
import { PAPER_BG_SPEED } from "../../src/components/sections/home/home-config";
import { CONTACT_PATH, POLICY_PATH } from "../../src/lib/routes";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import {
  collectPageIssues,
  usePreviewGuard,
  useChromium1920Only,
} from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

const PATH = POLICY_PATH;

// ── SSR: dokument prawny jest kompletny i nawigowalny bez JS ──
test.describe("bez JS strona jest kompletna treściowo", () => {
  test.use({ javaScriptEnabled: false });

  test("h1, 9 sekcji z nagłówkami i pełna treść w SSR", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toHaveText("Polityka prywatności");
    await expect(page.locator(".pp-sec")).toHaveCount(9);
    for (const h2 of [
      "Administrator danych",
      "Przekazywanie danych poza EOG",
      "Zmiany tej polityki",
    ]) {
      await expect(
        page.locator("main h2").filter({ hasText: h2 }),
      ).toBeVisible();
    }
    // treść idzie JEDNYM markupem (grid-areas zamiast duplikatów
    // dOnly/mOnly) — kluczowe frazy występują dokładnie raz
    await expect(
      page.getByText("Formularz niczego nie zapisuje po drodze"),
    ).toHaveCount(1);
    await expect(
      page.getByText("standardowe klauzule umowne zatwierdzone"),
    ).toBeVisible();
    // karty sekcji 03/04 i lista praw 07
    await expect(page.locator(".pp-card")).toHaveCount(3);
    await expect(page.locator(".pp-proc")).toHaveCount(3);
    await expect(page.locator(".pp-rights li")).toHaveCount(6);
  });

  test("spis treści działa jako zwykłe kotwice (bez JS)", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    const links = page.locator(".pp-toc-l a");
    await expect(links).toHaveCount(9);
    // Skoki eksportu robił JS (jump(k) + scrollTo smooth); port to czyste
    // kotwice, więc spis MUSI działać przy wyłączonym skrypcie.
    await expect(links.first()).toHaveAttribute("href", "#pp-01");
    await expect(links.last()).toHaveAttribute("href", "#pp-09");
    await links.nth(4).click();
    await expect(page).toHaveURL(new RegExp(`${PATH}#pp-05$`));
  });

  test("sloty kontaktu mają czytelny fallback i prowadzą do formularza", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    // Odstępstwo od chrome'u (analiza §2 pkt 10): w dokumencie prawnym
    // sloty NIE startują `hidden` — bez JS zdanie sekcji 01 musi się dać
    // przeczytać, a linki muszą dokądś prowadzić.
    const slots = page.locator("main .pp-slot");
    await expect(slots).toHaveCount(5);
    for (const slot of await slots.all()) {
      await expect(slot).toBeVisible();
      await expect(slot).toHaveAttribute("href", CONTACT_PATH);
      expect((await slot.innerText()).trim().length).toBeGreaterThan(0);
    }
    // administrator jest w SSR zidentyfikowany bez pomocy JS
    await expect(page.locator(".pp-sec").first()).toContainText(
      "Strzyżowiec 30, 59-610 Wleń",
    );
  });
});

// ── meta i higiena strony (jeden profil desktop) ──
test.describe(`${PATH}: higiena (jeden profil)`, () => {
  useChromium1920Only("higiena strony nie zależy od profilu");

  test("strona ładuje się bez błędów konsoli i 404", async ({ page }) => {
    const issues = collectPageIssues(page);
    await gotoReady(page, PATH);
    await settle(page);
    expect(issues()).toEqual([]);
  });

  test("pełne numery i mail NIE występują w surowym HTML (D-CH5)", async ({
    request,
  }) => {
    const html = await (await request.get(PATH)).text();
    expect(html).not.toContain("696513743");
    expect(html).not.toContain("696 513 743");
    expect(html).not.toContain("533328356");
    expect(html).not.toContain("533 328 356");
    expect(html).not.toContain("eha@pracownia-eha.pl");
  });
});

// ── sloty po JS: fillContactSlots ze skryptu Navbara ──
test("sloty kontaktu składają się w JS (treść + pas PYTANIA O DANE)", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  await expect(page.locator('.pp-sec a[data-tel="maciek"]')).toHaveAttribute(
    "href",
    "tel:+48696513743",
  );
  await expect(page.locator('.pp-sec a[data-tel="lukasz"]')).toHaveAttribute(
    "href",
    "tel:+48533328356",
  );
  await expect(page.locator(".pp-sec a[data-mail]")).toHaveAttribute(
    "href",
    "mailto:eha@pracownia-eha.pl",
  );
  await expect(page.locator(".pp-ask a[data-mail]")).toHaveText(
    "eha@pracownia-eha.pl",
  );
  await expect(page.locator('.pp-ask a[data-tel="maciek"]')).toHaveText(
    "+48 696 513 743",
  );
});

// ── KONTRAKT scroll-margin-top: kotwica ląduje POD paskiem, nie za nim ──
test("skok ze spisu treści ląduje pod nakładkowym paskiem", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  const hdrH = await page.evaluate(() =>
    Math.round(
      document.querySelector<HTMLElement>("[data-nav]")!.getBoundingClientRect()
        .height,
    ),
  );
  // Kilka pozycji spisu, w tym ostatnia (przy krótkiej reszcie dokumentu
  // przeglądarka nie dojedzie do celu — wtedy kontraktu nie ma czego
  // pilnować, więc sprawdzamy tylko te, które faktycznie dojechały).
  for (const idx of [0, 4, 8]) {
    await scrollPageTo(page, 0);
    await page.locator(".pp-toc-l a").nth(idx).click();
    await settle(page, 300);
    const m = await page.evaluate((i) => {
      const sec = document.querySelectorAll<HTMLElement>(".pp-sec")[i];
      const doc = document.documentElement;
      return {
        top: Math.round(sec.getBoundingClientRect().top),
        atBottom:
          Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight,
      };
    }, idx);
    if (m.atBottom) continue;
    // sekcja musi zaczynać się PONIŻEJ paska (bez scroll-margin-top
    // wylądowałaby na y = 0, czyli pod paskiem)
    expect(
      m.top,
      `sekcja ${idx + 1} nie może chować się za paskiem`,
    ).toBeGreaterThanOrEqual(hdrH);
    // …i nie za nisko: kotwica ma być tuż pod paskiem, nie w połowie ekranu
    expect(m.top).toBeLessThanOrEqual(hdrH + 60);
  }
});

// ── układ desktop ──
test.describe("układ desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("spis treści jest sticky i zatrzymuje się POD paskiem", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const toc = page.locator(".pp-toc");
    await expect(toc).toHaveCSS("position", "sticky");
    const hdrH = await page.evaluate(() =>
      Math.round(
        document
          .querySelector<HTMLElement>("[data-nav]")!
          .getBoundingClientRect().height,
      ),
    );
    const before = (await toc.boundingBox())!.y;
    await scrollPageTo(page, 900);
    const after = (await toc.boundingBox())!.y;
    // spis został w kadrze (przyklejony), a nie odjechał z treścią
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThanOrEqual(hdrH);
  });

  test("dokument jest gridem: spis w lewej kolumnie, treść w prawej", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const m = await page.evaluate(() => {
      const r = (s: string) =>
        document.querySelector<HTMLElement>(s)!.getBoundingClientRect();
      const toc = r(".pp-toc");
      const secs = r(".pp-secs");
      const lead = r(".pp-lead");
      return {
        tocRight: Math.round(toc.right),
        secsLeft: Math.round(secs.left),
        leadLeft: Math.round(lead.left),
        leadAboveSecs: lead.bottom <= secs.top + 1,
      };
    });
    expect(m.secsLeft).toBeGreaterThan(m.tocRight);
    // wstęp siedzi w TEJ SAMEJ kolumnie co sekcje (desktop eksportu)
    expect(Math.abs(m.leadLeft - m.secsLeft)).toBeLessThanOrEqual(1);
    expect(m.leadAboveSecs).toBe(true);
  });
});

// ── zakres widoku: czego tu świadomie NIE MA ──
test("widok nie ma zwijanych akapitów ani kadrów z parallaxem", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  // brak cv() w skrypcie eksportu (analiza §1c) — jak /obsluga-budowy/
  await expect(page.locator("[data-clp]")).toHaveCount(0);
  await expect(page.locator("[data-clp-btn]")).toHaveCount(0);
  // strona nie ma ANI JEDNEGO zdjęcia — jedyny obraz to rycina gołębia,
  // więc parallax kadrów [data-plx] (i jego zapas D-U1) nie ma tu racji
  // bytu; rycina jeździ lżejszym [data-plxr]
  await expect(page.locator("main [data-plx]")).toHaveCount(0);
  await expect(page.locator("main [data-rycsb]")).toHaveCount(0);
});

// ── pasek bez hero: pierwsza taka trasa widokowa (fallback z 4.1) ──
test("brak [data-navref] — stan solid wchodzi na fallbacku nav-config", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  const hdr = page.locator("[data-nav]");
  await expect(page.locator("[data-navref]")).toHaveCount(0);
  await expect(hdr).not.toHaveAttribute("data-tone", /.*/);
  await expect(hdr).not.toHaveAttribute("data-solid");
  await scrollPageTo(page, NAV_SOLID_FALLBACK_PX + 24);
  await expect(hdr).toHaveAttribute("data-solid");
  await expect(page.locator(".hdr-bg")).toHaveCSS("opacity", "1");
  // pasek zostaje widoczny w górnej strefie (auto-hide dopiero za progiem)
  expect(NAV_SOLID_FALLBACK_PX + 24).toBeLessThan(NAV_TOP_ALWAYS_PX);
  await expect(hdr).not.toHaveAttribute("data-hidden");
  await scrollPageTo(page, 0);
  await expect(hdr).not.toHaveAttribute("data-solid");
});

// ── CTA pasa „PYTANIA O DANE" ──
test("pas PYTANIA O DANE prowadzi do formularza", async ({ page }) => {
  await gotoReady(page, PATH);
  const goto = page.locator(".pp-goto");
  await expect(goto).toHaveText("PRZEJDŹ DO KONTAKTU →");
  await expect(goto).toHaveAttribute("href", CONTACT_PATH);
  await goto.click();
  await expect(page).toHaveURL(new RegExp(`${CONTACT_PATH}$`));
});

// ── reveal nagłówka po dojechaniu (bramka js-motion, mobile) ──
test("reveal kickera pasa PYTANIA O DANE odpala po dojechaniu scrollem", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "reveale [data-rev] istnieją tylko w układzie mobile");
  await gotoReady(page, PATH);
  const kick = page.locator(".pp-ask .pp-kick");
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
      doc: ".pp-doc",
      golabM: ".pp-golab.mOnly",
      golabD: ".pp-golab.dOnly",
    },
    { doc: "flex", golabM: "block", golabD: "none" },
    { doc: "grid", golabM: "none", golabD: "block" },
  );
});
