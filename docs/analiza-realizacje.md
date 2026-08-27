# Analiza portu: `/realizacje/` (Etap 4.3)

Referencja: `docs/design/export/realizacje.html` (przeglądana z dysku,
mobile 390 / desktop 1440; breakpoint 1024, drugi próg 700 w siatce).
Eksport = referencja WYGLĄDU I ZACHOWANIA — jego podwójne drzewa,
`sc-if`/`sc-for`, scroll w kontenerze `fixed`, mnożniki `--k`/`--w`/cqw
to artefakty Claude Design i nie wchodzą do kodu. Port: SSR + `@media`
przy stałych z `work-config.ts` + `clamp()`. Mechanizm detalu/lightboxa/
wideo = istniejąca kopia delung (overlay.ts / open-detail.ts /
WorkDetailOverlay / WorkDetail) — PORT SKINU, architektura bez zmian.

## 1. Odczyty z eksportu

### Nagłówek strony

- Kicker `REALIZACJE` (mono 10 px, letter-spacing .2em, zieleń
  rgba(87,101,74,.95)), h1 „Nasze realizacje" (serif 500), lead
  „Nie jesteśmy odtwórcami – jesteśmy technologami tradycji. …".
- Mobile: kolumna (gap 13 px), padding 104 px góry (u nas: `--hdr-h` +
  odstęp), kolumna max 700 px / padding 30 px; rycina `dom-ryc-house8`
  za prawą krawędzią (right −54, top 82, szer. 190, opacity .16,
  multiply) — rysowana maską (`ryc-r`) + parallax `plxr` (±15 px).
  Kicker/h1/lead to reveale `.rev` z kaskadą d1/d2.
- Desktop: grid 1fr 1fr wyrównany do dołu — lewa kolumna kicker+h1,
  prawa lead (max ~578 px); rycina house8 statyczna (opacity .15,
  multiply) przy prawej krawędzi; bez revealów (desktop eksportu
  statyczny — spójnie z 4.2).

### Siatka kafli

- Kafel: kadr 4:3, zdjęcie cover z filtrem `sepia(.16) saturate(.88)`,
  gradient (rgba(24,19,14,.15) 0 → 0 28% → .55 62% → .9 100%), w prawym
  górnym rogu „lupa w narożnikach kadru" 38 px (8 gradientów 11×1 px +
  szkło z plusem — wzór przeniesiony już w 4.2 do zajawki `re-lens`),
  na dole meta `MIEJSCE · ROK` (mono 10 px, .16em, krem .86, cień) +
  tytuł (serif 500 25 px/1.16, krem).
- Mobile: kolumna 1 → **2 kolumny od 700 px** (`gridCols: w >= 700`),
  gap 16 px, kontener max 700 px / padding 26 px; lupa widoczna zawsze;
  kadry z parallaxem `.plx` (zapas i ruch ~±10 % wysokości kadru).
- Desktop: 2 kolumny, gap poziomy clamp(20…31), pionowy ~3.3 vh,
  kontener max 1600 px / padding `--g`; lupa + przyciemnienie
  rgba(24,19,14,.42) + pill „ZOBACZ REALIZACJĘ" (obrys kremowy,
  backdrop-blur) **na hover**, zdjęcie skaluje się śladowo (1.005).

### Paginacja (E5)

- Desktop: wyśrodkowany rząd kwadratów clamp(40…49) px — bieżąca strona
  wypełniona `#26221B`/krem, pozostałe obrys rgba(33,29,24,.28), obok
  strzałka `→` (zieleń) z odstępem; eksport pokazuje **6 kafli**
  i atrapę „1 2 3 →" (bez logiki).
- Mobile: przycisk pełnej szerokości „Pokaż więcej realizacji" +
  strzałka ↓, obrys rgba(87,101,74,.55), zieleń, padding 16/20;
  w eksporcie martwy (bez logiki), widoczny pod 6 kaflami.

### Detal — modal desktop

