# Analiza — bezpośrednie linki do realizacji

Stan: **WYKONANE** (kod + testy, 2026-11-02, branch
`feat/linki-realizacji`). Decyzje pytań 1–5 zatwierdzone przez Mateusza
„zgodnie z rekomendacjami" z JEDNĄ zmianą D4 (przycisk „Udostępnij"
zastępuje CTA kontaktu w stopce detalu — §1). Przebieg wykonania i odstępstwa
od planu: §7.

## 0. Cel

Każda realizacja ma stały adres `https://pracownia-eha.pl/realizacje/<adres>/`,
który klient może wysłać ludziom. Wejście z linku pokazuje TĘ realizację
w dzisiejszym detalu (modal ≥1024 / szuflada <1024). Przeglądanie, przejścia,
galeria, podgląd pełnoekranowy i wideo działają 1:1 jak dziś. Adres powstaje
automatycznie po zapisie wpisu w panelu.

**Wykonalność: TAK.** Mechanizm detalu jest na to gotowy:
`openWorkDetail(slug, name)` otwiera detal z kodu (używa go już zajawka
na `/`), a treść każdego wpisu jest w HTML jako `<template data-work-detail>`.
Dziś kod nie dotyka adresu w ogóle (zero `history`/`location` w
`open-detail.ts` i `overlay.ts`), więc trzeba dopisać warstwę adresu,
a mechanizmu nie przebudowywać.

## 1. Zatwierdzone decyzje

| #   | Decyzja                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | **Prawdziwe podstrony** `/realizacje/<adres>/` (statyczny HTML per wpis, własny `<title>`, opis, `og:image` = okładka realizacji), a nie `#kotwica`.                                                                                                     |
| D2  | Wejście z linku: detal otwarty **od pierwszego wyświetlenia, bez animacji wjazdu**. Za nim lista `/realizacje/`. Zamknięcie zostawia na liście, a adres przechodzi na `/realizacje/`. Projnav chodzi po pełnej liście. Bez JS treść realizacji jest widoczna. |
| D3  | **Pasek adresu podąża za detalem**: otwarcie (lista i zajawka `/`) → `/realizacje/<adres>/`, projnav podmienia adres, „wstecz" zamyka (najpierw podgląd pełnoekranowy, potem detal).                                                                     |
| D4  | **Przycisk „Udostępnij realizację” ZASTĘPUJE „Skontaktuj się z nami”** w stopce detalu (ten sam styl, ikona udostępniania zamiast strzałki), a etykieta „CHCESZ WIĘCEJ INFORMACJI?” znika całkowicie (decyzja Mateusza — zmiana wobec rekomendacji „obok licznika”). Telefon: systemowe menu udostępniania, desktop: kopiowanie do schowka + „Link skopiowany”. Bez linku w panelu CMS. |
| D5  | Bez nowego pola w schemacie; zasada „nie zmieniaj adresu opublikowanej realizacji" w instrukcji. Usunięta realizacja → podpowiedź do listy zamiast suchego 404. Podstrony w sitemapie / Search Console.                                                   |

## 2. Ustalenia z kodu (zmierzone, nie założone)

### 2.1 ⚠️ Adresem MUSI być nazwa pliku, nie pole „Slug"

Na produkcji jest już rozjazd:

```
plik:  sklepienie-zaglaste-ze-starej-cegly-sobotka.json
pole:  "slug": "sklepienie-zaglaste-ze-starej-cegly-proszowka"
```

