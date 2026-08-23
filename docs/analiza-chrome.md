# Mini-analiza 4.1 — chrome globalny (navbar + menu mobilne + stopka)

Referencje: `docs/design/export/*.html` (chrome identyczny 8/8 — porównane
`handleScroll`/`mnVals`/`baseVals` między index/realizacje/polityka/obsługa);
zachowanie przeklikane na `index.html` i `realizacje.html`. Decyzje E9/E11/E14
bez zmian. Mechanika sheeta = `overlay.ts` z kopii delung (gest `touch*`
NIETKNIĘTY) — wymieniam wyłącznie markup i skin.

## 1. Odczyty z eksportów (wygląd + zachowanie)

### Navbar desktop (≥1024)

- Pasek NAKŁADKOWY (w eksporcie `sticky; height:0` w kontenerze scrolla =
  efektywnie fixed): wysokość **72 px**, padding poziomy = margines strony,
  logo = SAM ZNACZEK (`eha-logo-sign`, sepia `#4C3B2B`, ~44–64 px),
  pozycje IBM Plex Mono 400, uppercase, letter-spacing .16em, ~11–13.8 px,
  kolor `#211D18`, hover → zieleń `#57654A` (zwykła zmiana koloru — BEZ
  fali liter i halo z szablonu delung; to skin delung, nie eha).
- **Stan „solid"**: nad hero pasek jest przezroczysty (strona i tak jest
  „papierem"); po przekroczeniu `heroH - 40` wjeżdża tło `#FAF7F1`
  + tekstura papieru (opacity .2) + cień `0 1px 0 rgba(33,29,24,.09),
  0 10px 30px rgba(33,29,24,.06)` (przejście opacity .3s).
- **Auto-hide (E11)** — algorytm z eksportu (port 1:1):
  - `y ≤ 70` → pasek zawsze widoczny, akumulator zerowany;
  - delta w dół `> 2 px` → chowaj (`translateY(-125%)` + opacity 0
    + `pointer-events:none`; transform .4s cubic-bezier(.4,0,.2,1),
    opacity .26s), CHYBA że kursor w strefie górnej;
  - scroll w górę: akumulator `upAcc`; po **> 60 px** w górę → pokaż;
  - **strefa kursora**: `max(96px, 12% wysokości okna)` — wejście kursora
    pokazuje pasek; wyjście ze strefy przy `y > 70` i `upAcc ≤ 60`
    → pasek chowa się z powrotem; `mouseleave` dokumentu = jak wyjście
    ze strefy (ale przy otwartym dropdownie ignorowane);
  - **gotcha dropdownu**: przy otwartym panelu strefa kursora sięga
    `dół panelu + 48 px` — zjazd kursora z toggle'a na pozycje panelu
    nie chowa paska (bez tego pasek „uciekałby spod panelu");
  - schowanie paska ZAMYKA dropdown (panel nigdy nie zostaje sam).
- **Dropdown „O nas"**: toggle na KLIK (chevron 12×8, opacity .55 → 1,
  rotate 180; pozycja aktywna: kolor `#57654A` + underline
  `rgba(87,101,74,.55)`); panel wycentrowany pod pozycją: tło `#FFFDF8`
  + tekstura, border `rgba(33,29,24,.12)`, cień `0 20px 48px
  rgba(33,29,24,.13)`, padding 6, min-width ~190–238 px; pozycje IBM Plex
  Sans (bez uppercase), hover `rgba(87,101,74,.09)` + `#414D37`;
  klik poza panelem zamyka. Trzy linki: Ekipa EH/A / Kompetencje
  i technologie / Tradycja i ekologia.

### Navbar mobile (<1024)

