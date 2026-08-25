# Mini-analiza: /tradycja-i-ekologia/ (Etap 4.5, część 1 z 2)

Port `docs/design/export/tradycja-i-ekologia.html` (referencja WYGLĄDU
I ZACHOWANIA — podwójne drzewa, scroll w kontenerze fixed, mnożniki
`--k`/`--w`/cqw to artefakty Claude Design). Widok KONSUMUJE moduły 4.4
(`docs/analiza-ekipa.md` §2, `docs/analiza-kompetencje.md`):
`CollapsibleText` + `collapsible.ts`, `content-motion.ts`,
`content-config.ts`, `Navbar tone="dark"`, `PaperBackdrop` — bez zmian
ich mechanik. JEDYNA nowość mechaniki = **animowany diagram warstw**
(+ efekt `.kolek`) — osobny mały moduł strony (§2.8).

## 1. Odczyty z eksportu

### 1a. Struktura MOBILE (<1024; kontener treści 700px/30px)

1. **Hero 430 px** (stała wysokość): podkład `#3A3428` z maską
   `linear-gradient(#000 60%, transparent 100%)` (kadr wygasa w papier),
   zdjęcie `hero-tradycja-i-ekologia1` `sepia(.15) saturate(.85)`
   `object-position: 70% 38%`, parallax `.plx`; u góry gradient
   przyciemniający 118 px `rgba(24,19,14,.5)` (czytelność KREMOWEGO
   paska); h1 „Tradycja i ekologia." (serif 42 px, **ATRAMENT**) na dole
   hero (bottom 22, kontener 700/30) — siedzi na wygaszonej części.
2. **Manifest**: italic serif 19 px „Manifest pragmatyczny." (mobile-only
   — desktop nie ma leadu) + JEDEN akapit (połączone dwa akapity
   desktopu, padding 4/30/34); rycina house3 `.ryc .ryc-r .plxr`
   (right −38, top 118, w 128, opacity .5, BEZ blendu).
3. **Ciemny pas 236 px** `#14100B` z `ekologia-techno-ai` `.plx`
   (obj-pos 50% 52%, `sepia(.08) saturate(.95)`, maska fade 10 %/92 %).
