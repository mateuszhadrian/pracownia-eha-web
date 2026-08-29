// Podstrona realizacji (/realizacje/, Etap 4.3): płaska lista BEZ
// kategorii (E5) — siatka kafli z Content Collections (1→2 kolumny przy
// WORK_GRID_TWO_COL_MIN_PX), paginacja (desktop) / „pokaż więcej"
// (mobile) jako progressive enhancement (SSR renderuje wszystko, JS
// ukrywa), detal = JEDEN overlay #work-detail (modal ≥1024 / sheet
// <1024 — open-detail.ts) z galerią, projnavem po PEŁNEJ liście,
// podglądem pełnoekranowym (E7: contain na czerni + klawiatura ←/→)
// i wideo na tap (E8). Decyzje: docs/analiza-realizacje.md.
import { expect, test, type Page } from "@playwright/test";
import { PAPER_BG_SPEED } from "../../src/components/sections/home/home-config";
import {
  VIDEO_LOADING_DELAY_MS,
  WORK_DESKTOP_MIN_PX,
  WORK_GALLERY_DASHES_MAX,
  WORK_GRID_TWO_COL_MIN_PX,
  WORK_MOBILE_STEP,
  WORK_PAGE_SIZE,
} from "../../src/components/sections/work/work-config";
import { CONTACT_PATH } from "../../src/lib/routes";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import {
  collectPageIssues,
  useChromium1920Only,
  usePreviewGuard,
} from "../helpers/guards";
import { readRealizacje } from "../helpers/realizacje";
import { gotoReady, settle } from "../helpers/scroll";

const PATH = "/realizacje/";

// Wpisy kolekcji wprost z plików JSON (jak robi to build) — testy nie
// hardkodują treści CMS-a, liczą to samo co strona.
interface Entry {
  slug: string;
  order: number;
  title: string;
  place: string;
  year: string;
  // Pozycja galerii to wariant: albo zdjęcie, albo film — nigdy oba.
  gallery: (
    | { type: "photo"; image: string }
    | { type: "video"; video: string; duration?: string }
  )[];
}
const ENTRIES = readRealizacje<Entry>();

const pad = (n: number) => String(n).padStart(2, "0");
const VIDEO_ENTRY = ENTRIES.find((e) =>
  e.gallery.some((g) => g.type === "video"),
);
const PAGES = Math.ceil(ENTRIES.length / WORK_PAGE_SIZE);

usePreviewGuard();

// Pusta kolekcja to stan, który panel dopuszcza (klient może usunąć
// wszystko), a strona go przeżywa — pusta siatka, zero kontrolek.
// Sygnałem jest kontrakt CMS w tests/unit/cms-contract.test.ts.
test.skip(
  ENTRIES.length === 0,
  "brak realizacji w kolekcji — lista i detal nie mają treści",
);

/** Dociera do pierwszego kafla siatki i uspokaja scroll przed klikiem. */
async function revealFirstCard(page: Page) {
  const card = page.locator(".wk-grid [data-work-slug]").first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return card;
}

/** Odsłania kafel wpisu w siatce (desktop: paginacja, mobile: „pokaż
 *  więcej") i zwraca jego locator — wpis z wideo bywa poza pierwszą
 *  porcją. */
async function showEntry(page: Page, slug: string) {
  const card = page.locator(`.wk-grid [data-work-slug="${slug}"]`);
  if (await card.isHidden()) {
    const idx = ENTRIES.findIndex((e) => e.slug === slug);
    const pag = page.locator(
      `[data-pag-page="${Math.floor(idx / WORK_PAGE_SIZE)}"]`,
    );
    if (await pag.isVisible()) {
      await pag.click();
    } else {
      const more = page.locator("[data-more]");
      while ((await card.isHidden()) && (await more.isVisible())) {
        await more.click();
        await settle(page, 200);
      }
    }
    await settle(page, 400);
  }
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return card;
}

/** Otwiera detal kafla i czeka na koniec animacji wejścia nakładki. */
async function openDetail(page: Page, card: ReturnType<Page["locator"]>) {
  await card.click();
  const detail = page.locator("#work-detail");
  await expect(detail).toHaveClass(/is-open/);
  await page.waitForTimeout(600);
  return detail;
}

test.describe(`${PATH}: meta i treść (jeden profil)`, () => {
  useChromium1920Only("meta i liczby wpisów nie zależą od profilu");

  test("h1, lead i siatka ze WSZYSTKIMI wpisami kolekcji w SSR", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    await expect(page.locator("main h1")).toHaveText("Nasze realizacje");
    await expect(page.locator(".wk-grid [data-work-slug]")).toHaveCount(
      ENTRIES.length,
    );
    // template detalu per wpis — kontrakt mechanizmu (i strażnika visual)
    await expect(page.locator("template[data-work-detail]")).toHaveCount(
      ENTRIES.length,
    );
    // kafle w kolejności `order` z CMS
    await expect(
      page.locator(".wk-grid [data-work-slug]").first(),
    ).toHaveAttribute("data-work-slug", ENTRIES[0].slug);
  });

  test("CTA nad stopką prowadzi na kontakt", async ({ page }) => {
    await gotoReady(page, PATH);
    await expect(page.locator(".wk-cta a")).toHaveAttribute(
      "href",
      CONTACT_PATH,
    );
  });

  test("strona ładuje się bez błędów konsoli i 404", async ({ page }) => {
    const issues = collectPageIssues(page);
    await gotoReady(page, PATH);
    await settle(page, 400);
    expect(issues()).toEqual([]);
  });
});

