# Mini-analiza: /kompetencje-i-technologie/ (Etap 4.4, część 2 z 2)

Port `docs/design/export/kompetencje-i-technologie.html` (referencja
WYGLĄDU I ZACHOWANIA — podwójne drzewa, scroll w kontenerze fixed,
mnożniki `--k`/`--w`/cqw to artefakty Claude Design). Widok KONSUMUJE
moduły części 1 (`docs/analiza-ekipa.md` §2): `CollapsibleText` +
`collapsible.ts`, `content-motion.ts`, `content-config.ts`,
`Navbar tone="dark"`, `PaperBackdrop` — bez zmian ich mechanik.

## 1. Odczyty z eksportu

### 1a. Struktura MOBILE (<1024; kontener treści 700px/30px)

1. **Hero 430 px** (stała wysokość): zdjęcie
   `kompetencje-i-technologie-hero` `sepia(.1) saturate(.9)`, parallax
   `.plx`, maska `linear-gradient(#000 60%, transparent 100%)` (kadr
   wygasa w papier ku dołowi); u góry gradient przyciemniający 118 px
   `rgba(28,21,14,.62)` (czytelność KREMOWEGO paska — jak ekipa);
   h1 „Kompetencje i technologie." (serif 42 px, ATRAMENT) na dole
   hero. BEZ kickera i leadu w hero (oba są desktop-only w płycie).
2. **Lead**: italic serif 19 px „Inżynieria tradycji." + akapit
   wprowadzenia (14.5/1.7), padding 4px 30px 0.
3. **CIESIELSTWO — płyta tytułowa**: tło `mur-szachulcowy-ai1` `.plx`
   z maską fade (40 %→100 %) + mgła `rgba(250,247,241,.66)`; kicker
   mono `.rev` + h2 28 px `.rev d1` „Drewno. Ciesielstwo bez dróg na
   skróty" (padding 56/30/20).
4. **Treść ciesielstwa (zwijana, `cv('d1','132px')`)**: rycina house6
   za prawą krawędzią (150 px, right −74, opacity .28, `.ryc .ryc-r`),
   2 akapity; kadr `mur-szachulcowy.jpg` 210 px full-bleed `.plx`
   z maską fade 14/86; blok ZAKRES PRAC CIESIELSKICH (tło
   `mur-szachulcowy-ai2` opacity .16 z maską fade 22/78; kicker mono +
   4 karty pojęć w gridzie auto-fit 300). Link „Czytaj dalej →"
   w OSOBNYM kontenerze pod spodem (padding 14px 30px 0, kontener 700).
5. **MURARSTWO** — ten sam wzorzec: płyta (tło `cegla-i-kamien-ai1`),
   h2 „Cegła i kamień. Murarstwo z duszą"; zwijana treść
   (`cv('mu','132px')`): rycina house3 (right −64), 2 akapity, kadr
   `cegla-i-kamien2.jpg` 210 px `.plx`, blok ZAKRES PRAC MURARSKICH
   (tło `cegla-i-kamien3` .16, 4 karty); toggle w osobnym kontenerze.
