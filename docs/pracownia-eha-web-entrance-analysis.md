# Analiza wejściowa — pracownia-eha.pl (strona dla klienta: Pracownia EH/A)

> **Status:** ANALIZA DECYZYJNA (2026-08-19). Dokument powstał w repo
> `delung-web`, ale docelowo przenosi się do katalogu projektu
> `~/Projects/eha/pracownia-eha-web` — dlatego CELOWO nie jest wpisany do
> `docs/README.md` tego repo (ta sama konwencja, co analiza delung pisana
> w repo hadrianm).
>
> **Cel:** zebrać w jednym miejscu (1) decyzje podjęte, (2) architekturę
> docelową, (3) różnice względem delung-web (w tym NOWOŚĆ: integracja
> z istniejącą domeną i skrzynką w The Camels), (4) nieliczne punkty
> otwarte — tak, żeby dało się napisać instrukcję wykonawczą
> (`pracownia-eha-web-creation-process.md`).
>
> **Źródła:** kod i dokumentacja `delung-web` (CLAUDE.md, analizy
> `analiza-*.md`, reguły `.claude/rules/`) i `hadrianm-web`
> (`mailbox_setup.md`, `hosting_second_analysis_sveltia.md`,
> `contact-me-form-analysis-implementation.md`, kronika §A–E) oraz
> eksporty designów `~/Projects/eha/pracownia-eha-web/docs/design/export`
> (8 widoków HTML z Claude Design + `support.js` + `assets/` ~131 MB).

---

## 1. Kontekst i cel projektu

- **Klient:** Pracownia EH/A — rejestrowo „Pracownia Łukasz
  Jarosz-Jarszewski", Strzyżowiec 30, 59-610 Wleń; NIP 527-244-99-69,
  REGON 540526327. Remonty domów z historią (ciesielstwo, murarstwo,
  sklepienia, fizyka budowli, instalacje); tagline „REMONTY DOMÓW
  Z HISTORIĄ". Zespół dwuosobowy: Łukasz i Maciek (dwa telefony
  kontaktowe z etykietami imion).
- **Domena:** `pracownia-eha.pl` — **JUŻ ISTNIEJE**, kupiona przez
  klienta w **The Camels**; na hostingu The Camels (DirectAdmin) stoi
  strona-placeholder („Something amazing will be constructed here…") oraz
  **działająca skrzynka `eha@pracownia-eha.pl`** (jedyny adres na
  domenie). Nikt poza klientem nie zna/nie odwiedza adresu — można
  swobodnie testować na produkcji do czasu przekazania.
- **Charakter strony:** wizytówka firmowa z portfolio realizacji
  zarządzanym przez klienta w panelu CMS (zdjęcia + **filmy** + teksty)
  i formularzem kontaktowym.
- **Rola projektu:** trzeci przebieg „przepisu" (hadrianm → delung →
  eha). Kod startowy = kopia delung-web (najświeższe lekcje: bez
  GSAP/Lenisa, scroll natywny, jeden breakpoint 1024, schemat CMS po
  remoncie panelu, testy odporne na treść z panelu). Wszystkie
  rekomendacje kroniki hadrianm obowiązują nadal: guardraile i deploy
  w dniu 1, testy wcześnie, widoki pętlą analiza → implementacja →
  testy → PR.

## 2. Decyzje podjęte (2026-08-19, E1–E14)

