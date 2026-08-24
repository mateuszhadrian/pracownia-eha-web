# Mini-analiza: /ekipa-eha/ (Etap 4.4, część 1 z 2)

Port `docs/design/export/ekipa-eha.html` (referencja WYGLĄDU
I ZACHOWANIA — podwójne drzewa, scroll w kontenerze fixed, mnożniki
`--k`/`--w`/cqw to artefakty Claude Design). Druga część wzorca
(`/kompetencje-i-technologie/`) idzie w OSOBNYM PR-ze i konsumuje
moduły zaprojektowane tutaj (zwijane akapity + moduł ruchu). Eksport
kompetencji przejrzany pod kątem wspólnego modułu (§2).

## 1. Odczyty z eksportu

### 1a. Struktura MOBILE (<1024; kontener treści 700px/30px)

1. **Hero 420 px** (stała wysokość, niezależna od viewportu): podkład
   `#362B20` z maską `linear-gradient(#000 60%, transparent 100%)`
   (zdjęcie wygasa w papier ku dołowi), zdjęcie `eha-o-nas2`
   `grayscale(1) contrast(1.04)` + `mix-blend-mode: luminosity`,
   opacity .9, parallax `.plx` (±9 % kadru); u góry gradient
   przyciemniający 110 px (czytelność KREMOWEGO paska — §3);
   h1 „Ekipa EH/A." (serif 42 px, atrament) na DOLE hero — siedzi już
   na wygaszonej, papierowej części kadru.
2. **Lead**: italic serif 19 px „Dwa umysły, jedna rzemieślnicza
   pasja." + akapit wprowadzenia (14.5/1.7).
3. **Pas zdjęcia** `maciek-pod-sufitem` 196 px, maska pionowa fade
   góra+dół (18 %/82 %), `sepia(.26) saturate(.86)`, parallax `.plx`.
4. **Biogram ŁUKASZ**: rząd [karta portretu 104×128 w ramce
   `#F3EDE1` + podpis mono „ŁUKASZ"] + h3 21 px; pod spodem ZWIJANY
   akapit (zwinięty `max-height: 98px`) + link „Czytaj dalej →";
   rycina house1 (174 px, opacity .5) wystaje za prawą krawędź,
   `.ryc .plxr`.
5. **Biogram MACIEK**: lustrzany (h3 z prawej `text-align: right`,
   portret z prawej), zwijany 98 px; rycina house8 z lewej (118 px,
   opacity .35) `.ryc .plxr`.
6. Kreskowany separator (dashed .3) → **płyta „NASZE KORZENIE /
   Dolnośląskie dziedzictwo…"**: tło `house-old1` z maską fade
   (40 %→100 %) + mgła `rgba(250,247,241,.68)`, kicker mono `.rev` +
   h2 28 px `.rev d1`.
7. **Treść s1 (zwijana, 112 px)**: akapit o Niemczech (z `<em>`),
   2 karty pojęć (UMGEBINDEHAUS / FACHWERK — ramka `#F3EDE1`, mono
   600 10 px + opis 12.5 px), akapit „Naszym celem…" z ryciną
   `eha-kolek-ryc` POD tekstem (430 px, opacity .12, multiply,
   `.ryc`); link „Czytaj dalej →".
8. **Płyta „INŻYNIERIA TRADYCJI / Im trudniej, tym lepiej"**: 190 px,
   tło `technical-ryc` multiply z maską fade 55 %→100 % + gradient
   mgły, kicker `.rev` + h2 `.rev d1` przy dole.
9. **Treść s2 (zwijana, 112 px)**: akapit „Tam, gdzie inni…" (rycina
   house6 za prawą krawędzią, .28), akapit o ciesielstwie (rycina
   house8 za lewą, .25, `.plxr`), rząd 3 rycin domków (house8/house6/
   house4, wys. 54/64/54, opacity .45, `.ryc` z delayami 0/.35/.7 s),
   cytat italic 19 px „Nie jesteśmy odtwórcami…"; „Czytaj dalej →".
