# Mini-analiza: /polityka-prywatnosci/ (Etap 4.6)

Port `docs/design/export/polityka-prywatnosci.html` na SSR. Ostatni widok
treściowy przed Etapem 5 i jedyny **dokument prawny** w serwisie: 9 sekcji
RODO, spis treści (desktop sticky), pasmo daty obowiązywania, dane
kontaktowe przez sloty antyscrapingowe. Widok konsumuje komplet modułów
4.4/4.5 bez zmian mechanik i **nie wnosi żadnej nowej mechaniki**.

Widok ma **uśpiony kontrakt od Etapu 3** (`tests/e2e/policy.spec.ts`,
test „komplet 9 sekcji RODO"), który narzuca prefiks `.pp`, dokładnie
9 elementów `.pp-sec`, NIP w pierwszej sekcji, `mailto:` składany w JS
i link do `/kontakt/` w treści. Markup powstaje POD ten kontrakt — skip
znika sam, kontraktu nie ruszamy.

## 1. Odczyty z eksportu

### 1a. Struktura MOBILE (<1024; kontener treści 700 px / padding 30 px)

1. **nagłówek** — `padding: 96px 0 0`, kicker `OCHRONA DANYCH OSOBOWYCH`
   + `h1 Polityka prywatności` (38 px, `max-width: 300px`). BEZ hero,
   BEZ zdjęcia — pierwszy taki widok w serwisie.
2. **pasmo daty** `#3A3428` — `OBOWIĄZUJE OD <data>` (kropkowane
   podkreślenie) + `WERSJA 1.0`, mono 10 px.
3. **akapit wstępny** (`[DOMENA]` w kropkowanym slocie).
4. **spis treści** — pudło `#F3EDE1` z ramką `rgba(33,29,24,.22)`,
   nagłówek `SPIS TREŚCI`, 9 wierszy `NN · tytuł`, `min-height: 40px`,
   kreskowane separatory (ostatni bez).
5. **sekcje 01–09** (`data-sec="1..9"`) — kicker `NN · ETYKIETA`, h2
   26 px serif, akapity 14,5/1,75. Warianty w środku sekcji: 03 = trzy
   karty „cel / podstawa / uzasadnienie", 04 = trzy karty odbiorców,
   07 = numerowana lista praw 01–06, 02 i 09 = domknięcia (cytat
   z lewą kreską / `OSTATNIA AKTUALIZACJA`).
6. **pas „PYTANIA O DANE"** `#F1EBDD` — kicker, h2, akapit, telefon
   i mail wielkim serifem, link `PRZEJDŹ DO KONTAKTU →`; w prawym
   dolnym rogu rycina gołębia (`.ryc .ryc-r .plxr`, 150 px, opacity .3,
   multiply).
7. stopka (nasza, 4.1).

### 1b. Struktura DESKTOP (≥1024; kontener 1600 px / `var(--g)`)

1. **nagłówek** — kicker + h1 `clamp(40px,3.75vw,60px)`, padding górny
   `clamp(48px,4.8vw,78px)` PO pasku (eksport ma pasek sticky w flow,
   nasz jest fixed → doliczamy `--hdr-h`).
2. **pasmo daty** — jak mobile, w kontenerze 1600.
3. **dokument** — grid `clamp(240px,22vw,330px) minmax(0,1fr)`,
   `gap: clamp(48px,5vw,90px)`, `align-items: start`:
   - lewa kolumna: **spis treści `position: sticky`**, `top:
     clamp(28px,2.8vw,44px)`;
   - prawa kolumna: akapit wstępny + sekcje 01–09, każda oddzielona
     kreskowaną linią górną, `max-width: clamp(560px,58vw,780px)`,
     odstęp `clamp(38px,3.8vw,60px)`.
4. **pas „PYTANIA O DANE"** — grid `1.1fr 1fr` (tekst | dane), rycina
   gołębia większa (`clamp(180px,16vw,260px)`) i STATYCZNA.
5. stopka.

**Treść obu drzew jest IDENTYCZNA co do znaku** (zweryfikowane diffem
tekstu obu gałęzi `sc-if`) — jedyna różnica kompozycyjna to miejsce
akapitu wstępnego: mobile ma go NAD spisem treści, desktop w prawej
kolumnie POD spisem. To zmiana układu, nie treści ⇒ jeden markup.

### 1c. Skrypt eksportu — zachowania

- **`grep -c 'cv(' = 0`** → strona nie ma zwijanych akapitów.
  `CollapsibleText`/`collapsible.ts` NIE wchodzą, spec visual nie ma
  zrzutu `*-full-open` (klasa decyzji z `/obsluga-budowy/`).
- **BRAK `navColor`/`logoCol`** → navbar **domyślny** (bez
  `tone="dark"`); logo `#4C3B2B`, ikona menu `#211D18` — tak jak na
  szkielecie.
- **BRAK odpowiednika hero** → widok jest **pierwszą trasą bez
  `[data-navref]`**; pasek korzysta z fallbacku `NAV_SOLID_FALLBACK_PX`
  (8 px) z Etapu 4.1 — stan solid wchodzi zaraz po ruszeniu scrolla.
  To celowe: przezroczysty pasek nad czystą typografią bez zdjęcia
  koliduje z kickerem/h1.
- **`jump(k)`** — `scrollTo({top: el.offsetTop - (mobile ? 74 : 40),
  behavior:'smooth'})`. Port: **natywne `<a href="#pp-NN">`** +
  `scroll-margin-top` (patrz §2 pkt 3).
- **Ruch**: `.rev` (+`d1`) na kickerach i nagłówkach, `.ryc.ryc-r`
  + `.plxr` na gołębiu — WSZYSTKO mobile-only (`scanAnim()` i
  `updatePlx()` mają `if (!this.isM()) return`). **`rycsb` = 0
  wystąpień** → desktop bez rysowania rycin. Desktop rusza wyłącznie
  tłem (`bgRef`, `backgroundPositionY = scroll·0.15`).
- **Tło**: `paper-background` + `bgRef` ⇒ `PaperBackdrop` 1:1 jak
  pozostałe trasy treściowe (dryf desktop `PAPER_BG_SPEED`).
- **Zdjęć na stronie NIE MA** — jedyny obraz to rycina gołębia,
  więc `[data-plx]` (parallax kadrów) nie ma tu zastosowania.

## 2. Decyzje portu

1. **Zero nowych modułów i zero nowych mechanik.** Widok konsumuje
   `content-motion.ts` (reveale `[data-rev]`, rysowanie `[data-ryc]`,
   parallax `[data-plxr]`, dryf tła), `content-config.ts`,
   `PaperBackdrop`, Navbar (domyślny tone) i stopkę 4.1.
   `tradycja-motion.ts` i `collapsible.ts` nieimportowane.
2. **Jeden markup na oba progi — bez duplikatów treści.** Dokument
   idzie gridem trójelementowym (`wstęp`, `spis`, `sekcje`):
   - mobile: jedna kolumna, kolejność `wstęp → spis → sekcje`;
   - desktop: `grid-template-areas: "toc lead" "toc secs"`, spis
     w kolumnie 1 spinającej oba rzędy (`align-self: start`, żeby
     sticky miało po czym jechać).
     Duplikacji dOnly/mOnly jest DOKŁADNIE JEDNA i wynika z assetów,
     nie z treści: rycina gołębia w dwóch wariantach pliku (patrz
     pkt 6).
3. **Spis treści = czyste kotwice (progressive enhancement).**
   `<a href="#pp-01">` … `<a href="#pp-09">`, sekcje mają `id` i
   `scroll-margin-top: calc(var(--hdr-h) + 18px)`. Bez `--hdr-h`
   (fixed pasek!) nagłówek lądowałby POD paskiem — pilnuje tego
   kontrakt e2e mierzący pozycję nagłówka po kliknięciu, na obu
   progach. Spis działa **bez JS** — to jedyny nawigacyjny element
   dokumentu prawnego, więc nie może zależeć od skryptu.
   **Świadome odstępstwo od eksportu: BEZ `scroll-behavior: smooth`.**
   Powody: (a) `smooth` na `html` przechwytuje każde programowe
   `window.scrollTo` — także w helperach testów (`scrollPageTo`,
   `revealSweep`), co robi z determinizmu zrzutów loterię;
   (b) długi płynny przejazd w dół przechodzi przez heurystykę
   auto-hide paska (chowanie przy `d > 2 px`), więc kotwica
   „przyjeżdża" pod znikającym paskiem; (c) skok natywny jest
   mierzalny w e2e co do piksela. Przywrócenie to jedna reguła CSS +
   `scroll-behavior: auto !important` w `tests/helpers/freeze.css` —
   decyzja Mateusza, baseline'ów nie rusza.
4. **Nagłówek pod fixed paskiem.** Mobile `padding-top: calc(var(--hdr-h)
   + 4px)` = eksportowe 96 px co do piksela (nasz pasek mobile ma
   `height: 92px`, a znaczek 48 px siedzi w nim na 22–70 px — dokładnie
   jak nakładka eksportu, więc odstęp pod logo wychodzi eksportowe
   26 px). Desktop `padding-top: calc(var(--hdr-h) + clamp(48px,4.8vw,
   78px))` — eksport miał pasek 72 px w flow, my doliczamy tę samą
   wysokość jawnie.
5. **Reveale 1:1 z eksportu**: mobile-only, na kickerach i nagłówkach
   (`[data-rev]` + `[data-rev-d="1"]`), tempo delung (0.7/0.8 s, 22 px)
   jak we wszystkich widokach 4.2–4.5. Desktop statyczny.
6. **Rycina gołębia dwiema kopiami mOnly/dOnly** (wzorzec `zuraw-rycina1`
   / `zuraw-rycina1-m` z 4.5 cz. 2) — powód jest wyłącznie plikowy:
   wariant widoczny na MOBILE musi mieć alfę (lekcja 4.2 §2a:
   `body{position:fixed}` sheeta gubi `mix-blend-mode` w starym WebKicie
   i spłaszczona na biel rycina świeci białym pudłem), a wariant
   desktopowy zostaje spłaszczony (multiply na kremowym paśmie działa,
   plik waży 2× mniej). Mobilna kopia niesie `data-ryc="r"` +
   `data-plxr`, desktopowa jest statyczna — dokładnie jak w eksporcie.
7. **Assety — plan (2 warianty jednego NOWEGO pliku; reszta z repo)**:

   | plik | status | uzasadnienie |
   | --- | --- | --- |
   | **`golab-poczt-rycina1-m.webp`** (320 px, **alfa** q42/aq45, 40 KB) | NOWY | rycina mOnly, kadr 150 px → 320 = dpr2 z zapasem; alfa obowiązkowa (pkt 6) |
   | **`golab-poczt-rycina1.webp`** (560 px, spłaszczona na biel q45, 22 KB) | NOWY | rycina dOnly, kadr max 260 px → 560 = dpr2 z zapasem; spłaszczenie tnie wagę z 98 KB do 22 KB |
   | `paper-background.webp` | z repo | `PaperBackdrop` |
   | `koparka-rycina1.webp`, `dom-ryc-house1.webp` | z repo | siedzą w stopce 4.1 i sheecie menu — widok ich sam nie importuje |

   Jedna nowa fotografia? ŻADNA — widok nie ma zdjęć. To najlżejszy
   widok serwisu pod względem obrazów (62 KB rycin łącznie, oba
   warianty `lazy`).

8. **Kontrasty / a11y.** Klasa korekty `.5`/`.55` → `.65` z 4.4/4.5 ma
   tu jedno zastosowanie: `SPIS TREŚCI` i `OSTATNIA AKTUALIZACJA` mają
   w eksporcie `rgba(33,29,24,.55)` na papierze (`#F3EDE1` / `#FAF7F1`)
   — podnosimy do `.65`. Podobnie `WERSJA 1.0` `rgba(228,220,200,.6)`
   na `#3A3428` → `.72` (na ciemnym paśmie kontrast liczy się w drugą
   stronę). Reszta palety jest bezpieczna: kicker `rgba(87,101,74,.95)`,
   akapity `#3E382E`, karty `#5F574A`, linki `#57654A`. Allowlista axe
   zostaje **PUSTA**.
9. **Treść — rozstrzygnięcia placeholderów designu** (decyzje Mateusza,
   2026-08-25; design jest źródłem, placeholdery były świadomie puste):
   - `[DOMENA]` → `pracownia-eha.pl`;
   - pasmo daty → **`OBOWIĄZUJE OD 01.09.2026`**, `WERSJA 1.0`;
     `OSTATNIA AKTUALIZACJA: 01.09.2026` w sekcji 09 (data przyszła,
     po Etapie 5 — dokument opisuje stack, który wtedy realnie działa);
   - `[DOSTAWCA POCZTY E-MAIL]` → **The Camels**, `[EOG / POZA EOG]` →
     serwery w Polsce (EOG), a w sekcji 05 wprost „bez transferu poza
     EOG";
   - retencja: `[OKRES — NP. 5 LAT]` → **5 lat** (licząc od końca roku
     rozliczeniowego), `[OKRES — NP. 12 MIESIĘCY]` → **12 miesięcy**.

   Jedna dopisana klauzula (decyzja Mateusza przy zatwierdzaniu treści):
   w sekcji 04 karta Resend mówi „…automatyczne potwierdzenie do Ciebie,
   **jeśli podasz adres e-mail**" — E9 dopuszcza telefon LUB e-mail,
   więc potwierdzenie nie zawsze wychodzi.

   Poza placeholderami treść idzie **1:1 z designu** — opisuje docelowy
   stack (Cloudflare Pages/WAF/Turnstile/Web Analytics + Resend, brak
   cookies), zgodnie z instrukcją wykonawczą („niczego nie poprawiać
   bez decyzji"). Weryfikacja spójności z realiami kodu: (a) `functions/
api/kontakt.ts` nie zapisuje treści zapytań — KV trzyma wyłącznie
   licznik `quota:YYYY-MM-DD`, więc zdanie sekcji 06 „formularz niczego
   nie zapisuje po drodze" jest prawdziwe; (b) IP idzie do Turnstile
   jako `remoteip` — pokryte sekcjami 02 i 04; (c) Cloudflare Web
   Analytics wchodzi w Etapie 6 (checklista: „polityka JUŻ go
   deklaruje") — świadome wyprzedzenie, spójne z datą 01.09.2026.

10. **Sloty antyscrapingowe z CZYTELNYM fallbackiem SSR** (decyzja
    Mateusza). Chrome (navbar/stopka) renderuje sloty `hidden`, bo pusty
    wiersz tabeli nikomu nie przeszkadza. W dokumencie prawnym zdanie
    z dziurą („napisz na adres , zadzwoń pod  lub ") jest nie do
    przyjęcia, więc kotwice `a[data-tel]`/`a[data-mail]` w `.pp`
    renderują się WIDOCZNE, z etykietą zastępczą i `href="/kontakt/"`;
    `fillContactSlots()` (wołane ze skryptu Navbara) podmienia tekst
    i `href` na pełne dane. Pełnych ciągów w statycznym HTML dalej NIE
    MA (kontrakt D-CH5 nienaruszony), a bez JS dokument pozostaje
    spójny i prowadzi do formularza. Administrator jest w SSR
    zidentyfikowany nazwą, adresem pocztowym, NIP-em i REGON-em.
11. **Bez zmian w schemacie CMS** — widok nie czyta kolekcji realizacji,
    więc spec visual stoi na `usePreviewGuard` (nie na
    `useVisualFixtureGuard`).
12. **`overflow-x: clip`** na `.pp` (nie `hidden`) — rycina gołębia
    wystaje za prawą krawędź pasma; `clip` nie tworzy kontenera
    przewijalnego programowo (lekcja 5 z webkit-CI 4.4 cz. 1).

## 3. Testy

**Podział między spece.** `policy.spec.ts` (Etap 3) jest z założenia
**niezależny od profilu** (`useChromium1920Only`) i pilnuje TREŚCI oraz
META — to zostaje jego zakresem: lang/tytuł/canonical, uśpiony kontrakt
9 sekcji (od tego PR-a AKTYWNY, `test.skip` przestaje wchodzić), link
polityki w stopce. Dokładam tam tylko to, co jest treścią dokumentu
i nie zależy od profilu: komplet 9 kotwic spisu treści wskazujących na
istniejące `id`, pasmo daty (data + wersja) oraz brak `[DOMENA]`
i innych nawiasów kwadratowych w treści (strażnik przed nieuzupełnionym
placeholderem designu). Nowy `tests/e2e/polityka.spec.ts` bierze
wszystko, co **profilozależne albo behawioralne**.

- **e2e `policy.spec.ts`** (chromium-1920): meta + uśpiony kontrakt
  (9 `.pp-sec`, NIP, `mailto:`, link `/kontakt/`) + kotwice spisu ↔ `id`
  sekcji + pasmo daty + strażnik „zero placeholderów `[...]`".
- **e2e `polityka.spec.ts`** (6 profili): SSR bez JS (h1, 9 nagłówków,
  spis jako zwykłe kotwice `href="#pp-NN"`, pełna treść, kotwice
  kontaktowe z fallbackiem i `href="/kontakt/"`); **skok ze spisu ląduje
  POD paskiem** (po kliknięciu `top` nagłówka ≥ `--hdr-h`, kontrakt
  `scroll-margin-top` — mierzone na obu progach); sticky spisu na
  desktopie (`position: sticky` + spis zostaje w kadrze po zjechaniu);
  brak `[data-navref]` i stan solid od `NAV_SOLID_FALLBACK_PX`; sloty
  antyscrapingowe (pełnych ciągów NIE MA w surowym HTML z `page.request
  .get`, po JS `href` = `tel:`/`mailto:` z pełnymi danymi); brak
  `[data-clp]` i `[data-plx]` (kontrakt zakresu widoku); CTA `PRZEJDŹ
  DO KONTAKTU`; reveal po dojechaniu; dryf tła; `collectPageIssues`;
  strażnik natywnego scrolla; `expectBreakpointFlip(
  CONTENT_DESKTOP_MIN_PX)`.
- **visual `polityka.spec.ts`**: `usePreviewGuard` + `prepareSweep` +
  WSPÓLNY `revealSweep`; zrzuty `polityka-top` i `polityka-full`
  (fullPage `timeout: 20_000` + per-shot `maxDiffPixelRatio: 0.001` —
  klasa decyzji z 4.4/4.5; globalny próg 0.0005 NIETKNIĘTY); maska
  `video` + `.dt-poster` jako kontrakt speców visual. BEZ `*-full-open`
  (brak zwijanych akapitów).
- **`skeleton.spec.ts`**: trasa `/polityka-prywatnosci/` wypada razem
  z baseline'ami `skeleton-polityka-prywatnosci-*` (oba komplety,
  24 pliki). W `ROUTES` zostaje **JEDNA trasa** — `/kontakt/`; plik
  znika w Etapie 5.

## 3a. Pomiar LHCI — ten widok JEST bramkowany

`/polityka-prywatnosci/` to jeden z DWÓCH URL-i mierzonych przez LHCI
(obok `/`), więc ten PR realnie rusza budżetami. Pomiar lokalny
2026-08-25 (mediana z 3; **lokalnie ≠ CI** — mnożnik CPU, ale porównanie
gałęzi na TEJ SAMEJ maszynie jest miarodajne):

| mobile | main (szkielet) | ten PR (dokument) | budżet |
| --- | --- | --- | --- |
| performance | 0,92 | **0,79** | ≥ 0,80 |
| LCP | 3305 ms | **4816 ms** | ≤ 5000 |
| FCP | 1283 ms | 2562 ms | — |
| TBT / CLS | 0 / 0,0001 | 0 / 0 | ≤ 200 / ≤ 0,05 |
| total | 470 KB | 611 KB | ≤ 1,2 MB |
| script | 8 KB | 8 KB | ≤ 40 KB |
| pliki fontów | 7 (274 KB) | **12 (462 KB)** | ≤ 8 (warn) |

Desktop: performance **0,99**, LCP 939 ms, TBT 0, CLS 0–0,0092,
total 611 KB — wszystkie budżety z zapasem.

**Cała różnica siedzi w FONTACH, nie w treści ani w assetach widoku.**
Lighthouse nie pobiera ŻADNEJ z dwóch rycin gołębia (obie `lazy`, pod
zgięciem) — obraz strony to `paper-background` 90 KB + kafelek 12 KB
+ logo 21 KB, czyli dokładnie tyle, co na szkielecie. Doszło **5 plików
fontów (+188 KB)**, których szkielet nie potrzebował:

- `eb-garamond-*-italic` (latin 47 KB + latin-ext 87 KB = **134 KB**)
  — jedyny italik na stronie to cytat-domknięcie sekcji 02;
- `ibm-plex-mono-500` (latin 15 KB + ext 13 KB) — kicker, pasmo daty,
  numery spisu, chip aktualizacji;
- `ibm-plex-mono-ext-600` (14 KB) — nagłówek `SPIS TREŚCI`.

Pozostałe trasy treściowe (4.2–4.5) ładują te same 12 plików od dawna —
polityka po prostu DOŁĄCZA do nich, a że jest mierzona, koszt staje się
widoczny w budżecie. To ten sam kandydat, który wisi od Etapu 3: **audyt
subsetów (Etap 6)** — same `latin-ext` Garamonda to 199 KB na trzy polskie
znaki diakrytyczne.

Ocena ryzyka CI: w tym samym przebiegu lokalnym `/` wypada **gorzej**
(0,74 / LCP 6025) niż polityka, a `/` w CI przechodzi — więc polityka
powinna przejść z zapasem. **Progów NIE ruszano** (ani mobile, ani
desktop). Gdyby CI jednak zaświecił na czerwono: najpierw re-run (znany
flake obciążonego runnera), a dopiero potem rozmowa o subsetach — nie
o podnoszeniu progu.

Uwaga poboczna: jeden z trzech przebiegów desktop pokazał CLS 0,0092.
To `fillContactSlots()` podmieniający etykietę na numer w sekcji 01
(na desktopie sekcja 01 jest w pierwszym ekranie). Wariant `hidden`
z chrome'u dałby przesunięcie NIE MNIEJSZE (treść pojawia się z zera),
a próg to 0,05 — zostawiamy.

## 4. Co świadomie zostaje na dalej

- **Etap 5** — `/kontakt/`: formularz E9 (4 pola, walidacja alternatywna
  telefon LUB e-mail, honeypot `readonly`, Turnstile leniwie),
  `functions/api/kontakt.ts` przepisany pod E9 (dziś to wersja
  odziedziczona z delung, która ZAWSZE wysyła potwierdzenie na
  `data.email` — sekcja 04 polityki mówi o potwierdzeniu jako
  automatycznym, co przy E9 znaczy „tylko gdy podano e-mail";
  treści polityki to nie zmienia).
- **Etap 6** — Cloudflare Web Analytics (polityka już go deklaruje),
  JSON-LD + geo, audyt subsetów fontów, ewentualne zacieśnienie LCP.
- **Etap 7** — 2FA konta CMS, przekazanie dostępów.
- **Nie w tym PR-ze**: per-shot `maxDiffPixelRatio` dla `index-full`
  (dotyka baseline'ów `/` — decyzja Mateusza) oraz `scroll-behavior:
  smooth` dla kotwic spisu (§2 pkt 3).