// ── SSR: bez JS lista jest PEŁNA, kontrolki dawkowania ukryte (E5) ──
test.describe("bez JS lista jest pełna, kontrolki ukryte", () => {
  test.use({ javaScriptEnabled: false });

  test("wszystkie kafle widoczne, paginacja/„pokaż więcej” schowane", async ({
    page,
  }) => {
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".wk-grid [data-work-slug]:visible")).toHaveCount(
      ENTRIES.length,
    );
    // kontrolki są w SSR z `hidden` (odsłania je dopiero JS) albo nie ma
    // ich wcale (za mało wpisów) — w obu razach nic nie jest widoczne
    await expect(page.locator("[data-pag]:visible")).toHaveCount(0);
    await expect(page.locator("[data-more-wrap]:visible")).toHaveCount(0);
  });
});

// ── paginacja (desktop, E5) — odporna na liczbę wpisów ──
test.describe("paginacja desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "paginacja istnieje na desktopie");

  test("przy wpisach ≤ rozmiar strony kontrolek nie ma, siatka pełna", async ({
    page,
  }) => {
    test.skip(
      ENTRIES.length > WORK_PAGE_SIZE,
      "wpisów więcej niż strona — biegają testy pozytywne niżej",
    );
    await gotoReady(page, PATH);
    await expect(page.locator("[data-pag]")).toHaveCount(0);
    await expect(page.locator(".wk-grid [data-work-slug]:visible")).toHaveCount(
      ENTRIES.length,
    );
  });

  test("strona 1 pokazuje WORK_PAGE_SIZE kafli; przyciski przełączają", async ({
    page,
  }) => {
    test.skip(
      ENTRIES.length <= WORK_PAGE_SIZE,
      "za mało wpisów na drugą stronę paginacji",
    );
    await gotoReady(page, PATH);
    const pag = page.locator("[data-pag]");
    await expect(pag).toBeVisible();
    await expect(pag.locator("[data-pag-page]")).toHaveCount(PAGES);
    await expect(page.locator(".wk-grid [data-work-slug]:visible")).toHaveCount(
      WORK_PAGE_SIZE,
    );
    // strzałka wstecz na pierwszej stronie schowana (visibility)
    await expect(pag.locator("[data-pag-prev]")).toBeDisabled();

    await pag.locator('[data-pag-page="1"]').click();
    await settle(page, 400);
    await expect(page.locator(".wk-grid [data-work-slug]:visible")).toHaveCount(
      Math.min(ENTRIES.length - WORK_PAGE_SIZE, WORK_PAGE_SIZE),
    );
    // pierwszy widoczny kafel = pierwszy wpis strony 2
    await expect(
      page.locator(".wk-grid [data-work-slug]:visible").first(),
    ).toHaveAttribute("data-work-slug", ENTRIES[WORK_PAGE_SIZE].slug);
    await expect(pag.locator('[data-pag-page="1"]')).toHaveClass(/on/);
    await expect(pag.locator("[data-pag-prev]")).toBeEnabled();

    // strzałka → i ← chodzą po stronach
    await pag.locator("[data-pag-prev]").click();
    await settle(page, 400);
    await expect(
      page.locator(".wk-grid [data-work-slug]:visible").first(),
    ).toHaveAttribute("data-work-slug", ENTRIES[0].slug);
  });

  test("zmiana strony przewija do początku siatki", async ({ page }) => {
    test.skip(
      ENTRIES.length <= WORK_PAGE_SIZE,
      "za mało wpisów na drugą stronę paginacji",
    );
    await gotoReady(page, PATH);
    const pag = page.locator("[data-pag]");
    await pag.scrollIntoViewIfNeeded();
    await settle(page, 300);
    await pag.locator("[data-pag-page='1']").click();
    await settle(page, 900);
    const top = await page
      .locator(".wk-grid [data-work-slug]:visible")
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().top));
    const hdr = await page.evaluate(
      () =>
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--hdr-h",
          ),
        ) || 0,
    );
    // pierwszy kafel strony 2 ląduje tuż pod paskiem chrome'u
    expect(Math.abs(top - hdr - 12)).toBeLessThanOrEqual(3);
  });
});