- Wymiary: szerokość `min(1260px, max(720px, 100vw − 180px))`,
  wysokość 86 vh, wyśrodkowany; podział **57 % zdjęcie / 43 % treść**;
  cień 0 24px 70px rgba(16,12,8,.45); wejście: opacity 0→1 +
  lift 8 px, ~0.22 s.
- Tło pod modalem: blur 1.5 px + warstwy `#FAF7F1` .36 / papier .086 /
  `#241E17` .216 (≈ ciepły szary ~50 %).
- Kadr: zdjęcia przełączane przejazdem poziomym (w eksporcie warstwy
  A/B translateX — mechanicznie równoważne torowi translateX delung);
  dolny gradient 180 px (→ .6); licznik `01 / 04` (mono, krem .9)
  w lewym dolnym rogu; strzałki kadru = **kwadraty 52 px** (obrys krem
  .5, hover wypełnienie krem .16) w prawym dolnym rogu. Bez dashes.
- Treść (papier + tekstura): X 44 px (kwadrat na papierze, obrys
  rgba(33,29,24,.12)) w prawym górnym rogu; rycina `dom-ryc-house1`
  (opacity .12, multiply) za prawą krawędzią; meta
  `MIEJSCE — ROK` (mono, zieleń, kreska 16 px między), tytuł serif,
  akapity (sans, #5F574A, 1.78), sekcja `PARAMETRY` (nagłówek mono
  zieleń + linia) z wierszami „etykieta … kropkowany wypełniacz …
  wartość mono", na końcu blok CTA za linią: kicker „CHCESZ WIĘCEJ
  INFORMACJI?" + ciemny przycisk „Skontaktuj się z nami →".
- Projnav: kwadraty 52 px przy krawędziach ekranu (left/right 19 px),
  obrys krem .5, tło krem .16, hover `#E3DECF` + atrament; karta
  odjeżdża za krawędź, następna wjeżdża zza przeciwnej (= istniejący
  przejazd open-detail.ts).
- Klawiatura eksportu: Esc zamyka, ←/→ przełącza kadry galerii.

### Detal — sheet mobile

- Wysokość **90 %**, promień 20 px góry, grabber 40×4 px
  rgba(33,29,24,.22), X 38 px (papier .94 + obrys) right 14/top 16,
  scrim rgba(24,19,14,.55) + blur 1.5 px; strefa chwytu ~46 px,
  swipe-down zamyka (u nas gest overlay.ts — bez zmian).
- Treść: nagłówek (meta zieleń + tytuł serif 29 px, rycina house1
  .13 multiply za prawą krawędzią), **karuzela 4:3** — slajdy
  `flex: 0 0 300px`, gap 10 px, `scroll-snap-type: x mandatory`,
  scroll-padding/padding 24 px (licznik eksportu liczy `scrollLeft/310`
  = szerokość+gap — zgadza się z zaszytym w open-detail
  `offsetWidth + 10`); pod torem rząd kresek-wskaźników (aktywna
  16×2 px zieleń, reszta 8×2 px rgba(33,29,24,.2)) + licznik `01 / 04`;
  akapity; tabela PARAMETRY jak w modalu.
- Stopka sheeta: pas `#F1ECE0` (border-top + cień) przyklejony do dołu
  panelu — kicker + ciemny przycisk pełnej szerokości.
- Wideo w karuzeli: kółko 40 px rgba(12,10,8,.55) z kamerą (lewy górny
  róg) + badge `STUKNIJ, ABY OBEJRZEĆ` (prawy górny, tło rgba(12,10,8,.55),
  mono 9 px .09em).

### Lightbox i wideo