10. **Płyta „SIEĆ MISTRZÓW / Sprawdzona sieć mistrzów…"**: tło
    `ekipa-budowlana1` fade 40 % + mgła .68, kicker+h2 `.rev`.
11. **Treść s3 (zwijana, 112 px)**: akapit „EH/A to my…", kreskowany
    separator, blok motta (rycina `technical-elements-ryc` 42 px,
    kicker „NASZ MODEL DZIAŁANIA JEST PROSTY", italic „Ty przyjeżdżasz
    na budowę…"), separator, akapit „Cały ciężar inwestycji…" (rycina
    house2 za lewą, .2, `.plxr`), 2 karty (ŁUKASZ · ŻELAZNE
    HARMONOGRAMY / MACIEK · TECHNOLOGIE I MATERIAŁY), akapit „Dzięki
    temu…"; „Czytaj dalej →".
12. **CTA 320 px**: `ekipa-budowlana2` z maską wjazdu od góry
    (transparent→#000 42 %) + gradient ciemny dołem, italic krem
    „Zaopiekujemy się także Twoim domem." + przycisk „Porozmawiajmy
    o Twoim domu →" (krem `#ECE8DD`, jak CTA 4.3).
13. Stopka = chrome 4.1 (bez zmian).
14. Rycina house3 (130 px, prawa krawędź, top 442 px) `.ryc .plxr`
    w warstwie nad hero/leadem.

### 1b. Struktura DESKTOP (≥1024; kontener 1600px/var(--g))

1. **Hero 70vh** — ta sama warstwa co mobile (maska fade od 62 %,
   gradient górny), h1 przy dolnej krawędzi na `var(--g)`; BEZ
   parallaxu (desktop eksportu statyczny — jak 4.2/4.3).
2. **Intro**: wiersz [italic lead (kolumna ~28 %) | akapit
   wprowadzenia]; ryciny `data-ryc-sandbox` (rysowane): house3 z lewej
   (.3) + `warsztat-ryc1` z prawej (.16).
3. **Pas zdjęcia** 520 px, maska fade 72 %→100 %, statyczny.
4. **Biogramy** (tło: rycina `plan-ryc1` .12 na środku, rysowana):
   h2 z kreskowanym podkreśleniem (Maciek: wyrównany do prawej),
   wiersz [portret ~202×250 | akapit w 2 KOLUMNACH
   (`column-count: 2`, justify, hyphens)] — **BEZ zwijania, pełny
   tekst** (zwijane akapity są MOBILE-ONLY, potwierdzone w obu
   eksportach 4.4); Maciek lustrzanie.
5. **Płyta dziedzictwo** 460 px (fade 58 %), kicker+h2 przy dole.
6. **Treść s1**: lead-akapit większym stopniem (`--lead`), 2 karty
   w wierszu, akapit w 2 kolumnach z ryciną kolek z prawej (.14,
   rysowana `data-ryc-sandbox`).
7. **„Im trudniej"**: wiersz [panel `technical-ryc` (56 % szer.,
   520 px, maska fade w prawo 74 %, kicker+h2 wewnątrz przy dole) |
   akapit „Tam, gdzie inni…" wyrównany do dołu]; niżej akapit
   o ciesielstwie w 2 kolumnach (nad nim kreskowany separator);
   wiersz [3 ryciny domków statyczne (84–100 px, .45) | cytat
   z prawej].
8. **Płyta sieć mistrzów** 500 px (fade 44 %): grid [kicker+h2 |
   rycina technical-elements 92 px z prawej, statyczna].
9. **Treść s3**: wiersz [akapit „EH/A to my…" (1.3fr) | „Cały
   ciężar…" (1fr)], blok motta między kreskowanymi liniami, 2 karty
   grid 1fr 1fr, akapit „Dzięki temu…".
10. **CTA 540 px** + stopka 4.1.

### 1c. Skrypt eksportu — zachowania

- **Zwijane akapity** (`cv(k, h)` — identyczna funkcja w eksporcie
  kompetencji): zwinięty = `max-height: h` + `overflow: hidden` +
  maska `linear-gradient(#000 45%, transparent 100%)`, link „Czytaj
  dalej →"; rozwinięty = `max-height: none`, bez maski,
  `overflow: visible`, link „Zwiń ↑". Przełączenie NATYCHMIASTOWE
  (bez animacji wysokości). Wysokości zwinięcia: ekipa 98 px
  (biogramy) / 112 px (sekcje); kompetencje 132 px / 128 px —
  wysokość to parametr per instancja.
- Nav mobile: kolor ikon lerpowany kremowy→atrament (sy 236→332) +
  glow — eha portuje to na binarny stan `data-solid` (korekta 4.2);
  desktop: `navColor`/`logoCol` = `#F5EFE3` przed stanem solid,
  `#211D18` po (przejście .3 s) — §3.
- Desktop: `heroH = 70vh`, solid od `heroH − 40` (= wzorzec
  `[data-navref]` z 4.2); rysowanie rycin przy linii 60 % viewportu
  (= `[data-rycsb]` z home-motion); dryf tła `+0.15·scroll`
  (= `PAPER_BG_SPEED` 0.85, PaperBackdrop).
- Mobile: `.plx` d=0.18 (±9 % kadru), `.plxr` d=0.10 (±15 px),
  ryciny `.ryc` przy 30 % widoczności — wartości 1:1 z home-config.

## 2. Decyzje portu

1. **Wspólny moduł zwijanych akapitów** —
   `src/components/sections/CollapsibleText.astro` + skrypt
   `src/components/sections/collapsible.ts` (initCollapsibles()):
   - **API**: `<CollapsibleText id="bio-lukasz" collapsedMax="98px"
     class?>` ze slotem treści. Komponent renderuje
     `div.clp[data-clp]` → `div.clp-body#id` (slot) + `button.clp-btn
     [aria-controls=id][aria-expanded="true"] hidden` z DWOMA spanami
     etykiet („Czytaj dalej →"/„Zwiń ↑" — przełącza CSS po
     aria-expanded). Zwinięta wysokość per instancja przez
     `--clp-max` (inline style) — kompetencje podadzą swoje 132/128.
   - **Progressive enhancement jak paginacja E5**: SSR = pełny tekst,
     przycisk `hidden`; `initCollapsibles()` (ładowany ZAWSZE — to
     funkcja, nie dekoracja; działa też przy reduce) zdejmuje
     `hidden`, ustawia `aria-expanded="false"` i atrybut
     `data-collapsed` na hoście.
   - **Mobile-only**: styl zwinięcia (`max-height: var(--clp-max)`,
     `overflow: hidden`, maska 45 %) działa wyłącznie pod
     `@media (max-width: 1023.98px)`; przycisk na desktopie
     `display: none`. JS nie potrzebuje media query — stan trzyma
     atrybut, desktopowy CSS go ignoruje (przejście przez próg nie
     wymaga obsługi; stan rozwinięcia przeżywa resize).
   - **Bez animacji wysokości** — eksport przełącza natychmiast
     (React re-render); animowany max-height = reflow jank na słabym
     GPU. Świadomie 1:1 z referencją.
   - **„Zwiń" bez skoku scrolla**: przy zwijaniu JS mierzy pozycję
     przycisku przed/po i koryguje `window.scrollBy(delta)` — przycisk
     zostaje pod palcem (eksport tego nie robił, ale w eksporcie
     scroll żył w kontenerze fixed; na dokumencie zwinięcie długiej
     sekcji katapultowałoby widok w treść następnej).
   - Style bazowe `.clp` w komponencie (scoped + `:global` dla stanu);
     typografia treści i odstępy = CSS strony (jak każda sekcja).
2. **Stan bez JS**: pełne akapity, przyciski ukryte (`hidden` w SSR),
   zero masek — kontrakt e2e z wyłączonym JS.
3. **Tło widoku = PaperBackdrop** (wzorzec `/` i `/realizacje/`):
   eksport ma identyczną warstwę `paper-background` (mobile
   `center/cover` .2, desktop `repeat-y` + dryf 0.15·scroll). `.eka`
   (kontener widoku) dostaje `isolation: isolate` + `--bg-cream`;
   dryf desktop w module ruchu ze stałą `PAPER_BG_SPEED`; kontrakt
   e2e jak w work-index.
4. **Navbar na ciemnym hero (NOWOŚĆ w chrome — wariant „tone")**:
   eksport (oba drzewa) pokazuje KREMOWY pasek (logo, linki, burger
   `#F5EFE3`) nad ciemnym zdjęciem hero i atramentowy po wejściu
   w stan solid. Port: prop `tone="dark"` Navbara → atrybut
   `data-tone="dark"` na `.hdr`; CSS: przy `[data-tone="dark"]`
   BEZ `[data-solid]` i BEZ `[data-open]` (sheet jest papierowy —
   ikona X musi być atramentowa) `--hdr-ink` i kolor znaczka
   przechodzą w krem (transition .3 s jak eksport). Zero zmian
   mechaniki (progi/auto-hide/skrypt bez zmian); pozostałe trasy bez
   propa = wygląd dotychczasowy (baseline'y chrome-* na /realizacje/
   NIETKNIĘTE). Hero dostaje `[data-navref]` → solid od
   `heroH − 40 px` (mobile 420 px → próg 380 px; desktop 70vh) —
   mechanizm 4.1/4.2 bez zmian.
5. **Moduł ruchu WSPÓLNY dla stron treściowych 4.4** —
   `src/components/sections/content-motion.ts` (wzorzec work-motion,
   rozszerzony o desktopowe rysowanie i parallax kadrów ze strony
   głównej): `[data-rev]` (tempo delung), `[data-ryc]` mobile (30 %,
   maska schodzi po animationend/animationcancel — D-Q1), `[data-rycsb]`
   desktop (linia 60 % = rootMargin −40 %), `[data-plxr]` ±15 px,
   `[data-plx]` ±9 % kadru (zapas top −9 %/height 118 % w CSS — D-U1),
   dryf PaperBackdrop — stałe importowane z home-config
   (`PLXR_MAX_PX`, `PLX_AMT`, `PAPER_BG_SPEED`). Ładowany dynamicznie
   za bramką `js-motion`; bez JS/reduce strona statyczna i kompletna.
   Część 2 (kompetencje) importuje ten sam moduł.
6. **Breakpoint**: `CONTENT_DESKTOP_MIN_PX = 1024`
   w `src/components/sections/content-config.ts` (importują moduł
   ruchu i testy; `@media` w parze — sections.md). Drugiego progu
   700 px ten widok nie ma.
7. **Jeden markup, dwa układy (bez podwójnych drzew)** — @media +
   grid/order; świadome DUPLIKACJE tam, gdzie treść siedzi w innym
   poddrzewie (wzorzec „OBSZAR dOnly/mOnly" ze stopki 4.1):
   - s2: akapit „Tam, gdzie inni…" — desktop obok panelu płyty
     (dOnly), mobile w zwijanej treści (mOnly);
   - rycina technical-elements — desktop w płycie s3 (dOnly), mobile
     w bloku motta (mOnly);
   - ryciny dekoracyjne o różnych pozycjach per próg (house3 itd.) —
     osobne elementy dOnly/mOnly (desktopowe z `data-rycsb`, mobilne
     z `data-ryc`/`data-plxr`).
   - s3: kolejność mobile (p1 → motto → p2) vs desktop (p1+p2 obok
     siebie → motto) robi `order` na gridzie — bez duplikacji tekstu.
   - biogramy: grid z `grid-template-areas` per próg (mobile: rząd
     portret+nagłówek nad tekstem; desktop: nagłówek nad rzędem
     portret+tekst 2-kolumnowy).
8. **Nagłówki biogramów = h2 na obu progach** (eksport mobile ma h3,
   desktop h2 — ujednolicenie na h2 porządkuje hierarchię: h1 hero →
   h2 biogramy/płyty).
9. **Assety** (`optimize-images.mjs`; pełne szerokości wg konwencji
   1200–1456 px z 4.2/4.3):
   - NOWE: `eha-o-nas2.webp` 1456 (hero, LCP — eager), `maciek-pod-
     sufitem.webp` 1456, `house-old1.webp` 1456, `technical-ryc.webp`
     1456, `ekipa-budowlana1.webp` 1456, `ekipa-budowlana2.webp` 1456
     (fotografie — bez alfy);
   - NOWE Z ALFĄ (widoczne na mobile — lekcja 4.2 §2a, sharp
     z `alphaQuality` jak warianty 4.2): `technical-elements-ryc.webp`
     (324 px natywne), `eha-kolek-ryc-m.webp` 560 px (desktop zostaje
     na spłaszczonym `eha-kolek-ryc.webp`);
   - REUŻYTE z repo: `lukasz-portrait`, `maciek2` (portrety 460×690),
     `plan-ryc1`, `warsztat-ryc1` (desktop-only, spłaszczone),
     `dom-ryc-house1/2/3/4/6/8` (z alfą), `paper-background`.
10. **Meta**: klucze `ekipaPage.title`/`ekipaPage.description`
    w `src/i18n/ui.ts` (wzorzec workPage; opis ze szkieletu).
11. **Hero mobile 420 px stałe** (eksport) — bez mechaniki 100svh
    i D-Q2 (nie ma tu sekcji liczonych z viewportu; parallaxy liczą
    z `innerHeight` jak work-motion na /realizacje/ — przyjęte w 4.3).
12. **Deep-linki, JSON-LD, audyt fontów** — poza zakresem (Etap 6 /
    decyzje wcześniejsze).

## 3. Testy

- **e2e `tests/e2e/ekipa.spec.ts`**: SSR bez JS (h1, nagłówki, PEŁNE
  akapity widoczne, przyciski zwijania ukryte); zwijane akapity mobile
  (po JS: data-collapsed + aria-expanded=false + max-height 98/112 +
  maska; klik → rozwinięcie, treść w całości, „Zwiń ↑"; zwinięcie →
  przycisk zostaje w viewporcie — kontrakt braku skoku); desktop bez
  zwijania (przycisk display:none, max-height none); navbar tone
  (krem na górze → atrament po solid, `data-tone="dark"` +
  kontrakt navref/solid z progami z nav-config); CTA → /kontakt/;
  reveal płyty po dojechaniu (mobile); dryf tła (desktop,
  PAPER_BG_SPEED); collectPageIssues; strażnik natywnego scrolla;
  `expectBreakpointFlip(CONTENT_DESKTOP_MIN_PX)`.
- **visual `tests/visual/ekipa.spec.ts`**: `usePreviewGuard`
  (widok NIE czyta kolekcji realizacji — fixture zbędny);
  `ekipa-top` (hero + kremowy pasek), `ekipa-full` (fullPage po
  przejeździe rewealującym; akapity ZWINIĘTE — stan domyślny),
  `ekipa-full-open` (fullPage z rozwiniętymi wszystkimi — TYLKO
  profile mobile, desktop nie ma zwijania). Wideo/`.dt-poster` pod
  maską (kontrakt speców — na tej trasie ich nie ma).
- `skeleton.spec.ts`: wpis `/ekipa-eha/` WYPADA + kasacja
  `skeleton-ekipa-eha-*` (oba komplety, 24 → w tym PR).
- Baseline'y `ekipa-*` NIE istnieją — generuje Mateusz (workflow
  linux → darwin na końcu).

## 4. Co świadomie zostaje na część 2 (kompetencje) i dalej

- Konsumpcja `CollapsibleText` + `content-motion` przez
  `/kompetencje-i-technologie/` (wysokości 132/128 px, link „Czytaj
  dalej" w osobnym kontenerze — komponent na to gotowy: przycisk
  styluje CSS strony); ciemny blok „świadome granice"; mozaiki
  kadrów kompetencji.
- Ewentualna kalibracja `--ryc-vis` (mnożnik widoczności rycin jak na
  `/`) — na razie opacity 1:1 z eksportu; do oceny na telefonie.
- Audyt fontów/subsetów (Etap 6); JSON-LD (Etap 6).