// ── „pokaż więcej" (mobile, E5) — odporne na liczbę wpisów ──
test.describe("„pokaż więcej” mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "przycisk istnieje na mobile");

  test("przy wpisach ≤ krok przycisku nie ma, siatka pełna", async ({
    page,
  }) => {
    test.skip(
      ENTRIES.length > WORK_MOBILE_STEP,
      "wpisów więcej niż krok — biega test pozytywny niżej",
    );
    await gotoReady(page, PATH);
    await expect(page.locator("[data-more-wrap]")).toHaveCount(0);
    await expect(page.locator(".wk-grid [data-work-slug]:visible")).toHaveCount(
      ENTRIES.length,
    );
  });

  test("kroki dokładają kafle, wyczerpanie chowa przycisk", async ({
    page,
  }) => {
    test.skip(
      ENTRIES.length <= WORK_MOBILE_STEP,
      "za mało wpisów na drugi krok „pokaż więcej”",
    );
    await gotoReady(page, PATH);
    await expect(page.locator(".wk-grid [data-work-slug]:visible")).toHaveCount(
      WORK_MOBILE_STEP,
    );
    const btn = page.locator("[data-more]");
    await btn.scrollIntoViewIfNeeded();
    let shown = WORK_MOBILE_STEP;
    while (shown < ENTRIES.length) {
      await btn.click();
      shown = Math.min(ENTRIES.length, shown + WORK_MOBILE_STEP);
      await expect(
        page.locator(".wk-grid [data-work-slug]:visible"),
      ).toHaveCount(shown);
    }
    await expect(page.locator("[data-more-wrap]")).toBeHidden();
  });
});