- Eksport **nie ma podglądu pełnoekranowego ani flow wideo** — wchodzą
  w całości z mechaniki delung z adaptacjami E7/E8:
  E7a kadr = całe zdjęcie `object-fit: contain` na czarnym pełnym
  ekranie (bez ramy 330/412; licznik mobilny na stały dolny pas;
  wideo też `contain`), E7b klawiatura ←/→ w podglądzie ORAZ w galerii
  detalu na desktopie (Esc-hierarchia bez zmian: podgląd → detal).
  E8: `preload="none"`, `playsinline`, bez `controls`, `[data-cam]` +
  `[data-cam-hint]` (oba warianty tekstu w SSR, przełącza @media),
  tap w kadr startuje film i otwiera podgląd z grającym klipem,
  w podglądzie tap = pauza↔play, miniatura = klatka ze środka
  (`videoFrameAt`) — od korekty po produkcji JEDNĄ drogą jako
  `<img.dt-poster>`, bez atrybutu `poster` (patrz §2a).

### CTA + stopka

- Przed stopką pas `#241E17` ze zdjęciem `plac-budowy-photo3`
  (grayscale, opacity .55) + gradient; h2 serif „Twój dom może być
  naszą kolejną realizacją" + jasny przycisk „Skontaktuj się z nami →"
  (`#ECE8DD`). Mobile: min-height 290, kolumna przy dole, zdjęcie
  z parallaxem `.plx`, h2/przycisk to reveale; desktop: wysokość
  clamp(300…440), rząd (h2 lewo, przycisk prawo), gradient 90°.
- Stopka = chrome 4.1 (brak stopki w mobilnej wersji eksportu tras
  bywał niedoróbką — E14; tu wchodzi komponent Footer bez zmian).

## 2. Decyzje portu (jawne rozstrzygnięcia)

