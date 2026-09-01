// Widok /kontakt/ (Etap 5, docs/analiza-kontakt.md §6) — jedyny widok
// serwisu z FUNKCJĄ, więc obok zwykłych kontraktów portu (SSR bez JS,
// navbar tone="dark", sticky kolumna, reveale, dryf tła, strażnik
// natywnego scrolla, próg CONTACT_DESKTOP_MIN_PX) spec pilnuje całego
// formularza E9: 4 pola, walidacja alternatywna „telefon LUB e-mail"
// po stronie klienta, pułapki antyspamowe (honeypot readonly + min-czas
// na deterministycznym zegarze), ekran .sent i błąd .kt-srv.
//
// Turnstile i endpoint są STUBOWANE (page.route / window.turnstile):
// preview serwuje sam `dist`, Pages Function żyje dopiero na deployu,
// a widget wymagałby prawdziwego site key (Etap 5 infra).
import { expect, test, type Page } from "@playwright/test";
import { NAV_SOLID_HERO_PAD_PX } from "../../src/components/navbar/nav-config";
import {
  CONTACT_DESKTOP_MIN_PX,
  CONTACT_ENDPOINT,
} from "../../src/components/sections/contact/contact-config";
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

const PATH = CONTACT_PATH;

/** Wysokość hero ([data-navref]) w dokumencie. */
const heroH = (page: Page) =>
  page.evaluate(
    () => document.querySelector<HTMLElement>("[data-navref]")!.offsetHeight,
  );

/** Zegar formularza: contact-ui.ts liczy czas wypełniania z Date.now(),
 *  więc przesuwalny skew zdejmuje z testów czekanie MIN_FILL_MS
 *  (i pozwala CELOWO go nie przesunąć, żeby sprawdzić pułapkę). */
async function useSkewedClock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const real = Date.now.bind(Date);
    (window as unknown as { __skew: number }).__skew = 0;
    Date.now = () => real() + (window as unknown as { __skew: number }).__skew;
  });
}
const skip = (page: Page, ms: number) =>
  page.evaluate((v) => {
    (window as unknown as { __skew: number }).__skew = v;
  }, ms);

/** Widget Turnstile — atrapa oddająca token od ręki (prawdziwy wymaga
 *  site key z panelu Cloudflare, którego kod celowo nie potrzebuje). */
async function stubTurnstile(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let opts: { callback?: (t: string) => void } = {};
    (window as unknown as { turnstile: unknown }).turnstile = {
      render: (_el: HTMLElement, o: { callback?: (t: string) => void }) => {
        opts = o;
        return "stub-widget";
      },
      execute: () => opts.callback?.("stub-token"),
      reset: () => {},
    };
  });
}

/** Atrapa endpointu; zwraca licznik trafień (pułapki antyspamowe MUSZĄ
 *  udawać sukces BEZ requestu). */
function stubEndpoint(page: Page, status = 200): () => number {
  let hits = 0;
  void page.route(`**${CONTACT_ENDPOINT}`, async (route) => {
    hits += 1;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ ok: status === 200 }),
    });
  });
  return () => hits;
}

async function fill(
  page: Page,
  values: { name?: string; contact?: string; place?: string; msg?: string },
): Promise<void> {
  if (values.name !== undefined) await page.fill("#kt-name", values.name);
  if (values.contact !== undefined)
    await page.fill("#kt-contact", values.contact);
  if (values.place !== undefined) await page.fill("#kt-place", values.place);
  if (values.msg !== undefined) await page.fill("#kt-msg", values.msg);
}

const MSG = "Dom przysłupowy z 1820 r., proszę o wstępną wycenę więźby.";

