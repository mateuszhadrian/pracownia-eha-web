// Stałe linki do realizacji (docs/analiza-linki-realizacji.md): podstrona
// `/realizacje/<plik>/` per wpis = ta sama lista z OTWARTYM detalem;
// pasek adresu podąża za detalem (pushState / replaceState), „wstecz"
// zamyka podgląd pełnoekranowy, potem detal; stopka detalu udostępnia
// link (telefon: Web Share API, desktop: schowek); usunięta realizacja =
// 404 z wariantem „zobacz wszystkie realizacje". Mechanizm detalu
// (galeria, projnav, podgląd, wideo) ma własne kontrakty w
// work-index.spec.ts — tu wyłącznie warstwa adresu.
//
// Odporne na treść z panelu: wpisy z kolekcji przez readRealizacje()
// (`slug` = nazwa pliku, jak w buildzie); pusta / krótka lista = skip
// z powodem.
import { expect, test, type Page } from "@playwright/test";
import {
  WORK_PAGE_SIZE,
  WORK_SHARE_COPIED_MS,
} from "../../src/components/sections/work/work-config";
import {
  resolveRelated,
  workDocTitle,
} from "../../src/components/sections/work/work-data";
import { ui } from "../../src/i18n/ui";
import {
  HOME_PATH,
  WORK_INDEX_PATH,
  workDetailPath,
} from "../../src/lib/routes";
import { useChromium1920Only, usePreviewGuard } from "../helpers/guards";
import { readRealizacje } from "../helpers/realizacje";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

const SITE = "https://pracownia-eha.pl";

interface Entry {
  order: number;
  title: string;
  place: string;
  year: string;
  paras: string[];
  gallery: ({ type: "photo"; image: string } | { type: "video" })[];
  related?: string[];
}
const ENTRIES = readRealizacje<Entry>();
// „Inne realizacje z inwestycji": oczekiwana lista per wpis liczona tą samą
// funkcją co build (jej reguły — martwe id, duplikaty, samowskazanie —
// pilnuje work-data.test.ts); tu sprawdzamy RENDER i NAWIGACJĘ.
const RELATED = resolveRelated(
  ENTRIES.map((e) => ({ ...e, related: e.related ?? [] })),
);
const relatedOf = (slug: string) => RELATED.get(slug) ?? [];
const WITH_RELATED = ENTRIES.find((e) => relatedOf(e.slug).length > 0);
const WITHOUT_RELATED = ENTRIES.find((e) => relatedOf(e.slug).length === 0);
const NO_RELATED_REASON =
  "żaden wpis w kolekcji nie ma powiązań „Inne realizacje z inwestycji” — wariant zacznie biegać, gdy klient doda pierwsze w panelu";
const LIST_TITLE = ui.pl["workPage.title"];
const LAST = ENTRIES[ENTRIES.length - 1];

usePreviewGuard();

test.skip(
  ENTRIES.length === 0,
  "brak realizacji w kolekcji — nie ma podstron do sprawdzenia",
);

const path = () => new URL(location.href).pathname;
const pathOf = (page: Page) => new URL(page.url()).pathname;

/** Klika kafel wpisu na liście (odsłania go paginacją / „pokaż więcej"). */
async function clickTile(page: Page, slug: string) {
  const card = page.locator(`.wk-grid [data-work-slug="${slug}"]`);
  if (await card.isHidden()) {
    const idx = ENTRIES.findIndex((e) => e.slug === slug);
    const pag = page.locator(
      `[data-pag-page="${Math.floor(idx / WORK_PAGE_SIZE)}"]`,
    );
    if (await pag.isVisible()) await pag.click();
    else {
      const more = page.locator("[data-more]");
      while ((await card.isHidden()) && (await more.isVisible())) {
        await more.click();
        await settle(page, 200);
      }
    }
    await settle(page, 400);
  }
  await card.scrollIntoViewIfNeeded();
  await settle(page, 300);
  await card.click();
  await expect(page.locator("#work-detail")).toHaveClass(/is-open/);
  await settle(page, 600);
}