// ── detal desktop: modal, galeria (strzałki + KLAWIATURA), projnav ──
test.describe("detal desktop: modal, galeria, projnav", () => {
  test.skip(({ isMobile }) => !!isMobile, "układ modala tylko na desktop");

  test("klik w kafel otwiera modal; ×, Esc i scrim zamykają, host czyszczony", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const card = await revealFirstCard(page);
    const name = await card.getAttribute("data-work-name");
    const detail = await openDetail(page, card);

    await expect(detail.locator(".dt-title")).toHaveText(name ?? "");
    // kontekst = PEŁNA lista (E5) — nie widoczna strona paginacji
    await expect(detail.locator("[data-projcount]")).toHaveText(
      `REALIZACJA 01 / ${pad(ENTRIES.length)}`,
    );

    // X w dt-head (desktop; drugi [data-overlay-close] to X sheeta mobile)
    await detail.locator(".dt-x").click();
    await expect(detail).toBeHidden();
    // host czyszczony po zamknięciu (zwalnia obrazy/DOM)
    await expect(detail.locator(".dt-title")).toHaveCount(0);

    await openDetail(page, card);
    await page.keyboard.press("Escape");
    await expect(detail).toBeHidden();

    await openDetail(page, card);
    // klik w tło (róg nakładki, poza panelem) zamyka
    await page.mouse.click(8, 8);
    await expect(detail).toBeHidden();
  });

  test("galeria: strzałki i KLAWIATURA ←/→ przełączają kadry (E7b)", async ({
    page,
  }) => {
    const shots = ENTRIES[0].gallery.length;
    test.skip(shots < 2, "pierwszy wpis ma jeden kadr");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    const count = detail.locator("[data-shotcount]");
    await expect(count).toHaveText(`01 / ${pad(shots)}`);
    await expect(detail.locator("[data-prevshot]")).toBeDisabled();

    await detail.locator("[data-nextshot]").click();
    await expect(count).toHaveText(`02 / ${pad(shots)}`);
    await expect(detail.locator("[data-prevshot]")).toBeEnabled();

    // klawiatura w detalu poza podglądem (adaptacja E7b)
    await page.keyboard.press("ArrowLeft");
    await expect(count).toHaveText(`01 / ${pad(shots)}`);
    // kraniec bez zapętlenia
    await page.keyboard.press("ArrowLeft");
    await expect(count).toHaveText(`01 / ${pad(shots)}`);
    await page.keyboard.press("ArrowRight");
    await expect(count).toHaveText(`02 / ${pad(shots)}`);
  });

  test("projnav przechodzi po PEŁNEJ liście (kontekst E5)", async ({
    page,
  }) => {
    test.skip(ENTRIES.length < 2, "potrzeba min. 2 wpisów");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    await detail.locator("[data-nextproj]").click();
    // przejazd panelu podmienia treść po ~420 ms
    await expect(detail.locator(".dt-title")).toHaveText(ENTRIES[1].title);
    await expect(detail.locator("[data-projcount]")).toHaveText(
      `REALIZACJA 02 / ${pad(ENTRIES.length)}`,
    );
    // nakładka pozostaje otwarta (klik w projnav to nie klik w tło)
    await expect(detail).toHaveClass(/is-open/);

    await detail.locator("[data-prevproj]").click();
    await expect(detail.locator(".dt-title")).toHaveText(ENTRIES[0].title);
  });

  test("podgląd pełnoekranowy: contain na czerni (E7a), strzałki, klawiatura, Esc-hierarchia", async ({
    page,
  }) => {
    const shots = ENTRIES[0].gallery.length;
    test.skip(shots < 2, "pierwszy wpis ma jeden kadr");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));
    const lb = detail.locator("[data-lightbox]");

    await detail.locator("[data-slide]").first().click();
    await expect(lb).toBeVisible();
    await expect(lb.locator("[data-lb-count]").last()).toHaveText(
      `01 / ${pad(shots)}`,
    );
    await expect(lb.locator("[data-lb-prev]")).toBeDisabled();

    // E7a: kadr = całe zdjęcie na czarnym pełnym ekranie
    const kontrakt = await lb.evaluate((el) => {
      const media = el.querySelector(".lb-media img, .lb-media video");
      return {
        bg: getComputedStyle(el).backgroundColor,
        fit: media ? getComputedStyle(media).objectFit : null,
      };
    });
    expect(kontrakt.bg).toBe("rgb(0, 0, 0)");
    expect(kontrakt.fit).toBe("contain");

    // strzałka → przełącza kadr
    await lb.locator("[data-lb-next]").click();
    await expect(lb.locator("[data-lb-count]").last()).toHaveText(
      `02 / ${pad(shots)}`,
    );
    await expect(lb.locator("[data-lb-dashes] button").nth(1)).toHaveClass(
      /on/,
    );
    // klawiatura w podglądzie (adaptacja E7b)
    await page.keyboard.press("ArrowLeft");
    await expect(lb.locator("[data-lb-count]").last()).toHaveText(
      `01 / ${pad(shots)}`,
    );
    await page.keyboard.press("ArrowRight");
    await expect(lb.locator("[data-lb-count]").last()).toHaveText(
      `02 / ${pad(shots)}`,
    );

    // X zamyka TYLKO podgląd; galeria wraca na oglądany kadr
    await lb.locator(".lb-x").click();
    await expect(lb).toBeHidden();
    await expect(detail).toHaveClass(/is-open/);
    await expect(detail.locator("[data-shotcount]")).toHaveText(
      `02 / ${pad(shots)}`,
    );

    // Esc w podglądzie zamyka podgląd, nie detal (hierarchia bez zmian)
    await detail.locator("[data-slide]").nth(1).click();
    await expect(lb).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(lb).toBeHidden();
    await expect(detail).toHaveClass(/is-open/);
  });

  test("wideo (E8): kamera + badge, poster dwiema drogami, autoplay w podglądzie, tap = pauza↔play", async ({
    page,
  }) => {
    test.skip(!VIDEO_ENTRY, "brak wpisu z wideo w kolekcji");
    const entry = VIDEO_ENTRY!;
    const videoIdx = entry.gallery.findIndex((g) => g.type === "video");
    const videoItem = entry.gallery[videoIdx] as {
      video: string;
      duration?: string;
    };
    await gotoReady(page, PATH);
    const card = page.locator(`.wk-grid [data-work-slug="${entry.slug}"]`);
    // wpis z wideo może leżeć poza pierwszą stroną paginacji — pokaż go
    if (await card.isHidden()) {
      const idx = ENTRIES.findIndex((e) => e.slug === entry.slug);
      const targetPage = Math.floor(idx / WORK_PAGE_SIZE);
      await page.locator(`[data-pag-page="${targetPage}"]`).click();
      await settle(page, 400);
    }
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const detail = await openDetail(page, card);

    const video = detail.locator("[data-gal] video");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveAttribute("playsinline", "");
    // bez `controls` i bez własnego znaku play (E8) — ewentualny znak
    // może dodać wyłącznie sama przeglądarka
    expect(await video.getAttribute("controls")).toBeNull();
    // Pozycja z filmem NIE MA własnego zdjęcia — plakatem jest klatka
    // wycięta z samego filmu (videoFrameAt). Na preview endpoint
    // /cdn-cgi/media 404-uje — znany artefakt.
    // Klatka JEDNĄ drogą: <img class="dt-poster"> pod <video>. Atrybutu
    // `poster` NIE MA (korekta po produkcji 4.3 — silniki malują go
    // rozciągnięty do pudełka elementu, ignorując object-fit).
    expect(await video.getAttribute("poster")).toBeNull();
    const klatka = await detail
      .locator("[data-gal] .dt-poster")
      .getAttribute("src");
    expect(klatka).toMatch(
      /^\/cdn-cgi\/media\/mode=frame,time=\d+s,width=\d+\//,
    );
    // klatka pochodzi Z TEGO SAMEGO pliku, który jest odtwarzany
    expect(klatka).toContain(videoItem.video.replace(/^https?:\/\//, ""));

    // dojazd do kadru z wideo strzałkami (dashes są mobile-only w 4.3)
    for (let i = 0; i < videoIdx; i++) {
      await detail.locator("[data-nextshot]").click();
    }
    await settle(page, 700);
    await expect(detail.locator("[data-gal] [data-cam]")).toBeVisible();
    const hint = detail.locator("[data-gal] [data-cam-hint]");
    await expect(hint).toBeVisible();
    // oba warianty siedzą w DOM, o wyborze decyduje @media — useInnerText;
    // kapitaliki robi text-transform (design), stąd wersaliki w asercji
    await expect(hint).toHaveText("KLIKNIJ, ABY OBEJRZEĆ", {
      useInnerText: true,
    });
    if (videoItem.duration) {
      await expect(detail.locator("[data-gal] .dt-time")).toBeVisible();
    }

    // tap w kadr wideo → podgląd pełnoekranowy z JUŻ grającym filmem
    await detail.locator("[data-gal] [data-slide]").nth(videoIdx).click();
    const lb = detail.locator("[data-lightbox]");
    await expect(lb).toBeVisible();
    await expect(lb.locator("[data-lb-count]").last()).toHaveText(
      `${pad(videoIdx + 1)} / ${pad(entry.gallery.length)}`,
    );
    const lbVideo = lb.locator("video");
    expect(await lbVideo.evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      false,
    );
    // grający film chowa ikonkę kamery — i badge razem z nią
    await expect(lb.locator("[data-cam]")).toBeHidden();
    await expect(lb.locator("[data-cam-hint]")).toBeHidden();

    // tap w grający film = pauza (znaki wracają), kolejny tap = play
    await lbVideo.click();
    expect(await lbVideo.evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      true,
    );
    await expect(lb.locator("[data-cam]")).toBeVisible();
    await expect(lb.locator("[data-cam-hint]")).toBeVisible();
    await lbVideo.click();
    expect(await lbVideo.evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      false,
    );
  });
});