Klient zmienił pole „Slug" w panelu 2026-09-17 (commit `aea9692`, razem
z miejscowością Sobótka → Proszówka), a **Sveltia 0.178.0 NIE przemianowała
pliku**. Zapis w `.claude/rules/cms-realizacje.md` („zmiana pola Slug
PRZEMIANOWUJE plik") jest więc **nieprawdziwy** i trzeba go sprostować.

Skutki dla projektu:

- Nazwa pliku (`entry.id` z loadera `glob`) jest **stabilna** (panel jej
  nie zmienia) i **zawsze ASCII** (`slug: {encoding: ascii, clean_accents}`).
  Wartość pola `slug` może zawierać to, co klient wpisał (spacje, wielkie
  litery), i może się zmienić. **Adres strony = `entry.id`.**
- Dziś identyfikatorem templatów/kafli (`data-work-slug`) jest pole `slug`.
  Przechodzimy wszędzie na `entry.id`, żeby był JEDEN identyfikator
  (`viewProject` dostaje `id`; selektory `template[data-work-detail="…"]`
  bez zmian w logice).
- **Do decyzji przed startem (wymaga zgody — zasada twarda 2):** jednorazowe
  przemianowanie `…-sobotka.json` → `…-proszowka.json`, ZANIM jakikolwiek
  link pójdzie w świat. Później zmiana adresu = zerwane linki. Alternatywa:
  zostawić `sobotka` w adresie (działa, ale adres wprowadza w błąd co do
  miejsca).

### 2.2 Pozostałe

- `src/pages/realizacje.astro` (`/realizacje/`) i nowe
  `src/pages/realizacje/[adres].astro` współistnieją w Astro bez konfliktu.
- `@astrojs/sitemap` jest bez filtra, więc podstrony wejdą do sitemapy same.
  Kontrakt `seo.spec.ts` „dokładnie 8 tras" trzeba zmienić na 8 + N wpisów.
- Navbar podkreśla bieżącą pozycję przy **równości** ścieżki
  (`item.href === currentPath`), więc na `/realizacje/<adres>/` „REALIZACJE"
  straciłoby podkreślenie. Poprawka: dla `/realizacje/` dopasowanie prefiksem.
- `imgAt()` zna tylko szerokości 320/960 i zwraca adres WZGLĘDNY.
  `og:image` musi być absolutny i w formacie, który komunikatory na pewno
  przyjmą (bez `format=auto` → AVIF). Potrzebny nowy helper `ogImageAt()`:
  `https://pracownia-eha.pl/cdn-cgi/image/width=1200,height=630,fit=cover,format=jpeg/<okładka>`.
  Pole „Kadr" (`position`) da się przełożyć na `gravity=` transformacji —
  wtedy podgląd linku kadruje jak kafel. Lokalnie endpointu nie ma
  (zweryfikować na preview/produkcji).
- Kafel na `/realizacje/` jest `<button>`, na `/` — `<a href="/realizacje/">`.
  Proponuję oba jako `<a href="/realizacje/<adres>/">` z dzisiejszym
  przechwyceniem kliknięcia. Wygląd bez zmian, a dochodzi: środkowy klik /
  „otwórz w nowej karcie" / „kopiuj adres linku" z menu kontekstowego
  (trzecia droga po link) i lepszy fallback bez JS na `/`.
- `/realizacje/index.html` waży 63 KB raw. Każda podstrona to ta sama lista +
  wszystkie templaty, czyli ~63 KB × N plików w `dist`. Przy 6–20 wpisach
  pomijalne; LHCI tych tras nie mierzy.

## 3. Architektura

### 3.1 Podstrony (D1)

- Wspólny widok listy wyciągnięty z `realizacje.astro` do komponentu
  (np. `sections/work/WorkIndexView.astro`) z propem `initial?: string`.
  `realizacje.astro` i `realizacje/[adres].astro` (`getStaticPaths` z
  kolekcji) renderują TEN SAM widok, więc nie ma dwóch kopii.
- `BaseLayout` dostaje opcjonalne propy `ogImage`, `ogImageAlt`,
  `ogType` (`article` na podstronie). Domyślnie zachowanie bez zmian.
- Meta podstrony: `<title>` = „{tytuł} — {miejscowość} {rok} | Pracownia
  EH/A”, `description` = pierwszy akapit przycięty do ~155 znaków na granicy
  słowa, canonical = własny adres, `og:image` = okładka 1200×630.
- JSON-LD na podstronach: świadomie NIE w tej rundzie (kandydat
  na później; `@id` firmy jest już w `jsonld.ts`).

### 3.2 Wejście z linku (D2)

Wariant rekomendowany: **zasłona + natychmiastowe otwarcie z JS.**

1. Inline skrypt w `<head>` podstrony (wzorzec `js-motion`/`nav-fade`)
   ustawia `html.wk-dl`. CSS pod tą klasą ukrywa `main`/stopkę
   (`visibility: hidden`), więc pierwsze malowanie to papier + pasek,
   a nie „lista, a potem skok do modalu”. Bezpiecznik: klasa schodzi po
   ~1 s także wtedy, gdy JS się wywróci (strona nigdy nie zostaje pusta).
2. Skrypt strony woła `openWorkDetail(adres, nazwa)` z flagą „bez
   animacji” — przejście wyłączane inline na panelu/tle w
   `open-detail.ts` na jedną klatkę, **`overlay.ts` NIETKNIĘTY**.
   Zaraz potem zdejmuje `html.wk-dl` (lista jest już pod zasłoną).
3. Dawkowanie listy pod spodem: desktop ustawia stronę paginacji
   zawierającą tę realizację, mobile odsłania tyle kafli, by była na
   liście. Po zamknięciu użytkownik widzi ją w siatce.
4. Bez JS: klasa się nie ustawia, a `<noscript>` nad siatką renderuje
   prosty statyczny blok realizacji (tytuł jako h1, miejscowość/rok,
   akapity, zdjęcia, parametry) w skórze strony. Ten blok to dodatkowy
   markup wyłącznie w podstronach.

Odrzucony wariant: SSR detalu „otwartego” w HTML i adopcja przez JS.
Galeria na desktopie mieszka w innym miejscu DOM niż na mobile (placeGal),
a SSR nie zna progu, więc desktop do czasu JS pokazywałby zły układ.
Do tego `overlay.ts` musiałby umieć „przejąć” otwartą nakładkę (blokada
scrolla, fokus, `onClose`), czyli zmiana w module współdzielonym z menu.

### 3.3 Synchronizacja adresu (D3) — jedna maszyna stanów w `open-detail.ts`

| Zdarzenie                                   | Historia                                                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| klik kafla (lista, zajawka `/`)             | `pushState({wd: adres}, "", /realizacje/<adres>/)`                                                          |
| projnav ←/→                                 | `replaceState` na nowy adres (wstecz nie przechodzi po wszystkich obejrzanych)                              |
| otwarcie podglądu pełnoekranowego           | `pushState({wd, lb: true})` — ten sam adres                                                                 |
| zamknięcie podglądu (×, chevron, swipe, Esc) | jeśli wpis `lb` jest nasz → `history.back()`                                                               |
| zamknięcie detalu (×, swipe, Esc, tło, próg) | jeśli wpis `wd` jest nasz → `history.back()`; jeśli wejście z linku → `replaceState` na `/realizacje/`       |
| `popstate` bez `lb`, podgląd otwarty        | zamknij podgląd                                                                                             |
| `popstate` bez `wd`, detal otwarty          | zamknij detal (bez ponownego `back()` — flaga „zamykam z historii”)                                          |
| `popstate` z `wd`, detal zamknięty (dalej)   | otwórz ten detal                                                                                            |

- Jedno miejsce wyjścia: wszystkie drogi zamknięcia kończą się w
  `cleanup()` (callback `onClose`), więc tam ląduje synchronizacja adresu.
- Otwarcie z `/` zmienia adres na `/realizacje/<adres>/`, a zamknięcie
  przywraca `/` (back). Odświeżenie w trakcie = podstrona realizacji
  (lista w tle zamiast strony głównej — akceptowalne).
- Cloudflare Web Analytics śledzi zmiany historii w trybie SPA, więc
  otwarcia detalu prawdopodobnie zaczną się liczyć jako odsłony podstron.
  Do weryfikacji w panelu po wdrożeniu (polityka i tak deklaruje adresy
  podstron).

### 3.4 Przycisk „Udostępnij” (D4)

- `navigator.share({title, url})` tam, gdzie jest (telefony, Safari),
  inaczej `navigator.clipboard.writeText(url)` + krótka informacja
  „Skopiowano link” w miejscu przycisku (bez toastów, bez nowych bibliotek).
- Adres = `location.origin + /realizacje/<adres>/` (na preview poprawnie
  wskaże preview).
- **Miejsce (decyzja Mateusza, zmiana wobec propozycji „w `dt-head`”)**:
  przycisk ZASTĘPUJE „Skontaktuj się z nami” w stopce detalu — ten sam
  styl, ikona udostępniania zamiast strzałki; etykieta „CHCESZ WIĘCEJ
  INFORMACJI?” usunięta całkowicie. Kontakt zostaje osiągalny przez CTA
  listy (`.wk-cta`) i nawigację.

### 3.5 Usunięta realizacja (D5)

`404.astro` dostaje drugi, statycznie wyrenderowany wariant komunikatu
(„Tej realizacji nie ma już w portfolio” + przycisk „Zobacz wszystkie
realizacje”), wybierany po ścieżce `/realizacje/…`. Status 404 zostaje
(uczciwy dla Google). `_redirects` świadomie NIE wchodzi: plik nie istnieje,
a reguła z gwiazdką na `/realizacje/*` grozi przechwyceniem istniejących
podstron (do zweryfikowania, czy Pages stosuje redirect przed assetem).

## 4. Ryzyka i gotchas do pilnowania

1. **Przywracanie scrolla.** `overlay.ts` blokuje scroll przez
   `body{position:fixed}`, więc przy otwartym detalu `scrollY = 0`.
   Przeglądarka przy `popstate` przywraca zapisaną pozycję wpisu historii
   i może ścigać się z `unlockScroll()`. Plan: `history.scrollRestoration =
   "manual"` na trasach z detalem + `pushState` PRZED `lockScroll`.
   Kontrakt e2e: po „wstecz” lista stoi tam, gdzie była.
2. **Pętle zamykania** (close → back → popstate → close). Jedna flaga
   źródła zamknięcia; test „wstecz/dalej/wstecz” bez podwójnych zdarzeń.
3. **iOS Safari, gest krawędzi „wstecz”.** Przy wpisie z `pushState` Safari
   pokazuje animację zrzutu poprzedniego stanu. Może wyglądać inaczej niż
   swipe-down szuflady. Emulacja tego nie wykryje — test na telefonie.
4. **Android „wstecz”** dziś wychodzi ze strony przy otwartej szufladzie.
   Po zmianie zamyka szufladę. To jedyna zamierzona zmiana zachowania.
5. **Zmiana progu przy otwartym detalu** zamyka go (reguła sections.md),
   więc adres musi wrócić — pokrywa to wspólne wyjście przez `cleanup()`.
6. **Nawigacja wewnętrzna** (`nav-fade`) i `sessionStorage` bez zmian;
   zasłona `wk-dl` musi współgrać z `nav-fade` (obie tylko ukrywają).
7. Czwarte świadome odstępstwo od „mechanizm work 1:1” staje się piątym:
   historia + otwarcie bez animacji + przycisk. Wszystko ADDYTYWNE
   w `open-detail.ts`; `overlay.ts` nietknięty.

## 5. Testy

- **e2e (nowy `work-links.spec.ts`)**: każda podstrona 200 + meta
  (title/description/canonical/og:image absolutny); wejście z linku =
  detal właściwej realizacji otwarty bez animacji, lista pod spodem,
  `aria-current` w navbarze; zamknięcie → `/realizacje/`; klik kafla →
  adres, wstecz zamyka, dalej otwiera; projnav podmienia adres bez
  dokładania historii; podgląd + wstecz zamyka tylko podgląd; zajawka `/`
  → adres, wstecz wraca na `/`; pozycja scrolla po wstecz; `<noscript>`
  z treścią (SSR bez JS); udostępnianie (stub `navigator.share`
  i schowka); 404 pod nieistniejącym `/realizacje/x/` z wariantem
  komunikatu. Wszystko odporne na liczbę wpisów (`realizacjeFiles()`,
  skip z powodem przy pustej kolekcji).
- **seo.spec.ts**: lista tras = 8 + wpisy kolekcji; sitemapa je zawiera.
- **unit**: `ogImageAt()` (format, wymiary, gravity z „Kadru”), budowa
  `description` (przycięcie na słowie).
- **smoke prod**: jedna podstrona realizacji 200 + `og:image` odpowiada
  obrazkiem (`content-type: image/jpeg`, NIE samo 200 — lekcja Pages).
- **visual**: nowy zrzut wejścia z linku (detal otwarty) na fixture.
  Istniejące `work-index-*`, `work-detail-*`, `index-*`, `chrome-*` —
  zasięg zmierzyć progiem zerowym (oczekiwane 0 px, poza zrzutami
  detalu, jeśli dojdzie przycisk „Udostępnij”: wtedy `work-detail-*`
  zmienią się zamierzenie).

## 6. Kolejność prac

1. Decyzja §2.1 (przemianowanie pliku Proszówki) + sprostowanie
   `cms-realizacje.md`; etykieta pola „Slug” w `config.yml`
   („ustalany przy tworzeniu — później nie zmienia adresu linku”;
   sama etykieta, schemat bez zmian).
2. Identyfikator `entry.id` + `WorkIndexView` + podstrony + meta/og
   + navbar prefiks + `ogImageAt()`.
3. Wejście z linku (zasłona, otwarcie bez animacji, dawkowanie listy,
   `<noscript>`).
4. Historia (§3.3) + kafle jako `<a>`.
5. Przycisk „Udostępnij” (po akceptacji miejsca na zrzucie).
6. 404 z wariantem.
7. Testy, pomiar zasięgu baseline'ów, baseline'y (linux → darwin).
8. Test na telefonach (iOS swipe-back, Android wstecz, udostępnianie do
   WhatsAppa — podgląd linku z okładką).
9. Instrukcja klienta (PDF): „Jak udostępnić realizację” + „nie zmieniaj
   pola Slug”.

Szacunek: ~2 dni robocze z testami, bez czasu na akceptacje i test
na telefonach.

## 7. Wykonanie (2026-11-02)

- **Plik Proszówki przemianowany** (`git mv`, zgoda Mateusza):
  `…-sobotka.json` → `…-proszowka.json`. Treść pliku nietknięta.
  Sprostowanie zapisu o przemianowywaniu w `.claude/rules/cms-realizacje.md`.
- **Dane**: `entryToProject()` (slug = `entry.id`), `workDocTitle()`,
  `workDescription()` w `work-data.ts`; wspólna lista `work-list.ts`
  (czytają ją `/realizacje/`, podstrony i zajawka `/` przez
  `home-realizacje-data.ts`); `workDetailPath()` w `routes.ts`;
  `ogImageAt()` w `img.ts` (gravity z „Kadru").
- **Trasy**: `src/pages/realizacje.astro` → `src/pages/realizacje/index.astro`
  (URL bez zmian) + `src/pages/realizacje/[slug].astro`; widok listy
  przeniesiony 1:1 do `sections/work/WorkIndexView.astro` (prop `initial`).
  `BaseLayout` dostał `ogImage`/`ogImageAlt`/`ogType`. Zweryfikowane na
  produkcyjnym `/cdn-cgi/image`: `200 image/jpeg`, gravity realnie zmienia
  kadr.
- **Zasłona** `html.wk-dl` (inline w `<head>` podstrony, bezpiecznik 1,5 s)
  + otwarcie z klasą `.is-instant` na `#work-detail` (przejścia wyłączone
  na dwie klatki). `overlay.ts` NIETKNIĘTY.
- **Historia** wg §3.3 w `open-detail.ts`; jedno miejsce wyjścia =
  `cleanup()` → `syncHistoryOnClose()`. `document.title` podąża za
  detalem (`data-doc-title` na templacie, `data-index-title` na nakładce).
- **Kafle** `/realizacje/` i `/` są `<a href="/realizacje/<id>/">`
  (wygląd bez zmian — zmierzone 0 px).
- **Udostępnianie** — przycisk `button.dt-ask[data-share]` w `.dt-foot`
  (oba teksty stanu w SSR, `role=status` dla czytników),
  `WORK_SHARE_COPIED_MS = 2200` w `work-config.ts`.
- **Bez JS**: `<noscript>` z `WorkStaticDetail.astro` nad siatką podstrony.
- **404**: wariant „Tej realizacji nie ma już w naszym portfolio…” +
  „Zobacz wszystkie realizacje”, wybierany inline w `<head>` po ścieżce;
  bez JS — wariant ogólny.
- **Navbar**: „REALIZACJE” bieżące także na `/realizacje/<id>/`.
- **Panel**: etykieta pola „Adres linku (slug…)" + `hint` (schemat bez zmian).
- **Odstępstwo od planu §5**: nowy zrzut wizualny „wejście z linku”
  NIE powstał — stan na zrzucie byłby identyczny z istniejącym
  `work-detail-open` (ten sam detal, ta sama lista pod spodem), a każdy
  nowy baseline to 12 plików PNG w historii git.

### Znalezione przy okazji

- **a11y (realny błąd zastany od 4.3)**: na mobile tor galerii detalu
  `.dt-track` przewija się w bok, a nie był osiągalny klawiaturą — axe
  `scrollable-region-focusable` (serious). Dotąd żaden skan nie widział
  OTWARTEGO detalu; podstrona realizacji otwiera go od wejścia, więc
  pierwszy skan to złapał. Lekarstwo: `tabindex="0"` + `role="group"` +
  `aria-label` na torze (punktowy `eslint-disable` reguły
  `no-noninteractive-tabindex` z uzasadnieniem). Allowlista axe dalej PUSTA.
- **Port 4399 na maszynie Mateusza zajmuje `astro preview` projektu
  hadrianm-web** (uruchomiony 2026-10-22; 4398 — inny stary preview).
  `reuseExistingServer` sprawia, że Playwright po cichu testuje CUDZĄ
  stronę — objaw: masowe „element(s) not found". Testy tej sesji szły na
  własnym preview `pnpm preview --port 4397` + `BASE_URL=http://localhost:4397`.
  Skutek uboczny `BASE_URL`: odpala się sonda `POST /api/kontakt`
  z `smoke.spec.ts` (endpoint istnieje tylko na deployu) — jedyny czerwony
  w pełnym e2e, nie regresja.
- **Flake `not-found-full` na webkit-iphone-14**: dwustanowy, dokładnie
  8490 px (cały kadr z paskiem przesunięty o ~6 px). Przebieg KONTROLNY na
  `404.astro` i `Navbar.astro` z `main`: ta sama liczba 1 raz na 6 — stan
  zastany, nie skutek tej zmiany.

### Testy i zasięg baseline'ów

- unit **102 passed** (było 93): `ogImageAt` ×4, nowy `work-data.test.ts` ×5.
- e2e: nowy `work-links.spec.ts` (**71 passed** na 6 profilach);
  zaktualizowane `home.spec.ts` (href kafli = podstrona, adres przy
  otwartym detalu), `work-index.spec.ts` (stopka = udostępnij),
  `seo.spec.ts` (trasy = 8 + wpisy), `not-found.spec.ts` (`:visible`),
  `a11y.spec.ts` (+1 podstrona realizacji), `smoke.spec.ts` (+podstrona,
  `og:image` jako `image/jpeg` na deployu); helper `readRealizacje()`
  zwraca `slug` = nazwa pliku. Pełne e2e: **868 passed / 1 failed**
  (sonda kontaktu — wyżej).
- visual, próg zbity do zera (`work-index`, `index`, `chrome`,
  `not-found`, pliki przywrócone, `git status` czysty): **3 zmienione**
  — `work-detail-open` na webkit-iphone-se / webkit-iphone-14 /
  chromium-pixel-5 (1003 / 1542 / 2384 px: przyklejona stopka szuflady,
  zamierzone), **54 × 0 px**. Desktopowy `work-detail-open` się nie zmienia
  (stopka modala jest poniżej pierwszego ekranu treści).
- **Do wygenerowania przez Mateusza**: te 3 baseline'y × 2 platformy
  (workflow linux `mode=changed` dla `tests/visual/work-index.spec.ts` →
  darwin na końcu).
- Do sprawdzenia na telefonach (emulacja nie pokaże): gest „wstecz” od
  krawędzi w Safari iOS, „wstecz” Androida przy otwartej szufladzie,
  podgląd linku w WhatsAppie/Messengerze (okładka + tytuł), menu
  udostępniania z przycisku.

### Domknięcie po merge'u treści klienta (2026-11-02)

- W trakcie PR-a klient edytował panel (17 commitów na `main`: nowa
  „konstrukcja-stalowa”, usunięty „mur-z-cegly…”, edycje, w tym pliku
  Proszówki). GitHub zgłosił konflikt (zmiana nazwy pliku vs edycja);
  lokalny `git merge` rozpoznał zmianę nazwy i scalił czysto — treść
  wszystkich wpisów zweryfikowana `cmp` bajt w bajt z `origin/main`.
- **BŁĄD ZAŁOŻENIA, naprawiony**: `entry.id` loadera `glob` NIE jest
  nazwą pliku, gdy wpis ma pole `slug` — domyślny `generateId` bierze
  WTEDY wartość pola. Dopóki pola zgadzały się z nazwami plików, nie było
  tego widać; po edycjach klienta build dał adresy
  `/realizacje/przemurowanie-sklepienia-w-milęcicach/` (polski znak,
  adres zmieniający się z każdą edycją pola). Lekarstwo: jawny
  `generateId: ({ entry }) => entry.replace(/\.json$/, "")`
  w `content.config.ts`. Strażnikiem jest `seo.spec.ts` (sitemapa = trasy
  z NAZW PLIKÓW).
- Klient PRZERABIA testowe wpisy na prawdziwe realizacje, więc nazwy
  plików przestały pasować do treści. Za zgodą Mateusza (przed pierwszym
  udostępnionym linkiem) jednorazowo przemianowane:
  `instalacje-w-zabytkowej-oficynie-sroda-slaska.json` →
  `przemurowanie-sklepienia-w-milecicach.json`,
  `nowa-wiezba-nad-stuletnim-zrebem-olesnica.json` →
  `nowa-wiezba-nad-stuletnim-balem-czernica.json` (pole „Slug” klienta
  bez polskich znaków; treść nietknięta).
- Bramki po merge'u: unit 102, e2e **874 passed / 1 failed** (sonda
  kontaktu przy `BASE_URL` — artefakt). Fixture wizualny nietknięty
  (nazwy plików = pola `slug`), więc baseline'y bez zmian.

