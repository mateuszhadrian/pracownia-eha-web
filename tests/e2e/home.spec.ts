// Strona główna (Etap 4.2, docs/analiza-home.md §4) — kontrakty widoku:
// SSR bez JS (pełna treść w HTML-u), [data-navref] steruje stanem „solid"
// paska (4.1 czekał na hero), nawigacja CTA hero i pasków zajawek,
// zajawka realizacji z kolekcji (odporna na liczbę wpisów), sloty
// telefonów 06 (antyscraping D-CH5), reveale za bramką js-motion,
// strażnik „scroll jest natywny" (D-Q1 — wraca ze specami widoków)
// i kontrakt breakpointu HOME_DESKTOP_MIN_PX.
import { expect, test, type Page } from "@playwright/test";
import {
  HOME_DESKTOP_MIN_PX,
  HOME_REALIZACJE_MAX,
  PAPER_BG_SPEED,
} from "../../src/components/sections/home/home-config";
import { NAV_SOLID_HERO_PAD_PX } from "../../src/components/navbar/nav-config";
import {
  CONTACT_PATH,
  EKIPA_PATH,
  KOMPETENCJE_PATH,
  OBSLUGA_PATH,
  TRADYCJA_PATH,
  WORK_INDEX_PATH,
} from "../../src/lib/routes";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import { usePreviewGuard } from "../helpers/guards";
import { realizacjeFiles } from "../helpers/realizacje";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

const PATH = "/";

// Zajawka 02 czyta kolekcję (analiza H1) — panel pozwala usunąć wszystkie
// wpisy i strona to przeżywa (pusta zajawka = stan dopuszczalny); sygnałem
// braku treści jest kontrakt CMS w tests/unit/cms-contract.test.ts.
const WPISY = realizacjeFiles().length;
const BRAK_REALIZACJI = WPISY === 0;
const POWOD_BRAKU = "brak realizacji w kolekcji — zajawka nie ma kart";

/** Wysokość hero ([data-navref]) w dokumencie. */
const heroH = (page: Page) =>
  page.evaluate(
    () => document.querySelector<HTMLElement>("[data-navref]")!.offsetHeight,
  );

// ── SSR: treść kompletna bez JS (motion-gate nie może zabierać treści) ──
test.describe("bez JS strona jest kompletna treściowo", () => {
  test.use({ javaScriptEnabled: false });

  test("h1, nagłówki 6 zajawek i linki CTA są w SSR i widoczne", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toBeVisible();
    for (const h2 of [
      "Ekipa EH/A.",
      "Realizacje.",
      "Kompetencje i technologie.",
      "Obsługa budowy.",
      "Tradycja i ekologia.",
      "Kontakt.",
    ]) {
      // ten sam tekst h2 renderują oba warianty — wystarczy widoczny pierwszy
      await expect(
        page.locator("main h2").filter({ hasText: h2 }).first(),
      ).toBeVisible();
    }
    // CTA hero (bez JS zwykła nawigacja)
    await expect(page.locator(".cta-fill")).toHaveAttribute(
      "href",
      CONTACT_PATH,
    );
    // sloty telefonów bez JS ZOSTAJĄ ukryte (antyscraping — numery składa JS)
    for (const slot of await page.locator(".home a[data-tel]").all()) {
      await expect(slot).toBeHidden();
    }
  });
});

// ── [data-navref]: pasek przezroczysty nad hero, solid po zjechaniu.
// Papierowe tło (.hdr-bg) działa na OBU progach — korekta 4.2 (glow
// mobile z 4.1 wycięty na rzecz twardej krawędzi jak na desktopie). ──
test("navbar: przezroczysty na górze, data-solid + tło po zjechaniu za hero", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  const hdr = page.locator("[data-nav]");
  const bg = page.locator(".hdr-bg");
  await expect(hdr).not.toHaveAttribute("data-solid");
  await expect(bg).toHaveCSS("opacity", "0");

  const h = await heroH(page);
  // tuż PRZED progiem (heroH - pad) — wciąż przezroczysty
  await scrollPageTo(page, h - NAV_SOLID_HERO_PAD_PX - 24);
  await expect(hdr).not.toHaveAttribute("data-solid");
  // tuż ZA progiem — solid z papierowym tłem (fade 0.3 s → poll)
  await scrollPageTo(page, h - NAV_SOLID_HERO_PAD_PX + 24);
  await expect(hdr).toHaveAttribute("data-solid");
  await expect(bg).toHaveCSS("opacity", "1");
  // powrót na górę zdejmuje stan i tło
  await scrollPageTo(page, 0);
  await expect(hdr).not.toHaveAttribute("data-solid");
  await expect(bg).toHaveCSS("opacity", "0");
});