1. **Rozmiar strony paginacji desktop = 4** i **krok „pokaż więcej"
   mobile = 4** — świadome ODSTĘPSTWO od eksportu (pokazywał 6 kafli
   i atrapę „1 2 3 →"; decyzja Mateusza z korekt 4.3). Stałe
   `WORK_PAGE_SIZE` / `WORK_MOBILE_STEP` w `work-config.ts` (importują
   je widok i testy — zmiana liczby to jedna stała).
2. **Paginacja = czysty progressive enhancement (E5):** SSR renderuje
   WSZYSTKIE kafle i WSZYSTKIE `<template data-work-detail>`; kontrolki
   (paginacja / „pokaż więcej") są w SSR z atrybutem `hidden` —
   odsłania je dopiero JS (i tylko gdy wpisów jest więcej niż strona/
   krok). JS jedynie nadaje kaflom `hidden`. Bez JS = pełna lista,
   zero martwych kontrolek. Zmiana strony przewija do początku siatki
   (smooth przy motion OK), „pokaż więcej" nie przewija (dokłada pod
   spodem). Przejście przez próg 1024 resetuje stan do strony 1 /
   pierwszego kroku (stan per tryb nie ma sensu między układami).
3. **Projnav i licznik `REALIZACJA NN / NN` dostają kontekst PEŁNEJ
   listy** (potwierdzenie zapisu instrukcji/§6.3 analizy wejściowej) —
   `setDetailContext(wszystkie wpisy po order)` raz, niezależnie od
   widocznej strony. Detal otwarty z 6. kafla strony 1 pozwala
   projnavem dojechać do wpisu ze strony 2 — lista jest płaska (E5),
   paginacja to tylko dawkowanie siatki.
4. ⚠️ **UNIEWAŻNIONE 2026-08-27** (sesja poprawek wizualnych przed
   Etapem 6, decyzja Mateusza): karty zajawki 02 OTWIERAJĄ detal
   w miejscu — dokładnie tak, jak `/realizacje/` i jak delung. Zapis
   poniżej opisuje stan sprzed tej zmiany i zostaje wyłącznie jako
   ślad rozumowania. Szczegóły portu i gotcha o kontekście układania
   `main.home`: wpis „Poprawki wizualne przed Etapem 6" w `CLAUDE.md`
   oraz sekcja Work w `.claude/rules/sections.md`.
   ~~**Karty zajawki 02 strony głównej NIE dostają deep-linków do
   detalu** — zostają płaskie linki na `/realizacje/` (stan z 4.2).~~
   Powody: design nie pokazuje wejścia z home wprost w detal; detal
   wymaga JS (deep-link `#slug` bez JS byłby martwy — gorszy stan niż
   nawigacja na listę); wejście na listę pokazuje pełne portfolio.
   Gdyby Mateusz chciał inaczej — dopisanie obsługi
   `location.hash` na `/realizacje/` to ~10 linii, decyzja odwracalna.
5. **Kafel zostaje `<button>`** (wzorzec delung): bez JS klik nie robi
   nic, lista jest kompletna — degradacja zgodna z E5/instrukcją
   („detal jako degradacja wg wzorca delung").
6. **Licznik `[data-projcount]` zostaje** (mechanizm + realna wartość
   informacyjna), dyskretnie w wierszu nad meta treści modala (mono,
   `--faint`) — eksport go nie pokazuje, ale nie koliduje ze skinem;
   na mobile ukryty (jak w delung). Analogicznie **badge czasu
   `dt-time` zostaje** (desktop, dyskretny).
7. **Bez linku `dt-more`** („Zobacz wszystkie realizacje" w stopce
   detalu delung) — użytkownik detal otwiera Z listy, a design ma
   w tym miejscu blok „CHCESZ WIĘCEJ INFORMACJI?".
8. **Dashes galerii modala schowane na desktopie** (design: licznik +
   strzałki; kreski-wskaźniki żyją na mobile pod karuzelą). Markup
   `data-dashes` zostaje (mechanizm), decyduje CSS.
9. **Galerie bez zapętlenia** (mechanika delung: `disabled` na
   krańcach) — eksport zapętlał modulo, ale E7 mówi „mechanika delung
   1:1", a czytelne krańce > pętla. Projnav (między realizacjami)
   zapętla się jak w delung — bez zmian.
10. **Parallax kadrów kafli = istniejący `[data-tilepar]`**
    (work-motion.ts, ±35 px przy zapasie 70 px — D-U1 spełnione
    w pikselach). Eksportowe ±10 % wysokości kadru ≈ ±29 px przy 390 px
    — różnica niezauważalna, mechanizm już przetestowany. Parallax
    zdjęcia CTA: ten sam mechanizm (zapas 70 px w CSS kadru).
11. **Ruch strony za bramką `html.js-motion`** (wzorzec 4.2):
    `work-motion.ts` rozszerzony o rysowanie rycin `[data-ryc]`
    (mobile, maska z index.astro przeniesiona jako wspólny wzorzec
    do stylów widoku) i parallax `[data-plxr]` ±15 px; reveale
    `[data-rev]` już są. Desktop bez revealów (jak eksport). Rycina
    w DETALU (sheet/modal) jest STATYCZNA — eksport rysował ją przy
    każdym otwarciu, ale hook w open-detail.ts naruszałby zasadę
    „mechanizm bez zmian" dla dekoracji; świadome uproszczenie.
12. **Tło strony = PaperBackdrop, jak strona główna** (korekta
    Mateusza — pierwsza wersja portu zostawiła goły kafelek body,
    a eksport realizacji ma IDENTYCZNY wzorzec co index: skan
    `paper-background` opacity .2 na bazie `#FAF7F1`, mobile
    `center/cover` 1:1 z treścią, desktop `top center/100% auto
    repeat-y` + dryf 0.85× tempa treści). `HomeBackdrop` awansował do
    wspólnego `src/components/PaperBackdrop.astro`; dryf desktop robi
    pętla `work-motion.ts` (stała `PAPER_BG_SPEED` z home-config,
    kontrakt w e2e jak na `/`). Panel detalu (modal I sheet) — druga
    korekta Mateusza: ten sam duży skan papieru pod CAŁĄ scrollowaną
    treścią, nie kafelek. Eksport kładł warstwę `absolute inset:0`
    w scrollerze, więc papier kończył się po pierwszym ekranie i niżej
    świeciła biel (wada makiety — Mateusz potwierdził w designie).
    Port: `background-attachment: local` na `.dt-body` (tło przypięte
    do TREŚCI scrollera maluje się na całej wysokości przewijania),
    „opacity .2" tekstury robi półprzezroczysta warstwa kremu nad nią
    (background nie ma własnego opacity); kontrakt w e2e.
13. **Podpowiedź wideo wraca do badge'a z tłem** (design eha:
    `STUKNIJ/KLIKNIJ, ABY OBEJRZEĆ` na rgba(12,10,8,.55), uppercase
    mono) — w delung Mateusz zdecydował o samym tekście z cieniem,
    ale tu design mówi wprost. Oba warianty w SSR (`.dt-hint-m/-d`),
    przełącza @media w parze z `WORK_DESKTOP_MIN_PX`.
14. **Ryciny widoku: wyłącznie wersje Z ALFĄ** (lekcja 4.2 §2a —
    `body{position:fixed}` overlaya + stary WebKit gubi blend):
    `dom-ryc-house8.webp` (nagłówek, obie szerokości) i
    `dom-ryc-house1.webp` (treść detalu) już są alfa w repo.
    Jedyny nowy asset: brak — `plac-budowy-photo3.webp` (CTA) już
    w `src/assets/` (fotografia, blend nie dotyczy).
15. **Breakpointy:** 1024 (`WORK_DESKTOP_MIN_PX`, modal↔sheet +
    paginacja↔„pokaż więcej") i **700** (`WORK_GRID_TWO_COL_MIN_PX`,
    1→2 kolumny siatki) — stałe w `work-config.ts`, `@media` w parze;
    oba pod kontraktem breakpoint w e2e. Zmiana progu 1024 przy
    otwartym detalu zamyka go (mechanizm — bez zmian).
16. **Strona /realizacje/ nie ma hero → pasek startuje w stanie
    fallback** (solid od 8 px scrolla — mechanizm 4.1, bez zmian);
    `[data-navref]` na tej trasie nie występuje.
17. **Twarde założenia portu dopilnowane:** gap toru = 10 px w CSS
    (JS liczy `offsetWidth + 10` — bez zmian); kolejność `.dt` przed
    `.lb` w DOM (WorkDetailOverlay — bez zmian); modal ≤ 92 vw
    (max szerokości to `100vw − 180px` < 92 vw dla vw < 2250,
    cap 1260 px powyżej).

### 2a. Korekty Mateusza po testach lokalnych (2026-08-24)

- **Strona paginacji / krok „pokaż więcej" = 4** (pkt 1 — odstępstwo
  od eksportowych 6).
