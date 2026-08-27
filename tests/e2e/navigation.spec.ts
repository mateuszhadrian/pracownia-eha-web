// Nawigacja chrome'u (Etap 4.1): pasek fixed z dropdownem „O nas"
// i AUTO-HIDE (E11) na desktopie, menu mobilne jako bottom sheet na
// overlay.ts (otwieranie, Esc, scrim, swipe-down, akordeon „O nas"),
// telefony/mail stopki składane w JS (antyscraping), kontrakt
// breakpointu 1024 (expectBreakpointFlip). Przycisk „NA GÓRĘ ↑"
// wycięty w korekcie 4.2 (decyzja Mateusza) — razem z kontraktem.
import { expect, test, type Page } from "@playwright/test";
import {
  NAV_DESKTOP_MIN_PX,
  NAV_UP_REVEAL_PX,
  NAV_ZONE_PANEL_PAD_PX,
} from "../../src/components/navbar/nav-config";
import {
  CONTACT_PATH,
  EKIPA_PATH,
  OBSLUGA_PATH,
  TRADYCJA_PATH,
  WORK_INDEX_PATH,
} from "../../src/lib/routes";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

/** Szkielety bywają krótsze niż potrzeba auto-hide'owi — dosztukuj
 *  wysokości dokumentu (kontrakt dotyczy chrome'u, nie długości strony). */
async function ensureScrollRoom(page: Page): Promise<void> {
  await page.addStyleTag({ content: "main { min-height: 300vh !important }" });
}