test.describe("podstrony realizacji: meta (jeden profil)", () => {
  useChromium1920Only("meta podstron nie zależą od profilu");

  test("każda realizacja ma podstronę 200 z własnymi meta i okładką w podglądzie linku", async ({
    page,
  }) => {
    for (const entry of ENTRIES) {
      const res = await page.goto(workDetailPath(entry.slug));
      expect(res?.status(), entry.slug).toBe(200);
      const head = page.locator("head");
      await expect(page).toHaveTitle(workDocTitle(entry));
      await expect(head.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${workDetailPath(entry.slug)}`,
      );
      await expect(head.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        `${SITE}${workDetailPath(entry.slug)}`,
      );
      await expect(head.locator('meta[property="og:type"]')).toHaveAttribute(
        "content",
        "article",
      );
      // podgląd linku = okładka (pierwsze zdjęcie galerii) w kadrze
      // 1200×630, JPEG, adres absolutny na domenie produkcji
      const og = await head
        .locator('meta[property="og:image"]')
        .getAttribute("content");
      const cover = entry.gallery[0] as { image: string };
      expect(og).toMatch(
        new RegExp(
          `^${SITE}/cdn-cgi/image/width=1200,height=630,fit=cover,format=jpeg`,
        ),
      );
      expect(og).toContain(cover.image.replace(/^\//, ""));
      const desc = await head
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(desc?.length ?? 0).toBeGreaterThan(20);
      expect(desc?.length ?? 0).toBeLessThanOrEqual(156);
      // pozycja „REALIZACJE" zostaje bieżąca w pasku
      await expect(
        page.locator(`.hdr a[href="${WORK_INDEX_PATH}"][aria-current="page"]`),
      ).not.toHaveCount(0);
    }
  });
});

test.describe("wejście z linku", () => {
  test("detal otwarty od pierwszego wyświetlenia, bez wjazdu, lista pod spodem", async ({
    page,
  }) => {
    await page.goto(workDetailPath(LAST.slug), { waitUntil: "load" });
    const detail = page.locator("#work-detail");
    await expect(detail).toHaveClass(/is-open/);
    // bez animacji wjazdu: panel stoi od razu w pozycji końcowej
    const panel = detail.locator("[data-overlay-panel]").first();
    const r0 = await panel.boundingBox();
    await settle(page, 700);
    const r1 = await panel.boundingBox();
    expect(Math.abs((r0?.y ?? 0) - (r1?.y ?? 0))).toBeLessThan(1);

    await expect(detail.locator(".dt-title")).toHaveText(LAST.title);
    expect(pathOf(page)).toBe(workDetailPath(LAST.slug));
    await expect(page).toHaveTitle(workDocTitle(LAST));
    // zasłona wejścia zdjęta, lista jest pod nakładką
    await expect(page.locator("html")).not.toHaveClass(/wk-dl/);
    await expect(page.locator("main.wk")).toBeVisible();
    // projnav/licznik po PEŁNEJ liście
    await expect(detail.locator("[data-projcount]")).toHaveText(
      `REALIZACJA ${String(ENTRIES.length).padStart(2, "0")} / ${String(ENTRIES.length).padStart(2, "0")}`,
    );
  });

  test("zamknięcie zostawia na liście: adres /realizacje/, bez nowego wpisu historii, kafel widoczny", async ({
    page,
  }) => {
    await gotoReady(page, workDetailPath(LAST.slug));
    const before = await page.evaluate(() => history.length);
    await page.keyboard.press("Escape");
    await expect(page.locator("#work-detail")).toBeHidden();
    await expect.poll(() => pathOf(page)).toBe(WORK_INDEX_PATH);
    await expect(page).toHaveTitle(LIST_TITLE);
    expect(await page.evaluate(() => history.length)).toBe(before);
    // porcja siatki z tą realizacją jest odsłonięta (paginacja / pokaż więcej)
    await expect(
      page.locator(`.wk-grid [data-work-slug="${LAST.slug}"]`),
    ).toBeVisible();
  });

  test("bez JS: treść realizacji w bloku statycznym nad listą", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(workDetailPath(LAST.slug));
    const block = page.locator(".wks");
    await expect(block).toBeVisible();
    await expect(block.locator(".wks-title")).toHaveText(LAST.title);
    await expect(block.locator(".wks-desc")).toHaveCount(LAST.paras.length);
    await expect(page.locator("#work-detail")).toBeHidden();
    await ctx.close();
  });
});

test.describe("pasek adresu podąża za detalem", () => {
  test("klik kafla → adres podstrony; wstecz zamyka; dalej otwiera ponownie", async ({
    page,
  }) => {
    const entry = ENTRIES[0];
    await gotoReady(page, WORK_INDEX_PATH);
    await clickTile(page, entry.slug);
    expect(pathOf(page)).toBe(workDetailPath(entry.slug));
    await expect(page).toHaveTitle(workDocTitle(entry));

    await page.goBack();
    await expect(page.locator("#work-detail")).toBeHidden();
    expect(pathOf(page)).toBe(WORK_INDEX_PATH);
    await expect(page).toHaveTitle(LIST_TITLE);

    await page.goForward();
    await expect(page.locator("#work-detail")).toHaveClass(/is-open/);
    await expect(page.locator("#work-detail .dt-title")).toHaveText(
      entry.title,
    );
    expect(pathOf(page)).toBe(workDetailPath(entry.slug));
  });

  test("zamknięcie (Esc) cofa wpis historii i przywraca pozycję listy", async ({
    page,
  }) => {
    await gotoReady(page, WORK_INDEX_PATH);
    await scrollPageTo(page, 400);
    const entry = ENTRIES[0];
    const card = page.locator(`.wk-grid [data-work-slug="${entry.slug}"]`);
    // pozycję mierzymy PO ustawieniu kafla w widoku — click() Playwrighta
    // sam przewija do elementu, a to nie jest ruch, który mamy przywrócić
    await card.scrollIntoViewIfNeeded();
    await settle(page, 300);
    const y = await page.evaluate(() => scrollY);
    await card.click();
    await expect(page.locator("#work-detail")).toHaveClass(/is-open/);
    await settle(page, 600);

    await page.keyboard.press("Escape");
    await expect(page.locator("#work-detail")).toBeHidden();
    await expect.poll(() => page.evaluate(path)).toBe(WORK_INDEX_PATH);
    await settle(page, 300);
    expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(3);
    // wpis detalu zdjęty — „dalej" istnieje, „wstecz" nie wraca do detalu
    expect(
      await page.evaluate(() => (history.state as { wd?: string } | null)?.wd),
    ).toBeUndefined();
  });

  test("„wstecz” przywraca pozycję listy", async ({ page }) => {
    await gotoReady(page, WORK_INDEX_PATH);
    await scrollPageTo(page, 400);
    const entry = ENTRIES[0];
    const card = page.locator(`.wk-grid [data-work-slug="${entry.slug}"]`);
    await card.scrollIntoViewIfNeeded();
    await settle(page, 300);
    const y = await page.evaluate(() => scrollY);
    await card.click();
    await expect(page.locator("#work-detail")).toHaveClass(/is-open/);
    await settle(page, 600);
    await page.goBack();
    await expect(page.locator("#work-detail")).toBeHidden();
    await settle(page, 300);
    expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(3);
  });

  test("projnav podmienia adres bez dokładania historii (desktop)", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "projnav tylko na desktopie");
    test.skip(ENTRIES.length < 2, "projnav wymaga co najmniej 2 wpisów");
    await gotoReady(page, WORK_INDEX_PATH);
    await clickTile(page, ENTRIES[0].slug);
    const before = await page.evaluate(() => history.length);
    await page.locator("[data-nextproj]").click();
    await expect(page.locator("#work-detail .dt-title")).toHaveText(
      ENTRIES[1].title,
    );
    expect(pathOf(page)).toBe(workDetailPath(ENTRIES[1].slug));
    await expect(page).toHaveTitle(workDocTitle(ENTRIES[1]));
    expect(await page.evaluate(() => history.length)).toBe(before);
    // jedno „wstecz" = zamknięcie, nie powrót do poprzedniej realizacji
    await page.goBack();
    await expect(page.locator("#work-detail")).toBeHidden();
    expect(pathOf(page)).toBe(WORK_INDEX_PATH);
  });

  test("podgląd pełnoekranowy: wstecz zamyka NAJPIERW podgląd, potem detal", async ({
    page,
  }) => {
    const entry = ENTRIES[0];
    await gotoReady(page, WORK_INDEX_PATH);
    await clickTile(page, entry.slug);
    const lb = page.locator("#work-detail [data-lightbox]");
    await page.locator("#work-detail [data-slide]").first().click();
    await expect(lb).toBeVisible();

    await page.goBack();
    await expect(lb).toBeHidden();
    await expect(page.locator("#work-detail")).toHaveClass(/is-open/);
    expect(pathOf(page)).toBe(workDetailPath(entry.slug));

    await page.goBack();
    await expect(page.locator("#work-detail")).toBeHidden();
    expect(pathOf(page)).toBe(WORK_INDEX_PATH);
  });

  test("podgląd zamknięty przyciskiem, detal Esc — historia wraca do listy", async ({
    page,
  }) => {
    const entry = ENTRIES[0];
    await gotoReady(page, WORK_INDEX_PATH);
    const start = await page.evaluate(() => history.length);
    await clickTile(page, entry.slug);
    const lb = page.locator("#work-detail [data-lightbox]");
    await page.locator("#work-detail [data-slide]").first().click();
    await expect(lb).toBeVisible();
    await lb.locator("[data-lb-close]:visible").first().click();
    await expect(lb).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => (history.state as { lb?: true })?.lb))
      .toBeUndefined();
    await page.keyboard.press("Escape");
    await expect(page.locator("#work-detail")).toBeHidden();
    await expect.poll(() => pathOf(page)).toBe(WORK_INDEX_PATH);
    // „wstecz" po wszystkim nie trafia już na wpisy detalu
    expect(await page.evaluate(() => history.length)).toBeGreaterThanOrEqual(
      start,
    );
    expect(
      await page.evaluate(() => (history.state as { wd?: string } | null)?.wd),
    ).toBeUndefined();
  });

  test("zajawka na / : adres podstrony, wstecz wraca na stronę główną", async ({
    page,
    isMobile,
  }) => {
    await gotoReady(page, HOME_PATH);
    const card = (
      isMobile
        ? page.locator(".re-track .re-card:not(.re-morecard)")
        : page.locator(".re-pol")
    ).first();
    await card.scrollIntoViewIfNeeded();
    await settle(page, 300);
    await card.click();
    await expect(page.locator("#work-detail")).toHaveClass(/is-open/);
    expect(pathOf(page)).toBe(workDetailPath(ENTRIES[0].slug));
    await settle(page, 600);
    await page.goBack();
    await expect(page.locator("#work-detail")).toBeHidden();
    expect(pathOf(page)).toBe(HOME_PATH);
    await expect(page.locator("main.home")).toBeVisible();
  });
});

test.describe("udostępnianie", () => {
  test("desktop: kopiuje link do schowka i pokazuje „Link skopiowany”", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "na telefonie leci systemowe menu udostępniania");
    await page.addInitScript(() => {
      const w = window as unknown as { __copied?: string };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: (t: string) => {
            w.__copied = t;
            return Promise.resolve();
          },
        },
      });
    });
    const entry = ENTRIES[0];
    await gotoReady(page, workDetailPath(entry.slug));
    const btn = page.locator("#work-detail [data-share]");
    await expect(btn).toHaveText(/Udostępnij realizację/);
    await btn.click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __copied?: string }).__copied,
        ),
      )
      .toBe(new URL(workDetailPath(entry.slug), page.url()).href);
    await expect(btn).toHaveClass(/is-copied/);
    await expect(page.locator("#work-detail [data-share-status]")).toHaveText(
      "Link skopiowany",
    );
    await page.waitForTimeout(WORK_SHARE_COPIED_MS + 300);
    await expect(btn).not.toHaveClass(/is-copied/);
  });

  test("telefon: systemowe menu udostępniania z tytułem i linkiem", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Web Share API to ścieżka telefonu");
    await page.addInitScript(() => {
      const w = window as unknown as { __shared?: ShareData };
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: (d: ShareData) => {
          w.__shared = d;
          return Promise.resolve();
        },
      });
    });
    const entry = ENTRIES[0];
    await gotoReady(page, workDetailPath(entry.slug));
    await page.locator("#work-detail [data-share]").click();
    const shared = await page.evaluate(
      () => (window as unknown as { __shared?: ShareData }).__shared,
    );
    expect(shared?.title).toBe(entry.title);
    expect(shared?.url).toBe(
      new URL(workDetailPath(entry.slug), page.url()).href,
    );
  });

  test("stopka detalu nie ma już „Chcesz więcej informacji?” ani linku do kontaktu", async ({
    page,
  }) => {
    await gotoReady(page, workDetailPath(ENTRIES[0].slug));
    const foot = page.locator("#work-detail .dt-foot");
    await expect(foot).toBeVisible();
    await expect(foot.getByText(/chcesz więcej informacji/i)).toHaveCount(0);
    await expect(foot.locator("a")).toHaveCount(0);
  });
});

test.describe("usunięta realizacja", () => {
  useChromium1920Only("wariant 404 nie zależy od profilu");

  test("nieistniejąca podstrona = 404 z odesłaniem do listy realizacji", async ({
    page,
  }) => {
    const res = await page.goto("/realizacje/nie-ma-takiej-realizacji/");
    expect(res?.status()).toBe(404);
    const btn = page.getByRole("link", { name: "Zobacz wszystkie realizacje" });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("href", WORK_INDEX_PATH);
    await expect(
      page.getByRole("link", { name: "Powrót na stronę główną" }),
    ).toBeHidden();
  });
});

// ── „Inne realizacje z inwestycji" (docs/analiza-inne-realizacje.md):
// opcjonalna sekcja na samym dole treści detalu; ZWYKŁE linki pod stały
// adres realizacji — klik ładuje podstronę z detalem otwartym od wejścia,
// „wstecz" wraca do poprzedniej realizacji. Treść z kolekcji: wariant
// „z powiązaniami" biega dopiero, gdy klient doda je w panelu. ──
test.describe("inne realizacje z inwestycji", () => {
  test("wpis z powiązaniami: sekcja ostatnia przed stopką, linki pod adresy realizacji", async ({
    page,
  }) => {
    test.skip(!WITH_RELATED, NO_RELATED_REASON);
    const entry = WITH_RELATED!;
    const expected = relatedOf(entry.slug);
    await gotoReady(page, workDetailPath(entry.slug));
    const detail = page.locator("#work-detail");
    const rel = detail.locator(".dt-rel");
    await expect(rel).toHaveCount(1);
    await expect(rel.locator(".dt-specs-h span")).toHaveText(
      "INNE REALIZACJE Z INWESTYCJI",
    );
    // nawigacja z dostępną nazwą (nagłówek sekcji)
    await expect(
      page.getByRole("navigation", { name: "INNE REALIZACJE Z INWESTYCJI" }),
    ).toHaveCount(1);

    const links = rel.locator("a.dt-rel-a");
    await expect(links).toHaveCount(expected.length);
    for (const [i, r] of expected.entries()) {
      const a = links.nth(i);
      await expect(a).toHaveAttribute("href", workDetailPath(r.slug));
      await expect(a.locator(".dt-rel-t")).toHaveText(r.title);
      await expect(a.locator(".dt-rel-meta")).toHaveText(
        `${r.place} · ${r.year}`.toUpperCase(),
        { useInnerText: true },
      );
      // bez data-work-slug: tego atrybutu szukają kafle („otwórz w miejscu")
      await expect(a).not.toHaveAttribute("data-work-slug");
    }

    // na samym dole: ostatni blok treści przed stopką, z odstępem końcowym
    expect(
      await rel.evaluate((el) => {
        let next = el.nextElementSibling;
        while (next && next.matches("template, script"))
          next = next.nextElementSibling;
        return next?.classList.contains("dt-foot") ?? false;
      }),
    ).toBe(true);
    await expect(detail.locator(".dt-about")).not.toHaveClass(/dt-about--last/);
    await expect(detail.locator(".dt-specs")).not.toHaveClass(/dt-specs--last/);
  });

  test("klik w powiązanie: podstrona wskazanej realizacji z otwartym detalem; wstecz wraca", async ({
    page,
  }) => {
    test.skip(!WITH_RELATED, NO_RELATED_REASON);
    const entry = WITH_RELATED!;
    const target = relatedOf(entry.slug)[0];
    const targetEntry = ENTRIES.find((e) => e.slug === target.slug)!;
    await gotoReady(page, workDetailPath(entry.slug));
    const link = page.locator("#work-detail .dt-rel a.dt-rel-a").first();
    await link.scrollIntoViewIfNeeded();
    await settle(page, 300);
    await Promise.all([
      page.waitForURL((u) => u.pathname === workDetailPath(target.slug)),
      link.click(),
    ]);
    const detail = page.locator("#work-detail");
    await expect(detail).toHaveClass(/is-open/);
    await expect(detail.locator(".dt-title")).toHaveText(target.title);
    await expect(page).toHaveTitle(workDocTitle(targetEntry));

    await page.goBack();
    await expect.poll(() => pathOf(page)).toBe(workDetailPath(entry.slug));
    await expect(page.locator("#work-detail")).toHaveClass(/is-open/);
    await expect(page.locator("#work-detail .dt-title")).toHaveText(
      entry.title,
    );
  });

  test("wpis bez powiązań: sekcji nie ma", async ({ page }) => {
    test.skip(
      !WITHOUT_RELATED,
      "każdy wpis w kolekcji ma powiązania — wariant bez sekcji nie ma treści do sprawdzenia",
    );
    await gotoReady(page, workDetailPath(WITHOUT_RELATED!.slug));
    const detail = page.locator("#work-detail");
    await expect(detail.locator(".dt-title")).toHaveText(
      WITHOUT_RELATED!.title,
    );
    await expect(detail.locator(".dt-rel")).toHaveCount(0);
    await expect(
      detail.getByText("INNE REALIZACJE Z INWESTYCJI", { exact: true }),
    ).toHaveCount(0);
  });

  test("bez JS: powiązania w bloku statycznym jako zwykłe linki", async ({
    browser,
  }) => {
    test.skip(!WITH_RELATED, NO_RELATED_REASON);
    const entry = WITH_RELATED!;
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(workDetailPath(entry.slug));
    const links = page.locator(".wks .wks-rel a");
    await expect(links).toHaveCount(relatedOf(entry.slug).length);
    await expect(links.first()).toHaveAttribute(
      "href",
      workDetailPath(relatedOf(entry.slug)[0].slug),
    );
    await ctx.close();
  });
});