// ── hero wypełnia pierwszy ekran (mobile: 100svh − pasek; H3) ──
test("hero zaczyna się pod paskiem i domyka pierwszy ekran", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  const geo = await page.evaluate(() => {
    const hero = document
      .querySelector<HTMLElement>("[data-navref]")!
      .getBoundingClientRect();
    const hdrH = document
      .querySelector<HTMLElement>("[data-nav]")!
      .getBoundingClientRect().height;
    return {
      top: Math.round(hero.top),
      bottom: Math.round(hero.bottom),
      hdrH: Math.round(hdrH),
      vh: window.innerHeight,
    };
  });
  expect(geo.top).toBe(geo.hdrH);
  // treść może hero POWIĘKSZYĆ (niskie okna) — nigdy skrócić
  expect(geo.bottom).toBeGreaterThanOrEqual(geo.vh - 2);
});

// ── nawigacja: CTA hero + paski/linki zajawek ──
test("CTA hero nawigują na kontakt i realizacje", async ({ page }) => {
  await gotoReady(page, PATH);
  await page.locator(".cta-fill").click();
  await expect(page).toHaveURL(new RegExp(`${CONTACT_PATH}$`));
  await gotoReady(page, PATH);
  await page.locator(".hero-cta .cta-line").click();
  await expect(page).toHaveURL(new RegExp(`${WORK_INDEX_PATH}$`));
});

test("każda zajawka linkuje na swoją trasę (wariant bieżącego profilu)", async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, PATH);
  const cel: [string, string][] = [
    [".ek", EKIPA_PATH],
    [".re", WORK_INDEX_PATH],
    [".km", KOMPETENCJE_PATH],
    [".ob", OBSLUGA_PATH],
    [".td", TRADYCJA_PATH],
    [".kt", CONTACT_PATH],
  ];
  for (const [sec, href] of cel) {
    const link = isMobile
      ? page.locator(`${sec} .zaj-bar`)
      : page.locator(`${sec} .zaj-out, ${sec} .ek-more`).first();
    await expect(link, `link zajawki ${sec}`).toHaveAttribute("href", href);
  }
});

// ── zajawka realizacji: kolekcja CMS (H1) ──
test.describe("zajawka realizacji czyta kolekcję", () => {
  test.skip(BRAK_REALIZACJI, POWOD_BRAKU);

  test("liczba kart = min(kap, wpisy); wszystkie linkują na /realizacje/", async ({
    page,
    isMobile,
  }) => {
    await gotoReady(page, PATH);
    const cards = isMobile
      ? page.locator(".re-track .re-card:not(.re-morecard)")
      : page.locator(".re-pol");
    await expect(cards).toHaveCount(Math.min(HOME_REALIZACJE_MAX, WPISY));
    for (const card of await cards.all()) {
      await expect(card).toHaveAttribute("href", WORK_INDEX_PATH);
    }
  });

  test("karta-licznik „JESZCZE N” tylko przy nadwyżce wpisów (mobile)", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "licznik istnieje tylko w karuzeli mobile");
    await gotoReady(page, PATH);
    const more = page.locator("[data-re-more]");
    if (WPISY > HOME_REALIZACJE_MAX) {
      await expect(more).toHaveCount(1);
      await expect(more.locator(".re-count")).toHaveText(
        `JESZCZE ${WPISY - HOME_REALIZACJE_MAX}`,
      );
    } else {
      await expect(more).toHaveCount(0);
    }
  });
});