// ── SSR: strona i formularz są kompletne bez JS ──
test.describe("bez JS strona jest kompletna treściowo", () => {
  test.use({ javaScriptEnabled: false });

  test("h1, sekcje i pełny formularz (4 pola) w SSR", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toHaveText("Skontaktuj się z nami");
    for (const h2 of [
      "Wolisz formę pisemną?",
      "Albo wypełnij formularz",
      "Śledź nasze realizacje",
    ]) {
      await expect(
        page.locator("main h2").filter({ hasText: h2 }),
      ).toBeVisible();
    }
    // E9: DOKŁADNIE 4 pola na obu progach (5. pole desktopu eksportu
    // to pomyłka designu — analiza §1d)
    await expect(page.locator(".kt-f")).toHaveCount(4);
    await expect(
      page.locator(".kt-fields input, .kt-fields textarea"),
    ).toHaveCount(4);
    for (const [f, name] of [
      ["name", "name"],
      ["contact", "contact"],
      ["place", "place"],
      ["msg", "message"],
    ]) {
      await expect(
        page.locator(
          `.kt-f[data-f="${f}"] input, .kt-f[data-f="${f}"] textarea`,
        ),
      ).toHaveAttribute("name", name);
    }
    // formularz ma sensowny cel także bez skryptu
    const form = page.locator(".kt-form");
    await expect(form).toHaveAttribute("method", /post/i);
    await expect(form).toHaveAttribute("action", CONTACT_ENDPOINT);
  });

  test("notka RODO zamiast checkboxa; ekran .sent schowany", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    // E9: BEZ checkboxa RODO — sama notka z linkiem do polityki
    await expect(page.locator('.kt-form input[type="checkbox"]')).toHaveCount(
      0,
    );
    await expect(
      page.locator(`.kt-rodo a[href="${POLICY_PATH}"]`),
    ).toBeVisible();
    await expect(page.locator(".kt-done")).toBeHidden();
    await expect(page.locator(".kt-srv")).toBeHidden();
  });

  test("zakres widoku: bez zwijanych akapitów i bez kadrów z parallaxem", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-clp]")).toHaveCount(0);
    // widok nie ma ANI JEDNEJ fotografii (drugi taki po polityce):
    // wszystkie obrazy to dekoracyjne ryciny, więc żaden nie niesie treści
    await expect(page.locator("[data-plx]")).toHaveCount(0);
    const alts = await page
      .locator("main img")
      .evaluateAll((els) => els.map((el) => (el as HTMLImageElement).alt));
    expect(alts.length).toBeGreaterThan(0);
    expect(alts.every((a) => a === "")).toBe(true);
  });

  test("honeypot jest readonly i poza tab-orderem (nie usuwać)", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    const hp = page.locator('.kt-form [name="firma"]');
    await expect(hp).toHaveAttribute("readonly", "");
    await expect(hp).toHaveAttribute("tabindex", "-1");
  });

  test("pełne numery i mail NIE występują w surowym HTML (D-CH5)", async ({
    request,
  }) => {
    const html = await (await request.get(PATH)).text();
    for (const secret of [
      "696513743",
      "696 513 743",
      "533328356",
      "533 328 356",
      "eha@pracownia-eha.pl",
    ]) {
      expect(html, secret).not.toContain(secret);
    }
    // …ale slot ma czytelną etykietę zastępczą (decyzja Mateusza)
    expect(html).toContain("numer telefonu");
    expect(html).toContain("adres e-mail");
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

// ── sloty antyscrapingowe po JS (fillContactSlots ze skryptu Navbara) ──
test("sloty kontaktu składają się w JS (numery + mail)", async ({ page }) => {
  await gotoReady(page, PATH);
  await expect(page.locator('.kt-call a[data-tel="maciek"]')).toHaveAttribute(
    "href",
    "tel:+48696513743",
  );
  await expect(page.locator('.kt-call a[data-tel="lukasz"]')).toHaveAttribute(
    "href",
    "tel:+48533328356",
  );
  await expect(
    page.locator('.kt-call a[data-tel="maciek"] [data-slot]'),
  ).toHaveText("+48 696 513 743");
  await expect(page.locator(".kt-mail a[data-mail]")).toHaveAttribute(
    "href",
    "mailto:eha@pracownia-eha.pl",
  );
  await expect(page.locator(".kt-mail a[data-mail]")).toHaveText(
    "eha@pracownia-eha.pl",
  );
});

// ── FORMULARZ: walidacja alternatywna E9 ──
test.describe("formularz: walidacja alternatywna telefon-LUB-e-mail", () => {
  test("pusty submit zapala błędy na imieniu, kontakcie i opisie", async ({
    page,
  }) => {
    await useSkewedClock(page);
    await stubTurnstile(page);
    const hits = stubEndpoint(page);
    await gotoReady(page, PATH);
    await skip(page, 10_000);

    await page.locator(".kt-send").click();
    for (const f of ["name", "contact", "msg"]) {
      await expect(page.locator(`.kt-f[data-f="${f}"]`)).toHaveClass(/\berr\b/);
      await expect(page.locator(`.kt-f[data-f="${f}"] .kt-err`)).toBeVisible();
    }
    // lokalizacja jest OPCJONALNA — nie może świecić na czerwono
    await expect(page.locator('.kt-f[data-f="place"]')).not.toHaveClass(
      /\berr\b/,
    );
    expect(hits(), "błąd walidacji nie wysyła requestu").toBe(0);
  });

  test("sam TELEFON wystarcza — zgłoszenie wychodzi", async ({ page }) => {
    await useSkewedClock(page);
    await stubTurnstile(page);
    const hits = stubEndpoint(page);
    await gotoReady(page, PATH);
    await skip(page, 10_000);

    await fill(page, { name: "Anna", contact: "+48 696 513 743", msg: MSG });
    await page.locator(".kt-send").click();
    await expect(page.locator(".kt-frame")).toHaveClass(/\bsent\b/);
    await expect(page.locator(".kt-done-h")).toBeVisible();
    await expect(page.locator(".kt-form")).toBeHidden();
    expect(hits()).toBe(1);
  });

  test("sam E-MAIL wystarcza — zgłoszenie wychodzi", async ({ page }) => {
    await useSkewedClock(page);
    await stubTurnstile(page);
    const hits = stubEndpoint(page);
    await gotoReady(page, PATH);
    await skip(page, 10_000);

    await fill(page, { name: "Anna", contact: "anna@example.com", msg: MSG });
    await page.locator(".kt-send").click();
    await expect(page.locator(".kt-frame")).toHaveClass(/\bsent\b/);
    expect(hits()).toBe(1);
  });

  test("ani telefon, ani e-mail = błąd TYLKO na polu kontaktu", async ({
    page,
  }) => {
    await useSkewedClock(page);
    await stubTurnstile(page);
    const hits = stubEndpoint(page);
    await gotoReady(page, PATH);
    await skip(page, 10_000);

    await fill(page, { name: "Anna", contact: "oddzwońcie", msg: MSG });
    await page.locator(".kt-send").click();
    await expect(page.locator('.kt-f[data-f="contact"]')).toHaveClass(
      /\berr\b/,
    );
    await expect(page.locator('.kt-f[data-f="name"]')).not.toHaveClass(
      /\berr\b/,
    );
    await expect(page.locator('.kt-f[data-f="msg"]')).not.toHaveClass(
      /\berr\b/,
    );
    expect(hits()).toBe(0);
    // pisanie w polu gasi błąd
    await page.fill("#kt-contact", "anna@example.com");
    await expect(page.locator('.kt-f[data-f="contact"]')).not.toHaveClass(
      /\berr\b/,
    );
  });

  test("przycisk Wyślij kolejną wraca do pustego formularza", async ({
    page,
  }) => {
    await useSkewedClock(page);
    await stubTurnstile(page);
    stubEndpoint(page);
    await gotoReady(page, PATH);
    await skip(page, 10_000);

    await fill(page, { name: "Anna", contact: "anna@example.com", msg: MSG });
    await page.locator(".kt-send").click();
    await expect(page.locator(".kt-frame")).toHaveClass(/\bsent\b/);
    await page.locator(".kt-again").click();
    await expect(page.locator(".kt-frame")).not.toHaveClass(/\bsent\b/);
    await expect(page.locator("#kt-name")).toHaveValue("");
    await expect(page.locator("#kt-contact")).toHaveValue("");
  });
});

// ── FORMULARZ: pułapki antyspamowe ──
test.describe("formularz: pułapki antyspamowe", () => {
  test("submit szybszy niż min-czas udaje sukces BEZ requestu", async ({
    page,
  }) => {
    await useSkewedClock(page);
    await stubTurnstile(page);
    const hits = stubEndpoint(page);
    await gotoReady(page, PATH);
    // zegar CELOWO nieprzesunięty — Date.now() - t0 < MIN_FILL_MS

    await fill(page, { name: "Anna", contact: "anna@example.com", msg: MSG });
    await page.locator(".kt-send").click();
    await expect(page.locator(".kt-frame")).toHaveClass(/\bsent\b/);
    expect(hits(), "bot nie wie, że został odsiany — ale mail nie leci").toBe(
      0,
    );
  });

  test("wypełniony honeypot udaje sukces BEZ requestu", async ({ page }) => {
    await useSkewedClock(page);
    await stubTurnstile(page);
    const hits = stubEndpoint(page);
    await gotoReady(page, PATH);
    await skip(page, 10_000);

    await fill(page, { name: "Anna", contact: "anna@example.com", msg: MSG });
    // bot zdejmuje readonly i wypełnia pole-pułapkę
    await page.evaluate(() => {
      const hp = document.querySelector<HTMLInputElement>('[name="firma"]')!;
      hp.removeAttribute("readonly");
      hp.value = "ACME Sp. z o.o.";
    });
    await page.locator(".kt-send").click();
    await expect(page.locator(".kt-frame")).toHaveClass(/\bsent\b/);
    expect(hits()).toBe(0);
  });

  test("skrypt Turnstile dociąga się dopiero przy pierwszym focusie", async ({
    page,
  }) => {
    let loads = 0;
    await page.route("https://challenges.cloudflare.com/**", async (route) => {
      loads += 1;
      await route.abort();
    });
    await gotoReady(page, PATH);
    await settle(page, 200);
    expect(loads, "widget nie może wchodzić do startu strony").toBe(0);

    await page.locator("#kt-name").focus();
    await expect.poll(() => loads).toBeGreaterThan(0);
  });

  test("błąd serwera pokazuje .kt-srv i NIE pokazuje ekranu .sent", async ({
    page,
  }) => {
    await useSkewedClock(page);
    await stubTurnstile(page);
    stubEndpoint(page, 502);
    await gotoReady(page, PATH);
    await skip(page, 10_000);

    await fill(page, { name: "Anna", contact: "anna@example.com", msg: MSG });
    await page.locator(".kt-send").click();
    await expect(page.locator(".kt-srv")).toBeVisible();
    await expect(page.locator(".kt-frame")).not.toHaveClass(/\bsent\b/);
    await expect(page.locator(".kt-send")).toBeEnabled();
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
  await expect.poll(inkOf).toBe("rgb(33, 29, 24)");
});

// ── układ desktop: sticky kolumna kontaktowa ──
test.describe("układ desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop");

  // Ryciny desktopowe nie mogą być ucinane od DOŁU (sesja poprawek;
  // zgłoszenie Mateusza). `.kt-write`/`.kt-social` mają na mobile
  // `overflow: hidden` (ryciny celowo wychodzą za krawędź EKRANU),
  // ale na desktopie ucinało to rysunek w pół kreski, bo obie ryciny
  // są WYŻSZE od swoich sekcji. Sonda układu, nie pixel-diff.
  test("ryciny wychodzą poza sekcję zamiast być ucięte na jej krawędzi", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const geo = await page.evaluate(() => {
      const box = (sel: string) =>
        document.querySelector<HTMLElement>(sel)!.getBoundingClientRect();
      const write = box(".kt-write");
      const kalamarz = box(".kt-write-ryc.dOnly");
      const formsec = box(".kt-formsec");
      const social = box(".kt-social");
      const golab = box(".kt-social-ryc.dOnly");
      const footer = box("footer");
      return {
        // kałamarz sięga NIŻEJ niż jego sekcja (czyli nie jest przycięty)
        kalamarzPozaSekcja: kalamarz.bottom - write.bottom,
        // …i wchodzi w obszar pudła formularza, za którym ma się chować
        kalamarzWFormularzu: kalamarz.bottom - formsec.top,
        formsecPozycjonowany: getComputedStyle(
          document.querySelector<HTMLElement>(".kt-formsec")!,
        ).position,
        golabPozaSekcja: golab.bottom - social.bottom,
        // …ale nie dojeżdża do stopki (nie ma się tam za co schować)
        golabDoStopki: footer.top - golab.bottom,
        // oś pozioma zostaje przycięta — strona nie może dostać scrolla
        poziomyScroll: document.documentElement.scrollWidth > window.innerWidth,
        kalamarzWBoku: kalamarz.right - write.right,
        golabWBoku: golab.right - social.right,
      };
    });
    expect(geo.kalamarzPozaSekcja).toBeGreaterThan(0);
    expect(geo.kalamarzWFormularzu).toBeGreaterThan(0);
    expect(geo.formsecPozycjonowany).toBe("relative");
    expect(geo.golabPozaSekcja).toBeGreaterThan(0);
    expect(geo.golabDoStopki).toBeGreaterThan(0);
    expect(geo.poziomyScroll).toBe(false);
    expect(geo.kalamarzWBoku).toBeLessThanOrEqual(0);
    expect(geo.golabWBoku).toBeLessThanOrEqual(0);
  });

  test("kolumna kontaktowa jest sticky i zatrzymuje się POD paskiem", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const before = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>(".kt-card")!;
      const cs = getComputedStyle(card);
      return {
        position: cs.position,
        top: parseFloat(cs.top),
        hdr: parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--hdr-h",
          ),
        ),
      };
    });
    expect(before.position).toBe("sticky");
    // offset MUSI doliczać wysokość nakładkowego paska (analiza §2 pkt 3)
    expect(before.top).toBeGreaterThan(before.hdr);

    // W środku zakresu, po którym sticky ma po czym jechać, karta stoi
    // dokładnie na swoim offsecie (a nie wjeżdża pod pasek ani nie ucieka
    // z kadru). Zakres liczymy z DOM-u — przy krótkim dokumencie i wysokim
    // viewporcie karta bywa niemal równa swojemu kontenerowi.
    const range = await page.evaluate(() => {
      const split = document.querySelector<HTMLElement>(".kt-split")!;
      const card = document.querySelector<HTMLElement>(".kt-card")!;
      const stickyTop = parseFloat(getComputedStyle(card).top);
      const cardDocTop = card.getBoundingClientRect().top + window.scrollY;
      const splitDocBottom =
        split.getBoundingClientRect().bottom + window.scrollY;
      return {
        from: cardDocTop - stickyTop,
        to: splitDocBottom - card.offsetHeight - stickyTop,
      };
    });
    test.skip(
      range.to - range.from < 40,
      "karta wypełnia kontener — sticky nie ma po czym jechać na tym profilu",
    );
    await scrollPageTo(page, Math.round((range.from + range.to) / 2));
    const top = await page.evaluate(
      () => document.querySelector(".kt-card")!.getBoundingClientRect().top,
    );
    expect(Math.abs(top - before.top)).toBeLessThanOrEqual(1);
  });

  test("pudło rejestrowe znika z układu — jego panele są w karcie", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const m = await page.evaluate(() => ({
      reg: getComputedStyle(document.querySelector(".kt-reg")!).display,
      areaInCard: document
        .querySelector(".kt-card")!
        .contains(document.querySelector(".kt-area")),
    }));
    expect(m.reg).toBe("contents");
    expect(m.areaInCard).toBe(true);
  });
});