- **Tło widoku i panelu detalu** = wzorzec strony głównej (pkt 12:
  PaperBackdrop + `background-attachment: local` w scrollerze detalu).
- **Kamera na kadrze wideo desktop 160 px** (4× mobilnych 40 px;
  pierwsza korekta dała 8× = 320 px, po obejrzeniu zmniejszona
  o połowę) — mobile bez zmian (40 px).
- **Kreski-wskaźniki karuzeli nadążają za scrollem** — `onTrackScroll`
  w open-detail.ts aktualizował tylko tekst licznika (w delung kreski
  były na mobile schowane, więc nikt tego nie widział); teraz maluje
  też `.on`. Dodatkowo **kreski renderują się tylko przy galerii
  ≤ `WORK_GALLERY_DASHES_MAX` (15)** — dłuższy rząd przestałby się
  mieścić, zostaje sam licznik 01/NN (licznik trzyma wtedy prawą
  krawędź przez margin-left: auto).
- **Papier także na pasie grabbera i stopce CTA sheeta** — panel `.dt`
  i sticky `.dt-foot` świeciły gołym kremem/`#F1ECE0` nad papierową
  treścią; oba dostały te same warstwy tekstury (statyczne — nie
  scrollują), stopka dodatkowo BEZ border-top (separację robi cień).
