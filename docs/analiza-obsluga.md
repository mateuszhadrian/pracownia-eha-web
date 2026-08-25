# Mini-analiza: /obsluga-budowy/ (Etap 4.5, część 2 z 2)

Źródła: `docs/design/export/obsluga-budowy.html` (referencja WYGLĄDU
I ZACHOWANIA — nie implementacji), instrukcja wykonawcza §4.5
(„obsługa budowy = najlżejsza strona: hero + 3 sekcje + CTA"),
decyzje E1–E14, wzorce portu z `docs/analiza-ekipa.md`,
`docs/analiza-kompetencje.md` i `docs/analiza-tradycja.md`.

Widok zamyka Etap 4.5 i jest ostatnią stroną treściową przed
`/polityka-prywatnosci/` (4.6) i `/kontakt/` (Etap 5). **Zero nowych
mechanik** — wszystko konsumuje moduły 4.4/4.5.

## 1. Odczyty z eksportu

### 1a. Struktura MOBILE (<1024; kontener treści 700 px / padding 30 px)

| # | Blok | Zawartość |
| - | ---- | --------- |
| 1 | hero `430px` (`#2A241C`) | zdjęcie `ekipa-budowlana1` (`plx`, sepia .6 saturate .85, `object-position:55% 42%`), gradient górny 130 px (.55→0), gradient dolny 62 % (0→.85), h1 „Obsługa budowy." krem 42 px przy dole (bottom 22 px) |
| 2 | intro | motto italic „Twój święty spokój." + akapit wprowadzający; rycina `dom-ryc-house4` (`ryc-r` + `plxr`, right −70, top 96, 136 px, opacity .26) |
| 3 | sekcja „JEDEN PUNKT KONTAKTU" | nagłówek NA zdjęciu `plac-budowy-photo2` (`plx`, maska `#000 42%`→0, welon `rgba(250,247,241,.62)`, padding-top 150 px): kicker `.rev` + h2 28 px `.rev.d1`; poniżej na papierze 2 akapity + rycina `koparka-rycina1` (`ryc-r`+`plxr`, right −84, top 34, 180 px, opacity .24) |
| 4 | sekcja „PEŁNA KONTROLA Z DYSTANSU" | ten sam wzorzec ze zdjęciem `plac-budowy-photo3` (maska 44 %, welon .5, padding-top 154 px, h2 30 px); poniżej **akapit → motto italic → akapit** + rycina `zuraw-rycina1` (`ryc-r`, BEZ parallaxu, right −96, top 0, 230 px, opacity .24) |
| 5 | sekcja „PODSUMOWANIE / Czas na Twój ruch" | zdjęcie `czas-na-twoj-ruch-naglowek` (`plx`, maska 62 %, welon-gradient .34→.78→.9, padding-top 210 px): kicker `.rev`, h2 34 px `.rev.d1`, akapit `.rev.d2`, akapit z `<em>` |
| 6 | pudło CTA | ramka `rgba(33,29,24,.22)`, max 644 px / `calc(100% − 52px)`, padding 26/24; rycina `dom-ryc-house1` (`ryc-r`, right −46, bottom −30, 150 px, opacity .22); motto italic 18 px + przycisk `#57654A`/krem „Skontaktuj się z nami →" |
| 7 | pas domykający `300px` | `maciek-kroi` (`plx`, grayscale contrast 1.06, `mix-blend-mode:luminosity`, opacity .9) na `#362B20`, maska od góry (0 → .4 @18 % → `#000` @46 %) |
| 8 | stopka | chrome 4.1 |

### 1b. Struktura DESKTOP (≥1024; kontener 1600 px / `var(--g)`)

| # | Blok | Zawartość |
| - | ---- | --------- |
| 1 | hero + wstęp = **jeden ekran** (`height: screenH`) | `[data-hero]` = `flex:1` (zdjęcie `ekipa-budowlana1` statyczne, gradient górny `clamp(150,15.5,250)`, dolny 66 %); w środku h1 `clamp(40,4.4vw,70)` krem, pod nim rząd nad linią `rgba(245,239,227,.28)`: motto italic po lewej + mono „PRACOWNIA EH/A / REMONTY DOMÓW Z HISTORIĄ" po prawej. Pod hero blok wstępu (`flex:none`): kreskowana linia górna + akapit w `column-count: 2` |
| 2 | „JEDEN PUNKT KONTAKTU" | pas zdjęcia `plac-budowy-photo2` po LEWEJ na całą wysokość sekcji (`width:34%`); treść z `padding-left:25%` (karta NACHODZI na pas): papierowa karta z kickerem + h2, pod nią grid 1fr 1fr dwóch akapitów z dodatkowym `padding-left: clamp(140,13.9vw,222)`; rycina `koparka` (`rycsb`) prawy-dolny róg, 240–352 px, opacity .19 |
| 3 | „PEŁNA KONTROLA Z DYSTANSU" | lustro #2 (pas `plac-budowy-photo3` po PRAWEJ, treść `padding-right:25%`): karta, motto italic (max-width 88 %), kreskowana linia, grid 1fr 1fr akapitów; rycina `zuraw` (`rycsb`) lewy-dolny róg, opacity .19 |
| 4 | „PODSUMOWANIE / Czas na Twój ruch" | zdjęcie `czas-na-twoj-ruch-naglowek` na CAŁEJ sekcji (maska 46 %→96 %, welon-gradient .42→.8→.94); grid `1.05fr .8fr`: po lewej kicker + h2 (`×1.16`) + kreskowana linia + grid 1fr 1fr akapitów, po prawej **karta CTA** (papier, ramka, cień) z ryciną `dom-ryc-house1` (`rycsb`) i przyciskiem |
| 5 | stopka | chrome 4.1 |

**Desktop NIE MA pasa `maciek-kroi`** ani osobnego pudła CTA pod treścią —
CTA jest prawą kolumną sekcji podsumowania.

### 1c. Skrypt eksportu — zachowania

- `grep -c 'cv('` = **0** → **strona NIE MA zwijanych akapitów**
  (jedyna z widoków treściowych 4.4/4.5). Konsekwencje: bez
  `CollapsibleText`/`collapsible.ts`, bez zrzutu `*-full-open`,
  bez `[data-clp]` w testach.
- `navColor: so ? '#211D18' : '#F5EFE3'`, `logoCol: so ? '#4C3B2B' :
'#F5EFE3'`, a na mobile `mNavColor` miksuje krem → atrament po zjeździe
  z hero ⇒ **`<Navbar tone="dark" />`**.
- Próg solidu: `y > navHeroH − 40`, gdzie `navHeroH = [data-hero]
.offsetHeight` — 1:1 z `NAV_SOLID_HERO_PAD_PX`; `[data-hero]` obejmuje
  WYŁĄCZNIE kadr hero (blok wstępu jest poniżej, w tym samym ekranie).
- Tło: `paper-background` `top center / 100% auto repeat-y` z
  `backgroundPositionY = scroll × 0.15` (desktop) i `center/cover`
  opacity .2 (mobile) ⇒ **`PaperBackdrop`** bez zmian (`PAPER_BG_SPEED`).
- Ruch: `PARALLAX .15` (dryf tła), `RYC_LINE .6` (rysowanie desktop),
  mobile `plx` d=.18, `plxr` d=.10 → ±15 px, IO revealów/rycin
  threshold .3 — komplet pokrywa `content-motion.ts`.
- Auto-hide, dropdown „O nas", sheet mobilny = chrome 4.1, bez zmian.

## 2. Decyzje portu

1. **Zero nowych modułów.** Widok konsumuje `content-motion.ts`,
   `content-config.ts`, `PaperBackdrop`, `Navbar tone="dark"`, `Footer`.
   `tradycja-motion.ts` jest widoko-specyficzny (diagram + kolek) —
   NIE jest importowany. `collapsible.ts` NIE wchodzi (brak `cv()`).
   Prefiks klas widoku: **`.obs`**.
2. **Hero + wstęp = jeden ekran (desktop).** `.obs-top { height: 100vh;
display: flex; flex-direction: column }`, `.obs-hero { flex: 1 }`,
   `.obs-intro { flex: none }` — odwzorowanie `screenH` eksportu przy
   nakładkowym pasku (navbar jest `fixed`, nie zajmuje miejsca, tak jak
   `sticky height:0` eksportu). Mobile: `.obs-hero { height: 430px }`,
   `.obs-top` bez wysokości. **`[data-navref]` na `.obs-hero`** (wzorzec
   kompetencji: navref na kadrze, nie na całej sekcji — blok wstępu nie
   może wliczać się do progu solidu).
3. **Jeden markup na oba progi wszędzie, gdzie się da** — sekcje 3–5
   różnią się KOMPOZYCJĄ, nie treścią, więc zamiast duplikatów
   dOnly/mOnly stosujemy **grid-overlap** (wzorzec hero kompetencji):
   - kadr sekcji (`.obs-ph`) i nagłówek (`.obs-head`) siedzą mobile
     w TEJ SAMEJ komórce gridu (kadr dostaje wysokość nagłówka
     automatycznie — bez zgadywania pikseli), a na desktopie kadr
     przechodzi w `position: absolute` (pas 34 % / cała sekcja)
     i wypada z flow;
   - sekcja podsumowania trzyma **CTA w swoim markupie**: mobile grid
     `"ph" / "cta"` (pudło pod kadrem), desktop `"txt cta"` z kadrem
     `absolute inset:0` pod całością.
   Świadome duplikaty ograniczone do: **motto** „Twój święty spokój."
   (dOnly w hero / mOnly na czele wstępu — realnie inna sekcja i inny
   kolor), mono-tag hero (dOnly), rycina `house4` wstępu (mOnly), pas
   `maciek-kroi` (mOnly), kreskowane linie desktopu (dOnly, dekoracja).
   Jedyna powtarzana TREŚĆ (motto) siedzi w stałej frontmattera `MOTTO`.
4. **Kolejność akapitów sekcji 4 bez duplikatu.** Mobile chce
   akapit → motto → akapit, desktop motto → linia → grid akapitów.
   Markup ma je jako rodzeństwo (`lead`, `rule`, `p1`, `p2`); mobile
   przestawia `order`, desktop układa `grid-template-areas`. Zero kopii.
5. **Reveale 1:1 z eksportu** (mobile-only, jak we wszystkich widokach
   4.2–4.5): kickery + h2 (`data-rev-d="1"`) w sekcjach 3–5 oraz
   pierwszy akapit podsumowania (`data-rev-d="2"` — nowa wartość
   opóźnienia w tym widoku, `.18s`, wzorzec z `index.astro`).
6. **Parallaxy**: `[data-plx]` na kadrach hero / s3 / s4 / s5 /
   pas `maciek-kroi` (zapas `top:-9%; height:118%` w CSS — D-U1,
   zdejmowany na desktopie), `[data-plxr]` na `house4` i `koparce`
   (mobile). `zuraw` mobile BEZ parallaxu (tak w eksporcie).
7. **Ryciny dwiema kopiami mOnly/dOnly** (wzorzec tradycji: `data-ryc`
   i `data-rycsb` na osobnych elementach — jeden element z obydwoma
   atrybutami dostawałby `.in` od DWÓCH obserwatorów `content-motion`).
   Wszystkie z `mix-blend-mode: multiply`.
8. **Assety — plan (2 nowe fotografie + 1 wariant alfa; reszta z repo)**:
   | Plik | Skąd | Uwagi |
   | ---- | ---- | ----- |
   | `ekipa-budowlana1.webp` (1456×816, 33 KB) | JEST | hero — `eager` + `fetchpriority="high"` (LCP) |
   | `plac-budowy-photo2.webp` (1456×816, 73 KB) | JEST | sekcja 3 |
   | `plac-budowy-photo3.webp` (1200×673, 47 KB) | JEST | sekcja 4 — **świadomie BEZ wariantu `-full`**: to dekoracyjny pas pod `sepia(.18)`, a upscale na pasie 34 % przy 1920 px to ≤1,15×; wariant `-full` kosztowałby ~65 KB na najlżejszej stronie |
   | `koparka-rycina1.webp` (420×558, alfa) | JEST | mobile + desktop |
   | `dom-ryc-house4.webp` / `dom-ryc-house1.webp` (alfa) | JEST | wstęp / CTA |
   | `zuraw-rycina1.webp` (560×743, **bez alfy**) | JEST | tylko DESKTOP (dziś dOnly na `/`) |
   | **`zuraw-rycina1-m.webp`** (460 px, **alfa**, 105 KB) | NOWY | rycina widoczna na MOBILE musi mieć alfę — lekcja 4.2 §2a (`body{position:fixed}` sheeta gubi `mix-blend-mode` w starym WebKicie i spłaszczona na biel rycina świeci białym pudłem); wzorzec nazwy `telefon-rycina1-m` / `eha-kolek-ryc-m`. Szerokość 460 px = dokładnie dpr2 dla kadru 230 px (`q42`, `alphaQuality 40`) — alfa jest droga (przy 560 px ta sama rycina waży 155 KB) |
   | **`czas-na-twoj-ruch-naglowek.webp`** (1456, q42, 45 KB) | NOWY | tło sekcji podsumowania — pod ciężkim welonem (.34→.9 mobile, .42→.94 desktop), stąd niskie q |
   | **`maciek-kroi.webp`** (1000, q42, 69 KB) | NOWY | pas domykający, mOnly, grayscale + luminosity (wariant grayscale w pliku dawał ledwie 4 KB zysku — została standardowa ścieżka `optimize-images.mjs`) |
9. **Kontrasty / a11y**: eksport nie ma na tej stronie tekstów
   `rgba(...,.5–.55)` — klasa korekty z 4.4/4.5 nie ma tu zastosowania.
   Kicker `rgba(87,101,74,.95)`, mono-tag hero `rgba(245,239,227,.72)`
   na ciemnym kadrze i przycisk `#57654A`/`#F5EFE3` (kontrast 5,37:1)
   przechodzą; allowlista axe zostaje PUSTA.
10. **Bez zmian w schemacie CMS** — widok nie czyta kolekcji realizacji
    (stąd `usePreviewGuard`, nie `useVisualFixtureGuard`).
11. **GOTCHA gridu (złapana przy porcie, kontrakt w e2e)**: absolutnie
    pozycjonowane dziecko kontenera gridu z JAWNYM `grid-area` ma za blok
    zawierający swoją KOMÓRKĘ, nie padding-box kontenera (CSS Grid §9.2).
    Kadr sekcji podsumowania (`.s3-ph`) dziedziczy `grid-area: txt`
    z warstwy mobilnej, więc na desktopie `position:absolute; inset:0`
    dawało zdjęcie wielkości LEWEJ KOLUMNY zamiast pełnego bleedu —
    lekarstwo to `grid-area: auto` w regule desktopowej. Sekcji 03/04
    problem nie dotyczy, bo tam kontener przestaje być gridem
    (`display: block`). Sonda układu w e2e pilnuje `.s3-ph` = rozmiar
    sekcji (testy wizualne pokazałyby to dopiero jako pixel-diff bez
    diagnozy).
12. **Pudła dekoracyjne przycinamy `overflow: clip`**, nie `hidden`
    (lekcja webkit-CI (5) z 4.4 cz. 1: `hidden` daje się przewinąć
    PROGRAMOWO i rozjeżdża zrzuty przy dociskaniu maruderów w
    `revealSweep`).

## 3. Testy

- **e2e `tests/e2e/obsluga.spec.ts`** (wzorzec `tradycja.spec.ts`):
  SSR bez JS (h1, trzy h2, akapity — asercje `:visible` tam, gdzie
  markup ma duplikat dOnly/mOnly; **kontrakt braku `[data-clp]`** —
  strona świadomie nie zwija), navbar `tone="dark"` przez `expect.poll`
  (transition 0.3 s) z progami `NAV_SOLID_HERO_PAD_PX`, CTA → `/kontakt/`,
  reveal kickera podsumowania po dojechaniu, dryf `PaperBackdrop`
  (desktop), `collectPageIssues`, strażnik natywnego scrolla,
  `expectBreakpointFlip(CONTENT_DESKTOP_MIN_PX)` na trójce
  `.obs-band` (mOnly) / `.s2-rule` (dOnly) / `.obs-hero-row` (dOnly).
  Dwie sondy układu desktopowego: hero + wstęp = DOKŁADNIE jeden ekran
  (`screenH` eksportu) i `.s3-ph` = rozmiar całej sekcji (§2 pkt 11).
  Sonda D-U1 na mobile: każdy `[data-plx]` ma wysokość ≥ `1 + PLX_AMT`
  wysokości kadru (zapas ≥ ruch — testy wizualne tego nie pilnują).
- **visual `tests/visual/obsluga.spec.ts`**: `usePreviewGuard` +
  `prepareSweep` + WSPÓLNY `revealSweep`; zrzuty `obsluga-top`
  i `obsluga-full` (fullPage: `timeout: 20 s`, per-shot
  `maxDiffPixelRatio: 0.001` — klasa decyzji 4.4). **Bez `*-full-open`**
  (brak zwijania) ⇒ `FULLOPEN_MAX_DIFF_RATIO` nie dotyczy tego widoku.
  Maska `video` + `.dt-poster` jako kontrakt speców.
- `skeleton.spec.ts`: wpis `/obsluga-budowy/` znika razem z
  baseline'ami `skeleton-obsluga-budowy-*` (oba komplety, 24 pliki).
  W `ROUTES` zostają `/kontakt/` i `/polityka-prywatnosci/` — plik
  zostaje do Etapów 4.6/5.

## 4. Co świadomie zostaje na dalej

- **Etap 4.6 `/polityka-prywatnosci/`**: 9 sekcji 1:1 z designu, sticky
  spis treści, data obowiązywania, sloty antyscrapingowe.
- **Etap 5 `/kontakt/`**: formularz E9 (4 pola), Turnstile, Pages
  Function; ostatnia trasa ze `skeleton.spec.ts` po 4.6.
- **Waga widoku (pomiar na buildzie)**: JS = skrypt strony 0,3 KB +
  `content-motion` 2,2 KB ≈ **2,5 KB raw ponad chrome** (Navbar 7,7 KB
  + Footer 0,1 KB) — najlżejszy widok treściowy serwisu (tradycja
  ≈ 3,6 KB). Obrazy: 672 KB łącznie dla obu progów, z czego mobile nie
  pobiera desktopowego `zuraw-rycina1` (lazy + `display:none`).
  LHCI mierzy `/` i `/polityka-prywatnosci/` — ten PR nie rusza budżetów.
- **Etap 6**: podpięcie węzłów JSON-LD + geo, audyt subsetów fontów
  (dziś 12 plików — WARN budżetu „≤ 8"), ewentualne zacieśnienie LCP.
- **Wariant `plac-budowy-photo3-full`** (pkt 8) — gdyby pas na dużym
  monitorze okazał się miękki po ocenie na sprzęcie.
- **`index-full` z per-shot progiem 0.001** — otwarty kandydat z 4.5
  cz. 1, dotyka baseline'ów `/`, decyzja Mateusza (poza tym PR-em).