| #   | Obszar                  | Decyzja                                                                                                                                                                                                                                                                        |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E1  | Start kodu              | **Kopia delung-web jako szablon** (bez historii git); zostaje infrastruktura + mechanizm detalu/lightboxa/wideo, wycinamy widoki i treści delung                                                                                                                                 |
| E2  | Domena/DNS              | Rejestracja i hosting poczty **zostają w The Camels**; do Cloudflare przenosi się **tylko delegacja NS** (Pages Free wymaga strefy w CF). Założenie robocze: klient przekazuje login+hasło do panelu The Camels (pytanie wysłane; jeśli odmówi — osobna instrukcja „klient klika") |
| E3  | Poczta                  | Skrzynka `eha@pracownia-eha.pl` na hostingu The Camels **nietknięta** — komplet rekordów pocztowych odtwarzany 1:1 w strefie CF PRZED przełączeniem NS; placeholder DirectAdmin zgaśnie przy przełączeniu (zaakceptowane)                                                        |
| E4  | Resend                  | **Osobne konto klienta** na `eha@pracownia-eha.pl` (free plan = 1 domena/konto), domena `send.pracownia-eha.pl` (region EU), 2FA + Setup Key u Mateusza do rozliczenia — wzorzec delung 1:1                                                                                      |
| E5  | Kategorie realizacji    | **BEZ pola kategorii i bez filtrów** (design ich nie ma) — płaska lista. Za to **paginacja z designu**: desktop = paginacja, mobile = przycisk „pokaż więcej" (patrz §6.3)                                                                                                       |
| E6  | Schemat CMS             | Wzorzec delung po remoncie panelu: galeria wariantowa Zdjęcie/Film, pierwsza pozycja = zdjęcie = kafel (bez pola `cover`), miniatura filmu = klatka ze środka, slug ASCII; `paras`/`params` elastycznie (min 1) z hintami; bez pola opisu SEO per wpis                            |
| E7  | Lightbox                | Mechanizm delung 1:1, ale **kadr = całe zdjęcie dopasowane do ekranu** (`object-fit: contain` na czarnym tle — bez przycinania), plus **strzałki klawiatury** w podglądzie i galerii detalu (zasada: im lepszy UX, tym lepiej)                                                    |
| E8  | Wideo                   | Pełny flow delung (preload="none", bez controls, tap→podgląd z grającym klipem, tap=pauza↔play, klatka `/cdn-cgi/media`, poster dwiema drogami, preset HandBrake). **Klient MA już filmy** — wchodzą jako materiał testowy w Etapie CMS                                           |
| E9  | Formularz               | **4 pola wszędzie** (5. pole desktopu z designu = pomyłka, usunąć): imię i nazwisko, telefon LUB e-mail (jedno pole), lokalizacja inwestycji, opis. Auto-potwierdzenie tylko przy e-mailu. **Bez checkboxa RODO** — notka „wysyłając akceptujesz politykę" jak w delung           |
| E10 | Fonty                   | Self-host przez Fontsource: **EB Garamond** (+italiki), **IBM Plex Sans**, **IBM Plex Mono**; Google Fonts z eksportów NIE wchodzi (FOUC + polityka prywatności deklaruje tylko Cloudflare/Resend)                                                                               |
| E11 | Scroll + navbar         | Scroll **natywny na dokumencie** (kontener `fixed` z eksportów = artefakt Claude Design, nie odtwarzamy). Navbar **Z auto-hide** przy scrollu w dół + powrót przy scrollu w górę / kursorze u góry (celowy wzorzec 8/8 stron designu; inaczej niż delung D-CH4)                   |
| E12 | Nazewnictwo/repo        | Repo **publiczne** `mateuszhadrian/pracownia-eha-web`; prefiks `eha-`: bucket `eha-media` + `media.pracownia-eha.pl`, Worker `sveltia-cms-auth-eha` + `auth.pracownia-eha.pl`, konto `eha-cms`, OAuth „Panel treści — pracownia-eha.pl", Turnstile `eha-kontakt`, KV `eha-kontakt-quota` |
| E13 | Treści testowe          | **Dokładnie jak w delung**: CMS+R2 wstają PRZED widokami, 6 wpisów wg `DATA` z designu wgranych przez panel (ścieżka docelowa) — ŻADNEGO hardkodu realizacji w repo                                                                                                              |
| E14 | Materiały               | Assety eksportu = finalne źródła (131 MB PNG/JPG → pipeline WebP). Nazwy plików NIE niosą informacji („test" w nazwie ≠ placeholder) — przy wdrażaniu przemianować wg dobrych praktyk (ASCII, bez polskich znaków, bez dubli). Brak stopki na `realizacje.html` = niedoróbka eksportu — stopka wchodzi ze wspólnego chrome'u |

## 3. Designy — co wynika z eksportów

Eksporty: 8 plików HTML + `support.js` + `assets/` (68 plików, 131 MB,
wyłącznie PNG/JPG). Breakpoint **1024 px** (ten sam co delung), wzorce
390/1440. Fonty: EB Garamond (nagłówki), IBM Plex Sans (body), IBM Plex
Mono (etykiety uppercase). **Zero bibliotek zewnętrznych** — animacje to
CSS `@keyframes` + IntersectionObserver (reveale `.rev`, „rysowanie"
rycin maską `.ryc`, parallaxy `.plx`/`.plxr`, diagram `.lay`); wszystko
respektuje `prefers-reduced-motion`.

| Plik                             | Route docelowy                 | Sekcje / uwagi                                                                                                                  |
| -------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                     | `/`                            | hero + 6 zajawek (ekipa, realizacje, kompetencje, obsługa budowy, tradycja, kontakt) + stopka; najcięższa strona                 |
| `ekipa-eha.html`                 | `/ekipa-eha/`                  | hero, intro, biogramy Łukasz/Maciek, dziedzictwo, „sieć mistrzów", CTA; **zwijane akapity** („Czytaj dalej" ↔ „Zwiń")            |
| `kompetencje-i-technologie.html` | `/kompetencje-i-technologie/`  | ciesielstwo / murarstwo / sklepienia / fizyka budowli / instalacje / „świadome granice"; też zwijane akapity                     |
| `tradycja-i-ekologia.html`       | `/tradycja-i-ekologia/`        | manifest, fizyka budowli, upcycling, trwałość, mikroklimat; jedyna z **animowanym diagramem**                                    |
| `realizacje.html`                | `/realizacje/`                 | lista kafli + detal (modal desktop / bottom sheet mobile) + paginacja/„pokaż więcej"; **bez stopki (niedoróbka — dokładamy)**    |
| `obsluga-budowy.html`            | `/obsluga-budowy/`             | hero, „jeden punkt kontaktu", „pełna kontrola z dystansu", CTA; najlżejsza strona                                                |
| `kontakt.html`                   | `/kontakt/`                    | hero, split kontaktowy, formularz, dane firmowe, social, RODO                                                                    |
| `polityka-prywatnosci.html`      | `/polityka-prywatnosci/`       | 9 sekcji + spis treści ze skokami + blok „pytania o dane"; **pasmo daty bez daty** — data wchodzi przy wdrożeniu                 |

**Nawigacja** (identyczna 8/8): logo → `/`; pozycja zbiorcza **„O nas"**
= dropdown na desktopie / akordeon w menu mobilnym (Ekipa EH/A,
Kompetencje i technologie, Tradycja i ekologia); dalej Realizacje,
Obsługa budowy, Kontakt; polityka tylko w stopce. Menu mobilne = bottom
sheet (grabber, scrim, Esc, kaskadowe wjazdy pozycji, stopka z dwoma
telefonami MACIEK/ŁUKASZ). Navbar z **auto-hide** (E11).

**Model danych realizacji zaszyty w designie** (tablica `DATA`,
6 projektów — gotowy punkt wyjścia dla CMS i treści testowych):

```js
{ place: 'CZERNICA', year: '2023',
  cover: 'assets/….jpg', alt: '…',
  title: 'Dom z bala przeniesiony i zrekonstruowany',
  photos: [{ src }, { src, video: true }],   // 3–4 pozycje
  paras: ['…','…','…'],                       // 3 akapity opisu
  params: [['Rodzaj obiektu','Dom zrębowy'], …] }  // 7 par label/value
```

**Istotne fakty techniczne eksportów:**

- **To eksporty Claude Design** — otwierają się z dysku i dają się
  przeklikać (potwierdzone przez Mateusza), więc służą jako pełna
  referencja wyglądu i zachowania. Ale ich BUDOWA to artefakty
  środowiska DC, nie wzorce implementacji: dwa kompletne drzewa markupu
  (`isMobile`/`isDesktop` w JS zamiast media queries), szablonowanie
  `{{ }}`/`<sc-if>`/`<sc-for>`, runtime `support.js`. **Zasada portu:
  referencje odpowiadają na pytanie „jak ma wyglądać i jak się
  zachowywać", implementacja ma być optymalna w Astro** (SSR, `@media`
  zamiast JS-owego przełączania drzew, duplikaty per-breakpoint tylko
  tam, gdzie markup realnie się rozjeżdża — wzorzec delung).
- Scroll żyje w kontenerze `position:fixed` (artefakt środowiska) —
  wszystkie triggery animacji przemapowujemy na scroll dokumentu (E11).
- Skalowanie desktopu na container queries (`cqw`) i mnożnikach JS
  (`--k` od wysokości, `--w` od szerokości) — do przełożenia na
  `clamp()`/tokeny; ukryty drugi próg **700 px** w siatce realizacji
  (siatka 1 kol. → 2 kol.).
- **Atrapy do zbudowania od zera wg wzorców delung:** formularz (brak
  `<form>`, checkbox = `<span>`), wideo (badge „STUKNIJ, ABY OBEJRZEĆ"
  + ikonka kamery na zwykłym PNG, zero MP4), podgląd pełnoekranowy
  (w designie nie istnieje).
- Detal realizacji w designie: modal desktop 57 % zdjęcie / 43 % treść,
  przełączanie CAŁYCH realizacji strzałkami obok modala (odpowiednik
  projnav delung, przejazd karty za krawędź), strzałki zdjęć w kadrze,
  klawiatura Esc/←/→; mobile: bottom sheet 90 % z drag-to-dismiss
  i karuzelą scroll-snap 4:3 z kropkami i licznikiem `01 / 04`.
- Assety: 10 plików > 3 MB (rekord 7,5 MB); `paper-background.png`
  (2,2 MB) jest tłem KAŻDEJ strony i KAŻDEGO panelu — optymalizacja
  nr 1; logo siedzi jako ~258 KB base64 w każdym pliku (w porcie: jeden
  SVG); 4 pary duplikatów bajt w bajt; nazwy do przemianowania (E14).
- **Polityka prywatności z góry deklaruje stack**: Cloudflare
  (Pages/WAF/Turnstile/**Web Analytics**) + Resend, „nie zapisujemy
  cookie", transfery poza EOG na SCC. Implementacja musi to dotrzymać
  (stąd m.in. E10 — self-host fontów); nie będzie łatki à la delung
  D-E12, tylko data do wstawienia.
- Wyjścia na zewnątrz TYLKO: link do Google Maps (search, bez iframe),
  Instagram `pracowniaeha`, Facebook (profil id 61574396106209),
  uodo.gov.pl. **Facebook zostaje** (inaczej niż delung).

## 4. Co bierzemy z delung-web, co wycinamy, co budujemy od nowa

### 4.1 Zostaje (infrastruktura + mechanizmy — największa wartość kopii)

- **Fundament:** Astro 6 static, Tailwind 4, tokeny w `:root`,
  self-hosted fonty + preloady + bramka anty-FOUC, `BaseLayout`
  (canonical/OG/sitemap), scroll natywny (reguła `scroll.md`),
  `color-scheme: only light`, motion-gate `js-motion`.
- **Cały mechanizm detalu realizacji** (patrz §7): `overlay.ts`,
  `open-detail.ts`, markup `WorkDetailOverlay`/`WorkDetail`,
  `work-config.ts`, wzorzec `<template data-work-detail>`,
  `viewProject()` liczący kafel z pierwszej pozycji galerii.
- **CMS/serwis:** `imgAt()`/`videoFrameAt()`, Content Collections +
  `content.schema.ts` (Zod współdzielony z testem kontraktu), panel
  Sveltia (wersja przypięta 0.178.0, slug ASCII, warianty listy,
  `.superRefine` „pierwsza pozycja = zdjęcie"), formularz
  (`functions/api/kontakt.ts` + `contact-form.ts` + 5 warstw antyspamu
  + KV quota), antyscraping `contact-details.ts` (sloty tel/mail).
- **Testy i CI:** konfiguracja Playwright (6 profili) / Vitest / axe /
  LHCI, helpery (`assertPreview`, `realizacje.ts`, `breakpoint.ts`,
  `guards.ts` z filtrem `/cdn-cgi/`, freeze.css, `settleImages`),
  `build:visual` z fixture'ami, workflowy `ci.yml` / `prod-smoke.yml` /
  `update-visual-baselines.yml` (oba z `workflow_dispatch`), husky +
  commitlint + lint-staged.
- **Ekosystem `.claude`:** CLAUDE.md (przepisany), settings z blokadami
  (commit/push, baseline'y, JSON-y CMS, `.env`), hooki, reguły
  (`testing`, `cms-realizacje`, `sections`, `scroll`), skille (`/test`,
  `/release-check`, `/verify-mobile`, `/new-realizacja`).
- **Skrypty:** `optimize-images.mjs`, `make-icons.mjs`, wzorzec
  `migrate-realizacje-gallery.mjs` (gdyby była potrzebna migracja).

### 4.2 Wycinamy

- Wszystkie widoki delung: `sections/{home,oferta,work*,proces,o-nas,contact}`
  w warstwie treści/markupu (mechanizmy work zostają — §4.1),
  `KategorieSheets`, redirect `/kategorie/`, `categories.ts` i cały
  aparat kategorii (`workRail`, `categoriesWithWork`, deep-linki
  filtrów, test kontraktu kategorii) — **eha nie ma kategorii** (E5).
- Treści: polityka delung, opinie (`opinie.ts` — design eha nie ma
  sekcji opinii), dane firmy (`jsonld.ts` do przepisania), baseline'y
  wizualne, budżety LHCI (liczby mierzone od nowa), og-image/ikony.
- `BackButton`/`back-link.ts` — w delung uśpione (D-CH8); w eha
  najprościej nie kopiować (design nie ma wstecz-przycisków).

### 4.3 Budujemy od nowa (wg designów eha)

- Chrome globalny: navbar z dropdownem „O nas" + auto-hide, menu
  mobilne bottom sheet z akordeonem, stopka (2 kolumny + 2 telefony +
  IG/FB + „NA GÓRĘ").
- Strona główna (hero + 6 zajawek) i 4 podstrony treściowe
  (`/ekipa-eha/`, `/kompetencje-i-technologie/`,
  `/tradycja-i-ekologia/`, `/obsluga-budowy/`) — w tym wspólne
  mechanizmy: zwijane akapity, „rysowanie" rycin, diagram.
- `/realizacje/`: siatka (próg 700 px) + paginacja/„pokaż więcej"
  (§6.3) + skin detalu i lightboxa pod design eha (mechanika z delung).
- `/kontakt/` (4 pola, E9) i `/polityka-prywatnosci/` (9 sekcji +
  sticky spis treści).
- Nowa paleta/tokeny (papier/atrament/sepia z designów) + fonty E10.

## 5. Parametryzacja — miejsca „delung" do podmiany w kopii

Checklista jak §5 analizy delung (lista zweryfikowana na kodzie delung):

1. **Domena/URL:** `astro.config.mjs` (`site: "https://pracownia-eha.pl"`),
   `package.json` (`name`, `test:smoke:prod`), `public/robots.txt`,
   `prod-smoke.yml`, `.claude/settings.json` (allow `curl …`).
2. **CMS/R2:** `public/admin/config.yml` (repo, `base_url`,
   `account_id`, `access_key_id`, bucket `eha-media`,
   `public_url: https://media.pracownia-eha.pl`, `prefix: "realizacje/"`,
   slug ASCII zostaje), `public/admin/index.html` (title), testy
   `media-r2`/`img` (regex `media\.pracownia-eha\.pl`).
3. **Poczta/formularz:** `contact-form.ts` (`CONTACT_TO=
   "eha@pracownia-eha.pl"`, nadawcy `…@send.pracownia-eha.pl`, treści
   maili, temat `[pracownia-eha.pl] …`), `contact-config.ts` (site key
   nowego widgetu Turnstile, próg 1024 zostaje),
   `contact-details.ts` (**DWA telefony** + mail — rozszerzenie slotów
   antyscrapingowych o wariant per-osoba MACIEK/ŁUKASZ).
4. **Branding UI:** logo EH/A (z base64 eksportów → jeden zoptymalizowany
   SVG), `Navbar`/`Footer`/`LoadingOverlay`, `BaseLayout` (title,
   `og:site_name`), `site.webmanifest`, favicony/og-image (finalne
   w Etapie 6 przez `make-icons.mjs` z nowego `favicon.svg`).
5. **Teksty/JSON-LD:** `src/lib/jsonld.ts` — dane Pracowni EH/A, typ
   `HomeAndConstructionBusiness` (lepszy niż `GeneralContractor` dla
   profilu remontowego; decyzja robocza w Etapie 6), `sameAs` IG+FB;
   zasada delung D-CH5 zostaje (JSON-LD bez telefonu/maila).
6. **Skrypty/komentarze/`.claude`:** CLAUDE.md, skille, `lighthouserc*.cjs`
   (komentarze z liczbami delung → nowe pomiary), grep kontrolny
   `grep -ri "delung" src public functions .github .claude` → 0 trafień.

## 6. Architektura CMS i widoku realizacji

### 6.1 Schemat kolekcji `realizacje` (PL-only, z wideo — E6)

```ts
{
  slug: string,        // nazwa pliku (ASCII — encoding+clean_accents w config.yml)
  order: number,
  title: string,       // „Dom z bala przeniesiony i zrekonstruowany"
  place: string,       // „Czernica" (na kaflu uppercase z CSS)
  year: string,        // „2023"
  paras: string[],     // opis; min 1, hint „najlepiej 3 akapity"
  gallery: [           // WARIANT (types/typeKey Sveltii — jak delung po remoncie)
    { type: "photo", image: string, position?: string } |
    { type: "video", video: string, duration?: string }
  ],                   // min 1; PIERWSZA pozycja musi być zdjęciem (kafel)
                       //  — .superRefine z komunikatem dla klienta + hint
  specs: [ { label: string, value: string } ],  // params; min 1, hint „7 par"
}
```

Kafel = pierwsza pozycja galerii (`viewProject()` z delung bez zmian
koncepcyjnych). Miniatura filmu = klatka ze środka
(`videoFrameAt` → `/cdn-cgi/media/mode=frame`). Zmiany schematu zawsze
w **trzech miejscach naraz** (`content.schema.ts` + `config.yml` +
komponenty) — reguła `cms-realizacje.md` przechodzi.

Bez pól: `category` (E5), `cover` (liczony), `description` SEO (E6).

### 6.2 Logowanie klienta i R2 — wzorzec delung 1:1

Konto techniczne `eha-cms` (collaborator write, mail = skrzynka
klienta, User-bypass Always w rulesecie — dodawany przez API, lekcja
delung), OAuth App „Panel treści — pracownia-eha.pl", Worker
`sveltia-cms-auth-eha` (`auth.pracownia-eha.pl`,
`ALLOWED_DOMAINS=pracownia-eha.pl,localhost`), `site_domain`
w config.yml (bez tego localhost wysyła zły site_id — gotcha delung).
Bucket `eha-media` (EU) + `media.pracownia-eha.pl` + Image
Transformations + token Object R&W scope'owany do bucketa. Gotchas
dziedziczone: Sveltia nie kasuje mediów z R2 (sprzątanie sierot —
przy wideo istotne), upload R2 działa tylko przez pola edytora wpisu
(nie globalny widok Assets), Secret Access Key podawany w panelu.
Spike wideo: w delung `widget: file` → MP4 do R2 działał (Plan A,
range requests OK) — na tej samej przypiętej wersji Sveltii ryzyko
niskie, ale krok weryfikacyjny w instrukcji zostaje.

### 6.3 Paginacja listy realizacji (E5 — nowość względem delung)

Design: desktop = paginacja, mobile = przycisk „pokaż więcej"
doładowujący kolejne kafle. Strona jest statyczna, więc:

- **SSR renderuje WSZYSTKIE kafle** (i wszystkie `<template
  data-work-detail>` — jak w delung); JS jedynie ukrywa kafle poza
  bieżącą stroną / poza licznikiem „pokaż więcej". Bez JS lista jest
  po prostu pełna (progressive enhancement — stan bez JS lepszy, nie
  gorszy). SEO nie cierpi (treść w HTML), koszt bajtów pomijalny
  (kafle to markup + lazy obrazy przez `imgAt()`).
- Rozmiar strony paginacji = odczyt z designu w mini-analizie widoku
  (Etap 4); projnav detalu dostaje kontekst **pełnej listy** (nie
  tylko widocznej strony) — do potwierdzenia w analizie widoku.
- Testy: e2e paginacji/„pokaż więcej" pisane od razu odporne na liczbę
  wpisów (`test.skip` przy liczbie ≤ rozmiaru strony — reguła
  `testing.md`); visual na zamrożonym fixture.

## 7. Port mechanizmu detalu + podglądu pełnoekranowego (E7/E8)

Mechanika przenoszona z delung **1:1** — potwierdzona przenośność:
`overlay.ts` (498 linii, zero zależności), `open-detail.ts` (546 linii,
jedyny import = stała progu), markup `WorkDetailOverlay` + kontrakt
atrybutów `data-*`; razem ~1150 linii TS + ~600 linii CSS. Zostają bez
zmian: jeden overlay `#work-detail` (modal↔sheet czystym CSS przy
1024), klonowanie z `<template>`, `placeGal`, zamknięcie przy zmianie
progu, projnav z przejazdem panelu za krawędź (`swapSeq`/`exiting`),
gesty na `touch*` z `preventDefault` w pierwszej klatce (D-W9),
Esc capture'em zamyka tylko podgląd, powrót na oglądany kadr, fokus na
kontener (iOS), `data-overlay-panel`+`data-overlay-nodrag` na
lightboxie, wideo bez `controls` (`[data-cam]`/`[data-cam-hint]`,
tap→podgląd z grającym klipem, tap=pauza↔play, poster dwiema drogami —
gotcha Chromium przy `preload="none"`).

**Adaptacje pod eha (jedyne zmiany):**

1. **Kadr lightboxa: `object-fit: contain` na pełnym ekranie** (E7a) —
   delung kadruje `cover` w ramie 330/412; eha pokazuje CAŁE zdjęcie,
   czarne tło wypełnia resztę. Konsekwencje do pilnowania w analizie
   widoku: licznik mobilny delung pozycjonuje się względem stałej ramy
   (`calc(50% + min(...))`) — przy `contain` idzie na stały dolny pas;
   `.lb-media` traci `aspect-ratio` na rzecz `inset:0` + `contain`;
   wideo w podglądzie także `contain` (filmy klienta mogą być pion/poziom).
2. **Klawiatura** (E7b): w podglądzie ←/→ przełącza kadry (desktop);
   w detalu poza podglądem ←/→ przełącza kadry galerii — zgodnie
   z designem (`onKey` w modalu). Esc-hierarchia bez zmian (podgląd →
   detal). Zasada nadrzędna: im lepszy UX, tym lepiej.
3. **Skin:** wymiary/łuki/cienie modala (57/43, `min(1260…)`) i sheeta
   (90 %, grabber, kropki paginacji karuzeli 4:3) wg designu eha;
   tor galerii i liczniki przechodzą na format poziomy. Uwaga na
   zaszyty w JS gap toru (`offsetWidth + 10`) — przy zmianie gapu
   w CSS poprawić stałą (znane twarde założenie portu).
4. **Strzałki przełączania realizacji** obok modala (design `step()`)
   = istniejący projnav delung — zmienia się tylko pozycja/wygląd
   przycisków (w delung `.dt-projnav` to już chrome poza panelem —
   pasuje wprost).

## 8. Domena i poczta — integracja z The Camels (NOWOŚĆ tego projektu)

Stan zastany: domena kupiona w The Camels, hosting The Camels
(DirectAdmin) serwuje placeholder i skrzynkę `eha@pracownia-eha.pl`
(jedyny adres). Założenie E2: klient przekazuje login+hasło do panelu
klienta The Camels (w razie odmowy — wariant „klient klika wg
instrukcji", osobny dokument).

**Zasada nadrzędna:** rejestracja domeny i hosting poczty ZOSTAJĄ w The
Camels. Przenosimy WYŁĄCZNIE obsługę DNS (delegacja NS) do Cloudflare,
bo Pages na planie Free wymaga strefy w koncie CF. Poczta nie może mieć
ani chwili przerwy → rekordy pocztowe muszą stać w strefie CF ZANIM
przełączą się nameserwery.

**Proces (szczegóły klik-po-kliku wejdą do instrukcji):**

1. **Od klienta:** dostęp do panelu klienta The Camels (zarządzanie
   domeną = zmiana NS + DNSSEC) i do panelu DirectAdmin hostingu
   (odczyt strefy DNS i ustawień poczty). Nic więcej — hasła do
   skrzynki nie potrzebujemy (zostaje nietknięta).
2. **Inwentarz strefy DNS** (DirectAdmin → DNS Management): zrzut
   WSZYSTKICH rekordów, ze szczególnym naciskiem na pocztowe — MX,
   SPF (TXT `@`), DKIM (`x._domainkey` — DirectAdmin generuje własny
   selektor), DMARC (`_dmarc`), rekordy `mail.`/`webmail.`/
   `autoconfig.`/`autodiscover.`/SRV. Zapisać też adres serwera poczty
   (host MX) i sposób logowania klienta do skrzynki (webmail/IMAP) —
   po migracji nic się dla niego nie zmienia, ale trzeba to umieć
   potwierdzić testem.
3. **DNSSEC:** sprawdzić w panelu The Camels, czy aktywny. Jeśli TAK —
   wyłączyć i POCZEKAĆ na zdjęcie rekordu DS z rejestru NASK (kontrola
   DNSViz / whois „Unsigned") **zanim** zmienią się NS — ta sama
   pułapka co w OVH przy delung (SERVFAIL przy osieroconym DS).
4. **Strefa w Cloudflare:** Add a domain → `pracownia-eha.pl`; skan CF
   traktować jako podpowiedź, a KOMPLET rekordów przepisać ręcznie
   z inwentarza (skan gubi zwłaszcza TXT/SRV/DKIM). Rekordy pocztowe
   **DNS only** (szara chmurka). Rekordy A/CNAME placeholdera NIE
   przenosić (strona ma wskazywać Pages).
5. **Przełączenie NS** w panelu The Camels na parę wskazaną przez CF →
   status Active → **test poczty** (wyślij/odbierz z `eha@`, sprawdź
   nagłówki SPF/DKIM/DMARC = PASS) → Pages → Custom domains:
   `pracownia-eha.pl` + `www`. Placeholder DirectAdmin znika —
   zaakceptowane (E3).
6. **Dopiero po Active:** subdomeny projektu w strefie CF —
   `media.` (R2), `auth.` (Worker), `send.` (Resend: MX feedback-smtp,
   SPF amazonses, DKIM `resend._domainkey` — wzorzec hadrianm/delung,
   rekordy główne domeny NIETKNIĘTE).
7. **Rollback:** w razie problemów powrót NS na The Camels przywraca
   stan zastany w minuty (strefa u nich zostaje nienaruszona — NIE
   kasować jej po migracji); eksport strefy CF do notatek po każdej
   zmianie (higiena z części D instrukcji delung).

**Do zebrania od klienta (checklista do instrukcji):** login+hasło
panelu klienta The Camels; potwierdzenie, że poczta = pakiet hostingowy
The Camels (już potwierdzone); zgoda na zniknięcie placeholdera (już
jest); informacja, na czym klient czyta pocztę (webmail/telefon/Outlook)
— do testu po migracji i do instrukcji przekazania.

## 9. Routing i SEO

- Trasy (8, `src/lib/routes.ts` — jedno źródło prawdy): `/`,
  `/ekipa-eha/`, `/kompetencje-i-technologie/`, `/tradycja-i-ekologia/`,
  `/realizacje/`, `/obsluga-budowy/`, `/kontakt/`,
  `/polityka-prywatnosci/`. **Mobile 1:1 desktop** — bez odpowiednika
  pary /oferta/+/kategorie/ i bez redirectów; jedna trasa = jeden widok
  z wariantami per breakpoint (wzorzec duplikatów SSR z delung tam,
  gdzie markup się rozjeżdża).
- Sitemap `@astrojs/sitemap` + `robots.txt` z `Disallow: /admin`;
  Search Console (property domenowa) po podpięciu domeny.
- JSON-LD: `/kontakt/` = `HomeAndConstructionBusiness` (adres, geo,
  godziny „Na budowie pn.–pt. 8:00–16:00", NIP, `sameAs` IG+FB) —
  BEZ telefonu/maila (D-CH5); `/` = `@graph` z `WebSite` + samodzielną
  `Organization` (lekcja delung: nie zagnieżdżać w `publisher`;
  walidacja `validator.schema.org`, nie tylko RRT).
- OG/ikony/manifest: `make-icons.mjs` z wektora logo EH/A (znaczek na
  jasnym kwadracie, og-image = pełne logo na tle „papieru"); Etap 6.
- Antyscraping: telefonów (2×) i maila NIE ma w surowym HTML — sloty
  `contact-details.ts` składane w JS (kontrakt e2e na surowym HTML jak
  w delung); dotyczy też stopki menu mobilnego (MACIEK/ŁUKASZ)
  i polityki prywatności.
- Cloudflare Web Analytics (auto-injection w strefie — zgodne
  z polityką, która JUŻ go deklaruje); UptimeRobot HTTPS 5 min.

## 10. Testy i CI

- Pełna piramida z kopii delung: `quality` + `e2e` + `lighthouse` jako
  required checks (od Etapu 3), prod-smoke po deployu, husky lokalnie.
- Profile Playwright: te same 6; breakpoint 1024 ⇒ telefony zawsze
  mobile, chromium-1366/1920 desktop. Kontrakt progu
  (`tests/helpers/breakpoint.ts`, pomiar 1023/1024) dla chrome'u,
  realizacji i widoków z rozjazdem markupu; dodatkowo próg 700 px
  siatki realizacji pod ten sam wzorzec.
- Baseline'y od zera, święta kolejność: kod → workflow linux → commit
  darwin na końcu. Wideo na zrzutach przez maskę (`video` +
  `.dt-poster`); odtwarzanie funkcjonalnie w e2e (`Input.dispatchTouchEvent`
  dla gestów — kontrakty z delung przechodzą z mechanizmem).
- Testy odporne na treść z panelu OD PIERWSZEGO DNIA (lekcja incydentu
  delung 2026-08-06): odczyt wpisów wyłącznie przez helper, `test.skip`
  z powodem przy krótkiej liście, jedyny czerwony sygnał = kontrakt
  „katalog ma ≥1 wpis" w unit. `build:visual` na zamrożonym fixture
  (własny komplet eha: ~5 wpisów, 1 z wideo — NIE synchronizowany
  z treścią produkcyjną).
- Allowlista axe: PUSTA od startu (ratchet od zera) — kontrasty
  etykiet IBM Plex Mono na „papierze" sprawdzić na etapie tokenów.
- LHCI: budżety z pomiaru szkieletu+home Z ZAPASEM na sekcje, potem
  ratchet (podnoszenie tylko decyzją Mateusza, osobne commity).
  **Warunek wejścia: pipeline obrazów** — bez WebP z 131 MB PNG budżety
  polegną natychmiast (patrz Ryzyka).

## 11. Proponowane etapy pracy (szkielet pod instrukcję wykonawczą)

- **Etap 0 — bootstrap repo:** `~/Projects/eha/pracownia-eha-web` =
  kopia delung-web bez `.git`/generatów/baseline'ów/treści; wycinanie
  (§4.2), parametryzacja (§5), tokeny+fonty eha (E10), `routes.ts`
  (8 tras), szkielety wszystkich stron, ekosystem `.claude` przepisany,
  eksporty designów już są w `docs/design/export` (przeglądane wprost
  z dysku — §3); pipeline obrazów:
  `optimize-images.mjs` na assetach sekcji statycznych (przemianowanie
  wg E14 przy okazji). Weryfikacja: komplet zielony + grep „delung" = 0.
- **Etap 1 — „pusta" produkcja + INTEGRACJA THE CAMELS:** repo GitHub
  (publiczne) + ruleset `main-protection` (required: `quality`),
  Cloudflare Pages (`pnpm build`/`dist`/NODE_VERSION=22), pełny proces
  §8 (inwentarz DNS → DNSSEC → strefa CF → NS → test poczty → custom
  domains). Kamień milowy: `pracownia-eha.pl` serwuje szkielet, poczta
  `eha@` działa bez przerwy.
- **Etap 2 — CMS + media:** R2 `eha-media` + `media.pracownia-eha.pl`
  + Transformations + CORS + token; konto `eha-cms` + OAuth App +
  Worker `sveltia-cms-auth-eha` + `auth.pracownia-eha.pl`; `config.yml`
  + schemat §6.1 (trzy miejsca + testy kontraktu); weryfikacja uploadu
  MP4 przez panel; **6 testowych wpisów wg `DATA` designu przez panel**
  (E13) — zdjęcia z eksportu + PRAWDZIWE filmy klienta (E8).
- **Etap 3 — testy/CI na szkielecie:** adaptacja speców do tras eha,
  fixture wizualny, pierwsze baseline'y (kolejność!), budżety LHCI
  z pomiaru + zapas, required checks komplet, prod-smoke.
- **Etap 4 — widoki (po jednym PR, pętla mini-analiza → implementacja
  → testy → baseline'y):** 4.1 chrome (navbar+dropdown+auto-hide, menu
  bottom sheet, stopka) → 4.2 strona główna → 4.3 `/realizacje/`
  (siatka+paginacja, detal, lightbox `contain`, wideo — najcięższy
  widok, wcześnie = najwięcej czasu na korekty po testach na telefonie)
  → 4.4 `/ekipa-eha/` + `/kompetencje-i-technologie/` (wspólny wzorzec
  zwijanych akapitów) → 4.5 `/tradycja-i-ekologia/` (diagram) +
  `/obsluga-budowy/` → 4.6 `/polityka-prywatnosci/` (+ data).
- **Etap 5 — formularz + `/kontakt/`:** konto Resend klienta na `eha@`
  (E4) + `send.pracownia-eha.pl`; Turnstile `eha-kontakt`; KV
  `eha-kontakt-quota` + sekrety Pages; adaptacja `contact-form.ts`
  (4 pola, telefon-LUB-email → auto-potwierdzenie warunkowe, notka
  o polityce zamiast checkboxa); reguła WAF burst na `/api/kontakt`.
- **Etap 6 — SEO/pomiar/polish:** ikony+og z `make-icons.mjs`, JSON-LD
  (§9), Web Analytics (zgodny z polityką), Search Console + sitemap,
  UptimeRobot, fizyczny test na telefonach (lista rzeczy
  niewykrywalnych emulacją), przegląd/zacieśnienie budżetów.
- **Etap 7 — umowa i przekazanie:** umowa (abonament managed +
  kill-switch — dźwignie: deploy Pages, `ALLOWED_DOMAINS` Workera,
  collaborator, DNS), instrukcja panelu PL, 2FA `eha-cms` na telefonie
  klienta, przekazanie dostępów (panel, Resend), szkolenie na żywo;
  ustalenie z klientem docelowego władania panelem The Camels
  (zostaje jego — my tylko oddajemy hasła, jeśli je zmienialiśmy).

## 12. Ryzyka i punkty otwarte

- **[OTWARTE] Dostęp do The Camels** — pytanie u klienta; do czasu
  odpowiedzi Etap 1 poza krokiem „repo+Pages+pages.dev" stoi. Wariant
  awaryjny (klient klika sam) = osobna instrukcja kontaktu z klientem.
- **131 MB PNG/JPG** — bez pipeline'u WebP budżety LHCI polegną;
  konwersja w Etapie 0 (sekcje) i przy uploadzie do R2 (realizacje —
  `imgAt()` skaluje, ale źródła > 7 MB to wolny upload i koszt
  transformacji: higiena „nie wgrywać > ~10 MB" z części C delung).
  `paper-background.png` (tło wszystkiego) → mały tileable WebP —
  wpływa na KAŻDĄ stronę i KAŻDY panel.
- **Eksporty jako referencja, nie wzorzec kodu** — ryzykiem nie jest
  ich otwieranie (działają z dysku), lecz pokusa kopiowania artefaktów
  środowiska DC (podwójne drzewo w JS, scroll w kontenerze, mnożniki
  `--k`/`--w`). Zasada z §3: wygląd/zachowanie 1:1, implementacja
  optymalnie w Astro.
- **Lightbox `contain`** zmienia geometrię względem delung (licznik,
  pozycje chrome'u, wideo pion/poziom) — pokryć w mini-analizie widoku
  realizacji i skalibrować na realnych assetach + filmach klienta.
- **Dwa telefony w antyscrapingu** — rozszerzenie `contact-details.ts`
  o sloty per-osoba; kontrakt e2e na surowym HTML musi objąć oba numery
  (28–31 wystąpień w designach = dużo miejsc do składania w JS).
- **Auto-hide navbara** — nowy mechanizm względem delung (delung
  świadomie go nie miał); pisać z e2e od razu (scroll w dół chowa,
  w górę pokazuje, dropdown „O nas" blokuje chowanie — gotcha
  z designu: strefa kursora rozszerzana przy otwartym panelu).
- **Pole „telefon LUB e-mail"** — walidacja alternatywna po obu
  stronach + warunkowe auto-potwierdzenie; przypadek „ani telefon, ani
  e-mail" musi mieć czytelny komunikat (inaczej klient traci leady).
- **Spike wideo Sveltia→R2** — w delung działał (Plan A) na tej samej
  wersji panelu; krok weryfikacyjny zostaje, plan B (URL wklejany) bez
  zmian z analizy delung.
- **Data polityki prywatności** — pasmo daty w designie puste; wstawić
  datę wdrożenia (i pilnować zgodności treści ze stanem faktycznym —
  polityka już dziś deklaruje Web Analytics, więc go NIE pomijać).
- **Duplikaty/nazwy assetów** — scalić duble, przemianować (ASCII, bez
  „test", spójne rozszerzenia) w Etapie 0 (E14); szczególnie
  `łukasz-test-portrait.png` (polski znak = ryzyko URL-encoding).

---

_Decyzje E1–E14 rozstrzygnięte 2026-08-19. Następny krok po akceptacji
tej analizy: instrukcja wykonawcza `pracownia-eha-web-creation-process.md`
(Część A: checklista; B: pełne etapy 0–7 z klik-po-kliku dla The Camels,
Cloudflare, GitHub, Resend; C: flow mediów klienta; D: backupy)._