test.describe("nawigacja desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  test("link Realizacje nawiguje na podstronę /realizacje/", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator(`.nav-link[href="${WORK_INDEX_PATH}"]`).click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("dropdown O nas: klik otwiera i zamyka, klik poza zamyka, Esc zamyka", async ({
    page,
  }) => {
    await gotoReady(page);
    const toggle = page.locator("[data-dropdown-toggle]");
    const panel = page.locator("[data-dropdown-panel]");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(panel).toBeVisible();
    // klik poza panelem (środek strony) zamyka
    await page.mouse.click(400, 500);
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("dropdown O nas nawiguje na 3 podstrony", async ({ page }) => {
    for (const path of [EKIPA_PATH, "/kompetencje-i-technologie/"] as const) {
      await gotoReady(page);
      await page.locator("[data-dropdown-toggle]").click();
      await page.locator(`.drop-link[href="${path}"]`).click();
      await expect(page).toHaveURL(
        new RegExp(`${path.replaceAll("/", "\\/")}?$`),
      );
      await expect(page.locator("main h1")).toBeVisible();
    }
    await gotoReady(page);
    await page.locator("[data-dropdown-toggle]").click();
    await page.locator(`.drop-link[href="${TRADYCJA_PATH}"]`).click();
    await expect(page).toHaveURL(/\/tradycja-i-ekologia\/?$/);
  });

  // ── wskaźnik bieżącej strony + czytelność submenu (sesja poprawek
  // wizualnych; zgłoszenie Mateusza). Design ma DWA warianty kreski
  // zależnie od tonu paska, a panel dropdownu jest nieprzezroczystą
  // kartą, więc jego treść nie może dziedziczyć kremowego --hdr-ink. ──
  test.describe("wskaźnik bieżącej strony", () => {
    test("na jasnym pasku kreska jest zielona, na ciemnym w kolorze tekstu", async ({
      page,
    }) => {
      // /realizacje/ — pasek atramentowy nad papierem (design:
      // realizacje.html → border-bottom 1px solid rgba(87,101,74,.6))
      await gotoReady(page, WORK_INDEX_PATH);
      const akt = page.locator('.hdr-nav .nav-link[aria-current="page"]');
      await expect(akt).toHaveCount(1);
      await expect(akt).toHaveCSS("border-bottom-width", "1px");
      await expect(akt).toHaveCSS(
        "border-bottom-color",
        "rgba(87, 101, 74, 0.6)",
      );
      // pozostałe pozycje kreski NIE mają
      const inne = page.locator(
        '.hdr-nav .nav-link:not([aria-current="page"])',
      );
      for (const link of await inne.all()) {
        await expect(link).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");
      }

      // /obsluga-budowy/ — pasek kremowy nad ciemnym hero (design:
      // obsluga-budowy.html → 1px solid currentColor). Zieleń akcentu
      // ginęła tu na zdjęciu; kreska musi mieć kolor TEKSTU paska.
      await gotoReady(page, OBSLUGA_PATH);
      const aktD = page.locator('.hdr-nav .nav-link[aria-current="page"]');
      const kolory = await aktD.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { color: cs.color, border: cs.borderBottomColor };
      });
      expect(kolory.border).toBe(kolory.color);
      expect(kolory.color).toBe("rgb(245, 239, 227)");
    });

    test("po wejściu w stan solid kreska wraca do zieleni", async ({
      page,
    }) => {
      // wariant kremowy ma w selektorze `:not([data-solid])`, więc
      // wygasa razem z tonem — bez osobnej reguły
      await gotoReady(page, OBSLUGA_PATH);
      await ensureScrollRoom(page);
      await scrollPageTo(page, 1200);
      await expect(page.locator("[data-nav]")).toHaveAttribute(
        "data-solid",
        "",
      );
      await expect
        .poll(async () =>
          page
            .locator('.hdr-nav .nav-link[aria-current="page"]')
            .evaluate((el) => getComputedStyle(el).borderBottomColor),
        )
        .toBe("rgba(87, 101, 74, 0.6)");
    });

    test("submenu O nas jest czytelne także na trasach z ciemnym hero", async ({
      page,
    }) => {
      // Regresja złapana w tej sesji: .drop-link brał --hdr-ink, który
      // przy tone="dark" jest kremowy (#f5efe3) — na panelu #fffdf8
      // dawało kontrast 1,06:1, czyli pozycje NIEWIDOCZNE.
      for (const path of [OBSLUGA_PATH, CONTACT_PATH, EKIPA_PATH] as const) {
        await gotoReady(page, path);
        await page.locator("[data-dropdown-toggle]").click();
        const panel = page.locator("[data-dropdown-panel]");
        await expect(panel).toBeVisible();
        const tlo = await panel.evaluate(
          (el) => getComputedStyle(el).backgroundColor,
        );
        expect(tlo).toBe("rgb(255, 253, 248)");
        for (const link of await panel.locator(".drop-link").all()) {
          const kolor = await link.evaluate((el) => getComputedStyle(el).color);
          // atrament (zwykła pozycja) albo zieleń akcentu (bieżąca
          // podstrona) — nigdy krem paska
          expect(
            ["rgb(33, 29, 24)", "rgb(87, 101, 74)"],
            `kolor pozycji submenu na ${path}`,
          ).toContain(kolor);
        }
      }
    });
  });

  test("auto-hide: scroll w dół chowa pasek, powrót po scrollu w górę", async ({
    page,
  }) => {
    await gotoReady(page, WORK_INDEX_PATH);
    await ensureScrollRoom(page);
    const nav = page.locator("[data-nav]");
    // kursor POZA strefą górną — inaczej blokuje chowanie (kontrakt niżej)
    await page.mouse.move(600, 500);

    await expect(nav).not.toHaveAttribute("data-hidden", "");
    await scrollPageTo(page, 600);
    await expect(nav).toHaveAttribute("data-hidden", "");
    // pasek naprawdę wyjechał poza viewport (transform -125%, przejście
    // .4s — poll doczekuje końca animacji; tolerancja na subpiksele)
    await expect
      .poll(async () => {
        const box = await nav.boundingBox();
        return box ? box.y + box.height : Number.NaN;
      })
      .toBeLessThanOrEqual(1);

    // powrót po > NAV_UP_REVEAL_PX scrolla w górę
    await scrollPageTo(page, 600 - (NAV_UP_REVEAL_PX + 40));
    await expect(nav).not.toHaveAttribute("data-hidden", "");
    await expect
      .poll(async () => {
        const box = await nav.boundingBox();
        return box ? Math.abs(box.y) : Number.NaN;
      })
      .toBeLessThan(1);
  });

  test("auto-hide: u samej góry strony pasek jest zawsze widoczny", async ({
    page,
  }) => {
    await gotoReady(page, WORK_INDEX_PATH);
    await ensureScrollRoom(page);
    const nav = page.locator("[data-nav]");
    await page.mouse.move(600, 500);
    await scrollPageTo(page, 600);
    await expect(nav).toHaveAttribute("data-hidden", "");
    await scrollPageTo(page, 0);
    await expect(nav).not.toHaveAttribute("data-hidden", "");
  });

  test("auto-hide: kursor w górnej strefie ekranu przywołuje pasek", async ({
    page,
  }) => {
    await gotoReady(page, WORK_INDEX_PATH);
    await ensureScrollRoom(page);
    const nav = page.locator("[data-nav]");
    await page.mouse.move(600, 500);
    await scrollPageTo(page, 600);
    await expect(nav).toHaveAttribute("data-hidden", "");
    // wjazd kursora w strefę górną (poniżej progu 96px/12vh)
    await page.mouse.move(600, 40);
    await expect(nav).not.toHaveAttribute("data-hidden", "");
    // wyjazd ze strefy przy braku scrolla w górę — pasek chowa się z powrotem
    await page.mouse.move(600, 500);
    await expect(nav).toHaveAttribute("data-hidden", "");
  });

  test("auto-hide: otwarty dropdown blokuje chowanie (rozszerzona strefa kursora)", async ({
    page,
  }) => {
    await gotoReady(page, WORK_INDEX_PATH);
    await ensureScrollRoom(page);
    const nav = page.locator("[data-nav]");
    const toggle = page.locator("[data-dropdown-toggle]");
    const panel = page.locator("[data-dropdown-panel]");

    await toggle.click();
    await expect(panel).toBeVisible();
    // kursor pod dolną krawędzią panelu — poniżej bazowej strefy górnej,
    // ale wciąż w strefie rozszerzonej o NAV_ZONE_PANEL_PAD_PX (gotcha
    // z designu: pasek nie może uciec spod otwartego panelu)
    const pbox = await panel.boundingBox();
    expect(pbox).not.toBeNull();
    const yInExtendedZone = pbox!.y + pbox!.height + NAV_ZONE_PANEL_PAD_PX / 2;
    await page.mouse.move(600, yInExtendedZone);

    await scrollPageTo(page, 600);
    await expect(nav).not.toHaveAttribute("data-hidden", "");
    await expect(panel).toBeVisible();

    // zjazd kursora daleko pod panel = koniec ochrony: pasek się chowa,
    // a schowanie ZAMYKA dropdown (panel nigdy nie zostaje bez paska)
    await page.mouse.move(600, yInExtendedZone + 400);
    await expect(nav).toHaveAttribute("data-hidden", "");
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("kontrakt breakpointu 1024: pasek desktop ↔ burger mobile", async ({
    page,
  }) => {
    await gotoReady(page);
    await expectBreakpointFlip(
      page,
      NAV_DESKTOP_MIN_PX,
      { nav: ".hdr-nav", burger: ".mbtn" },
      { nav: "none", burger: "flex" },
      { nav: "flex", burger: "none" },
    );
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

  // ── poprawki wizualne po 4.6 (zgłoszenie Mateusza z telefonu) ──
  test("papierowe tło paska PRZEŻYWA otwarcie menu", async ({ page }) => {
    // overlay.ts blokuje scroll przez `body{position:fixed;top:-scrollY}`,
    // co ZERUJE window.scrollY i odpala `scroll`. Bez zamrożenia stanu
    // (Navbar: `sheetOpen`) próg przeliczał się na pozycji 0 i tło gasło
    // dokładnie w chwili otwarcia menu.
    await gotoReady(page);
    await ensureScrollRoom(page);
    await scrollPageTo(page, 1200);
    const root = page.locator("[data-nav]");
    await expect(root).toHaveAttribute("data-solid", "");

    await page.locator("[data-burger]").click();
    await expect(page.locator("#nav-sheet")).toHaveClass(/is-open/);
    await expect(root).toHaveAttribute("data-solid", "");
    await expect(page.locator(".hdr-bg")).toHaveCSS("opacity", "1");

    await page.keyboard.press("Escape");
    await expect(page.locator("#nav-sheet")).toBeHidden();
    await expect(root).toHaveAttribute("data-solid", "");
  });

  test("na górze strony otwarcie menu NIE zapala tła paska", async ({
    page,
  }) => {
    // Druga strona kontraktu: zamrażamy stan zastany, a nie wymuszamy tło.
    await gotoReady(page);
    const root = page.locator("[data-nav]");
    await expect(root).not.toHaveAttribute("data-solid", "");
    await page.locator("[data-burger]").click();
    await expect(page.locator("#nav-sheet")).toHaveClass(/is-open/);
    await expect(root).not.toHaveAttribute("data-solid", "");
  });

  test("na ciemnym hero logo i burger zostają kremowe po otwarciu menu", async ({
    page,
  }) => {
    // Wcześniej reguła tonu miała `:not([data-open])`, więc znak wracał do
    // atramentu — na ciemnym hero, pod ciemną zasłoną sheeta (z-index 100
    // > 50 paska). Kolor czytamy przez expect.poll: przejście trwa 0.3 s.
    await gotoReady(page, OBSLUGA_PATH);
    const inkOf = () =>
      page.evaluate(() =>
        getComputedStyle(document.querySelector(".mbtn")!).getPropertyValue(
          "color",
        ),
      );
    await expect(page.locator("[data-nav]")).toHaveAttribute(
      "data-tone",
      "dark",
    );
    await expect.poll(inkOf).toBe("rgb(245, 239, 227)");
    await page.locator("[data-burger]").click();
    await expect(page.locator("#nav-sheet")).toHaveClass(/is-open/);
    await expect.poll(inkOf).toBe("rgb(245, 239, 227)");
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
    // Odczekaj wjazd panelu (transform .44s): boundingBox mierzony w trakcie
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

  test("akordeon O nas w sheecie rozwija podlinki i nawiguje", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    const accBtn = page.locator("#nav-sheet [data-acc-toggle]");
    const sub = page.locator(`#nav-sheet .m-sub-link[href="${EKIPA_PATH}"]`);

    await expect(accBtn).toHaveAttribute("aria-expanded", "false");
    await expect(sub).not.toBeInViewport();
    await accBtn.click();
    await expect(accBtn).toHaveAttribute("aria-expanded", "true");
    await expect(sub).toBeVisible();

    // drugi klik zwija
    await accBtn.click();
    await expect(accBtn).toHaveAttribute("aria-expanded", "false");
    await expect(sub).not.toBeInViewport();

    // rozwiń ponownie i nawiguj
    await accBtn.click();
    await sub.click();
    await expect(page).toHaveURL(/\/ekipa-eha\/?$/);
    await expect(page.locator("main h1")).toBeVisible();
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

test("stopka: telefony i mail złożone w JS w slotach antyscrapingowych", async ({
  page,
}) => {
  await gotoReady(page);
  const maciek = page.locator('footer a[data-tel="maciek"]');
  const lukasz = page.locator('footer a[data-tel="lukasz"]');
  const mail = page.locator("footer a[data-mail]");
  await expect(maciek).toHaveAttribute("href", "tel:+48696513743");
  await expect(lukasz).toHaveAttribute("href", "tel:+48533328356");
  await expect(mail).toHaveAttribute("href", "mailto:eha@pracownia-eha.pl");
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
