# Mini-analiza: /kontakt/ (Etap 5) — port eksportu + formularz E9

Źródła: `docs/design/export/kontakt.html` (odczyt z dysku, linia 43 =
base64 logo wycięta do scratchpada), `docs/pracownia-eha-web-creation-process.md`
Część B Etap 5 pkt 1–7, `.claude/rules/sections.md` § „Contact (`kt`)",
kod istniejący (`contact-ui.ts`, `contact-form.ts`,
`functions/api/kontakt.ts`, `contact-config.ts`, `contact-details.ts`)
oraz opublikowana treść `/polityka-prywatnosci/` (sekcje 02/04/08).

Widok jest OSTATNIM widokiem serwisu i JEDYNYM z funkcją. Warstwa
wizualna to zwykły port w klasie 4.4–4.6 (zero nowych mechanik ruchu);
cała nowa robota siedzi w formularzu i w kontrakcie klient↔serwer.

---

## 1. Odczyty z eksportu

### 1a. Struktura MOBILE (<1024; kontener 700 px / padding 30 px)

1. **hero** `#3A3428`, `padding:96px 0 34px`, rycina `telefon-rycina1`
   (wrapper `plxr`, obraz `ryc ryc-r`, `invert(1) sepia(.3)`, opacity .3,
   `right:-46px; top:52px; width:240px`); kicker `KONTAKT`, h1
   „Skontaktuj się z nami" 40 px, lead 14 px.
2. **kafle telefonów** — blok wysunięty w górę `margin-top:-16px`,
   `box-shadow:0 6px 20px rgba(33,29,24,.18)`: pasek `#4B5840`
   „ZADZWOŃ DO NAS", dwa wiersze `#57654A` (etykieta MACIEK/ŁUKASZ mono
   9,5 px + numer Garamond 24 px + strzałka →).
3. **godziny** — akapit 13,5 px `#5F574A` + kreskowany tag
   `KONTAKT 7 DNI W TYGODNIU · BUDOWA PN–PT 8–16`.
4. kreskowana linia (dekoracja, `margin-top:26px`).
5. **„napisz wiadomość"** — kicker, h2 „Wolisz formę pisemną?" 27 px,
   akapit, link mailto Garamond 22 px, tag
   `ODPOWIADAMY W CIĄGU 2 DNI ROBOCZYCH`; rycina `kalamaz-rycina1`
   (`ryc ryc-r plxr`, multiply, opacity .4, `right:-30px; top:8px;
   width:150px`).
6. **formularz** — pas `#F1EBDD` z ramkami góra/dół na PEŁNEJ szerokości
   ekranu: kicker `FORMULARZ`, h2 „Albo wypełnij formularz" 26 px, lead,
   **4 pola** (01 IMIĘ I NAZWISKO / 02 TELEFON LUB E-MAIL / 03
   LOKALIZACJA INWESTYCJI / 04 OPIS `rows=4`), „checkbox" RODO,
   przycisk `#4C3B2B` „Wyślij zapytanie →".