// ── reveal nagłówka po dojechaniu (bramka js-motion, mobile) ──
// ── tag godzin łamany jawnie (sesja poprawek; zgłoszenie Mateusza).
// Jeden ciąg „KONTAKT 7 DNI W TYGODNIU · BUDOWA PN–PT 8–16" ma 326 px,
// a kolumna mobile 260–326 px, więc od 375 px w dół zawijał się sam
// i zrzucał do drugiego wiersza sierotę „8–16", a przy 375 px SAMO
// „16". Przy 390 px stał dokładnie na styk. Teraz to dwa człony:
// mobile jeden pod drugim, desktop sklejone kropką. ──
test("tag godzin: mobile dwa wiersze, desktop jeden z kropką", async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, PATH);
  const tag = page.locator(".kt-tag-hours");
  const geo = await tag.evaluate((el: HTMLElement) => {
    const czlony = [
      ...el.querySelectorAll<HTMLElement>(":scope > span"),
    ].filter((s) => !s.classList.contains("kt-tag-sep"));
    const sep = el.querySelector<HTMLElement>(".kt-tag-sep")!;
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    return {
      wierszy: Math.round(
        (el.getBoundingClientRect().height - parseFloat(cs.paddingBottom)) / lh,
      ),
      czlonow: czlony.length,
      // żaden człon nie może się łamać w środku — inaczej wraca sierota
      nowrap: czlony.map((s) => getComputedStyle(s).whiteSpace),
      wysokosciCzlonow: czlony.map((s) =>
        Math.round(s.getBoundingClientRect().height),
      ),
      sep: getComputedStyle(sep).display,
      tekst: el.innerText.replace(/\s+/g, " ").trim(),
    };
  });
  expect(geo.czlonow).toBe(2);
  expect(geo.nowrap).toEqual(["nowrap", "nowrap"]);
  // każdy człon mieści się w JEDNYM wierszu (sierota „16" niemożliwa)
  const lh = geo.wysokosciCzlonow[0];
  expect(geo.wysokosciCzlonow[1]).toBe(lh);
  if (isMobile) {
    expect(geo.wierszy).toBe(2);
    expect(geo.sep).toBe("none");
    expect(geo.tekst).toContain("KONTAKT 7 DNI W TYGODNIU");
    expect(geo.tekst).toContain("BUDOWA PN–PT 8–16");
  } else {
    expect(geo.wierszy).toBe(1);
    expect(geo.sep).toBe("inline");
    expect(geo.tekst).toBe("KONTAKT 7 DNI W TYGODNIU · BUDOWA PN–PT 8–16");
  }
});

