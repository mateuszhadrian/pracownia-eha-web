# Mini-analiza 4.2 — strona główna (`/`)

Referencja: `docs/design/export/index.html` (przeczytany w całości: oba
drzewa markupu + skrypt zachowań). Decyzje E10/E11/E13/E14 bez zmian.
Chrome 4.1 (Navbar/Footer) — tylko PODPINANY, bez przeróbek.

## 1. Odczyty z eksportu

### Kolejność i treść sekcji (oba breakpointy 1:1)

hero → 01 EKIPA EH/A → 02 REALIZACJE → 03 KOMPETENCJE I TECHNOLOGIE →
04 OBSŁUGA BUDOWY → 05 TRADYCJA I EKOLOGIA → 06 KONTAKT → stopka (4.1).
Każda sekcja = pełny ekran (`secH = max(100vh, 550px)`); nagłówek sekcji
to zawsze czwórka: eyebrow mono („NN · TYTUŁ", zieleń .95), h2 Garamond
500 (mobile 40–54 px / desktop 31–44 px), lead italik Garamond
(sepia #4C3B2B), akapit Plex Sans (#3E382E). Treści sekcji przepisane
z eksportu co do znaku (h1, leady, akapity, listy, podpisy).

### Hero

- Pełne logo EH/A (`eha-logo-full`, sepia #4C3B2B): mobile
  clamp(234, 33vw, 300) px, desktop clamp(230, 22.2vw, 355) px;
  h1 „Dom z historią zasługuje na spokojny remont." (Garamond 500,
  mobile 34–46 px, desktop 40–60 px); lead „Ciesielstwo i murarstwo…";
  CTA #1 „Porozmawiajmy o Twoim domu" (wypełniony #211D18 → kontakt),
  CTA #2 „Zobacz realizacje →" (link z podkreśleniem → realizacje);
  mobile CTA w kolumnie, desktop w rzędzie.
- Ryciny domów (opacity 1, bez blend): mobile 4 szt. (house6/house3×2/
  house2, częściowo za krawędziami, parallax `.plxr`); desktop 3 szt.
  statyczne (house3/house1/house2) + `plan-ryc1` 380 px na dole
  (112 % wysokości — „rysuje się" po dojechaniu scrolla).

### 01 Ekipa

- Mobile: nagłówek, potem dwa rzędy portretów w ramkach „polaroid"
  (#F3EDE1, border, cień; foto 88–116×106–140, sepia .22): ŁUKASZ
  („Od sieci korporacyjnych do sieci słupowo-ryglowych."), MACIEK
  odbity lustrzanie („Geologiczna precyzja i zrozumienie materii.");
  pasek CTA na całą szerokość #3A3428 „Poznaj Ekipę EH/A" + strzałka
  w kółku. Rycina house8 z lewej (draw `.ryc-l` + `.plxr`).
- Desktop: flex — kolumna tekstu (max 666 px) + kolaż 2 polaroidów
  (box aspect 440/460, rotacje −2.2°/+1.6°); link inline „Poznaj Ekipę
  EH/A →"; ryciny: warsztat-ryc1 490 px (draw), koparka prawy dół .18.

### 02 Realizacje

- Treść kart = PIERWSZE 3 wpisy kolekcji wg designu (CZERNICA·2023 dom
  z bala / CZERNICA·2022 elewacja szachulcowa / SOBÓTKA·2024 sklepienie
  żaglaste) — dokładnie porządek `order` treści CMS.
- Mobile: karuzela pozioma (overflow-x, karty 4:5 szer. 250–300 px,
  cover + gradient, place·rok mono + tytuł Garamond, ikonka lupy) +
  karta-licznik „JESZCZE 9 / Zobacz więcej realizacji" (#3A3428);
  pasek CTA „Zobacz wszystkie realizacje". Rycina house8 z prawej.
- Desktop: kolumna tekstu z lewej + 3 polaroidy porozrzucane
  (szer. 235–362 px, rotacje −2.4°/1.9°/1.2°, pozycje % sekcji), CTA
  obrysowe „Zobacz wszystkie realizacje"; BEZ licznika. Ryciny:
  dom-remont-ryc1 520 (draw), house8 lewy dół.

### 03 Kompetencje i technologie

- Mobile: nagłówek + siatka 2×2 kart-ramek (Ciesielstwo/Murarstwo/
  Sklepienia/Instalacje — foto + tytuł Garamond + podtytuł mono zieleń)
  + notka „stan surowy zamknięty +" po kreskowanym separatorze + pasek
  CTA „Poznaj nasze kompetencje". Rycina house6 z prawej (draw).
- Desktop: lewy panel FOTO na całą wysokość (46.67vw,
  `kompetencje-i-technologie-hero`, filtr sepia), prawa kolumna: lista
  4 pozycji (wiersze z kreskowanymi separatorami + strzałka) — bez
  zdjęć; notka; CTA obrysowe. Ryciny: narzedzia-ryc1 360 (draw),
  zuraw-rycina1 prawy dół.

### 04 Obsługa budowy

- Wspólny motyw: „ZAKRES PROWADZENIA INWESTYCJI" — 4 kroki (Wykopy
  i fundamenty/ciężki sprzęt na placu; Konstrukcja i mury/ciesielstwo,
  zaprawa wapienna; Dach i stolarka/więźba, pokrycie, okna; Stan surowy
  zamknięty +/tu kończymy — ostatnia kropka ciemna) + cytat „Cała
  logistyka…".
- Mobile: nagłówek, potem pas zdjęcia `plac-budowy-photo3` przykryty
  papierem .72 z maską pionową (parallax `.plx`: top −9 %, height
  118 %), na nim pionowa oś kroków (kropki + kreskowane łączniki);
  cytat; pasek CTA „Zobacz, jak prowadzimy budowę". Rycina koparki
  z prawej (draw).
- Desktop: górny pas zdjęcia `plac-budowy-photo2` (40 % wysokości,
  filtr sepia), niżej dwie kolumny (tekst | cytat+CTA obrysowe), na
  dole kroki w 4 kolumnach na wspólnej kreskowanej linii (kropki
  z „aureolą" #FAF7F1). Ryciny: taczka 340 + dom-remont-ryc2 490
  (draw), wiertnica prawa krawędź.

### 05 Tradycja i ekologia

- Wspólne 3 wiersze: Wełna drzewna i wapno/ŚCIANA PRZYJMUJE I ODDAJE
  WILGOĆ; Materiał z drugiego życia/STARA CEGŁA, BELKI, CAŁE ZRĘBY;
  Złącza ciesielskie/DREWNIANE KOŁKI, BEZ ŚRUB + cytat „Najbardziej
  ekologiczny dom…".
- Mobile: zdjęcie `ekologia-techno-ai` (300–400 px, maska pionowa,
  parallax `.plx`, gradient ciemny) z TRZEMA wierszami NA zdjęciu
  (krem); cytat; pasek CTA „Zobacz, jak rozumiemy ekologię". Rycina
  kołka EH/A (`eha-kolek-ryc`, osobna animacja `.kolek` — fade+rise
  2.2 s) z lewej.
- Desktop: prawy panel foto (44.44vw × 59.1 % wys., filtr sepia),
  lewa kolumna tekstu + 3 wiersze (kreskowane separatory, atrament);
  cytat + CTA pod panelem. Ryciny: szkielet-domu 420 + wnetrze-domu-2
  280 (draw), eha-kolek lewy dół .18 (statyczny).

### 06 Kontakt

- Wspólne: nagłówek 06, telefony MACIEK/ŁUKASZ (etykieta mono nad
  numerem Garamond), mail, „KONTAKT 7 DNI W TYGODNIU · BUDOWA PN–PT
  8–16"; CTA „Napisz lub zadzwoń".
- Mobile: karta #F3EDE1 z ryciną telefonu (draw), nagłówek „ZADZWOŃ";
  CTA jako pasek na dole sekcji (z marginesem, nie full-bleed).
- Desktop: lewy CIEMNY panel #241E17 (38.9vw, rycina telefonu invert)
  z telefonami/mailem w kremie; prawa kolumna tekstu + CTA obrysowe;
  na dole pas „DOLNY ŚLĄSK · CAŁA POLSKA" po kreskowanym separatorze.
- ⚠️ Eksport ma pełne numery w markupie — u nas WYŁĄCZNIE sloty
  `a[data-tel="maciek|lukasz"]`/`a[data-mail]` (D-CH5; kontrakt
  antyscrapingowy w navigation.spec sprawdza surowy HTML `/`).

### Ruch (skrypt eksportu — wszystko za `prefers-reduced-motion`)

- `.rev` (nagłówki sekcji, TYLKO mobile): opacity 0 + translateY(10px)
  → wjazd .68 s, kaskada d1/d2/d3 (+.09/.18/.27 s); trigger
  IntersectionObserver przy ≥30 % widoczności, jednorazowo.
- `.ryc` (mobile) / `data-ryc-sandbox` (desktop): „rysowanie" ryciny
  podwójną maską gradientową (klin 105°/255° + smugi), animacja
  mask-position 2.8 s (mobile) / 2 s (desktop); wariant -l/-r wg
  strony ekranu. Desktop trigger: środek elementu nad linią 60 %
  wysokości viewportu; mobile: IO ≥30 %. Po animacji eksport ZDEJMUJE
  maskę z elementu.
- `.kolek` (05 mobile): opacity+translateY+scale, 2.2 s.
- `.plxr` (mobile, ryciny): translateY = ±10 % × 150 px (≈ ±15 px) wg
  położenia środka elementu względem środka viewportu.
- `.plx` (mobile, zdjęcia 04/05): amt 0.18 — element dostaje
  top:−9 %/height:118 % (zapas = ruch, D-U1 spełnione w eksporcie),
  translateY = ±9 % wysokości kadru.
- Desktop: dryf tła papieru (backgroundPositionY = 0.15 × scroll) —
  NIE przenosimy (patrz §3).

## 2. Decyzje portu

| #   | Decyzja                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1  | **Zajawka „Realizacje" CZYTA KOLEKCJĘ CMS** (pierwsze 3 wpisy po `order` przez `viewProject()`; licznik mobile = `liczba − 3`, karta licznika tylko gdy > 0; przy < 3 wpisach renderuje co jest, przy 0 — sekcja bez kart, sam tekst + CTA). Uzasadnienie: karty designu = dosłownie pierwsze 3 wpisy treści CMS (fixture pokrywa je 1:1), `HOME_MAX = 3` w helperach czekał na to od Etapu 3, a karta statyczna kłamałaby licznikiem i treścią po każdej zmianie w panelu. Konsekwencje: visual spec na `useVisualFixtureGuard` + `build:visual` (licznik na baseline'ach = „JESZCZE 2", fixture ma 5 wpisów), e2e przez `tests/helpers/realizacje.ts` z `test.skip` przy pustej kolekcji. Okładki przez `imgAt()` (mobile 320 / desktop 960); linki kart → `/realizacje/` (jak w designie; deep-linki do detalu = temat 4.3+). |
| H2  | **Gutter `--g` wchodzi do `global.css`** (`:root` w `@media ≥1024`: `--g: clamp(60px, 9.72vw, 160px)`); Navbar i Footer przechodzą na `var(--g)` w tym samym PR (dziś mają ten clamp zahardkodowany). Sekcje desktop strony głównej używają `var(--g)` jako marginesu.                                                                                                              |
| H3  | **Hero = pierwszy ekran**: mobile `min-height: calc(100svh - var(--hdr-h))` pod paskiem fixed (strona dostaje `padding-top: var(--hdr-h)`), desktop analogicznie z podłogą ~480 px (eksport: max(100vh,550) − pasek 72). **`svh`, nie `dvh`** — świadome odstępstwo od litery instrukcji: `dvh` rośnie przy zwijaniu paska Safari, więc hero zmieniałoby wysokość W TRAKCIE scrolla i szarpało treścią pod spodem (lekcja D-Q2 delung); `svh` = dokładnie pierwszy ekran przy wejściu i stała wartość potem. Intencja („hero wypełnia pierwszy ekran") zachowana. `[data-navref]` na hero: `offsetHeight − 40` trafia wtedy dokładnie w moment, w którym pasek zaczyna nachodzić na treść pod hero. |
| H4  | **Pozostałe sekcje NIE są przypinane do wysokości ekranu na sztywno**: `min-height` z ekranu (desktop `calc(100vh - var(--hdr-h))`… w praktyce ~100vh) + layouty FLOW (flex/grid) odtwarzające geometrię eksportu przy wzorcach 1440/390. Absolutne pozycjonowanie zostaje tylko tam, gdzie element jest dekoracją (ryciny) albo kolażem (polaroidy 01/02). Powód: eksport ratował niskie okna mnożnikiem `--k` liczonym w JS (artefakt) — w czystym CSS sekcja o stałej wysokości z treścią na `%` NAKŁADA się przy 1366×768; sekcja rosnąca z treścią nie.                                                                                     |
| H5  | Skalowanie `cqw`/`--k`/`--w` → `clamp()` od szerokości viewportu (wzorce 390/1440; mnożniki = 1). Tokeny typograficzne sekcji jako zmienne CSS na kontenerze `.home` (mobile + nadpisania w `@media 1024`), wartości z eksportu.                                                                                                                                                     |
| H6  | **Ruch za bramką `js-motion`** (wzorzec delung Home.astro): inline skrypt PRZED paintem dodaje `html.js-motion` przy `no-preference`; stany startowe (`opacity:0` itd.) WYŁĄCZNIE pod `html.js-motion` — bez JS / przy reduce strona w pełni statyczna i kompletna. `home-motion.ts` importowany dynamicznie tylko przy `no-preference`.                                                                                                                                                    |
| H7  | **Markup ruchu na data-atrybutach**: `data-rev` (+ `data-rev-d` kaskada), `data-ryc="l\|r"` (mobile draw), `data-rycsb="l\|r"` (desktop draw), `data-kolek`, `data-plxr`, `data-plx`. Strona -l/-r przypisana STATYCZNIE w markupie (eksport liczył ją w runtime ze środka ekranu — pozycje znamy z designu). Triggery: IO threshold .3 (mobile), IO z `rootMargin: 0 0 -40% 0` (linia 60 % viewportu, desktop draw); wszystko na scrollu DOKUMENTU.                                                                  |
| H8  | **Po `animationend` rysowania maska jest ZDEJMOWANA** (jak w eksporcie) — ryciny mobile są jednocześnie `.plxr` (transform co klatkę), a maska na przesuwanej warstwie to dokładnie drogi wzorzec z D-Q1. Parallaxy: nasłuch `scroll` passive → jedna pętla rAF; elementy poza viewportem pomijane; `.plx` dostaje top −9 %/height 118 % z CSS (zapas ≥ ruch, D-U1), ryciny wystające za krawędź mają `max-width: none` (preflight!).                                                                     |
| H9  | Assety przez `optimize-images.mjs` (tabela niżej); ryciny q45–50 (kreska znosi kompresję), zdjęcia q60–70. Obrazy wariantu ukrytego (`display:none` po drugiej stronie progu) mają `loading="lazy"` — nigdy nie przecinają viewportu, więc się nie pobierają; wszystko poza hero lazy. Hero bez bitmap (logo = maska CSS na cache'owanym SVG jak w 4.1) — LCP to h1 (SSR, fonty preloadowane w BaseLayout).                                                                                              |
| H10 | Kontrasty drobnych monospace podbite do AA jak w 4.1 (C9): etykiety `.55` → `.64+`, kremy na ciemnym `.5–.6` → `.72`; rozmiary < 10 px podniesione do ≥ 10 px. Ratchet axe zostaje PUSTY.                                                                                                                                                                                            |
| H11 | Meta description strony głównej = lead hero (dotąd `/` bez description — szkielet; wzorzec delung).                                                                                                                                                                                                                                                                                 |
| H12 | Struktura: `src/components/sections/home/` — `HomeHero`, `HomeEkipa`, `HomeRealizacje`, `HomeKompetencje`, `HomeObsluga`, `HomeTradycja`, `HomeKontakt` (+ `HomeSectionHead.astro` dla czwórki nagłówkowej, `home-config.ts` z `HOME_DESKTOP_MIN_PX = 1024`, `home-motion.ts`); `index.astro` składa całość + bramka + stopka.                                                        |
| H13 | Telefony/mail w 06 wyłącznie przez sloty `contact-details` (etykiety osób w SSR, numery składa JS — `fillContactSlots()` z Navbara łapie cały dokument). Bez JS sloty zostają ukryte — spójnie z chrome'em i polityką.                                                                                                                                                                |

### Plan assetów (eksport → `src/assets/`, WebP)

| Plik eksportu                     | Cel (istn. = już w repo)       | Szer. | q   | Użycie                          |
| --------------------------------- | ------------------------------ | ----- | --- | ------------------------------- |
| dom-ryc-house2/3/4/6/8.png        | dom-ryc-house\*.webp           | 460   | 50  | ryciny hero/sekcji (m+d)        |
| dom-ryc-house1.png                | (reuse dom-ryc-house1.webp)    | —     | —   | hero desktop (źródłowy PNG ma tylko 225 px — wariant „lg" nie istnieje) |
| plan-ryc1.png                     | plan-ryc1.webp                 | 760   | 45  | hero desktop (draw)             |
| lukasz-portrait.png / maciek2.jpg | lukasz-portrait/maciek2.webp   | 460   | 68  | 01 (m+d)                        |
| warsztat-ryc1.png                 | warsztat-ryc1.webp             | 740   | 45  | 01 desktop (draw)               |
| (koparka-rycina1)                 | istn. koparka-rycina1.webp 420 | —     | —   | 01 d + 04 m (reuse z 4.1)       |
| dom-remont-ryc1/2.png             | dom-remont-ryc1/2.webp         | 780   | 45  | 02/04 desktop (draw)            |
| mur-szachulcowy.jpg               | mur-szachulcowy.webp           | 640   | 62  | 03 mobile                       |
| cegla-i-kamien2.jpg               | cegla-i-kamien2.webp           | 640   | 62  | 03 mobile                       |
| sklepienie-zagliste-web.jpg       | sklepienie-zagliste.webp       | 640   | 62  | 03 mobile                       |
| instalacje.jpg                    | instalacje.webp                | 640   | 62  | 03 mobile                       |
| kompetencje-i-technologie-hero.png| kompetencje-hero.webp          | 1200  | 65  | 03 desktop (panel ~900×1080)    |
| narzedzia-ryc1.png                | narzedzia-ryc1.webp            | 540   | 45  | 03 desktop (draw)               |
| zuraw-rycina1.png                 | zuraw-rycina1.webp             | 640   | 45  | 03 desktop                      |
| plac-budowy-photo3.png            | plac-budowy-photo3.webp        | 1200  | 60  | 04 mobile (pas pod papierem .72)|
| plac-budowy-photo2.png            | plac-budowy-photo2.webp        | 1920  | 62  | 04 desktop (pas 40 %)           |
| taczka-ryc1.png                   | taczka-ryc1.webp               | 520   | 45  | 04 desktop (draw)               |
| wiertnica-rycina1.png             | wiertnica-rycina1.webp         | 580   | 45  | 04 desktop                      |
| ekologia-techno-ai.png            | ekologia-techno.webp           | 1300  | 63  | 05 (m+d — jeden plik)           |
| eha-kolek-ryc.png                 | eha-kolek-ryc.webp             | 860   | 48  | 05 (m `.kolek` + d statyczna)   |
| szkielet-domu-ryc1.png            | szkielet-domu-ryc1.webp        | 640   | 45  | 05 desktop (draw)               |
| wnetrze-domu-ryc1/2.png           | wnetrze-domu-ryc1/2.webp       | 590/420| 45 | 06/05 desktop (draw)            |
| telefon-rycina1.png               | telefon-rycina1.webp           | 820   | 48  | 06 (m karta + d panel invert)   |
| kalamaz-rycina1.png               | kalamaz-rycina1.webp           | 780   | 45  | 06 desktop                      |
| paper-background.png              | paper-background.webp          | 816 (natywna) | 55 | tło całej strony (HomeBackdrop, §2a) |

Budżet: mobile dokłada do strony `/` ~0.6–0.7 MB obrazów (ryciny+foto)
do zmierzonych 332 KB szkieletu → prognoza < 1.1 MB przy limicie 1.2 MB;
desktop dokłada więcej (panel 03, pas 04), limit 2 MB niezagrożony.
Wagi realne do raportu po optymalizacji.

### 2a. Korekty z implementacji (2026-08-24)

- **Ryciny spłaszczone na białe tło (bez alfy)** — WebP koduje kanał alfa
  bezstratnie i pojedyncze ryciny ważyły po 300–450 KB; po spłaszczeniu
  10× mniej (komplet rycin: 362 KB). W markupie przywraca je
  `mix-blend-mode: multiply` — TAKŻE w hero, gdzie eksport miał opacity 1
  bez blendu (kreska na papierze wygląda identycznie); rycina telefonu na
  ciemnym panelu 06 desktop: `filter: invert(1) sepia(.3)` +
  `mix-blend-mode: screen` (czarne spłaszczone tło staje się neutralne).
- `instalacje.webp` przycięty do kadru karty (pion 560×1245 → 640×422;
  119 KB → 40 KB); `dom-ryc-house1-lg` nie powstał (patrz tabela).
- Utility `dOnly`/`mOnly` chowają wyłącznie po niewłaściwej stronie progu
  (bez `display: revert`, które kasowało flexowe CTA).
- 06 desktop: wiersz panel|tekst to WEWNĘTRZNY wrapper `.kt-row`
  (globalne `.home .sec` wygrywa specyficznością z :where-scoped stylem
  komponentu — nadpisywanie `flex-direction` sekcji nie działa).
- **Strażnik visual**: `useHomeVisualFixtureGuard` (nowy w guards.ts) —
  `useVisualFixtureGuard` liczy `<template data-work-detail>`, które
  wejdą dopiero z widokiem 4.3; wariant dla `/` liczy karty zajawki
  (min(3, wpisy)) i licznik „JESZCZE N" z fixture'u.
- `HOME_MAX` z tests/helpers/realizacje.ts usunięty — kap żyje w JEDNYM
  miejscu: `HOME_REALIZACJE_MAX` (home-config.ts), importują go komponent
  i testy.
- Visual fullPage: przejazd rewealujący ma kroki ~0.7·viewport
  z ~140 ms pauzy — szybszy przelot gubi wpisy IntersectionObservera
  (zmierzone przy budowie widoku).
- **Tło strony (korekta Mateusza po testach na preview)**: kafelek
  512 px nie oddaje referencji — wchodzi `HomeBackdrop` z prawdziwym
  skanem (`paper-background.webp`, 816×1456, 89 KB, q55; eksport też
  upscalował ten sam plik) na bazie kremowej `--bg-cream` (`.home`
  dostaje `isolation: isolate`, tekstura z-index −1; kafelek body
  zostaje pod chrome'em innych tras — kalibracja per widok wg README
  designów). Mobile: `center/cover`, jedzie z treścią 1:1 (eksport);
  desktop: `top center / 100% auto repeat-y` + dryf 0.85× tempa treści
  (`PAPER_BG_SPEED` w home-config; eksport: +0.15·scroll na
  background-position). Implementacja dryfu: element FIXED (wysokość
  100vh + okres) przesuwany transformem modulo okres w pętli
  home-motion.ts — sam kompozytor, zero przemalowań (D-Q1); pod bramką
  js-motion (bez JS / przy reduce tekstura absolute jedzie z treścią).
  Kontrakt e2e: „tło papieru dryfuje wolniej niż treść".
- **Karuzela 02 mobile dostaje CSS scroll-snap** (korekta Mateusza —
  brak snapa w eksporcie to niedoróbka): tor `scroll-snap-type: x
  mandatory` + `scroll-padding-inline` = padding toru, kafle
  `align: start` + `scroll-snap-stop: always` (kontrakt karuzel
  z sections.md). Kontrakty w e2e (style + realny dosnap 2. kafla).
- **Hero mobile na niskich ekranach** (korekta Mateusza: dół hero
  uciekał poza pierwszy ekran): szerokość logo liczona z BUDŻETU
  WYSOKOŚCI — `clamp(80px·wh, (100svh − --hdr-h − (1208px − 190vw))·wh,
  rozmiar projektowy)`, gdzie wh = proporcja logo, a `1208px − 190vw`
  = reszta treści hero (paddingi+gapy+h1+lead+CTA), która ROŚNIE na
  węższych ekranach (tekst łamie się częściej) — model liniowy
  z pomiarów 390 px→455 px (Chromium) i 375 px→483 px (WebKit)
  z ~12 px zapasu; przy zmianie treści hero przemierzyć oba punkty.
  Poniżej ~600 px svh podłoga 80 px chroni znak i hero rośnie przez
  min-height (bez nakładania; landscape telefonów świadomie jak
  w eksporcie — hero wyższe niż ekran). Desktop bez zmian. Kontrakt
  e2e przy wysokości 680 na wszystkich profilach mobile.
- Test „dosnapowania" karuzeli tylko na chromium-pixel-5 — WebKit nie
  snapuje scrolla PROGRAMOWEGO (quirk Safari); kontrakt stylów snapa
  biega na wszystkich profilach mobile.
- **Reveale tekstów przełączone na tempo delung** (korekta Mateusza:
  eksportowe 0.68 s/10 px odbierane jako „migotanie"): PRZEJŚCIA
  opacity 0.7 s ease + transform 0.8 s cubic-bezier(.22,.61,.36,1)
  z podjazdem 22 px (Home.astro delung 1:1); kaskada czwórki
  nagłówkowej zostaje przez transition-delay. Trigger też z delung:
  IO `rootMargin -10%` + threshold .01, elementy pierwszego ekranu
  odsłaniane od razu, a te nad ekranem (skok kotwicy) bez animacji.
  Ryciny/kołek bez zmian (próg 30 % z eksportu).
- **D-Q2 na stronie głównej** (korekta Mateusza — Galaxy S20 FE,
  Chrome): chowanie paska URL ZMIENIA tam rozmiar webview, więc drga
  nawet 100svh i sekcje skakały w jego rytm. Port mechanizmu delung
  (`home-viewport.ts`, ładowany ZAWSZE — stabilność, nie dekoracja):
  sonda 100svh; DOPÓKI svh przy stałej szerokości nie drga — czysty
  CSS (zero zmian w Safari/desktop/testach); po pierwszym drgnięciu
  wartość SPRZED niego jest mrożona w `--svh` (inline na main.home),
  obrót ekranu zdejmuje pin. Konsumenci: `.sec`/`.hero`/logo hero
  (var(--svh)) + parallaxy w home-motion (vpH()). Kontrakty e2e:
  zmiana samej wysokości nie zmienia geometrii, pin dopiero po
  drgnięciu, obrót zwalnia.
- **`theme-color` #ffffff → #f5efe3** (BaseLayout, wszystkie trasy):
  biały pas przy zwijaniu paska URL na Androidzie brał kolor z tej
  mety — teraz jest w kolorze papieru.
- **Navbar mobile bez glow** (korekta Mateusza; szczegóły
  w analiza-chrome §4b): mobile dostaje stan `data-solid` 1:1
  z desktopem (papier + krawędź, fade 0.3 s, ten sam próg z hero);
  auto-hide dalej desktop-only.
- **Ryciny widoczne na MOBILE wróciły do wersji Z ALFĄ** (korekta
  Mateusza — iPhone SE 2020): przy otwartym sheecie `overlay.ts`
  blokuje scroll przez `body{position:fixed}`, a starszy WebKit gubi
  wtedy `mix-blend-mode` — spłaszczone na biel ryciny świeciły białym
  kontenerem. Wersja z alfą degraduje się niewidocznie (przezroczyste
  tło zostaje nawet bez blendu). Zakres: dom-ryc-house2/3/4/6/8
  (te same pliki służą też desktopowi) + warianty mobile
  `eha-kolek-ryc-m` (560 px) i `telefon-rycina1-m` (340 px); desktop
  06/05 zostaje na spłaszczonych (invert+screen na ciemnym panelu /
  statyczna dekoracja). Alfa stratna (`alphaQuality` 40–50) trzyma
  wagę: domki 16–28 KB, kołek-m 39 KB, telefon-m 44 KB.
- **Widoczność subtelnych rycin regulowana tokenem `--ryc-vis`**
  (index.astro, tokeny `.home`; korekta Mateusza): mnożnik bazowych
  opacity z eksportu (0.12–0.18) — 1 = wiernie jak design, obecnie 1.6;
  skaluje wszystkie proporcjonalnie (głębia warstw zostaje), hero
  (opacity 1) i mocniejsze ryciny (≥0.24) poza regulacją.
- **Kadr 05 z twardymi krawędziami** (korekta Mateusza): maska pionowa
  z eksportu (fade góra/dół) zdjęta ze zdjęcia mobile.
- **Karty 03 mobile to ŻYWE obrazki** (korekta Mateusza): `<figure>`
  zamiast linków (do podstrony prowadzi pasek CTA sekcji); hover
  i transition zdjęte.
- **Stopka** (korekty Mateusza — szczegóły analiza-chrome §4b):
  „NA GÓRĘ ↑" wycięty, kredyt hadrianm po prawej w linii polityki,
  pasmo brandowe bez „CAŁA POLSKA" — po dopytaniu także pas sekcji 06
  desktop (spójnie: samo „DOLNY ŚLĄSK").
- **Lupa kafli 02 = wzór z podstrony /realizacje/** (korekta Mateusza):
  kremowa lupa w „narożnikach kadru" (8 gradientów 11×1 px) z
  drop-shadow — zamiast wypełnionego kółka z eksportu strony głównej.
- **05 mobile: kołek WYCIĘTY** (zasłaniało go zdjęcie; aparat
  [data-kolek] i asset `eha-kolek-ryc-m` usunięte — desktopowy kołek
  statyczny zostaje) oraz **kadr zdjęcia dopasowany do treści**:
  wysokość z wierszy + symetryczny odstęp góra/dół
  (clamp 22–30 px; eksport miał sztywne 300–400 px i tekst przy dole).
- **Liść w 05 mobile** (korekta Mateusza): `lisc-rycina1` (góra
  desktopowej podstrony Tradycja i ekologia w eksporcie) osadzony
  i animowany 1:1 jak koparka w 04 (`.ob-ryc`: prawa krawędź,
  rysowanie `data-ryc="r"` + parallax `data-plxr`,
  opacity 0.16·`--ryc-vis`, multiply); asset z alfą 440 px/40 KB.
- **Ryciny hero mobile rysują się sekwencyjnie po wejściu** (korekta
  Mateusza): ta sama animacja maski co ryciny sekcji, ale autostart bez
  IO — wszystkie dostają `.in` od razu po załadowaniu modułu ruchu,
  a rozłożenie w czasie robi `animation-delay` po `[data-ryc-auto]`:
  lewa (house6) 0 s → prawa górna (house3) 1 s → obie dolne 2 s.
  Po `animationend`/`animationcancel` maska schodzi (cancel = freeze.css
  testów wizualnych anuluje bieg — bez tej gałęzi rycina zostawałaby
  w połowie zamaskowana na zrzutach). Bez JS / przy reduce ryciny
  statyczne od razu. Kontrakt e2e (mapowanie etapów + autostart).
  ⚠️ Dla 4.3: overlay detalu realizacji też robi `body{position:fixed}`
  — NA DESKTOPIE spłaszczone ryciny (plan/warsztat/dom-remont/
  narzedzia/zuraw/taczka/wiertnica/szkielet/wnetrze/kalamaz/kolek/
  telefon) mogą na starym WebKit iOS/macOS pokazać ten sam objaw przy
  otwartym detalu; jeśli wystąpi — te same warianty z alfą.

## 3. Czego świadomie NIE przenosimy

- Podwójne drzewa `isMobile`/`isDesktop`, `sc-if`/`sc-for`, `{{ }}`,
  presety szerokości, scroll w kontenerze `fixed` — artefakty Claude
  Design (jak w 4.1). Jeden markup + `@media 1024`; duplikacja tylko
  tam, gdzie układy realnie się rozjeżdżają (02/03/05 — fragmenty).
- ~~Dryf tła papieru na desktopie~~ — **jednak przenosimy** (korekta
  Mateusza po testach: tło ma wyglądać i płynąć jak w referencji);
  szczegóły w §2a (HomeBackdrop). Pomijamy wyłącznie eksportową
  IMPLEMENTACJĘ (background-position co klatkę = przemalowanie warstwy,
  wzorzec kosztowy D-Q1) — u nas transform na kompozytorze.
- Wyliczanie strony -l/-r rysowania w runtime (H7 — statycznie).
- Pełne numery telefonów/mail w markupie 06 (antyscraping, H13).
- `paper-background.png` jako nakładki sekcji — kafelek z Etapu 0.6.
- Timeout „doanimowania" 900 ms z cyklu życia eksportu (artefakt
  symulatora; u nas IO działa od wejścia elementu).

## 4. Testy

- **e2e `tests/e2e/home.spec.ts`**: SSR bez JS (JS off → h1 + treść
  wszystkich 6 zajawek + CTA w DOM, widoczne); kontrakt `[data-navref]`
  (top: pasek BEZ `data-solid`; po zjechaniu za hero: `data-solid`);
  nawigacja CTA hero (kontakt/realizacje) i pasków CTA zajawek
  (6 tras); zajawka realizacji: liczba kart = min(3, wpisy) przez
  helper (skip przy 0), karta licznika tylko przy > 3, linki
  → `/realizacje/`; sloty telefonów 06 wypełnione po JS; reveale:
  po dojechaniu do sekcji `[data-rev]` ma opacity 1; strażnik „scroll
  jest natywny" (wzorzec delung oferta.spec — wraca ze specami
  widoków); `collectPageIssues` puste; `expectBreakpointFlip(1024)`
  na wariantach hero/sekcji (stała `HOME_DESKTOP_MIN_PX`).
- **visual `tests/visual/index.spec.ts`** (NOWY, `useVisualFixtureGuard`
  — H1): `index-top` (viewport) + `index-full` (fullPage po przejeździe
  scrolla przez całą stronę — IO musi odpalić reveale przed zszyciem;
  freeze.css sadza je od razu w stanach końcowych) na 6 profilach.
  Wideo na `/` nie ma; okładki R2 na preview to znane 404 (kafle =
  ciemne karty z tekstem — deterministyczne). BEZ emulacji reduce.
- **`skeleton.spec.ts`**: wpis `/` WYPADA razem z baseline'ami
  `skeleton-home-*` (oba komplety) w tym samym PR.
- **`chrome.spec.ts`**: bez zmian (zrzuty na `/realizacje/`); przejście
  Navbar/Footer na `var(--g)` nie zmienia geometrii (ten sam clamp).
- Baseline'y `index-*` generuje Mateusz: kod → workflow linux na
  branchu PR → darwin `pnpm test:visual:update` na końcu.

## 5. Niejasności / odstępstwa do potwierdzenia w PR

1. **`svh` zamiast `dvh`** w hero (H3) — intencja „pierwszy ekran"
   zachowana, uzasadnienie wyżej; jeśli Mateusz woli literalne `dvh`,
   zmiana to jedna linia.
2. Desktopowe karty 02 linkują na `/realizacje/` bez deep-linku do
   detalu (jak eksport); ewentualne otwieranie detalu z home = decyzja
   przy 4.3 (mechanizm overlay wchodzi tam).
3. Licznik mobile „JESZCZE N" liczy wpisy kolekcji (produkcja dziś:
   6 wpisów → „JESZCZE 3"; design pokazywał 9 przy 12 wpisach DATA —
   liczba u nas ŻYWA, nie kopiowana).