7. **dane firmowe** — kicker `DANE FIRMOWE I OBSZAR` + akapit 14,5 px.
8. **pudło rejestrowe** — ramka `rgba(33,29,24,.22)` na `#F3EDE1`:
   `OBSZAR DZIAŁANIA` (Dolny Śląsk / okolice Jeleniej Góry / dojazd)
   + link „ZOBACZ OBSZAR NA MAPIE →", kreskowana linia, `DANE
   REJESTROWE` (nazwa / NIP / REGON, każdy wiersz podkreślony kreską);
   rycina `dom-ryc_0004_house4` (multiply, opacity .22).
9. **social** — kicker `MEDIA SPOŁECZNOŚCIOWE`, h2 „Śledź nasze
   realizacje", akapit, rycina `golab-poczt-rycina1` (multiply,
   opacity .4, `width:168px`); pod spodem dwa wiersze-linki
   Instagram / Facebook z prawym mono-podpisem.
10. **pasmo „rodo"** `rgba(33,29,24,.045)` + ramka górna: kursywa
    Garamond 12 px z administratorem, NIP-em i linkiem do polityki.
11. stopka 4.1.

### 1b. Struktura DESKTOP (≥1024; kontener 1600 px / `var(--g)`)

1. **hero** `height: clamp(230px,20cqw,320px)` (NISKIE, nie
   pełnoekranowe), treść przy dolnej krawędzi
   (`bottom: clamp(24px,2.2cqw,36px)`), grid `1fr 1fr`: lewa kolumna
   kicker + h1, prawa lead. Rycina telefonu statyczna (BEZ
   `data-ryc-sandbox` — desktop jej nie rysuje).
2. **„split kontakt"** — grid `clamp(360px,34cqw,520px) 1fr`,
   gap `clamp(48px,5cqw,80px)`, padding
   `clamp(44px,4.4cqw,70px) var(--g) clamp(56px,5.6cqw,90px)`:
   - **kolumna kontaktowa** = JEDNA karta `position: sticky;
     top: clamp(104px,8.6cqw,136px)`, ramka + `#F3EDE1`, w środku
     kolejno: pasek ZADZWOŃ DO NAS, dwa telefony, panel godzin,
     panel `E-MAIL` (label + mailto + tag „ODPOWIADAMY…"), panel
     `OBSZAR DZIAŁANIA` (rycina house4, rysowana), panel `DANE
     REJESTROWE`; panele rozdzielone kreskami;
   - **kolumna prawa**: „napisz wiadomość" (kicker + h2 + akapit,
     BEZ mailto — mail siedzi w karcie; rycina kalamaz rysowana),
     formularz w ramce `#F1EBDD` (grid 2×2 + OPIS na całą szerokość,
     „checkbox" i przycisk w jednym wierszu), „dane firmowe"
     (kreska górna, akapit justowany), „social" (kreska górna, grid
     `1fr 1fr`: tekst | linki; rycina gołębia rysowana).
3. **pasmo „rodo"** na całą szerokość, 4. stopka.

### 1c. Skrypt eksportu — zachowania

- `grep -c 'cv(' = 0` ⇒ **BRAK zwijanych akapitów** ⇒ bez
  `CollapsibleText`/`collapsible.ts`, bez zrzutu `*-full-open`.
- `navColor: so ? '#211D18' : '#F5EFE3'`, `logoCol: so ? '#4C3B2B'
  : '#F5EFE3'`; mobile `mNavColor` miesza krem→atrament na wysokości
  hero ⇒ **`<Navbar tone="dark" />`** na obu progach.
- `past = y > heroH - 40` na `[data-hero]` ⇒ `[data-navref]` na hero,
  próg `NAV_SOLID_HERO_PAD_PX` bez zmian.
- Ruch: mobile IO próg .3 dla `.ryc` i `.rev` (4× `data-ryc`, 3× `plxr`,
  12× `rev`); desktop `[data-ryc-sandbox]` ×3 rysowane przy linii 60 %
  (`RYC_LINE = 0.6`), `bgRef` + `paper-background` z `PARALLAX = 0.15`.
  **Cały ten zestaw pokrywa `content-motion.ts`** (rev / ryc / rycsb /
  plxr / plx / dryf tła) — patrz §2 pkt 8.
- Brak `plx` (kadrów zdjęciowych) — widok nie ma ani jednej fotografii.

### 1d. Dwie pułapki designu (potwierdzone liczbowo)