// ── wskaźnik ładowania wideo (sesja poprawek wizualnych; zgłoszenie
// Mateusza). Do tej pory slajd dostawał `is-playing` na zdarzeniu
// `play`, które leci PRZED pierwszym bajtem — podpowiedź znikała, a kadr
// stał nieruchomo (zmierzone `play`→`playing`: 0,65 s bez throttlingu,
// 2,0 s na Fast 3G, 7,5 s na Slow 3G) i użytkownik brał film za zdjęcie.
// Test jedzie na WŁASNYCH zdarzeniach media (`waiting`/`playing`),
// bo prawdziwe buforowanie jest niedeterministyczne. ──
test.describe("wskaźnik ładowania wideo w podglądzie", () => {
  test.skip(!VIDEO_ENTRY, "brak wpisu z wideo w kolekcji");
  // Te dwa testy jako JEDYNE w zestawie e2e czekają na REALNE `playing`,
  // czyli na pobranie filmu z R2 (13,4 MB) przez publiczną sieć. Przy
  // czterech workerach i zimnym brzegu CDN-u 15 s okazało się za mało —
  // wywróciło `main` dwa razy pod rząd (run 33258429686, oba profile
  // WebKit: slajd stał na `is-loading`). Diagnoza WYKLUCZYŁA produkcję:
  // R2 odpowiada z TTFB 60 ms, a plik jest `faststart` (`moov` na
  // offsecie 32, przed `mdat`), więc u użytkownika odtwarzanie rusza po
  // ~36 KB. To był zakład o przepustowość runnera, nie o kod.
  //
  // PODMIANA FILMU NA MAŁY STUB ZOSTAŁA SPRAWDZONA I ODRZUCONA: przy
  // w pełni zbuforowanym pliku symulowane `waiting` natychmiast wraca do
  // `playing`, więc asercja „stany są rozłączne" (niżej) traci sens —
  // ten test POTRZEBUJE dużego, częściowo zbuforowanego materiału.
  // Stąd większy budżet zamiast usuwania zależności; właściwe domknięcie
  // (bramka CHECK_REMOTE_MEDIA) = Etap 7.
  test.slow(); // 30 s → 90 s: samo podniesienie asercji nic by nie dało

  test("zacięcie w trakcie zapala plakietkę „ładuję”, start ją gasi", async ({
    page,
    isMobile,
  }) => {
    const entry = VIDEO_ENTRY!;
    const videoIdx = entry.gallery.findIndex((g) => g.type === "video");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await showEntry(page, entry.slug));

    // dojazd do kadru wideo: desktop strzałkami, mobile przewinięciem toru
    if (!isMobile) {
      for (let i = 0; i < videoIdx; i++) {
        await detail.locator("[data-nextshot]").click();
      }
    }
    const kadr = detail.locator("[data-gal] [data-slide]").nth(videoIdx);
    await kadr.scrollIntoViewIfNeeded();
    await settle(page, 500);
    await kadr.click();

    const lb = detail.locator("[data-lightbox]");
    await expect(lb).toBeVisible();
    const slajd = lb.locator(".lb-slide").nth(videoIdx);
    // film startuje sam (autoplay w geście usera) — czekamy na `playing`.
    // 40 s, nie 15: to jedyna asercja w zestawie czekająca na pobranie
    // 13,4 MB z zewnętrznego CDN-u (uzasadnienie w nagłówku describe).
    await expect(slajd).toHaveClass(/is-playing/, { timeout: 40_000 });
    await expect(slajd).not.toHaveClass(/is-loading/);

    // ZACIĘCIE: własne `waiting` na elemencie media. Czas do zapłonu
    // mierzymy W PRZEGLĄDARCE (MutationObserver), a nie asercją
    // „jeszcze nie ma" — ta ścigałaby się z timerem 400 ms i pod
    // obciążeniem runnera potrafi przegrać (złapane w pierwszym
    // przebiegu tego testu: zielony w izolacji, czerwony w komplecie).
    const zaplon = await slajd.evaluate(
      (el: HTMLElement) =>
        new Promise<number>((res) => {
          const t0 = performance.now();
          const obs = new MutationObserver(() => {
            if (!el.classList.contains("is-loading")) return;
            obs.disconnect();
            res(performance.now() - t0);
          });
          obs.observe(el, { attributes: true, attributeFilter: ["class"] });
          el.querySelector("video")!.dispatchEvent(new Event("waiting"));
          window.setTimeout(() => {
            obs.disconnect();
            res(-1);
          }, 5000);
        }),
    );
    // wskaźnik zapala się DOPIERO po progu — bez tego migałby na
    // szybkim łączu; tolerancja na rozdzielczość timera
    expect(zaplon).toBeGreaterThanOrEqual(VIDEO_LOADING_DELAY_MS - 60);
    await expect(slajd).toHaveClass(/is-loading/);
    // stany są rozłączne — inaczej `.is-playing` schowałoby plakietkę
    await expect(slajd).not.toHaveClass(/is-playing/);

    const hint = slajd.locator("[data-cam-hint]");
    await expect(hint).toBeVisible();
    // kapitaliki robi text-transform (design), stąd wersaliki w asercji.
    // Kropki rysuje ::before, więc innerText ich NIE widzi — liczymy je
    // osobno jako elementy (animuje je CSS delayem, nie JS).
    await expect(hint).toHaveText("POCZEKAJ, ŁADUJĘ WIDEO", {
      useInnerText: true,
    });
    await expect(slajd.locator(".dt-dots b")).toHaveCount(3);

    // START: własne `playing` — plakietka dopala minimalny czas
    // widoczności i dopiero potem ustępuje miejsca stanowi „gra"
    const dogaszanie = await slajd.evaluate(
      (el: HTMLElement) =>
        new Promise<number>((res) => {
          const t0 = performance.now();
          const obs = new MutationObserver(() => {
            if (!el.classList.contains("is-playing")) return;
            obs.disconnect();
            res(performance.now() - t0);
          });
          obs.observe(el, { attributes: true, attributeFilter: ["class"] });
          el.querySelector("video")!.dispatchEvent(new Event("playing"));
          window.setTimeout(() => {
            obs.disconnect();
            res(-1);
          }, 5000);
        }),
    );
    // plakietka nie gaśnie natychmiast — dopala minimalny czas
    // widoczności, żeby nie mrugnęła (film w tym czasie już gra)
    expect(dogaszanie).toBeGreaterThan(0);
    await expect(slajd).toHaveClass(/is-playing/);
    await expect(slajd).not.toHaveClass(/is-loading/);
    await expect(hint).toBeHidden();
  });

  test("pauza wraca do podpowiedzi, a nie do wskaźnika", async ({
    page,
    isMobile,
  }) => {
    const entry = VIDEO_ENTRY!;
    const videoIdx = entry.gallery.findIndex((g) => g.type === "video");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await showEntry(page, entry.slug));
    if (!isMobile) {
      for (let i = 0; i < videoIdx; i++) {
        await detail.locator("[data-nextshot]").click();
      }
    }
    const kadr = detail.locator("[data-gal] [data-slide]").nth(videoIdx);
    await kadr.scrollIntoViewIfNeeded();
    await settle(page, 500);
    await kadr.click();

    const lb = detail.locator("[data-lightbox]");
    const slajd = lb.locator(".lb-slide").nth(videoIdx);
    await expect(slajd).toHaveClass(/is-playing/, { timeout: 40_000 });
    await slajd.locator("video").evaluate((v: HTMLVideoElement) => {
      v.pause();
    });
    await expect(slajd).not.toHaveClass(/is-playing/);
    await expect(slajd).not.toHaveClass(/is-loading/);
    await expect(slajd.locator("[data-cam-hint]")).toBeVisible();
    await expect(slajd.locator("[data-cam-hint]")).toHaveText(
      isMobile ? "STUKNIJ, ABY OBEJRZEĆ" : "KLIKNIJ, ABY OBEJRZEĆ",
      { useInnerText: true },
    );
  });
});