- Pasek FIXED, **bez auto-hide** (wzorzec 8/8 eksportów: auto-hide jest
  desktop-only; E11 mówi o kursorze — na dotyku nie istnieje): logo-znaczek
  48 px + przycisk menu 44×44 (ikona **2 kreski → X**, rotate ±45; bez
  napisu „MENU" z szablonu).
- **Glow**: pas 160 px u góry (gradient papieru + blur 9px, maska w dół),
  opacity = `min(1, scrollY/130) · 0.85` — pasek nie ma twardego tła,
  czytelność nad treścią daje glow. Wygładzanie własną pętlą rAF
  (scroll.md — Safari async scrolling).

### Menu mobilne (bottom sheet)

- Skin „papier” zamiast ciemnego skinu szablonu: panel `#FAF7F1`, radius
  20 px, cień `0 -14px 44px rgba(24,19,14,.26)`, tekstura papieru .22,
  rycina domu (`dom-ryc-house1`) w prawym dolnym rogu (168 px, opacity .28,
  multiply); scrim `rgba(33,29,24,.34)`; grabber 40×4 `rgba(33,29,24,.22)`.
- Pozycje: EB Garamond 500 29 px `#211D18`, min-height 56 px, separatory
  kreskowane `rgba(76,59,43,.3)`; kaskada wjazdów delay `.06 + i·.045 s`.
- **Akordeon „O nas"** (pierwsza pozycja): chevron 14×9, rozwinięcie
  max-height 0→180 px + opacity; podlinki IBM Plex Sans 15.5 px, zieleń
  `#57654A`, wcięcie 34 px, min-height 46 px; nagłówek akordeonu po
  rozwinięciu zielony.
- Stopka sheeta: border-top `rgba(33,29,24,.14)`, DWA telefony — etykieta
  mono 9 px (MACIEK/ŁUKASZ) nad numerem EB Garamond 500 23 px — przez
  sloty `contact-details` (bez maila — tak jak w designie).
- Mechanika (Esc, scrim, swipe-down, focus-trap, blokada scrolla) =
  `overlay.ts` bez zmian; hamburger→X sterowany `data-open` jak dotąd.

### Stopka (wszystkie 8 tras, w tym /realizacje/ — E14)

- Tło `#211D18`, tekst `#F5EFE3`; nagłówki kolumn mono 600 ~8.5–10 px
  letter-spacing .16em + kreskowany separator.
- **Desktop**: lewe pasmo (~28 %, przyciemnione `rgba(0,0,0,.2)`):
  logo-znaczek kremowy, „REMONTY DOMÓW Z HISTORIĄ / DOLNY ŚLĄSK · CAŁA
  POLSKA", italik EB Garamond „Dom z historią zasługuje na spokojny
  remont.", rycina koparki (invert+sepia, opacity .22). Prawa część —
  3 kolumny: **O NAS** (3 podstrony + Polityka prywatności przygaszona),
  **OFERTA** (Realizacje / Obsługa budowy / Kontakt + „Dolny Śląsk,
  okolice Jeleniej Góry…"), **KONTAKT** (2 telefony mono z etykietami
  MACIEK/ŁUKASZ, mail, godziny + NIP/REGON, Instagram/Facebook
  z kreskowanym podkreśleniem).
- **Mobile**: nagłówek logo-znaczek + motto po prawej; tabela
  etykieta/wartość (74 px / reszta, kreskowane separatory): O NAS,
  STRONY (w mobile ta kolumna nazywa się STRONY, nie OFERTA — tak
  w eksporcie), TEL., E-MAIL, OBSZAR, DANE, SOCIAL; rycina koparki
  w tle po prawej.
- **Pas dolny** (tło `rgba(0,0,0,.16)`, border-top): „© 2026 PRACOWNIA
  EH/A" + link POLITYKA PRYWATNOŚCI (mono, kreskowane podkreślenie);
  po prawej **„NA GÓRĘ ↑"** — w eksporcie martwy `href="#"`, u nas
  podpięty scroll na górę (smooth; przy `prefers-reduced-motion` skok).
- Telefony/mail WYŁĄCZNIE przez sloty `a[data-tel]`/`a[data-mail]`
  (antyscraping D-CH5) — etykiety osób w SSR, numery składa JS.

## 2. Decyzje portu

| #   | Decyzja                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Pasek `position: fixed` (desktop i mobile) — wierny designowi nakładkowy chrome; `--hdr-h` zostaje (ResizeObserver) do heroes 4.2. SkeletonPage dostaje `padding-top` z zapasem na pasek (szkielety i tak wypadają w 4.2–4.6)                     |
| C2  | Stan „solid": próg = `[data-navref].offsetHeight - 40` gdy hero istnieje (wchodzi w 4.2); DZIŚ fallback „po 8 px scrolla" — na stronach bez hero pasek dostaje papier+cień od razu po ruszeniu scrollem (nad treścią przezroczysty pasek = kolizja) |
| C3  | Propsy `variant`/`over`/`tone` Navbara (spadek po delung: proces/o-nas) WYCIĘTE — chrome eha jest jeden; mechanizm `--p` zastąpiony stanami `data-solid`/`data-hidden`                                                                            |
| C4  | Auto-hide 1:1 z eksportu (progi 70/2/60 px, strefa `max(96px,12vh)`, rozszerzenie `panel+48px`, mouseleave); stałe w `nav-config.ts` obok `NAV_DESKTOP_MIN_PX`; bez wygładzania rAF (stan binarny, animuje CSS) — rAF tylko dla glow mobile        |
| C5  | Skin nav delung wycięty: bez fali liter per-znak, bez halo, bez zielonego podkreślenia aktywnej pozycji (design nie ma wskaźnika aktywnej strony). `aria-current="page"` ZOSTAJE (a11y) + subtelnie zielony kolor pozycji bieżącej (nasza adaptacja) |
| C6  | Dropdown: `<button aria-expanded aria-controls>` + panel `<div role="menu">`? NIE — zwykła lista linków w `<div id>` (menu pattern wymaga pełnej klawiszologii; lista linków = prostsza i poprawna). Esc zamyka dropdown (adaptacja UX), Tab naturalny |
| C7  | Sheet: struktura/atrybuty overlay.ts bez zmian (`data-overlay*`, grabber, `touch*`); wymiana skinu na papier + akordeon `<button>` (max-height + aria-expanded) + kaskada wg designu                                                                |
| C8  | Ryciny: `koparka-rycina1.png` i `dom-ryc-house1.png` przez `optimize-images.mjs` → WebP w `src/assets/` (koparka ~600 px, dom ~400 px szerokości); tekstury papieru = istniejący `paper-tile.webp` (nie wnosimy 2,2 MB `paper-background.png`)       |
| C9  | Kontrasty drobnych tekstów podbite do AA jak dotąd w szkielecie (alphy .5 eksportu → ~.64–.7; ratchet axe jest PUSTY i taki ma zostać); rozmiary czcionek stopki lekko podniesione tam, gdzie eksport schodzi do 9 px (nieczytelne, a design to znosi) |
| C10 | Skalowanie `cqw`/`--k`/`--w` eksportów → `clamp()` od szerokości viewportu (wzorce 390/1440), jak w całym projekcie                                                                                                                                |
| C11 | Mobile bez auto-hide (design 8/8); glow rAF za bramką zwykłego `scroll` passive — bez motion-gate (to czytelność, nie dekoracja ruchu; przy reduce zostaje, bo nie animuje niczego czasowo)                                                          |

## 3. Czego świadomie NIE przenosimy

- Podwójne drzewa markupu `isMobile`/`isDesktop`, szablonowanie `{{ }}`,
  `sc-if`/`sc-for`, runtime `support.js`, presety szerokości — artefakty
  Claude Design. U nas: jeden markup + `@media 1024`.
- Scroll w kontenerze `fixed` — scroll NATYWNY na dokumencie (E11,
  scroll.md); auto-hide słucha `window.scrollY`.
- `navPadB` (zdefiniowany, nieużyty w markupie eksportu — martwy kod).
- Pełny `paper-background.png` jako tekstura paska/panelu/sheeta —
  zastępuje go kafelek `paper-tile.webp` z Etapu 0.6.
- Martwy `href="#"` przy „NA GÓRĘ ↑" — podpinamy scroll (niedoróbka
  eksportu wskazana w instrukcji).