// ── rycina gołębia w sekcji social (sesja poprawek; zgłoszenie
// Mateusza z telefonu). Element wystaje 44 px poza prawą krawędź przy
// szerokości 168 px, a `.kt-social` ma `overflow: hidden` — ekran ucinał
// więc prawe ~26 % rysunku, czyli GŁOWĘ z dziobem. Odbicie lustrzane
// obraca lot: głowa idzie do środka kadru, a za krawędź wychodzi
// skrzydło. Kompozycji i kotwiczenia NIE ruszamy. ──
test("gołąb sekcji social jest odbity na mobile, w oryginale na desktopie", async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, PATH);
  const ryc = page.locator(
    isMobile ? ".kt-social-ryc.mOnly" : ".kt-social-ryc.dOnly",
  );
  const geo = await ryc.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return {
      transform: getComputedStyle(el).transform,
      left: box.left,
      right: box.right,
      vw: window.innerWidth,
    };
  });
  if (isMobile) {
    // scaleX(-1) → matrix(-1, 0, 0, 1, 0, 0)
    expect(geo.transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    // po odbiciu głowa siedzi przy LEWEJ krawędzi elementu — musi być
    // w kadrze; za prawą krawędź ekranu wychodzi tylko skrzydło
    expect(geo.left).toBeGreaterThan(0);
    expect(geo.right).toBeGreaterThan(geo.vw);
  } else {
    expect(geo.transform).toBe("none");
  }
});