- **Miniatura wideo „niewidoczna" lokalnie = znany artefakt preview**,
  nie bug: `/cdn-cgi/media` istnieje wyłącznie na produkcji
  (cms-realizacje.md — „nie debuguj miniatur lokalnie"). Zweryfikowane
  2026-08-24: produkcyjny endpoint dla pliku fixture'a oddaje JPEG
  101 KB (GET 200; HEAD nie jest wspierany przez transformację —
  zwraca 404, nie sugerować się nim).

### 2b. Korekty po testach NA PRODUKCJI (2026-08-24, po merge'u PR #8)

- **Atrybut `poster` WYCIĘTY z `<video>`** — na produkcji (gdzie klatka
  wreszcie się ładuje) wyszło, że silniki malują obraz z atrybutu
  ROZCIĄGNIĘTY do pudełka elementu, ignorując `object-fit` (WebKit):
  w galerii nad poprawnym `<img.dt-poster>` (cover) lądowała
  zdeformowana klatka, a w podglądzie pełnoekranowym rozciągała się na
  cały ekran ZA grającym filmem (zamiast czerni). „Dwie drogi" delung
  i tak nie działały w Chromium (przy `preload="none"` nie pobiera
  plakatu nigdy — pomiar szablonu), więc `<img.dt-poster>` zostaje
  JEDYNĄ drogą: cover w galerii (wycięty środek klatki wypełnia kadr),
  contain w podglądzie (czerń wokół, jak sam film). Reguły
  sections.md/cms-realizacje.md zaktualizowane; kontrakt e2e pilnuje
  BRAKU atrybutu.
- **Kamera w podglądzie pełnoekranowym mobile → LEWY DOLNY róg**
  (przy pauzie nakładała się na chevron wyjścia w lewym górnym);
  desktop bez zmian (chevrona nie ma, X jest po prawej). Kontrakt e2e
  (dolna połowa ekranu + zero przecięcia z chevronem).
- **Miniatura wciąż „rozciągnięta" po fixie postera = wadliwy PLIK,
  nie kod**: klip testowy `20251024_120816_conv.mp4` był ANAMORFICZNY
  (zakodowany 1920×1080 + SAR 81:256 → display 9:16 pion). Przeglądarki
  honorują SAR przy odtwarzaniu (film OK), ale `/cdn-cgi/media` tnie
  klatkę z zakodowanych wymiarów (zweryfikowane wariantami parametrów:
  height=960 → 1706×960; fit=cover tylko kadruje zgnieciony obraz) —
  JPEG jest zdeformowany u źródła. Naprawa: reenkod do kwadratowych
  pikseli (608×1080, SAR 1:1, 13,4 MB) + upload pod NOWĄ nazwą
  i edycja pozycji wideo w panelu — podmiana pod tą samą nazwą
  odpada, bo cache klatek `/cdn-cgi/media` (20 dni) okazał się ODPORNY
  na purge strefy (Purge Everything nie ruszył klatki; świeży klucz
  cache oddał poprawną — pomiar 2026-08-24). Reguła SAR 1:1 + zakaz
  podmiany pod tą samą nazwą dopisane do cms-realizacje.md; preset
  HandBrake uzupełniony o `Anamorphic: None` (Część C.2 instrukcji).

## 3. Czego świadomie NIE przenosimy

- Podwójne drzewa, `sc-if`/`sc-for`, mnożniki `--k`/`--w`, cqw,
  scroll w kontenerze fixed, symulator szerokości — artefakty.
- Warstwy A/B kadru modala — tor translateX delung robi ten sam
  przejazd; mechanizm zostaje.
- Zapętlenie galerii kadrów modulo (pkt 9) i rysowanie ryciny przy
  każdym otwarciu detalu (pkt 11).
- Glow paska mobile (wycięty w korekcie 4.2 — obowiązuje stan solid).
- Atrapa paginacji „1 2 3" bez logiki — u nas liczba stron liczona
  z kolekcji, kontrolki tylko przy JS i nadwyżce wpisów.

## 4. Plan testów

- **e2e `tests/e2e/work-index.spec.ts`** (nowy; wpisy WYŁĄCZNIE przez
  `tests/helpers/realizacje.ts`, pusta kolekcja = `test.skip`
  z powodem): SSR bez JS (pełna lista, kontrolki ukryte, template'y
  detalu w HTML); paginacja desktop (strona 1 = `WORK_PAGE_SIZE`
  kafli, przejście na 2, strzałki, skip przy wpisach ≤ rozmiar);
  „pokaż więcej" mobile (krok, znikanie przycisku); detal
  otwarcie/zamknięcie (modal: X/Esc/scrim; sheet: X/Esc), host
  czyszczony; projnav + licznik z kontekstem PEŁNEJ listy (kontrakt
  E5!); galeria desktop strzałkami i KLAWIATURĄ (E7b), licznik;
  lightbox: otwarcie tapem, contain + czarne tło (kontrakt CSS),
  strzałki, klawiatura ←/→, Esc zamyka TYLKO podgląd, powrót na
  oglądany kadr; wideo funkcjonalnie (preload/playsinline/bez
  controls, miniatura jedną drogą — `<img.dt-poster>` bez atrybutu
  `poster` (korekta §2b), hint per próg,
  autoplay w podglądzie `paused === false`, tap pauza↔play);
  mobile gesty: karuzela `scroll-snap-stop: always` + licznik ze
  scrolla (`offsetWidth + 10`), swipe-down sheeta dotykiem
  (`Input.dispatchTouchEvent`, chromium), swipe-down lightboxa,
  tap w scrim; `collectPageIssues`; strażnik natywnego scrolla;
  kontrakt breakpoint 1024 (paginacja↔przycisk) i 700 (kolumny
  siatki — pomiar `grid-template-columns` po obu stronach progu).
- **visual `tests/visual/work-index.spec.ts`** (nowy,
  `useVisualFixtureGuard` — fixture w końcu renderuje
  `<template data-work-detail>`): top, pełna strona (po przejeździe
  rewealującym), detal (sheet na profilach mobile / modal 1920),
  lightbox, stan kadru wideo (1920). WIDEO ZAWSZE POD MASKĄ
  (`video` + `.dt-poster`).
- **`tests/visual/index.spec.ts`** przechodzi z
  `useHomeVisualFixtureGuard` na wspólny `useVisualFixtureGuard`
  (template'y już są); strażnik domowy znika z `guards.ts` (martwy
  kod). Baseline'y `index-*` bez zmian (strażnik nie wpływa na piksele).
- **`tests/visual/skeleton.spec.ts`**: wpis `/realizacje/` wypada
  wraz z baseline'ami `skeleton-realizacje-*` (oba komplety, 6 profili
  × top/full). **`chrome.spec.ts` bez zmian kodu**, ale jego zrzuty
  robione NA `/realizacje/` — wymiana szkieletu na widok rozjedzie
  `chrome-*` (zamierzona regeneracja w tym samym PR).
- Baseline'y generuje Mateusz: kod → workflow
  `update-visual-baselines.yml` na branchu PR → darwin
  `pnpm test:visual:update` na końcu.

## 5. Ryzyka / na co patrzeć na telefonie

- Snap karuzeli detalu (300 px + gap 10) i lightboxa (pełny ekran,
  `pan-x` + swipe-down) na fizycznym dotyku.
- Wideo na tap w iOS Low Power Mode (autoplay z gestu ma przejść).
- Limit warstw GPU Androida przy otwartym detalu (karuzela + blur
  scrima + parallaxy pod spodem).
- Ryciny przy otwartym overlayu na starszym iPhonie (blendy przy
  `body{position:fixed}` — wersje alfa powinny domknąć temat; jeśli
  objaw wróci na desktopowych spłaszczonych rycinach innych tras
  przy otwartym detalu, lista wariantów do podmiany w analiza-home
  §2a).
- Feel „pokaż więcej" (dokładanie bez skoku scrolla).