// ── detal mobile: bottom sheet, karuzela, gesty ──
test.describe("detal mobile: bottom sheet, karuzela, gesty", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("tap w kafel otwiera sheet; X i Esc zamykają, host czyszczony", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const card = await revealFirstCard(page);
    const name = await card.getAttribute("data-work-name");
    const detail = await openDetail(page, card);

    await expect(detail.locator(".dt-title")).toHaveText(name ?? "");
    // desktopowy dt-head schowany; sheet ma własny X
    await expect(detail.locator(".dt-head")).toBeHidden();
    await detail.locator(".dt-xm").click();
    await expect(detail).toBeHidden();
    await expect(detail.locator(".dt-title")).toHaveCount(0);

    await openDetail(page, card);
    await page.keyboard.press("Escape");
    await expect(detail).toBeHidden();
  });

  test("tap w kadr → podgląd (contain, licznik na dolnym pasie); chevron wraca na oglądany kadr", async ({
    page,
  }) => {
    const shots = ENTRIES[0].gallery.length;
    test.skip(shots < 2, "pierwszy wpis ma jeden kadr");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));
    const lb = detail.locator("[data-lightbox]");

    await detail.locator("[data-slide]").first().click();
    await expect(lb).toBeVisible();
    // chrome mobile: chevron-wstecz jest, X i pasek strzałek desktopu nie
    await expect(lb.locator(".lb-back")).toBeVisible();
    await expect(lb.locator(".lb-x")).toBeHidden();
    await expect(lb.locator("[data-lb-count]").first()).toHaveText(
      `01 / ${pad(shots)}`,
    );
    // E7a: kadr contain na czerni także na mobile
    expect(
      await lb.evaluate((el) => {
        const media = el.querySelector(".lb-media img, .lb-media video");
        return media ? getComputedStyle(media).objectFit : null;
      }),
    ).toBe("contain");

    // swipe (programowo: scroll toru o szerokość ekranu) przełącza kadr
    await lb.locator("[data-lb-track]").evaluate((el) => {
      el.scrollTo({ left: el.clientWidth, behavior: "instant" });
    });
    await expect(lb.locator("[data-lb-count]").first()).toHaveText(
      `02 / ${pad(shots)}`,
    );

    // chevron zamyka TYLKO podgląd; galeria wraca na oglądany kadr
    await lb.locator(".lb-back").click();
    await expect(lb).toBeHidden();
    await expect(detail).toHaveClass(/is-open/);
    await expect(detail.locator("[data-shotcount]")).toHaveText(
      `02 / ${pad(shots)}`,
    );

    // wyraźny swipe-down również zamyka podgląd
    await detail.locator("[data-slide]").nth(1).click();
    await expect(lb).toBeVisible();
    const vw = page.viewportSize()!;
    const cx = vw.width / 2;
    await page.mouse.move(cx, vw.height * 0.4);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(cx, vw.height * 0.4 + i * 22);
    }
    await page.mouse.up();
    await expect(lb).toBeHidden();
    await expect(detail).toHaveClass(/is-open/);
  });

  test("kamera w podglądzie mobile siedzi w lewym dolnym rogu (nie nachodzi na chevron)", async ({
    page,
  }) => {
    test.skip(!VIDEO_ENTRY, "brak wpisu z wideo w kolekcji");
    const entry = VIDEO_ENTRY!;
    const videoIdx = entry.gallery.findIndex((g) => g.type === "video");
    await gotoReady(page, PATH);
    const card = page.locator(`.wk-grid [data-work-slug="${entry.slug}"]`);
    // wpis z wideo może leżeć poza pierwszym krokiem „pokaż więcej"
    while (await card.isHidden()) {
      await page.locator("[data-more]").click();
    }
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const detail = await openDetail(page, card);

    // dojazd karuzeli do kadru wideo i tap → podgląd z grającym filmem
    await detail.locator("[data-track]").evaluate((el, idx) => {
      const track = el as HTMLElement;
      const slide = track.children[idx] as HTMLElement;
      track.scrollTo({
        left: slide.offsetLeft - track.offsetLeft,
        behavior: "instant",
      });
    }, videoIdx);
    await settle(page, 400);
    await detail.locator("[data-slide]").nth(videoIdx).click();
    const lb = detail.locator("[data-lightbox]");
    await expect(lb).toBeVisible();

    // pauza (tap w film) pokazuje ikonkę kamery
    await lb.locator("video").click();
    const cam = lb.locator("[data-cam]");
    await expect(cam).toBeVisible();
    const camBox = await cam.boundingBox();
    const backBox = await lb.locator(".lb-back").boundingBox();
    const vh = page.viewportSize()!.height;
    // dolna połowa ekranu, zero przecięcia z chevronem wyjścia (korekta
    // Mateusza — w lewym górnym rogu ikonka wchodziła pod chevron)
    expect(camBox!.y).toBeGreaterThan(vh / 2);
    expect(camBox!.y).toBeGreaterThan(backBox!.y + backBox!.height);
  });

  test("karuzela galerii: gotchas toru + licznik ze scrolla", async ({
    page,
  }) => {
    const shots = ENTRIES[0].gallery.length;
    test.skip(shots < 2, "pierwszy wpis ma jeden kadr");
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    const track = detail.locator("[data-track]");
    // gotcha karuzel (sections.md): scroll-snap-stop: always
    await expect(track.locator("[data-slide]").first()).toHaveCSS(
      "scroll-snap-stop",
      "always",
    );

    // kreski-wskaźniki: renderowane tylko przy galerii ≤ próg (korekta
    // Mateusza — dłuższy rząd przestałby się mieścić, zostaje licznik)
    const dashes = detail.locator("[data-dashes] [data-shot]");
    await expect(dashes).toHaveCount(
      shots <= WORK_GALLERY_DASHES_MAX ? shots : 0,
    );

    // przewinięcie toru o kafel (szerokość + gap 10 — stała zaszyta
    // też w JS open-detail) przestawia licznik I kreski (korekta
    // Mateusza — scroll aktualizował tylko tekst licznika)
    await track.evaluate((el) => {
      const slide = el.children[0] as HTMLElement;
      el.scrollTo({ left: slide.offsetWidth + 10, behavior: "instant" });
    });
    await expect(detail.locator("[data-shotcount]")).toHaveText(
      `02 / ${pad(shots)}`,
    );
    if (shots <= WORK_GALLERY_DASHES_MAX) {
      await expect(dashes.nth(1)).toHaveClass(/on/);
      await expect(dashes.nth(0)).not.toHaveClass(/on/);
    }
  });

  test("swipe-down za uchwyt zamyka sheet (gest overlay.ts)", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));

    const grab = detail.locator("[data-overlay-drag]");
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

    await expect(detail).toBeHidden();
  });

  test("swipe-down DOTYKIEM zamyka sheet z treści (a nie tylko myszą)", async ({
    page,
    browserName,
  }) => {
    // Mysz NIE odtwarza tej ścieżki: przeglądarka przerywa strumień
    // pointerów, gdy uzna gest za przewijanie. Zdarzenia dotykowe idą
    // przez CDP — ten sam tor co palec (dostępne tylko w chromium).
    test.skip(
      browserName !== "chromium",
      "Input.dispatchTouchEvent — chromium",
    );
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));
    const box = await detail.locator(".dt-txt").boundingBox();
    expect(box).not.toBeNull();

    const cdp = await page.context().newCDPSession(page);
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let i = 1; i <= 12; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + i * 22 }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });

    await expect(detail).toBeHidden();
  });

  test("swipe-down w treści NIE zamyka, gdy sheet jest przewinięty niżej", async ({
    page,
  }) => {
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));
    const body = detail.locator("[data-overlay-scroll]");
    await body.evaluate((el) => el.scrollTo({ top: 220, behavior: "instant" }));
    await expect
      .poll(async () => body.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);

    const box = await detail.locator(".dt-about").boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const y = box!.y + 10;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x, y + i * 25);
    await page.mouse.up();

    await expect(detail).toBeVisible();
  });

  test("tap w scrim (pas nad sheetem) zamyka", async ({ page }) => {
    await gotoReady(page, PATH);
    const detail = await openDetail(page, await revealFirstCard(page));
    // sheet ma 90% — pas u samej góry to tło nakładki
    const vw = page.viewportSize()!;
    await page.mouse.click(vw.width / 2, 4);
    await expect(detail).toBeHidden();
  });
});

