// Strona główna (Etap 4.2) — regres wizualny: widok startowy (hero +
// przezroczysty pasek) i pełna strona na 6 profilach.
//
// Strażnik useVisualFixtureGuard (od 4.3 — wspólny): zajawka 02 czyta
// kolekcję realizacji (analiza H1), więc build pod testem MUSI
// pochodzić z `pnpm build:visual` (zamrożony fixture: 5 wpisów →
// „JESZCZE 2"); strażnik liczy <template data-work-detail> na
// /realizacje/, które widok 4.3 wreszcie renderuje. Okładki kart na
// preview to znany 404 transformacji Cloudflare — kafle renderują się
// jako ciemne karty z tekstem (deterministyczne; wzorzec delung).
//
// Determinizm: prepareSweep (freeze.css zeruje animacje CZASOWE, więc
// klasa .in sadza reveale/rysowanie od razu w stanach końcowych;
// eager+decode zdjęć). Reveale odpala IntersectionObserver na scrollu
// dokumentu — zrzut fullPage NIE scrolluje (captureBeyondViewport), więc
// przed nim robimy PRZEJAZD przez całą stronę z krokiem i settle
// (za szybki przelot gubi wpisy IO — zmierzone przy budowie widoku).
// Transformy parallaxu liczy pętla rAF przy każdej pozycji przejazdu —
// stała lista kroków ⇒ ten sam stan końcowy w każdym przebiegu.
// NIE emulujemy prefers-reduced-motion (bramka js-motion = martwa strona).
import { expect, test } from "@playwright/test";
import { useVisualFixtureGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
// revealSweep WSPÓLNY (utwardzony w PR /ekipa-eha/ — pełne settle na
// dole, dociśnięcie maruderów IO scrollem WYŁĄCZNIE dokumentu,
// wymuszony przemalunek rAF po powrocie): lokalna kopia bez tych
// zabezpieczeń przegrywała loterię IntersectionObservera na wolnym
// webkit-CI (index-full 10–42k px różnicy przy nieodpalonych
// revealach — incydent 2026-08-25).
import { prepareSweep, revealSweep } from "../helpers/visual";

useVisualFixtureGuard();

const PATH = "/";

/** Tolerancja pikselowa zrzutu `index-full` (decyzja Mateusza przy
 *  poprawkach wizualnych po 4.6 — kandydat odkładany od 4.5 cz. 2).
 *  Do tej pory `index-full.png` był JEDYNYM zrzutem fullPage w projekcie
 *  BEZ per-shot progu: jechał na globalnym 0.0005, podczas gdy wszystkie
 *  pozostałe fullPage mają 0.001–0.0025. Skutek: ten jeden zrzut
 *  regularnie świecił na czerwono na webkit-iphone-se przy różnicach
 *  rzędu 0.0008–0.0015, których żaden inny widok by nie zgłosił —
 *  kosztowało to trzy sesje diagnostyczne (4.5 cz. 2, PR polityki,
 *  poprawki po 4.6).
 *  Źródła szumu są dwa i oba są NIEWIZUALNE: (1) subpikselowy szum
 *  resamplingu WebKita przy dpr=2 na krawędziach detalu ZDJĘĆ
 *  (rozsyp 1–6 px na wiersz); (2) zaokrąglenie rastra przy dpr=2, które
 *  potrafi przesunąć pojedyncze wiersze tekstu o 1 px, gdy geometria
 *  zmieni się o setne części piksela (przy tej zmianie: 0,016 px na
 *  wysokości logo stojącego na podłodze 80 px — jedyny taki przypadek
 *  w serwisie, SE).
 *  Wartość 0.0025 = ta sama klasa co `*-full-open` w kompetencjach
 *  i tradycji. Realna regresja layoutu na tej stronie to DZIESIĄTKI
 *  tysięcy px (0.02–0.05), więc próg jej nie przepuści; globalny
 *  0.0005 w playwright.config.ts zostaje NIETKNIĘTY.
 *
 *  ETAP 5 — podniesienie 0.0025 → 0.006 (decyzja Mateusza). Objaw:
 *  9923 px = 0.00435 na webkit-iphone-se w CI. Rozpoznanie (pełny
 *  łańcuch w CLAUDE.md): render `/` z buildu gałęzi i z buildu
 *  origin/main na tej samej maszynie jest identyczny CO DO PIKSELA
 *  (0 różnic), actual z CI jest bajt-w-bajt równy zrzutowi z workflow
 *  baseline'ów (więc to nie losowy flake), a poprzednie CI na main
 *  było z tym baseline'em ZIELONE (więc baseline nie jest
 *  przeterminowany). W paśmie różnicy tekst stoi piksel w piksel —
 *  przesuwa się WYŁĄCZNIE zdjęcie w tle, czyli pętla parallaxu
 *  [data-plx] osiadła na innej klatce przy zszywaniu fullPage.
 *  Punkt osiadania zależy od obciążenia, a to zmienia się przy KAŻDEJ
 *  zmianie składu zestawu wizualnego (tu: zniknął skeleton.spec.ts,
 *  doszedł kontakt.spec.ts → inny przydział na 4 workerów). Próg
 *  pokrywa całą tę klasę, zachowując 3–8× zapasu do realnej regresji.
 *  Lekarstwo strukturalne (zamrożenie transformów [data-plx] przed
 *  zrzutem fullPage w revealSweep) unieważniłoby baseline'y wszystkich
 *  widoków z kadrami — kandydat na Etap 6, nie na ten PR.
 *
 *  POPRAWKI KLIENTA — podniesienie 0.006 → 0.008 (decyzja Mateusza),
 *  tym razem z POLICZONYM SUFITEM KLASY, a nie z szacunku. Objaw:
 *  15 604 px = 0.00622 na webkit-iphone-14 w CI, przy limicie 15 055 —
 *  przekroczenie o 549 px (3,6 %). Rozpoznanie z artefaktu CI: surowa
 *  różnica 158 521 px w DWÓCH zwartych pasmach, y 3699–3956
 *  (258 wierszy) i y 4574–4781 (208 wierszy); w obu tekst, kropki osi
 *  i mono-podpisy stoją PIKSEL W PIKSEL, przesuwa się wyłącznie
 *  zdjęcie w tle.
 *  SUFIT: `/` ma na mobile DOKŁADNIE DWA kadry [data-plx] o wysokości
 *  258 i 209 px — czyli te same 258 i 208 wierszy, które widać
 *  w diffie. Razem 467 px na 6434 px dokumentu = 7,3 % strony;
 *  pozostałe 92,7 % to tekst zablokowany co do piksela. Ta klasa NIE
 *  MOŻE więc przekroczyć ratio 0.0726 surowo, a że Playwright liczy
 *  PERCEPCYJNIE (~10× łagodniej — zmierzone: surowe 0.0632 → zgłoszone
 *  0.00622), sufit percepcyjny wynosi ≈ 0.0071. Próg 0.008 leży
 *  POWYŻEJ sufitu, więc pokrywa całą klasę; realna regresja layoutu na
 *  `/` to 0.10–0.27 (zmierzone w tej sesji na tym samym zrzucie), czyli
 *  12–34× wyżej. Globalny 0.0005 w playwright.config.ts NIETKNIĘTY.
 *  Przesłanka odkładająca lekarstwo strukturalne PRZESTAŁA
 *  OBOWIĄZYWAĆ: jedyne zrzuty *-full* poza regeneracją tej sesji to
 *  `polityka-full` (zero [data-plx] — pilnuje tego kontrakt e2e)
 *  i `work-detail-fullscreen` (zrzut lightboxa), więc zamrożenie
 *  parallaxu unieważnia dziś wyłącznie baseline'y i tak przepisywane.
 *  Wchodzi OSOBNYM PR-em po merge'u tego. */
const FULLPAGE_MAX_DIFF_RATIO = 0.008;

test("strona główna: widok startowy (hero + pasek) vs baseline", async ({
  page,
}) => {
  await prepareSweep(page, PATH);
  // Mikro-scroll tam i z powrotem: WebKit trzyma warstwę paska fixed
  // w niższej rasteryzacji do pierwszego przemalowania (wzorzec delung).
  await scrollPageTo(page, 10);
  await scrollPageTo(page, 0);
  await settle(page, 300);
  await expect(page).toHaveScreenshot("index-top.png");
});

test("strona główna: pełna strona vs baseline", async ({ page }) => {
  await prepareSweep(page, PATH);
  await revealSweep(page);
  // Maska wideo = kontrakt speców visual (dziś na `/` wideo nie ma;
  // zostaje, żeby przyszła zmiana treści nie musiała jej „pamiętać").
  const mask = [page.locator("video"), page.locator(".dt-poster")];
  await expect(page).toHaveScreenshot("index-full.png", {
    fullPage: true,
    mask,
    maxDiffPixelRatio: FULLPAGE_MAX_DIFF_RATIO,
  });
});