// Sonda siedziała na kickerze „MEDIA SPOŁECZNOŚCIOWE"; po jego
// usunięciu (poprawki klienta) pierwszym [data-rev] sekcji jest h2.
test("reveal nagłówka sekcji social odpala po dojechaniu scrollem", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "reveale [data-rev] istnieją tylko w układzie mobile");
  await gotoReady(page, PATH);
  const kick = page.locator(".kt-social h2");
  await expect(kick).toHaveCSS("opacity", "0");
  await kick.scrollIntoViewIfNeeded();
  await settle(page, 400);
  await expect(kick).toHaveCSS("opacity", "1");
});

// ── dryf tła papieru (PaperBackdrop): jak pozostałe trasy ──
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
test("próg desktopowy: układ przełącza się dokładnie na CONTACT_DESKTOP_MIN_PX", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "kontrakt progu — jeden profil desktop (test sam zmienia szerokość)",
  );
  await gotoReady(page, PATH);
  await expectBreakpointFlip(
    page,
    CONTACT_DESKTOP_MIN_PX,
    {
      split: ".kt-split",
      card: ".kt-card",
      reg: ".kt-reg",
      mailLb: ".kt-mail .kt-lb",
    },
    { split: "flex", card: "contents", reg: "flex", mailLb: "none" },
    { split: "grid", card: "flex", reg: "contents", mailLb: "block" },
  );
});