- **Piąte pole desktopu = pomyłka.** Desktop ma `04 · ZAKRES PRAC`
  (placeholder „Więźba, ściany, fundamenty…") i przez to `05 · OPIS`.
  Wszystkie pozostałe placeholdery występują w pliku **2×**
  (mobile + desktop), a „Więźba, ściany, fundamenty…" **1×**.
  E9: **4 pola wszędzie**, OPIS wraca na desktopie do numeru `04`.
- **„Checkbox" RODO = pusty `<span>` 16×16 px z ramką**, nie `<input>`.
  E9: **bez checkboxa** — zostaje sama notka z linkiem do polityki.
  Dodatkowo obie gałęzie mają RÓŻNY tekst przy kwadraciku (mobile:
  „Zapoznałem się z Polityką prywatności…", desktop: „…wyrażam zgodę na
  kontakt…") — kolejny dowód, że to element niedopracowany.

---

## 2. Decyzje portu

1. **Prefiks `.kt`, jeden markup na oba progi.** Widok nie ma ani
   jednego bloku o różnej TREŚCI między gałęziami — różni się wyłącznie
   KOMPOZYCJA (mobile: płaski stos sekcji; desktop: dwie kolumny,
   z czego lewa to jedna karta). Port idzie wzorcem obsługi (§2 pkt 3
   `analiza-obsluga.md`), bez duplikatów dOnly/mOnly.

2. **Karta kontaktowa = `display: contents` na mobile.** Kontener
   `.kt-split` jest na mobile `flex; column`, a `.kt-card` i `.kt-main`
   mają `display: contents` — ich dzieci awansują na elementy flexowe
   `.kt-split` i ustawiają się właściwością `order` w kolejności
   eksportu mobile (telefony → godziny → „napisz wiadomość" → e-mail →
   formularz → dane firmowe → pudło rejestrowe → social). Na desktopie
   `.kt-split` staje się gridem 2-kolumnowym, `.kt-card` wraca do
   `flex; column` (ramka, tło, `sticky`), `.kt-main` też — `order`
   przestaje mieć znaczenie. Zero kopii treści; różnice ramek/teł
   (mobile: cień na kaflach telefonów i ramka na pudle rejestrowym;
   desktop: jedna ramka na całej karcie) robi CSS na tych samych
   elementach — zagnieżdżony `display: contents` na `.kt-reg`.
   Jedyne elementy per-próg: mono-etykieta `E-MAIL` (dOnly — mobile jej
   nie ma), kreskowana linia nad „napisz wiadomość" (mOnly) oraz para
   wariantów rycin (§ pkt 7).

3. **Sticky z doliczonym paskiem.** Eksport liczył `top` od góry
   swojego kontenera, w którym pasek 72 px był sticky W FLOW; nasz jest
   FIXED, więc offset trzeba doliczyć:
   `top: calc(var(--hdr-h) + clamp(32px, 8.6vw - 72px, 64px))` —
   odwzorowuje `clamp(104px,8.6cqw,136px)` co do piksela w całym
   zakresie. Do tego `align-self: start` (rozciągnięty grid-item nie ma
   po czym jechać — lekcja spisu treści z polityki).

4. **Hero: `[data-navref]` na sekcji hero**, mobile
   `padding-top: calc(var(--hdr-h) + 4px)` (eksportowe 96 px przy
   `--hdr-h: 92px`), desktop `height: clamp(230px, 20vw, 320px)`.
   Kicker/h1/lead jednym gridem: mobile jedna kolumna, desktop
   `1fr 1fr` z leadem w drugiej kolumnie.

5. **POLA (E9) — 4 wszędzie, walidacja alternatywna.**
   Kontrakt multipart przepisany pod realny formularz i pod to,
   co deklaruje opublikowana polityka prywatności (sekcja 02:
   „imię i nazwisko, numer telefonu **lub** adres e-mail, lokalizacja
   inwestycji oraz treść wiadomości"):

   | pole HTML | `name` | wymagane | uwagi |
   | --- | --- | --- | --- |
   | 01 IMIĘ I NAZWISKO | `name` | tak | ≤ `NAME_MAX` |
   | 02 TELEFON LUB E-MAIL | `contact` | tak | e-mail **albo** telefon |
   | 03 LOKALIZACJA INWESTYCJI | `place` | nie | jedna linia, ≤ `PLACE_MAX` |
   | 04 OPIS | `message` | tak | 10–5000 znaków |
   | honeypot | `firma` | — | `readonly`, poza tab-orderem |
   | — | `elapsed`, `lang`, `cf-turnstile-response` | — | dokłada JS |

   `temat`/`TOPICS` **znikają** (formularz E9 nie ma pola tematu, a
   polityka nie wymienia go wśród zbieranych danych) — na ich miejsce
   wchodzi `place`. Jedno źródło prawdy zostaje jedno: `contact-form.ts`.

6. **Walidacja pola 02 — jedna reguła dla klienta i serwera.**
   `contact-form.ts` dostaje `classifyContact(value)` zwracające
   `{ kind: "email" | "phone" | "invalid", email, phone }`:
   - `EMAIL_RE` bez zmian (ta sama reguła co dotąd),
   - telefon: po usunięciu spacji, myślników, kropek i nawiasów
     zostaje opcjonalny `+` i **9–15 cyfr** (`PHONE_RE`). Polski numer
     ma 9 cyfr; górna granica mieści `+48…` i numery zagraniczne.
     Reguła jest CELOWO permisywna — twardsza dawałaby fałszywe odrzuty
     (numer bywa pisany na kilkanaście sposobów).
   `validateSubmission` odrzuca z `field: "contact"`, gdy `kind` jest
   `invalid`. `contact-ui.ts` woła TĘ SAMĄ funkcję — klient i serwer nie
   mogą się rozjechać.

7. **Mail #2 tylko przy e-mailu (spójność z polityką).**
   `functions/api/kontakt.ts` dziś ZAWSZE wysyła potwierdzenie na
   `data.email` — pod E9 to się zmienia:
   - `reply_to` maila #1 = adres nadawcy **jeśli podał e-mail**,
     w przeciwnym razie `CONTACT_TO` (Resend odrzuca pusty/nie-mailowy
     `reply_to`);
   - mail #2 leci **tylko** gdy `data.email !== ""`.
   To nie jest kosmetyka: karta „Resend" w sekcji 04 polityki mówi
   wprost „automatyczne potwierdzenie do Ciebie, **jeśli podasz adres
   e-mail**". Bez tej zmiany kod rozjeżdża się z opublikowanym
   dokumentem prawnym. KV dalej trzyma WYŁĄCZNIE licznik
   `quota:YYYY-MM-DD` (polityka: „Formularz niczego nie zapisuje po
   drodze") — nie ruszamy.
   Mail #1 zyskuje wiersze `Telefon` / `E-mail` (ten z pól, którego nie
   podano → „—") oraz `Lokalizacja`; temat: `[pracownia-eha.pl]
   {lokalizacja}: zapytanie od {imię}` (bez lokalizacji — sam podpis).

8. **Ruch: wspólny `content-motion.ts`, ZERO nowych modułów.**
   Słownictwo eksportu (`rev`, `ryc`, `plxr`, `rycsb` przez
   `[data-ryc-sandbox]`, `bgRef`) pokrywa się 1:1 z tym, co moduł już
   robi na pięciu widokach. Komentarz w `contact-ui.ts` o
   `contact-motion.ts` (plik odziedziczony z delung, w tym repo NIGDY
   nie istniał) zostaje sprostowany. `tradycja-motion.ts` — nie.

9. **Tło = `PaperBackdrop`** (`.kt` z `isolation: isolate` +
   `--bg-cream`), dryf desktop `PAPER_BG_SPEED`, kontrakt e2e jak na
   pozostałych trasach. Eksport ma `bgRef` + `PARALLAX = 0.15` —
   identycznie jak `/`, `/realizacje/` i widoki treściowe.

10. **Sloty antyscrapingowe — wariant „czytelny fallback bez `href`"**
    (decyzja Mateusza). Na `/kontakt/` wariant `.pp` (link do
    `/kontakt/`) nie ma sensu, a wariant chrome'u (`hidden`) zostawiłby
    stronę kontaktową bez JEDNEJ danej kontaktowej. Kotwice
    `a[data-tel="maciek|lukasz"]` i `a[data-mail]` renderują się więc
    widoczne, **bez atrybutu `href`**, z etykietą zastępczą w
    `[data-slot]` („numer telefonu" / „adres e-mail"); `fillContactSlots`
    podmienia tekst i dokłada `href`. Pełnych ciągów w statycznym HTML
    dalej NIE MA (D-CH5 nienaruszony), a bez JS układ się nie rozpada.
    Do tego jeden `<noscript>` w karcie kontaktowej mówiący wprost,
    dlaczego numery są schowane.

11. **Turnstile / antyspam — bez zmian mechaniki.** Honeypot `readonly`
    (+ `tabindex="-1"`, `aria-hidden` na wrapperze — inaczej axe zgłasza
    pole bez etykiety), min-czas `MIN_FILL_MS`, leniwe ładowanie skryptu
    przy pierwszym `focusin`, `execute` przy submit, WAF, KV quota.
    `TURNSTILE_SITE_KEY` zostaje placeholderem `<TURNSTILE_SITE_KEY>` do
    czasu założenia widgetu (§5) — kod i testy tego nie wymagają.

12. **Komunikaty walidacji renderowane w SSR.** `contact-ui.ts` zapala
    tylko klasę `.err` na opakowaniu pola; teksty siedzą w markupie
    (`<span class="kt-err">`) i pokazuje je CSS (`.err .kt-err`).
    Zero tekstów w JS, komunikat działa też przy walidacji serwera.

13. **Podłoga `font-size: 16px` na polach mobile** (Safari iOS zoomuje
    stronę przy focusie mniejszego pola i zostawia ją zoomniętą) —
    eksport ma 15 px/14 px, podnosimy do 16 px poniżej 1024. Świadome
    odstępstwo od designu, wpisane w `sections.md`.

14. **Kontrasty (klasa korekt 4.4–4.6).** Eksportowe
    `rgba(33,29,24,.6)` na etykietach pól przy mono 10 px to na
    `#F1EBDD` ok. 4,3:1 — poniżej AA dla tekstu < 18,66 px bold.
    Etykiety pól, kickery `rgba(33,29,24,.55)` i mono-tagi idą na
    `.65`/`var(--accent)` tak jak na polityce. Allowlista axe zostaje
    **PUSTA**.

---

## 3. Plan assetów

Po sześciu widokach w repo jest niemal wszystko:

| rola | plik | stan |
| --- | --- | --- |
| hero, mobile (rysowana + parallax) | `telefon-rycina1-m.webp` 340 px, **alfa** | JEST (4.2) |
| hero, desktop (statyczna) | `telefon-rycina1.webp` 700 px, spłaszczona | JEST (4.2) |
| „napisz wiadomość", desktop | `kalamaz-rycina1.webp` 660 px, spłaszczona | JEST (4.2) |
| „napisz wiadomość", mobile | `kalamaz-rycina1-m.webp` ~300 px, **alfa** | **NOWY** |
| pudło rejestrowe (oba progi) | `dom-ryc-house4.webp` 224 px, alfa | JEST |
| social, mobile | `golab-poczt-rycina1-m.webp` 320 px, alfa | JEST (4.6) |
| social, desktop | `golab-poczt-rycina1.webp` 560 px, spłaszczona | JEST (4.6) |
| stopka | `koparka-rycina1.webp` | w `Footer.astro` |

**Jeden nowy plik.** Reguła bez zmian (lekcja 4.2 §2a): rycina widoczna
na MOBILE musi mieć alfę — `body{position:fixed}` sheeta gubi w starszym
WebKicie `mix-blend-mode` i spłaszczona na biel rycina świeci białym
pudłem. Rycina telefonu na ciemnym hero: desktop = wariant spłaszczony
z `filter: invert(1) sepia(.3)` + `mix-blend-mode: screen` (wzorzec
`HomeKontakt`), mobile = wariant z alfą, sam `filter`.

**Zero fotografii** — widok nie ma ani jednego zdjęcia (drugi taki po
polityce), więc i zero `[data-plx]`.

---

## 4. Zmiany w istniejącym kodzie

- **`src/lib/contact-form.ts`** — `ContactRaw`/`ContactData`:
  `email`+`phone`+`temat` → `contact` (wejście) i `email`+`phone`+`place`
  (wyjście); nowe `PHONE_RE`, `PLACE_MAX`, `classifyContact()`;
  `validateSubmission` z polem błędu `"contact"`; `TOPICS` usunięte;
  `buildNotifyEmail` (telefon/e-mail/lokalizacja, temat z lokalizacją);
  `buildConfirmEmail` bez tematu.
- **`functions/api/kontakt.ts`** — odczyt `contact`/`place`,
  `reply_to` warunkowy, mail #2 tylko przy e-mailu. Reszta (bot-trap,
  Turnstile, KV, kody odpowiedzi) bez zmian.
- **`src/components/sections/contact/contact-ui.ts`** —
  `[data-f="email"]`/`#kt-email` → `[data-f="contact"]`/`#kt-contact`,
  walidacja przez `classifyContact`, sprostowany komentarz o module
  ruchu. Mechanika Turnstile/honeypotu/ekranu `.sent` NIETKNIĘTA.
- **`src/components/sections/contact/contact-config.ts`** — bez zmian
  (site key wchodzi w §5).
- **`src/pages/kontakt.astro`** — szkielet → pełny widok.
- **`tests/unit/contact-form.test.ts`** — przepisany pod E9.
- **`tests/e2e/smoke.spec.ts`** — sonda POST na nowy kontrakt pól
  + asercja `.kt-form` na `/kontakt/`.
- **`tests/visual/skeleton.spec.ts`** — plik KASOWANY (ostatnia trasa)
  razem z baseline'ami `skeleton-kontakt-*` (24 pliki).

---

## 5. Infrastruktura (klika Mateusz — kod jej NIE wymaga)

Stan na 2026-08-25: **nic jeszcze nie zrobione**, więc widok powstaje na
placeholderze `TURNSTILE_SITE_KEY = "<TURNSTILE_SITE_KEY>"`, a testy e2e
stubują Turnstile. Lista kroków i miejsce na klucz — w raporcie
końcowym PR-a oraz w Części B pkt 5.1–5.5 instrukcji.

---

## 6. Testy

- **unit** (`contact-form.test.ts`): warianty pola 02 — sam telefon /
  sam e-mail / ani jedno ani drugie / oba (e-mail wygrywa); granice
  `NAME_MAX`/`MESSAGE_MIN`/`MESSAGE_MAX`/`PHONE_MAX`/`PLACE_MAX`;
  honeypot i min-czas; higiena maili (escapowanie, jedna linia
  w Subject); mail #2 tylko przy e-mailu (kontrakt na poziomie danych).
- **e2e** (`kontakt.spec.ts`, wzorzec `polityka.spec.ts`): SSR bez JS
  (4 pola, `method="post"`/`action="/api/kontakt"`, brak `[data-clp]`,
  brak `[data-plx]`, notka RODO bez checkboxa), walidacja alternatywna
  po stronie klienta, honeypot `readonly` i min-czas na
  deterministycznym zegarze, **stub Turnstile + stub `/api/kontakt`**
  (`page.route`) → ekran `.sent` i błąd `.kt-srv`, sloty antyscrapingowe
  (surowy HTML bez pełnych ciągów + `href` po JS), sticky kolumna
  desktop, `tone="dark"` przez `expect.poll`, reveal, dryf tła,
  `collectPageIssues`, strażnik natywnego scrolla,
  `expectBreakpointFlip(CONTACT_DESKTOP_MIN_PX)`.
- **visual** (`kontakt.spec.ts`): `usePreviewGuard` (widok nie czyta
  kolekcji realizacji), wspólny `revealSweep`, zrzuty `kontakt-top`
  i `kontakt-full` (fullPage `timeout: 20_000`, per-shot
  `maxDiffPixelRatio: 0.001` — klasa decyzji 4.4–4.6; globalny 0.0005
  nietknięty). **Zrzut stanu `.sent`**: osiągalny deterministycznie
  (stub `/api/kontakt` + wypełnienie pól + przesunięty zegar), ale
  wymagałby wyjątku od reguły „testy wizualne fotografują SSR" i dawał
  trzeci komplet baseline'ów dla stanu, który e2e sprawdza już
  funkcjonalnie i dosłownie (nagłówek, akapit, przycisk „wyślij
  kolejną"). **Decyzja: nie robimy go** — stan `.sent` pilnuje e2e.

---

## 7. Co świadomie zostaje na dalej

- **Etap 6**: JSON-LD `HomeAndConstructionBusiness` na `/kontakt/`
  (dziś węzeł istnieje w `jsonld.ts`, ale NIE jest renderowany) + geo,
  Cloudflare Web Analytics (polityka już go deklaruje), Search Console,
  UptimeRobot, audyt subsetów fontów, brand polish.
- **Etap 7**: 2FA konta CMS, przekazanie dostępów (w tym konta Resend),
  backupy.