6. **SKLEPIENIA** — płyta (tło `sklepienia-ai1`), h2 „Sklepienia.
   Korona naszego rzemiosła"; zwijana treść (`cv('sk','132px')`):
   rycina house7, 2 akapity (w p1 `<em>` „im trudniej, tym lepiej"),
   kadr `sklepienie-zagliste-web.jpg` 220 px `.plx` + podpis mono
   „SKLEPIENIA ŻAGLISTE — REALIZACJA EH/A" (kontener 700), blok
   TWORZYMY I ODTWARZAMY (kicker + 5 kart numerowanych 01–05: numer
   mono zielony + tytuł serif 18 px na `#F3EDE1`); toggle w osobnym
   kontenerze. **Cała zawartość (kadr + karty) siedzi WEWNĄTRZ
   zwijanego pudła** — jak w pozostałych rzemiosłach.
7. **FIZYKA BUDOWLI** (BEZ zwijania): ciemny pas 224 px `#171008`
   z `ekologia-techno-ai` (STATYCZNY — bez `.plx`; maska fade 12/90);
   kicker `.rev` + h2 `.rev d1` „Fizyka budowli. Ekologia, która
   działa"; akapit; rycina house5 (`.ryc .ryc-r .plxr`, right −70);
   karta TRADYCJA I EKOLOGIA (`#F3EDE1`, kicker + tekst + ZIELONY
   przycisk „Poznaj nasze podejście →" → /tradycja-i-ekologia/).
8. **INSTALACJE** (BEZ zwijania): płyta (tło `hydraulika-elektryka-ai`
   `.plx` + mgła), h2 „Współczesny krwiobieg w historycznym ciele";
   akapit 1; rycina house4 (`.ryc .ryc-r .plxr`); rząd [polaroid
   `instalacje.jpg` 126×162 w ramce + podpis „ROZDZIELACZ C.O." |
   akapit 2]; mozaika 2 kadrów w ramkach `#F3EDE1` z podpisami mono
   (`rozdzielnica.jpg` — karta o szerokości 0.75×H, portret 3:4;
   `podlogowka.jpg` — flex 1; H = clamp(90px, 44.4cqw−18.7px, 300px);
   kontener max-width 1000).
9. **ŚWIADOME GRANICE — na mobile JASNA sekcja** (ciemny blok jest
   desktop-only!): płyta (tło `naglowek-ost-sekcja-techn.jpg` `.plx` +
   mgła, padding 64/30/20), kicker + h2 „Stan surowy zamknięty +";
   zwijana treść (`cv('ss','128px')`): 2 akapity (w p2 `<em>` „stan
   surowy zamknięty +"); rycina house2 (`.ryc .ryc-r .plxr`) w warstwie
   z maską zwijania; link toggle INLINE w tym samym kontenerze (nie
   w osobnym); kreskowany separator → cytat italic 18 px wyśrodkowany
   („Malowanie ścian czy kładzenie glazury…") → separator → ZIELONY
   przycisk „Skontaktuj się z nami →" (do lewej) → kadr końcowy 280 px
   na `#362B20`: `czernica-elewacja-szachulcowa-3` grayscale
   luminosity .9 `.plx`, maska wjazdu od góry (transparent→#000 46 %).
10. Stopka = chrome 4.1.

### 1b. Struktura DESKTOP (≥1024; kontener 1600px/var(--g))

1. **Hero 62vh** (`heroH = vh*0.62`) — samo zdjęcie (`sepia(.14)
   saturate(.86)`, BEZ maski dolnej, BEZ parallaxu), gradient górny
   clamp(130–210 px) `rgba(24,19,14,.62)`; stan solid od `heroH − 40`
   (wzorzec `[data-navref]`).
2. **Płyta tytułowa** nachodzi na dół hero (margin-top
   −clamp(64,6.6vw,106)): papier `#FAF7F1` + ramka + cień, kicker
   KOMPETENCJE + h1 + lead italic; max-width clamp(600,62vw,990),
   wcięcie var(--g).
3. **Akapit wprowadzający**: blok do prawej (szer. clamp(560,58vw,930)),
   `column-count: 2`, justify+hyphens; rycina house6 z LEWEJ
   (rysowana `data-rycsb`, clamp(250,24vw,384), opacity .2).
4. **CIESIELSTWO**: grid 1.04fr/.96fr — lewa kolumna [kicker + h2 +
   kreskowany separator + 2 akapity justify], prawa kadr
   `mur-szachulcowy.jpg` (min-h ≈ fit(560,340)); niżej ZAKRES PRAC
   CIESIELSKICH: kicker + 4 karty 2×2 (max-w clamp(640,68vw,1088)),
   rycina house6 z PRAWEJ (`data-rycsb`). Bez teł ai1/ai2 na desktopie.
5. **MURARSTWO**: mozaika kadrów grid 1.32fr/.68fr
   (`cegla-i-kamien2.jpg` + `cegla-i-kamien.jpg`, wys. ≈ fit(460,300),
   separator border-left krem); płyta tytułowa nachodzi
   (margin-top −clamp(58,6vw,96), max-w clamp(560,58vw,928)); grid
   1.06fr/.94fr [2 akapity | kicker ZAKRES + 4 karty w kolumnie];
   rycina house6 z LEWEJ przy dole.
6. **SKLEPIENIA**: grid 1.04fr/.96fr [kadr `sklepienie-zagliste-web`
   (min-h ≈ fit(520,330)) z BADGE podpisu w lewym dolnym rogu | karta
   `#F3EDE1` z kicker + h2 + separator + 2 akapity]; rycina house6
   z PRAWEJ przy dole.
7. **TWORZYMY I ODTWARZAMY = CIEMNY PAS** `#211D18` full-width:
   kicker krem .72 + grid 5 kolumn z separatorami border-left
   `rgba(245,239,227,.22)`; numery mono `rgba(160,177,140,.95)`,
   tytuły serif clamp(19,1.6vw,26) krem.
8. **FIZYKA BUDOWLI**: grid .6fr/.4fr [kadr `ekologia-techno-ai`
   (min-h ≈ cap(560,.62,320)) z badge „WAPIEŃ, WEŁNA DRZEWNA…"
   w lewym górnym rogu | kicker + h2 + separator + akapit]; karta
   TRADYCJA I EKOLOGIA nachodzi na kadr z prawej strony
   (margin-left −clamp(80,8.4vw,134), z-index 2).
9. **INSTALACJE**: grid .46fr/.54fr [kadr `instalacje.jpg`
   (min-h ≈ cap(660,.50,260)) z badge „ROZDZIELACZ C.O." | płyta
   `#FAF7F1` nachodzi z prawej (margin-left −clamp(70,7.4vw,118)):
   kicker + h2 + separator + 2 akapity, rycina house4 `data-rycsb`];
   niżej para kadrów grid 1fr/1fr w ramkach z podpisami
   (`rozdzielnica` + `podlogowka`, wys. ≈ cap(600,.38,220)).
10. **ŚWIADOME GRANICE = CIEMNY BLOK** `#211D18`:
    `czernica-elewacja-szachulcowa-3` luminosity opacity .5 + gradient
    w prawo `rgba(33,29,24,.94)→.72`; grid .9fr/1.1fr [kicker zielony
    jasny + h2 krem | 2 akapity `rgba(245,239,227,.82)` za kreskowaną
    linią border-left]; niżej separator + grid [cytat italic krem
    clamp(19,1.53vw,24) | KREMOWY przycisk „Skontaktuj się z nami →"
    (`#F5EFE3`, tekst atrament)]. Wysokości/paddingi liczone z vh
    (granTop .04, PadT .072, PadM .038, PadB .062, blok cap(520,.58,300)).
11. Stopka 4.1. Tło całości = paper-background repeat-y + dryf
    0.15·scroll (= PaperBackdrop + `PAPER_BG_SPEED`).

### 1c. Skrypt eksportu — zachowania

- **Zwijane akapity `cv(k, h)`** — funkcja IDENTYCZNA jak w ekipie;
  wysokości: **`d1`/`mu`/`sk` = 132 px, `ss` = 128 px** (odczyt
  z `baseVals()`); zwijanie MOBILE-ONLY (drzewo desktop renderuje
  pełny tekst bez toggle'ów). Toggle rzemiosł w osobnym kontenerze POD
  pudłem, toggle `ss` inline.
- **Nav desktop**: `navColor: solid ? '#211D18' : '#F5EFE3'`,
  `logoCol` analogicznie → **`tone="dark"`** (jak ekipa); mobile lerp
  kremowy→atrament (sy 236→332 od `heroB−194`) → port binarny
  `data-solid` (korekta 4.2). Solid desktop od `heroH − 40` = wzorzec
  `[data-navref]`; auto-hide/progi bez zmian.
- Ruch: `.plx` d=0.18, `.plxr` d=0.10, `.ryc` przy 30 %, `.rev` .68 s,
  rysowanie desktop przy linii 60 %, dryf tła 0.15·scroll — wartości
  1:1 z home-config; wszystko obsługuje `content-motion.ts` BEZ zmian.

## 2. Decyzje portu

1. **Prefiks widoku `.kmp`**; wzorzec strony = `ekipa-eha.astro`
   (tokeny typograficzne desktop identyczne z `.eka` — eksporty używają
   tych samych formuł: `--body`, `--h2`, `--mono`, `--monos`, `--lhb`);
   `overflow-x: clip` + `isolation` + `--bg-cream` na `main.kmp`.
2. **Tło = PaperBackdrop** (eksport: mobile `center/cover` .2, desktop
   `repeat-y` + dryf 0.15·scroll — identycznie jak `/`, /realizacje/,
   /ekipa-eha/); dryf liczy content-motion (`PAPER_BG_SPEED`),
   kontrakt e2e jak w ekipie.
3. **`Navbar tone="dark"`** (rozstrzygnięte Z EKSPORTU — §1c). Hero
   tutaj NIE jest ciemne jak w ekipie, ale kremowy pasek czyta się
   dzięki górnemu gradientowi przyciemniającemu (mobile 118 px,
   desktop clamp(130,13vw,210)). `[data-navref]` na WRAPPERZE OBRAZU
   hero (`.kmp-hero-ph` — offsetHeight = 430 px mobile / 62vh desktop;
   płyta tytułowa desktopu do progu NIE wlicza się, jak w eksporcie).
4. **Hero z JEDNYM h1 (bez duplikacji nagłówka)** — grid-overlap:
   `.kmp-head { display: grid }`; mobile: rząd 430 px, obraz i blok
   tytułowy w TEJ SAMEJ komórce (`align-self: end` — h1 siada na
   wygaszonym dole kadru, padding-bottom 22 px); desktop: rzędy
   `calc(62vh − clamp(64px,6.6vw,106px)) auto`, obraz w rzędzie 1
   z jawną wysokością 62vh (wystaje w dół pod płytę), blok tytułowy
   w rzędzie 2 jako papierowa płyta (z-index wyżej) — nachodzenie
   z eksportu bez znanej z góry wysokości płyty. Kicker KOMPETENCJE
   i lead „Inżynieria tradycji." w płycie = dOnly; lead mobile =
   mOnly kopia w sekcji intro (świadoma duplikacja — wzorzec 4.1).
5. **Sekcje rzemiosł (ciesielstwo/murarstwo/sklepienia) = świadome
   duplikacje dOnly/mOnly** — eksport ma dla nich REALNIE różne
   kompozycje (mobile: płyta z tłem → zwijane pudło z kadrem i kartami;
   desktop: grid tekst|kadr / mozaika / karty poza pudłem, bez teł ai):
   - **kicker + h2 = JEDEN element** (wspólny `.kmp-sec-head`; mobile:
     płyta full-bleed z tłem `[data-plx]` + mgłą — tło i mgła mOnly;
     desktop: nagłówek kolumny tekstu / karta / płyta nachodząca —
     czysty CSS per sekcja);
   - **akapity, kadry i bloki kart ZDUPLIKOWANE**: mobile wewnątrz
     `CollapsibleText` (host mOnly), desktop własne poddrzewo dOnly
     (precedens: trud-p1 i OBSZAR z cz. 1; assety wspólne). Grid-
     akrobatyka łącząca kicker/h2 poza pudłem z kadrem w pudle
     wymagałaby łamania struktury komponentu — odrzucona.
   - Blok TWORZYMY I ODTWARZAMY: mobile = jasne karty WEWNĄTRZ
     zwijanego pudła sklepień (mOnly), desktop = osobny ciemny pas
     `.kmp-two` (dOnly) — duplikacja 5 pozycji.
6. **Fizyka budowli, instalacje i świadome granice = JEDEN markup**
   (grid-areas/kolejność, duplikaty tylko punktowe): fizyka — ciemny
   pas mOnly + kadr z badge dOnly, kicker/h2/akapit/karta wspólne;
   instalacje — płyta-tło mOnly + kadr z badge dOnly, polaroid mOnly,
   kicker/h2/akapity/para kadrów wspólne (para: mobile flex z kartą
   3:4 przez `--iph: clamp(90px, 44.4vw − 18.7px, 300px)` — cqw
   eksportu ≈ vw, odchyłka pomijalna; desktop grid 1fr/1fr); granice —
   sekcja jasna mobile / ciemna desktop czystym CSS (tło czernica +
   gradient = dOnly, płyta naglowek = mOnly, kadr końcowy = mOnly),
   **`CollapsibleText id="sec-granice"` WSPÓLNY dla obu progów**
   (desktop: pełny tekst w prawej kolumnie grida, przycisk i tak
   display:none), cytat + przycisk CTA wspólne (kolory per próg:
   zielony/krem — ten sam tekst i href).
7. **Zwijane pudła**: `collapsedMax` **132 px** (sec-ciesielstwo,
   sec-murarstwo, sec-sklepienia) i **128 px** (sec-granice) — odczyt
   §1c. Host rzemiosł = kontener 700/30 (jak `.s-clp` ekipy), przycisk
   naturalnie w osi kontenera („osobny kontener" eksportu = te same
   współrzędne); kadry full-bleed WEWNĄTRZ pudła łamią kontener
   klasycznym breakoutem (`width:100vw; margin-left: calc(50% − 50vw)`
   — overflow-x:clip na .kmp pilnuje osi X). Ryciny w pudłach jak
   w ekipie: absolute w treści — zwinięte pudło przycina je razem
   z maską (eksport miał wariant z maską na zewnętrznej warstwie dla
   `ss` — uproszczenie 1:1 z decyzją cz. 1 dla trud/s3).
8. **Ruch**: konsumpcja `content-motion.ts` bez zmian — mobile
   `[data-rev]`/`[data-rev-d="1"]` (kickery+h2 płyt), `[data-ryc="r"]`
   (WSZYSTKIE ryciny mobile tego widoku rysują od prawej), `[data-plxr]`
   (house5/house4/house2 — house6/house3/house7 w rzemiosłach są bez
   parallaxu, 1:1 z eksportem), `[data-plx]` (hero, tła płyt, kadry
   w pudłach; pas fizyki i kadr końcowy granic — pas jest STATYCZNY
   w eksporcie, kadr granic MA `.plx`); desktop `[data-rycsb]`:
   intro house6 "l", zakres-cies house6 "r", murarstwo house6 "l",
   sklepienia house6 "r", instalacje house4 "r" (strony wg położenia —
   reguła `drawRyc` eksportu). CSS rysowania/revealów skopiowany
   z ekipy (tokeny --ryc-wedge/lines + keyframes `kmpRycL/R`, scope
   `.kmp`). Bez kaskady nth-child (rząd domków był tylko w ekipie).
9. **Assety** (`optimize-images.mjs`, konwencja 1200–1456 q42–50;
   nazwy wg tabeli README — `czernica-elewacja-szachulcowa-3`
   po przemianowaniu):
   - NOWE fotografie: `kompetencje-i-technologie-hero.webp` 1456
     (LCP — eager+fetchpriority; istniejący `kompetencje-hero.webp`
     640→1200 należy do zajawki `/` i ZOSTAJE nietknięty),
     `mur-szachulcowy-full.webp` 1456, `cegla-i-kamien2-full.webp`
     1456, `sklepienie-zagliste-full.webp` 1456 (sufiks `-full` =
     duży wariant istniejącego assetu zajawek — wzorzec sufiksu `-m`
     z 4.2 w drugą stronę), `cegla-i-kamien.webp` 1200,
     `cegla-i-kamien3.webp` 1200, `instalacje-full.webp` 1200,
     `rozdzielnica.webp` 1200, `podlogowka.webp` 1200,
     `czernica-elewacja-szachulcowa-3.webp` 1456; tła płyt (pod mgłą
     .66 / opacity .16 — niższe q): `mur-szachulcowy-ai1/-ai2`,
     `cegla-i-kamien-ai1`, `sklepienia-ai1`,
     `hydraulika-elektryka-ai`, `naglowek-ost-sekcja-techn` — 1200;
   - NOWE ryciny Z ALFĄ (widoczne na mobile — lekcja 4.2 §2a; sharp
     `alphaQuality` 45 jak warianty cz. 1): `dom-ryc-house5.webp`,
     `dom-ryc-house7.webp` (420 px);
   - REUŻYTE: `ekologia-techno.webp` (1300 — wystarcza na kadr .6fr),
     `instalacje.webp` (640 — polaroid 126×162),
     `dom-ryc-house2/3/4/6`, `paper-background`.
10. **Meta**: klucze `kompetencjePage.title`/`.description`
    w `src/i18n/ui.ts` (opis ze szkieletu).
10a. **Korekta a11y** (ratchet axe od pustej allowlisty — ta sama
    klasa co podpisy portretów ekipy): podpisy kadrów
    (`.skl-kadr figcaption`, `.inst-pol figcaption`,
    `.ip-card figcaption`) rgba .55 → **.65** — eksportowe .55 na
    `#F3EDE1` nie łapało AA (color-contrast serious). Badge'e
    desktop (.62/.68 na mgle .92+) przechodzą i zostają 1:1.
11. **Schemat CMS niepotrzebny** (widok statyczny, nie czyta
    kolekcji); breakpoint tylko 1024 (`CONTENT_DESKTOP_MIN_PX`),
    drugiego progu 700 ten widok nie ma.
12. Deep-linki, JSON-LD, audyt fontów — poza zakresem (jak cz. 1).

## 3. Testy

- **e2e `tests/e2e/kompetencje.spec.ts`** (wzorzec ekipa.spec.ts):
  SSR bez JS (h1, nagłówki sekcji, PEŁNE akapity — asercje przez
  `:visible` tam, gdzie treść jest zduplikowana dOnly/mOnly; przyciski
  zwijania `hidden`); zwijane akapity mobile ([data-clp] ×4,
  max-height 132/128, maska, aria, rozwiń/zwiń + kontrakt braku skoku
  ±2 px); desktop bez zwijania; navbar tone="dark" (kolor burgera
  przez **expect.poll** — transition 0.3 s, progi z nav-config,
  navref = `.kmp-hero-ph`); CTA → /tradycja-i-ekologia/ (karta fizyki)
  i → /kontakt/ (granice); reveal kickera granic po dojechaniu
  (mobile); dryf tła (desktop, PAPER_BG_SPEED); collectPageIssues;
  strażnik natywnego scrolla;
  `expectBreakpointFlip(CONTENT_DESKTOP_MIN_PX)` (płyta-tło mOnly /
  kadr ciesielstwa dOnly / ciemny pas `.kmp-two` dOnly).
- **visual `tests/visual/kompetencje.spec.ts`**: `usePreviewGuard`
  (widok NIE czyta kolekcji — fixture zbędny); WYŁĄCZNIE wspólny
  `revealSweep` z tests/helpers/visual.ts; zrzuty: `kompetencje-top`,
  `kompetencje-full` (zwinięte), `kompetencje-full-open` (mobile);
  fullPage z `timeout: 20_000` + per-shot `maxDiffPixelRatio: 0.001`
  (klasa decyzji z ekipy — globalny próg nietknięty); maska
  `video`/`.dt-poster` (kontrakt speców — na trasie ich nie ma).
- `skeleton.spec.ts`: wpis `/kompetencje-i-technologie/` WYPADA +
  `git rm` baseline'ów `skeleton-kompetencje-i-technologie-*`
  (oba komplety, 24 pliki, w tym samym PR).
- Baseline'y `kompetencje-*` NIE istnieją — generuje Mateusz
  (workflow linux z kontrolą intruzów → darwin na końcu).

## 4. Co świadomie zostaje na Etap 4.5 i dalej

- `/tradycja-i-ekologia/` (animowany diagram + `.kolek`) +
  `/obsluga-budowy/` — konsumują `CollapsibleText`(jeśli design ma
  zwijanie), `content-motion.ts`, `content-config.ts`, PaperBackdrop
  i ewentualnie `tone="dark"` wg własnych eksportów.
- Kalibracja `--ryc-vis` (widoczność rycin mobile) — po ocenie na
  telefonie, jak w cz. 1.
- Audyt fontów/subsetów i JSON-LD — Etap 6.