// ── D-Q2: chowany pasek URL nie rusza layoutu (korekta Mateusza po
// teście na Galaxy S20 FE — Chrome zmienia tam rozmiar webview i sekcje
// liczone z viewportu skakały w rytm paska; home-viewport.ts przypina
// --svh dopiero przy wykrytym drgnięciu, wzorzec delung) ──
test.describe("chowany pasek przeglądarki nie rusza layoutu (D-Q2)", () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    "pasek URL zmienia webview tylko na telefonach",
  );

  const geometria = (page: Page) =>
    page.evaluate(() => ({
      heroH: Math.round(
        document.querySelector("[data-navref]")!.getBoundingClientRect().height,
      ),
      sekcjaTop: Math.round(
        window.scrollY +
          document.querySelector(".sec")!.getBoundingClientRect().top,
      ),
      logoW: Math.round(
        document.querySelector(".hero-logo")!.getBoundingClientRect().width,
      ),
    }));
  const pin = (page: Page) =>
    page.evaluate(
      () =>
        document
          .querySelector<HTMLElement>("main.home")!
          .style.getPropertyValue("--svh") || "",
    );

  test("zmiana samej wysokości nie zmienia geometrii; pin dopiero po drgnięciu", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await settle(page, 200);
    // bez drgania viewportu NIC nie jest przypięte (czysty CSS — lekcja
    // delung: wartość z JS nigdy nie jest bit w bit tym, co policzył CSS)
    expect(await pin(page)).toBe("");
    const przed = await geometria(page);

    // dokładnie to, co robi chowający się pasek URL: rośnie SAMA wysokość
    const vp = page.viewportSize()!;
    await page.setViewportSize({ width: vp.width, height: vp.height + 90 });
    await settle(page, 200);
    expect(await pin(page)).not.toBe("");
    expect(await geometria(page)).toEqual(przed);

    // …i z powrotem (pasek wraca)
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await settle(page, 200);
    expect(await geometria(page)).toEqual(przed);
  });

  test("obrót ekranu (zmiana szerokości) zwalnia przypięcie", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const vp = page.viewportSize()!;
    await page.setViewportSize({ width: vp.width, height: vp.height + 90 });
    await settle(page, 200);
    expect(await pin(page)).not.toBe("");
    // realnie inny viewport — wracamy do formuły CSS
    await page.setViewportSize({ width: vp.height, height: vp.width });
    await settle(page, 200);
    expect(await pin(page)).toBe("");
  });
});

// ── ryciny hero (mobile): rysują się sekwencyjnie po wejściu — lewa od
// razu, prawa górna +1 s, dolne +2 s (korekta Mateusza; delaye w CSS
// przez [data-ryc-auto], autostart bez IO w home-motion.ts) ──
test("ryciny hero rysują się sekwencyjnie po wejściu (mobile)", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "sekwencja rycin hero istnieje tylko na mobile");
  await gotoReady(page, PATH);
  const stan = await page.evaluate(() =>
    ["hr-m1", "hr-m2", "hr-m3", "hr-m4"].map((cls) => {
      const el = document.querySelector<HTMLElement>(`.${cls}`)!;
      return {
        cls,
        auto: el.dataset.rycAuto ?? null,
        // autostart zaszedł: albo .in (animacja gra/czeka na delay),
        // albo maska już zdjęta po animationend
        odpalona: el.classList.contains("in") || !el.hasAttribute("data-ryc"),
      };
    }),
  );
  // mapowanie etapów: lewa 0 s, prawa górna 1 s, dolne 2 s
  expect(stan).toEqual([
    { cls: "hr-m1", auto: "0", odpalona: true },
    { cls: "hr-m2", auto: "2", odpalona: true },
    { cls: "hr-m3", auto: "2", odpalona: true },
    { cls: "hr-m4", auto: "1", odpalona: true },
  ]);
});

// ── hero na niskich ekranach: kurczy się logo, nie ucieka dół (korekta
// Mateusza po testach na telefonach) ──
test("hero mieści się w całości na niskim ekranie — logo się skaluje", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "skalowanie logo budżetem wysokości jest mobile-only");
  const vp = page.viewportSize()!;
  await page.setViewportSize({ width: vp.width, height: 680 });
  await gotoReady(page, PATH);
  const m = await page.evaluate(() => ({
    heroBottom: Math.round(
      document.querySelector("[data-navref]")!.getBoundingClientRect().bottom,
    ),
    vh: window.innerHeight,
    logoW: document.querySelector(".hero-logo")!.getBoundingClientRect().width,
  }));
  // cały hero w pierwszym ekranie…
  expect(m.heroBottom).toBeLessThanOrEqual(m.vh + 2);
  // …bo logo zeszło poniżej projektowego minimum (234), ale nie do zera
  expect(m.logoW).toBeLessThan(234);
  expect(m.logoW).toBeGreaterThanOrEqual(78);
});