// ── tło panelu detalu (korekta Mateusza): papier pod CAŁĄ scrollowaną
// treścią — background-attachment: local przypina teksturę do treści
// scrollera (eksportowa warstwa absolute kryła tylko pierwszy ekran) ──
test("papier w detalu jedzie z treścią przez całą wysokość scrolla", async ({
  page,
}) => {
  await gotoReady(page, PATH);
  const detail = await openDetail(page, await revealFirstCard(page));
  const bg = await detail.locator("[data-overlay-scroll]").evaluate((el) => ({
    image: getComputedStyle(el).backgroundImage,
    attachment: getComputedStyle(el).backgroundAttachment,
  }));
  expect(bg.image).toContain("paper-background");
  expect(bg.attachment).toBe("local, local");
});

// ── dryf tła papieru (PaperBackdrop — od 4.3 wspólny ze stroną
// główną): tekstura płynie w 0.85 tempa treści; pętla work-motion.ts ──
test("tło papieru dryfuje wolniej niż treść (desktop)", async ({
  page,
  isMobile,
}) => {
  test.skip(
    !!isMobile,
    "dryf tła jest desktop-only — mobile scrolluje 1:1 z treścią (eksport)",
  );
  await gotoReady(page, PATH);
  await page.evaluate(() => window.scrollTo(0, 600));
  await settle(page, 350);
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

// ── kontrakty progów (sections.md: stała + @media w parze) ──
test("próg desktopowy: warianty przełączają się dokładnie na WORK_DESKTOP_MIN_PX", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "kontrakt progu — jeden profil desktop (test sam zmienia szerokość)",
  );
  await gotoReady(page, PATH);
  // elementy per próg dostępne bez otwierania nakładki: uchwyt sheeta
  // i projnav (overlay w DOM; computed display liczy się z ich reguł)
  // oraz pill hover kafla (desktop-only)
  await expectBreakpointFlip(
    page,
    WORK_DESKTOP_MIN_PX,
    {
      grab: "#work-detail .dt-grab",
      projnav: "#work-detail .dt-projnav",
      pill: ".wk-grid .tile-see",
    },
    { grab: "flex", projnav: "none", pill: "none" },
    { grab: "none", projnav: "block", pill: "grid" },
  );
});

test("drugi próg: siatka 1 → 2 kolumny dokładnie na WORK_GRID_TWO_COL_MIN_PX", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "kontrakt progu — jeden profil (test sam zmienia szerokość)",
  );
  await gotoReady(page, PATH);
  const cols = () =>
    page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector(".wk-grid")!,
        ).gridTemplateColumns.split(" ").length,
    );
  const height = page.viewportSize()?.height ?? 900;
  await page.setViewportSize({ width: WORK_GRID_TWO_COL_MIN_PX - 1, height });
  await settle(page, 150);
  expect(await cols(), "1 kolumna pod progiem").toBe(1);
  await page.setViewportSize({ width: WORK_GRID_TWO_COL_MIN_PX, height });
  await settle(page, 150);
  expect(await cols(), "2 kolumny od progu").toBe(2);
});
