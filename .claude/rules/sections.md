---
paths:
  - "src/components/sections/**"
---

# Sekcje strony — gotchas

Sekcje eha powstają w Etapie 4 (po jednej, pętla mini-analiza →
implementacja → testy → PR) — mini-analizy per widok lądują w `docs/`.
Poniżej reguły wspólne odziedziczone z szablonu + gotchas jedynej sekcji,
która przeżyła kopię w całości (work) i mechaniki formularza (contact).

## Wspólne

- Moduły ruchu (`*-motion.ts`) ładowane DYNAMICZNIE tylko przy
  `prefers-reduced-motion: no-preference`; bez JS / przy reduce sekcja
  renderuje pełną, statyczną treść. Animacje eksportów (reveale `.rev`,
  „rysowanie" rycin `.ryc`, parallaxy `.plx`, diagram `.lay`) portujemy
  na CSS + IntersectionObserver za bramką `js-motion` — triggery zawsze
  na scrollu DOKUMENTU (scroll w kontenerze eksportów = artefakt).
- **BEZ GSAP i bez bibliotek scrolla** — ruch sekcji to własne pętle rAF
  i `IntersectionObserver` (wzorzec `work-motion.ts`); nie przywracaj
  bibliotek ruchu.
- Breakpoint projektu: **1024 px** (spójnie z designami — desktop ≥1024,
  mobile <1024). Testy importują stałą `*_DESKTOP_MIN_PX` z configu
  sekcji, a `@media` w `.astro` trzymamy z nią W PARZE (CSS nie
  zaimportuje stałej). **Drugi próg 700 px** dotyczy WYŁĄCZNIE siatki
  realizacji (1 kolumna → 2 kolumny; Etap 4.3) — do kontraktu breakpoint
  obok 1024. Progów 760/768/861 z wcześniejszych szablonów w kodzie
  nie ma.
- **Eyebrows (mono-kickery „NN · TYTUŁ" / „NAZWA SEKCJI" nad h1/h2) NIE
  ISTNIEJĄ** — 29 sztuk wypadło z 7 tras na życzenie klienta (sesja
  poprawek klienta). Eksporty designów je MAJĄ, więc przy porcie nowej
  sekcji nie odtwarzaj ich z makiety. `HomeSectionHead` jest odtąd
  TRÓJKĄ (h2 → lead → akapit), bez propów `num`/`label`. Zostały
  wyłącznie etykiety INNEGO gatunku: nad listami/kartami (`ZAKRES PRAC
…`, `TWORZYMY I ODTWARZAMY`), nad cytatem (`.s3-kick`), opis diagramu,
  badge na zdjęciu, podpis marki na hero i cała `/polityka-prywatnosci/`.
  ⚠️ Kicker bywał elementem gridu z nazwanym obszarem — **pusty wiersz
  gridu schodzi do zera wysokości, ale jego `row-gap` ZOSTAJE**, więc
  usunięcie takiego elementu wymaga też wycięcia wiersza z
  `grid-template-areas` (złapane na `/obsluga-budowy/` sekcja 05
  i na hero `/kontakt/`).
- Warstwy testów po zmianie: `.claude/rules/testing.md`; sekcje dostają
  własne specy w `tests/visual/` razem z widokami (Etap 4).

## Work (`wk` / `dt`) — realizacje (mechanizm z szablonu, skin w 4.3)

- **eha NIE MA kategorii ani filtrów** (E5) — płaska lista + paginacja
  z designu: SSR renderuje WSZYSTKIE kafle i `<template data-work-detail>`,
  JS tylko ukrywa (desktop: paginacja, mobile: „pokaż więcej"); bez JS =
  pełna lista.
- **Detal otwiera się TAKŻE z zajawki 02 strony głównej** (sesja poprawek
  przed Etapem 6 — unieważnia analiza-realizacje §2 pkt 4). Kafle zajawki
  są `<a href="/realizacje/">` z `data-work-slug`/`-name`: JS robi
  `preventDefault` DOPIERO gdy `openWorkDetail()` zwróci `true`, więc bez
  JS `href` zostaje jedynym dojściem do treści (na `/realizacje/` kafel
  jest `<button>`, bo tam pełna lista leży obok). Na listę przenoszą
  wyłącznie CTA „Zobacz wszystkie realizacje" i mobilny kafel-licznik.
  **Templaty i `<WorkDetailOverlay />` MUSZĄ stać POZA `main.home`**
  (renderuje je `index.astro` po `<Footer />`): `.home` ma
  `isolation: isolate`, więc `.dt-ov` (z-index 100) trafiłby do JEGO
  kontekstu układania i pasek `.hdr` (z-index 50) malowałby się NA
  modalu. Listę wpisów dla kafli i templatów daje JEDEN moduł
  `home-realizacje-data.ts` — nie licz jej lokalnie w dwóch miejscach.
- Track karuzeli mobile wymaga `scroll-snap-stop: always` (bez tego szybki
  swipe przeskakuje kilka kafli naraz).
- **Parallax musi mieć zapas ≥ ruch** (lekcja D-U1 szablonu): element
  z `data-par` przesuwa się o `data-par × wysokość hosta`, więc obraz musi
  wystawać poza kadr co najmniej o tyle — zapasem jest albo skala
  (`s ≥ 1 + 2 × data-par`), albo wysokość (`top: -amt%` /
  `height: (100+2·amt)%`). Pamiętaj: preflight Tailwinda ma
  `img { max-width: 100% }` — bez `max-width: none` zapas powstaje tylko
  w pionie. **Testy wizualne tego NIE pilnują** — kafle realizacji są na
  preview pustymi ramkami; strażnikiem musi być sonda układu w e2e.
- Detal realizacji: JEDEN overlay `#work-detail` na szkielecie
  `overlay.ts` (`WorkDetailOverlay.astro`) — wariant modal (≥1024) ↔
  bottom sheet (<1024) to czysty CSS przy `WORK_DESKTOP_MIN_PX`;
  zmiana progu przy otwartej nakładce zamyka ją (miejsce galerii w DOM
  jest per-próg — `open-detail.ts`). Znane twarde założenia portu
  (pilnować przy skinowaniu w 4.3): gap toru zaszyty w JS
  (`offsetWidth + 10`), kolejność `.dt` przed `.lb` w DOM, projnav
  zakłada panel ≤ 92vw.
- Lightbox eha (E7): mechanika szablonu + DWIE adaptacje — kadr = całe
  zdjęcie `object-fit: contain` na czarnym pełnym ekranie (bez ramy;
  wideo też `contain` — filmy klienta bywają pion/poziom) oraz
  klawiatura ←/→ w podglądzie I w galerii detalu na desktopie.
  Esc-hierarchia bez zmian (podgląd → detal).
- Pozycja galerii to WARIANT: albo zdjęcie, albo film
  (`.claude/rules/cms-realizacje.md`). Pierwsza pozycja jest KAFLEM
  realizacji, więc musi być zdjęciem — `viewProject()` liczy z niej
  `cover`, dzięki czemu konsumenci kafla nie wiedzą o zmianie.
- Galeria detalu: zdjęcia przez `imgAt()`, wideo
  `<video preload="none" playsinline>` — miniaturą jest **klatka ze
  środka filmu** (`videoFrameAt()`), nie osobne zdjęcie. Klatka idzie
  JEDNĄ drogą: `<img class="dt-poster">` pod `<video>` — **BEZ atrybutu
  `poster`** (korekta po produkcji 4.3: silniki malują obraz z atrybutu
  ROZCIĄGNIĘTY do pudełka elementu, ignorując `object-fit` — WebKit —
  więc nad poprawnym `<img>` lądowała zdeformowana klatka w galerii
  i jako tło grającego filmu w podglądzie; atrybut i tak nie był pewny:
  przy `preload="none"` Chromium nie pobiera plakatu NIGDY — zmierzone
  w szablonie na produkcji: Firefox 7/7, WebKit 1/1, Chromium 0/7,
  a `preload="metadata"` tego nie zmienia). **Nie kasuj `<img.dt-poster>`
  ani nie przywracaj atrybutu `poster`.** Kadr wideo na zrzutach
  wizualnych jest pod maską — `.dt-poster` też musi tam być. BEZ
  `controls` i bez własnego znaku play: ikonka kamery `[data-cam]` oraz
  podpowiedź `[data-cam-hint]` („STUKNIJ/KLIKNIJ, ABY OBEJRZEĆ" — oba
  warianty w SSR, przełącza `@media`), tap w kadr galerii startuje film
  i otwiera podgląd pełnoekranowy (`[data-lightbox]`), w podglądzie
  tap = pauza↔play; odtwarzanie testuj funkcjonalnie w e2e.
- **Wskaźnik ładowania filmu** (sesja poprawek przed Etapem 6): slajd
  podglądu ma TRZY ROZŁĄCZNE stany — spoczynek („…, aby obejrzeć"),
  `is-loading` („POCZEKAJ, ŁADUJĘ WIDEO" + kropki) i `is-playing`.
  Podpowiedź chowa `playing`, **nigdy `play`** (to drugie leci przed
  pierwszym bajtem — zmierzone 0,65–7,5 s luki zależnie od łącza);
  `waiting`/`stalled` zapalają wskaźnik także przy zacięciu W TRAKCIE.
  Stany muszą zostać rozłączne, bo `.is-playing` chowa całą plakietkę.
  Progi w `work-config.ts` (`VIDEO_LOADING_DELAY_MS` / `_MIN_MS` /
  `_TIMEOUT_MS`) — importują je testy; nie wpisuj liczb w kod. Kropki
  animuje CSS (trzy `@keyframes` o różnym PROGU zapalenia, a nie jedna
  animacja z `animation-delay` — delay przesuwa cały cykl i kropki
  gasłyby po kolei) i rysuje je `::before`, nie tekst w DOM.

## Chrome (navbar/stopka) — Etap 4.1

- Navbar eha ma AUTO-HIDE (E11): chowanie przy scrollu w dół, powrót po
  ~60 px scrolla w górę LUB gdy kursor w górnej strefie; przy otwartym
  dropdownie „O nas" strefa kursora jest rozszerzana (gotcha z designu —
  nav nie może uciec spod otwartego panelu). E2E auto-hide od razu.
- Menu mobilne = bottom sheet na `overlay.ts` z akordeonem „O nas";
  stopka sheeta: dwa telefony MACIEK/ŁUKASZ przez sloty
  `contact-details.ts` (antyscraping!).
- **Pozycja bieżącej strony = PODKREŚLENIE, nie kolor tekstu** (design;
  sesja poprawek przed Etapem 6 — sprostowanie zapisu z 4.1). Dwa
  warianty: `rgba(87,101,74,.6)` nad papierem i `currentColor` przy
  `tone="dark"` bez `[data-solid]` (zieleń akcentu ginęła na ciemnym
  hero). `currentColor` sam podąża za tonem — nie dokładaj reguły dla
  stanu solid.
- **Panel dropdownu jest NIEPRZEZROCZYSTĄ kartą** i nie może dziedziczyć
  tonu paska: `.nav-drop` przywraca `--hdr-ink: #211d18` lokalnie. Bez
  tego przy `tone="dark"` treść panelu jest kremowa na kremowym tle
  (zmierzony kontrast 1,06 : 1 — pozycje NIEWIDOCZNE na 5 z 8 tras).
  Nowe elementy panelu stylizuj przez ten token, nie punktowo.
- **Stan paska zamraża się na czas KAŻDEJ otwartej nakładki.**
  `overlay.ts` blokuje scroll przez `body{position:fixed;top:-scrollY}`,
  co zeruje `window.scrollY`; `onScroll` Navbara wychodzi wtedy od razu
  (`sheetOpen || document.body.style.position === "fixed"`) — łącznie
  z aktualizacją `lastY`, inaczej powrót do zapamiętanej pozycji przy
  zamknięciu wygląda dla auto-hide jak gwałtowny scroll w dół i chowa
  pasek tuż po zamknięciu modala.

## Contact (`kt`) — /kontakt/ (Etap 5, WYKONANY)

- Mechanika formularza w `contact-ui.ts` (ładowana ZAWSZE — to funkcja,
  nie dekoracja); markup i skin w `src/pages/kontakt.astro` (prefiks
  `.kt`, decyzje portu: `docs/analiza-kontakt.md`).
- Telefony i e-mail: sloty `a[data-tel="maciek|lukasz"]`/`[data-mail]`
  - `[data-slot]` wypełniane przez `fillContactSlots`
    (`src/lib/contact-details.ts`, wołane przez skrypt Navbara) — nie
    „upraszczaj" do jawnego `tel:`/`mailto:` w markupie (D-CH5).
    Na `/kontakt/` kotwice startują **BEZ `href`**, z czytelną etykietą
    zastępczą w `[data-slot]` (decyzja Mateusza: znikające kafle byłyby
    na stronie kontaktowej gorsze niż etykieta) — stąd punktowy
    `eslint-disable astro/jsx-a11y/anchor-is-valid` przy tych trzech
    kotwicach i `<noscript>` tłumaczący, dlaczego numeru nie widać.
- Pola wg E9: **4 pola wszędzie** (5. pole desktopu z eksportu = pomyłka):
  imię i nazwisko, **telefon LUB e-mail** (jedno pole, walidacja
  alternatywna po OBU stronach), lokalizacja inwestycji (OPCJONALNA),
  opis. Kontrakt multipart: `name` / `contact` / `place` / `message`
  (+ `firma`, `elapsed`, `lang`, `cf-turnstile-response`) — pola `email`,
  `phone` i `temat` odeszły razem z formularzem delunga.
  Rozbiór pola 02 robi `classifyContact()` z `src/lib/contact-form.ts` —
  JEDNO źródło prawdy dla klienta i serwera, nie duplikuj regexpów.
  Auto-potwierdzenie (mail #2) TYLKO gdy podano e-mail. Bez checkboxa
  RODO — notka z linkiem do polityki.
- **Zestaw pól deklaruje opublikowana polityka prywatności** (sekcja 02
  wylicza dane, sekcja 04 obiecuje potwierdzenie „jeśli podasz adres
  e-mail") — zmiana pól albo przepływu maili wymaga przeglądu
  `/polityka-prywatnosci/`, nie tylko kodu.
- Komunikaty walidacji siedzą w SSR (`<span class="kt-err">`) i pokazuje
  je CSS przy klasie `.err`; `contact-ui.ts` zapala tylko klasę — zero
  tekstów w JS.
- Układ: JEDEN markup na oba progi. Kolumna kontaktowa jest na desktopie
  sticky kartą (`top` MUSI doliczać `var(--hdr-h)` — pasek jest FIXED),
  a na mobile rozsypuje się na osobne sekcje przez `display: contents`
  na `.kt-card`/`.kt-main` + `order` w kolejności eksportu mobile.
- Honeypot jest `readonly` (autofill Chrome'a nie wypełnia readonly;
  focus zdejmuje atrybut w `contact-ui.ts`) — nie usuwaj atrybutu.
- Turnstile ładowany leniwie (pierwszy `focusin` w formularzu) — nie
  przenoś do eager loadu.
- Pola mobile mają PODŁOGĘ `font-size: 16px` (Safari iOS zoomuje stronę
  przy focusie mniejszego pola i zostawia ją zoomniętą).
- **Mono-tagi z kropką rozdzielającą łam JAWNIE, nie zawijaniem**
  (`.kt-tag-hours` tutaj, `.kt-hours` w zajawce 06 na `/`): dwa człony
  z `white-space: nowrap` + separator w osobnym `<span>`, mobile
  w kolumnie, desktop inline. Jeden ciąg zawijał się w środku i zrzucał
  do drugiego wiersza sierotę „8–16", a przy 375 px SAMO „16".
  Separator wyłączaj przez `:not(.kt-tag-sep)` na regule blokowej —
  osobna reguła `.kt-tag-sep{display:none}` ma niższą specyficzność
  i kropka zostaje jako trzeci wiersz.
- **Ryciny desktopowe nie mogą być ucinane od dołu**: sekcje mają
  `overflow: hidden` dla MOBILE (tam ryciny wychodzą za krawędź ekranu),
  a na desktopie zwalniamy oś pionową parą `overflow-x: clip` +
  `overflow-y: visible` — `hidden` + `visible` NIE działa (przeglądarka
  podmienia drugą oś na `auto` i robi scroller). Element, za którym
  rycina ma się chować, musi być `position: relative` — inaczej jego tło
  maluje się pod absolutną ryciną.
- Breakpoint: `CONTACT_DESKTOP_MIN_PX = 1024` z `contact-config.ts`
  (importują go testy e2e; `@media` w parze).
- Pułapki klienckie mają serwerowy odpowiednik w `functions/api/kontakt.ts`
  (Pages Function: honeypot, czas wypełnienia, weryfikacja Turnstile) —
  zmiany po jednej stronie kontraktu wymagają przeglądu drugiej.