- Brak stopki na `realizacje.html` — stopka wchodzi na WSZYSTKIE trasy
  (E14).

## 4. Testy (kontrakty 4.1)

- **e2e `navigation.spec.ts`**: auto-hide (scroll w dół chowa —
  `data-hidden` + bounding box poza viewportem; ≥60 px w górę pokazuje;
  u samej góry zawsze widoczny; kursor w strefie górnej pokazuje;
  otwarty dropdown + kursor nad panelem blokuje chowanie przy scrollu
  w dół); dropdown (klik otwiera/zamyka, aria-expanded, klik poza
  zamyka, Esc zamyka, nawigacja na 3 podstrony); akordeon w sheecie
  (rozwija podlinki, nawigacja); „NA GÓRĘ ↑" (scroll wraca do 0);
  kontrakt breakpointu `expectBreakpointFlip(1024)` na `.hdr-nav`/`.mbtn`;
  istniejące testy sheeta/antyscrapingu/logo — aktualizacja selektorów,
  kontrakty bez zmian. Desktopowy test „link Ekipa EH/A" przechodzi
  przez dropdown (pozycja przeniosła się do „O nas").
- **visual `chrome.spec.ts`**: dochodzi dropdown otwarty (desktop, zrzut
  z clipem górnych ~400 px strony) i sheet z rozwiniętym akordeonem
  (mobile, pełny zrzut jak chrome-sheet). Pasek po auto-hide — TYLKO
  e2e (zrzut schowanego paska to pusty prostokąt).
- **Baseline'y**: zmiana chrome'u CELOWO rozjeżdża wszystkie
  `skeleton-*` i `chrome-*`; komplety darwin+linux w tym samym PR
  (sekwencja: kod → workflow linux → darwin — generuje Mateusz).

## 4a. Korekty z implementacji (2026-08-23)

- **„NA GÓRĘ ↑" = `<button>`**, nie `<a href="#">` — to akcja, nie
  nawigacja (reguła lint `anchor-is-valid`); scroll smooth, przy
  `prefers-reduced-motion` skok.
- **Znaczek logo = maska CSS** (`mask: url(eha-logo-sign.svg)` +
  `background: currentColor`) na jednym cache'owanym pliku — wariant
  inline (`?raw`) wpychał 2×22 KB wektora w KAŻDY HTML (58,7 KB → 14,3 KB
  po zmianie). Kolor znaczka nadaje kontekst (pasek sepia, stopka krem).
- **Tekstury papieru**: kafelek `paper-tile.webp` przygaszony warstwą
  gradientu do poziomów eksportu (pasek ~.2, sheet ~.22); panel dropdownu
  bez tekstury (w designie .06 — niewidoczna).
- **Kolejność wierszy strony mobilnej stopki zachowana 1:1 z eksportem**
  (O NAS, STRONY, TEL., E-MAIL, OBSZAR, DANE, SOCIAL) — OBSZAR jest
  w markupie dwa razy (raz dOnly w kolumnie OFERTA, raz mOnly między
  E-MAIL a DANE); duplikacja dwóch linijek tekstu zamiast łamania siatki.
- **Kontrakt `jsonld.test.ts` zaktualizowany**: stopka nie drukuje już
  adresu/nazwy prawnej (decyzja §5.2) — test pilnuje odtąd zgodności
  samego NIP-u; adres zostaje w JSON-LD (węzły wchodzą w Etapie 6).
- Rycina sheeta ładowana lazy (nakładka startuje `[hidden]`).

## 5. Niejasności — rozstrzygnięte przez Mateusza (2026-08-23)

1. **Linia „Realizacja: hadrianm"** — ZOSTAJE, dyskretnie w pasie dolnym
   stopki (mono, przygaszona, wpasowana w design).
2. **Dane firmowe** — wg designu: tylko NIP/REGON + godziny; bez nazwy
   prawnej i adresu.
3. **URL-e social** — finalne: `instagram.com/pracowniaeha`,
   `facebook.com/profile.php?id=61574396106209`.