// ── karuzela realizacji: scroll-snap (korekta Mateusza — brak snapa
// w eksporcie to niedoróbka; kontrakt karuzel projektu = sections.md) ──
test.describe("karuzela realizacji przyciąga kafle", () => {
  test.skip(BRAK_REALIZACJI, POWOD_BRAKU);

  test("tor ma snap x mandatory, kafle align:start + stop:always", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "karuzela istnieje tylko w układzie mobile");
    await gotoReady(page, PATH);
    const snap = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>("[data-re-track]")!;
      const card = track.querySelector<HTMLElement>(".re-card")!;
      return {
        type: getComputedStyle(track).scrollSnapType,
        align: getComputedStyle(card).scrollSnapAlign,
        stop: getComputedStyle(card).scrollSnapStop,
      };
    });
    expect(snap.type).toBe("x mandatory");
    expect(snap.align).toBe("start");
    expect(snap.stop).toBe("always");
  });

  test("po przewinięciu toru kafel dosnapowuje do krawędzi kolumny", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-pixel-5",
      "WebKit nie dosnapowuje scrolla programowego (quirk Safari) — " +
        "zachowanie snapa mierzymy na chromium, kontrakt stylów wyżej " +
        "obejmuje wszystkie profile mobile",
    );
    test.skip(WPISY < 2, "snap do drugiego kafla wymaga ≥ 2 wpisów");
    await gotoReady(page, PATH);
    await page
      .locator("[data-re-track]")
      .evaluate((el) => el.scrollBy({ left: 150, behavior: "smooth" }));
    await settle(page, 700);
    const m = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>("[data-re-track]")!;
      const card = track
        .querySelectorAll(".re-card")[1]
        .getBoundingClientRect();
      return {
        cardLeft: Math.round(card.left),
        padLeft: Math.round(
          parseFloat(getComputedStyle(track).scrollPaddingLeft),
        ),
      };
    });
    expect(Math.abs(m.cardLeft - m.padLeft)).toBeLessThanOrEqual(1);
  });
});

// ── sloty kontaktu 06 (antyscraping D-CH5) ──
test("telefony i mail zajawki 06 wypełnia JS (sloty, nie SSR)", async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, PATH);
  const scope = isMobile ? ".kt-card" : ".kt-panel";
  await expect(page.locator(`${scope} a[data-tel="maciek"]`)).toHaveAttribute(
    "href",
    "tel:+48696513743",
  );
  await expect(page.locator(`${scope} a[data-tel="lukasz"]`)).toHaveAttribute(
    "href",
    "tel:+48533328356",
  );
  await expect(page.locator(`${scope} a[data-mail]`)).toHaveAttribute(
    "href",
    "mailto:eha@pracownia-eha.pl",
  );
});

// ── reveale za bramką js-motion (mobile — desktop nagłówki są statyczne) ──
test("reveal nagłówka sekcji odpala po dojechaniu scrollem", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "reveale [data-rev] istnieją tylko w układzie mobile");
  await gotoReady(page, PATH);
  const eyebrow = page.locator(".ob-head .s-eyebrow");
  // stan startowy uzbrojony (js-motion): niewidoczny przed dojazdem
  await expect(eyebrow).toHaveCSS("opacity", "0");
  await eyebrow.scrollIntoViewIfNeeded();
  await settle(page, 400);
  await expect(eyebrow).toHaveCSS("opacity", "1");
});

// ── dryf tła papieru (PaperBackdrop): tekstura płynie w 0.85 tempa
// treści (eksport: +0.15·scroll na background-position elementu jadącego
// z treścią). Port = transform na elemencie fixed, modulo okres. ──
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

// ── strażnik D-Q1: scroll natywny, bez wygładzacza (wzorzec delung) ──
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
test("próg desktopowy: warianty przełączają się dokładnie na HOME_DESKTOP_MIN_PX", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "kontrakt progu — jeden profil desktop (test sam zmienia szerokość)",
  );
  await gotoReady(page, PATH);
  await expectBreakpointFlip(
    page,
    HOME_DESKTOP_MIN_PX,
    { heroRycM: ".hr-m1", heroRycD: ".hr-d1", panelKt: ".kt-panel" },
    { heroRycM: "block", heroRycD: "none", panelKt: "none" },
    { heroRycM: "none", heroRycD: "block", panelKt: "block" },
  );
});