4. **FIZYKA BUDOWLI**: nagłówek BEZ płyty-tła (padding 12/30/0): kicker
   `.rev` + h2 `.rev d1` „Fizyka budowli. Dom, który naprawdę oddycha";
   **zwijana treść `cv('fz','132px')`**: p1 → blok DIAGRAMU (kicker
   „UKŁAD WARSTW OTWARTYCH DYFUZYJNIE" + karta `#F3EDE1` z diagramem
   148 px + podpis „PARA WODNA — ŚCIANA PRZYJMUJE I ODDAJE WILGOĆ")
   → p2; toggle w osobnym kontenerze (14/30/0).
5. **UPCYCLING**: płyta (margin-top 34; tło `cegla-rozbiorkowa` `.plx`
   obj-pos 50% 55% + mgła `rgba(250,247,241,.66)`, maska fade 40 %,
   padding 56/30/20), kicker+h2 „Upcycling na wielką skalę. Drugie życie
   architektury"; **zwijana `cv('up','132px')`**: rycina house5
   (`.ryc .ryc-r`, BEZ plxr; right −98, w 142, .28 multiply) → p1 →
   kadr `dom-z-bala4` 212 px full-bleed `.plx` (maska 16/84, obj-pos
   50% 58%) + podpis centrowany „CZERNICA — REKONSTRUKCJA PRZEWIEZIONEGO
   ZRĘBU" → p2 → blok [kicker zielony „BEZKOMPROMISOWO · RELOKACJA
   BUDYNKÓW" + p3] → kadr `dom-z-bala3` 212 px `.plx` (obj-pos 50% 40%)
   + podpis „NOWA WIĘŹBA NAD STULETNIM ZRĘBEM"; toggle osobno.
6. **TRWAŁOŚĆ**: pas 200 px (margin-top 26; `tradycja-i-ekologia-
   drewno-ai1` opacity .34 `.plx`, maska fade 40 %, obj-pos 56% 50%,
   treść flex-end), kicker+h2 „Trwałość. Prawdziwa miara ekologii";
   **zwijana `cv('tw','132px')`**: **efekt `.kolek`** — `eha-kolek-ryc`
   absolute left 50 %/top 44, w 330, opacity .14 multiply, animacja
   `kolekIn 2.2s cubic-bezier(.22,.6,.2,1)`: opacity 0→.14,
   translate(−50 %,10px)→(−50 %,0), scale(.965)→1 — oraz 3 akapity;
   toggle osobno.
7. **MIKROKLIMAT**: płyta (margin-top 34; tło = TEN SAM obraz hero,
   obj-pos 32% 62% + mgła .66, maska 40 %, padding 56/30/20), kicker+h2
   „Zdrowy mikroklimat i bezpieczna przystań"; treść **BEZ zwijania**:
   rycina house2 `.ryc .ryc-r .plxr` (right −72, top −10, w 132, .24
   multiply), p1, p2 z `<em>` „antyalergicznym mikroklimacie"; 3 karty
   auto-fit 300 (BEZ PLEŚNI / BEZ TOKSYCZNYCH OPARÓW / STABILNA
   WILGOTNOŚĆ — ramka `#F3EDE1`, wzorzec kart kompetencji).
8. Kreskowany separator (margin 26 auto, max 648) → **CTA 320 px**:
   `house-old1` grayscale contrast(1.05) luminosity .9 `.plx` na
   `#362B20`, maska wjazdu od góry (transparent → .4 @ 18 % → #000
   42 %), gradient ciemny dołem (45 %→.62); przycisk „Porozmawiajmy
   o Twoim domu →" (krem `#ECE8DD`, do lewej w kontenerze 700/30).
   BEZ cytatu (inaczej niż CTA ekipy).
9. Stopka = chrome 4.1.

### 1b. Struktura DESKTOP (≥1024; kontener 1600px/var(--g))

1. **Hero 68vh** (`heroH = vh*0.68`): zdjęcie cover (obj-pos 60% 40%,
   BEZ parallaxu), gradient górny clamp(130–210) `rgba(24,19,14,.6)`
   + gradient DOLNY clamp(200–320) `rgba(24,19,14,.55)`; h1 **KREM**
   `#F5EFE3` przy dole na `var(--g)` + mono etykieta z prawej
   „PRACOWNIA EH/A / REMONTY DOMÓW Z HISTORIĄ" (krem .72).
2. **Manifest**: grid `.62fr 1fr 1fr` (gap clamp(30–54)), każda kolumna
   z kreskowanym border-top: [rycina `lisc-rycina1` rysowana
   `data-ryc-sandbox` (clamp(190–300), .42 multiply) | p1 | p2] — DWA
   akapity (mobile ma je POŁĄCZONE w jeden), justify+hyphens.
3. **FIZYKA**: grid 1fr/1fr [kicker+h2+p1 | kadr `ekologia-techno-ai`
   (kadrH2 ≈ clamp(220, 42vh, 420), tło #14100B) z badge „WAPIEŃ ·
   WEŁNA DRZEWNA · STARE DREWNO" w lewym DOLNYM rogu]; kreskowany
   separator; grid 1.45fr/1fr [blok diagramu (wys. diagH2 ≈
   clamp(150, 24vh, 250)) | p2]. **Diagram desktopu w eksporcie jest
   STATYCZNY** (zero klas `.lay`); strzałka na 74 % wysokości (mobile
   50 %), środkowe etykiety POZIOME (mobile wszystkie pionowe),
   krawędzie 9 % szerokości (mobile 52 px), grubsze pasy gradientów.
4. **UPCYCLING**: sep + grid 1fr/1fr [kicker+h2+p1 | kadr bala4
   (kadrH3 = kadrH2) z DWOMA badge'ami: zielony „BEZKOMPROMISOWO ·
   RELOKACJA BUDYNKÓW" lewy GÓRNY + „CZERNICA — REKONSTRUKCJA…" lewy
   dolny]; sep + grid 1fr/1fr [kadr bala3 + badge dolny | p2+p3].
5. **TRWAŁOŚĆ**: pas clamp(170, 29vh, 300) (drewno .34, maska 42 %,
   STATYCZNY — bez plx), kicker+h2 przy dole; sep + grid 1fr/1fr/1fr
   (gap clamp(36–67)) z 3 akapitami. **BEZ kolka na desktopie.**
6. **MIKROKLIMAT**: pas (hero 32% 62% + mgła .66), kicker+h2; treść:
   rycina house2 `data-ryc-sandbox` (right `--g·.18`, top −46, clamp
   (190–278), .2 multiply); grid 1.08fr/1fr [p1 rozmiarem leadu | p2];
   grid 3 kart; separator pełnej szerokości kontenera.
7. **CTA** clamp(280, 36vh, 380) (margin-top mikroPad ≈ max(30, 5.2vh)),
   maska .4 @ 16 %, gradient dolny od 40 %; przycisk WYŚRODKOWANY.
8. Stopka 4.1. Tło = paper-background repeat-y + dryf 0.15·scroll
   (= PaperBackdrop + `PAPER_BG_SPEED`). Paddingi sekcji z vh:
   sectionPad ≈ max(30px, 5.2vh), sectionPadS ≈ max(22px, 3.8vh),
   manifestPad ≈ max(26px, 4.2vh), trwaloscPadS ≈ max(20px, 3.4vh).

### 1c. Skrypt eksportu — zachowania

- **Zwijane akapity `cv(k, h)`** — funkcja IDENTYCZNA jak 4.4;
  wysokości: **`fz`/`up`/`tw` = 132 px** (×3; bez wariantu 128).
  Zwijanie MOBILE-ONLY (drzewo desktop renderuje pełny tekst).
  Wszystkie toggle w osobnych kontenerach pod pudłem.
- **DIAGRAM (mobile)**: IO na KONTENERZE diagramu (`diagRef`, próg
  30 %) → wszystkie dzieci `.lay/.arw/.arwh` dostają `lay-go`:
  `.lay` (5 warstw) `layIn .62s cubic-bezier(.22,.6,.2,1)` opacity
  0→1 + translateY(9px→0), delaye inline 0/.08/.16/.24/.32 s;
  `.arw` (kreskowana strzałka) `arwIn .9s cubic-bezier(.3,.05,.25,1)`
  **`scaleX(0→1)`, transform-origin left center**, delay .42 s;
  `.arwh` (2 groty) `arwFade .4s ease` opacity 0→1, delay 1.3 s.
  Wszystko za `@media (prefers-reduced-motion: no-preference)` — przy
  reduce/bez JS diagram statyczny i KOMPLETNY. Desktop: statyczny.
- **`.kolek`**: IO próg 30 % → `kolek-go` (parametry w §1a.6).
- **Nav desktop**: `navColor: solid ? '#211D18' : '#F5EFE3'` →
  **`tone="dark"`**; solid od `heroH − 40` (wzorzec `[data-navref]`);
  mobile lerp kremowy→atrament (od `heroB − 194`) → port binarny
  `data-solid` (korekta 4.2); auto-hide/progi bez zmian.
- Ruch: `.plx` d=0.18, `.plxr` d=0.10, `.ryc`/`.kolek` przy 30 %,
  `.rev` .68 s, rysowanie desktop przy linii 60 %, dryf tła
  0.15·scroll — wartości 1:1 z home-config; obsługuje
  `content-motion.ts` BEZ zmian (poza diagramem i kolkiem — §2.8).

## 2. Decyzje portu

1. **Prefiks widoku `.trd`**; wzorzec strony =
   `kompetencje-i-technologie.astro` (tokeny, dOnly/mOnly,
   `overflow-x: clip` + `isolation` + `--bg-cream` na `main.trd`).
2. **Tło = PaperBackdrop** (eksport: identyczna warstwa jak wszystkie
   dotychczasowe trasy; dryf desktop liczy content-motion,
   `PAPER_BG_SPEED`, kontrakt e2e).
3. **`Navbar tone="dark"`** (rozstrzygnięte Z EKSPORTU — §1c);
   `[data-navref]` na CAŁYM hero `.trd-hero` (h1 siedzi wewnątrz —
   offsetHeight = 430 px mobile / 68vh desktop; nie ma płyty tytułowej,
   więc bez grid-overlapu kompetencji).
4. **Hero z JEDNYM h1**: kolor per próg czystym CSS (mobile atrament na
   wygaszonym dole kadru; desktop krem na dolnym gradiencie); maska
   fade dolna mobile-only; etykieta mono = dOnly.
5. **Sekcje fizyka/upcycling/trwałość = świadome duplikacje
   dOnly/mOnly** (wzorzec rzemiosł kompetencji — eksport ma realnie
   różne kompozycje: mobile treść w zwijanych pudłach, desktop gridy):
   kicker+h2 WSPÓLNE (`.trd-sec-head`; tło płyty upcyclingu i pasów
   trwałość/mikroklimat = wspólny markup, bo desktop też je ma —
   wyjątek: płyta upcyclingu jest mOnly, desktop nie ma tam tła);
   akapity/kadry/diagram ZDUPLIKOWANE, treści w stałych frontmattera
   (`MAN_P`/`FIZ_P`/`UP_P`/`TRW_P`/`MIKRO_CARDS`/`DIAG_LAYERS` +
   badge'y), mobile-owy scalony akapit manifestu = `MAN_P.join(" ")`
   (kopie nie mogą się rozjechać). **Mikroklimat i CTA = jeden markup**
   (grid/@media; duplikat tylko rycina house2 — mobile `data-ryc`+
   `data-plxr`, desktop `data-rycsb="r"`, inne mechanizmy — wzorzec
   ekipy §2.7).
6. **Zwijane pudła ×3** (`sec-fizyka`/`sec-upcycling`/`sec-trwalosc`),
   `collapsedMax="132px"` każde; host = kontener 700/30 (wzorzec
   `.kmp-clp`), kadry full-bleed breakoutem `100vw`; ryciny/kolek
   absolute w treści (zwinięte pudło przycina je razem z maską).
7. **Kadry bala4/bala3 desktop** z badge'ami = wzorzec `.kmp-badge`;
   podpisy mobilnych kadrów i etykiety krawędzi diagramu
   (WNĘTRZE/ZEWNĘTRZE, podpis PARA WODNA): eksportowe rgba .5/.55 na
   papierze/`#F3EDE1` → **.65** (klasa korekty a11y 4.4 — ratchet axe
   od pustej allowlisty; badge'y desktop na mgle .92 zostają 1:1).
8. **ANIMOWANY DIAGRAM + KOLEK = osobny mały moduł strony**
   `src/components/sections/tradycja-motion.ts` (decyzja: NIE
   rozszerzamy content-motion — jego kontrakty „czysta funkcja
   geometrii / width-guard" zostają nietknięte; moduł ładowany
   dynamicznie za tą samą bramką js-motion, obok content-motion):
   - **Port na CSS TRANSITIONS, nie keyframes** (wzorzec `[data-rev]`):
     wszystkie animacje eksportu są dwustanowe (from→to), więc
     transition z transition-delay odtwarza kaskadę 1:1 (delaye warstw
     0/.08/.16/.24/.32, strzałka .42/scaleX, groty 1.3) — a freeze.css
     testów (`animation:none; transition:none`) sadza wtedy stan
     KOŃCOWY natychmiast po nadaniu `.in`, bez księgowości
     animationend/drop() (lekcja webkit-CI 4.4 zaadresowana
     konstrukcyjnie).
   - Markup SSR kompletny: stany startowe (opacity 0, translateY,
     scaleX(0)) uzbraja WYŁĄCZNIE `html.js-motion .trd [data-diag]` /
     `[data-kolek]` pod `@media <1024` (animacja jest mobile-only jak
     w eksporcie; desktopowa kopia diagramu bez atrybutu = zawsze
     statyczna). Bez JS / przy reduce diagram i kolek statyczne
     i kompletne.
   - Moduł: JEDEN IntersectionObserver o parametrach revIO
     content-motion (`rootMargin -10%`, threshold .01, elementy nad
     viewportem od razu) na `[data-diag]` (kontener — jak `diagRef`
     eksportu; `.in` na kontenerze odpala kaskadę dzieci) i
     `[data-kolek]`. Świadome odstępstwo od eksportowego progu 30 %:
     kolek siedzi w ZWINIĘTYM pudle (widoczne ~88 px z ~285 px ≈ 31 %
     — próg .3 byłby na granicy = flake), threshold .01 odpala
     deterministycznie także dla elementów przyciętych przez pudło;
     wizualnie różnica niezauważalna (2.2 s fade znaku wodnego).
   - Determinizm zrzutów: WSPÓLNY `revealSweep` dostaje w selektorze
     maruderów DODATKOWO `[data-diag]:not(.in)` i `[data-kolek]:not(.in)`
     (zmiana czysto addytywna — inne trasy nie mają tych atrybutów).
     Diagram w zwiniętym pudle fizyki leży POD oknem 132 px (niewidoczny
     na zrzucie -full), kolek odhacza się mimo przycięcia. Zrzuty BEZ
     maski — stany końcowe.
9. **Assety** (`optimize-images.mjs`, konwencja 1200–1456 q42–50):
   - NOWE fotografie: `hero-tradycja-i-ekologia1.webp` 1456 (LCP —
     eager+fetchpriority; reużyty też jako tło płyty mikroklimatu),
     `dom-z-bala4.webp` 1456, `dom-z-bala3.webp` 1456 (portret —
     szerokość wystarcza), `cegla-rozbiorkowa.webp` 1200 q42 (pod mgłą
     .66), `tradycja-i-ekologia-drewno-ai1.webp` 1200 q42 (opacity .34);
   - REUŻYTE: `ekologia-techno.webp` (1300 = zoptymalizowany
     `ekologia-techno-ai` z eksportu — pas mobile + kadr fizyki desktop),
     `house-old1.webp` (CTA), `eha-kolek-ryc-m.webp` (kolek — wariant
     Z ALFĄ, widoczny na mobile: lekcja 4.2 §2a), `lisc-rycina1.webp`
     (440, alfa; desktop manifest), `dom-ryc-house2/3/5` (alfa),
     `paper-background`. ZERO nowych rycin.
10. **Meta**: klucze `tradycjaPage.title`/`.description` w
    `src/i18n/ui.ts` (opis ze szkieletu).
11. **Schemat CMS niepotrzebny** (widok statyczny); breakpoint tylko
    1024 (`CONTENT_DESKTOP_MIN_PX`); drugiego progu 700 brak.
12. Deep-linki, JSON-LD, audyt fontów — poza zakresem (Etap 6).

## 3. Testy

- **e2e `tests/e2e/tradycja.spec.ts`** (wzorzec kompetencje.spec.ts):
  SSR bez JS (h1, 4 h2, PEŁNE akapity — duplikaty przez `p:visible`
  count 1; diagram kompletny statycznie: widoczna kopia z 5 warstwami;
  przyciski zwijania `hidden`); zwijane mobile ([data-clp] ×3,
  max-height 132, maska, aria, rozwiń/zwiń + kontrakt braku skoku
  ±2 px); desktop bez zwijania; **diagram po dojechaniu** (mobile: po
  rozwinięciu fizyki `.in` na [data-diag], warstwy opacity 1, strzałka
  scaleX→1, groty opacity 1 — expect.poll, kaskada trwa ~1.7 s;
  desktop: statycznie kompletny bez `.in`); **kolek po dojechaniu**
  (mobile: opacity → 0.14 przez expect.poll — transition 2.2 s);
  navbar tone="dark" przez expect.poll (progi z nav-config); CTA →
  /kontakt/; reveal kickera mikroklimatu po dojechaniu (mobile); dryf
  tła (desktop, PAPER_BG_SPEED); collectPageIssues; strażnik natywnego
  scrolla; `expectBreakpointFlip(CONTENT_DESKTOP_MIN_PX)`.
- **visual `tests/visual/tradycja.spec.ts`**: `usePreviewGuard` (widok
  NIE czyta kolekcji); WYŁĄCZNIE wspólny `revealSweep` (rozszerzony
  addytywnie — §2.8); zrzuty: `tradycja-top` / `tradycja-full`
  (zwinięte) / `tradycja-full-open` (mobile); fullPage `timeout:
  20_000` + per-shot `maxDiffPixelRatio: 0.001` (klasa decyzji 4.4;
  globalny próg nietknięty); maska `video`/`.dt-poster` (kontrakt —
  na trasie ich nie ma); diagram w stanach końcowych, bez maski.
- `skeleton.spec.ts`: wpis `/tradycja-i-ekologia/` WYPADA + `git rm`
  baseline'ów `skeleton-tradycja-i-ekologia-*` (oba komplety,
  24 pliki, w tym samym PR).
- Baseline'y `tradycja-*` NIE istnieją — generuje Mateusz (PR →
  workflow linux z kontrolą intruzów → darwin na końcu).

## 4. Co świadomie zostaje na Etap 4.5 cz. 2 i dalej

- `/obsluga-budowy/` (najlżejsza: hero + 3 sekcje + CTA) — osobny PR;
  konsumuje te same moduły; tradycja-motion jest widoko-specyficzny
  (obsługa nie ma diagramu).
- Kalibracja `--ryc-vis` (widoczność rycin mobile) — po ocenie na
  telefonie, jak 4.4.
- Audyt fontów/subsetów i JSON-LD — Etap 6.
