# Analiza: sekcja „Inne realizacje z inwestycji" w detalu realizacji

Stan: **ZAAKCEPTOWANA i WDROŻONA w kodzie** (2026-11-03, branch
`feat/inne-realizacje`). Test w panelu na produkcji: czwartek, z klientem
(§6 krok 9). Makiety strony i panelu powstały poza repo (§8); przebieg
wdrożenia i odstępstwa od planu: §9.

Prośba klienta: w każdej realizacji opcjonalna sekcja z linkami do innych
realizacji z tej samej inwestycji. W panelu lista pozycji (jak parametry),
w każdej pozycji jeden select z innymi realizacjami; na stronie lista
tytułów, a klik przenosi pod stały adres wybranej realizacji.

---

## 1. Decyzje (zapadłe 2026-11-03)

| #   | Pytanie                       | Decyzja                                                                                                                                                                                                   |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Model danych                  | **Ręczna lista per wpis** (to, o co prosił klient). Pole „Inwestycja" z automatycznym grupowaniem — odrzucone (§7).                                                                                       |
| D2  | Symetria A→B ⇒ B→A            | **Nie.** Strona pokazuje dokładnie to, co jest w panelu danego wpisu.                                                                                                                                     |
| D3  | Widget panelu                 | **Lista, w każdej pozycji jeden select** (relacja). Bieżąca realizacja wykluczona z selecta (zweryfikowane — §3).                                                                                         |
| D4  | Co robi klik                  | **Zwykła nawigacja** `<a href="/realizacje/<plik>/">` — dokładnie „jakby wpisał adres". Mechanizm detalu nietknięty.                                                                                      |
| D5  | Wygląd                        | Nagłówek stały **„INNE REALIZACJE Z INWESTYCJI"** w stylu nagłówka PARAMETRY; pozycja = mono „MIEJSCE · ROK" + tytuł serifem + strzałka `→`; kolejność jak w panelu; bez limitu. Makiety: §8.             |
| D6  | Zepsute odwołania             | Usunięta realizacja / wskazanie samej siebie / duplikat → **pomijane przy buildzie**, ostrzeżenie w logu buildu; zero ważnych pozycji = sekcja znika. Build i CI się NIE wywracają.                       |
| D7  | Testy wizualne                | **Fixture dostaje powiązania** w jednym wpisie (z parametrami) + NOWY zrzut „detal przewinięty do końca".                                                                                                 |
| D8  | Instrukcja panelu dla klienta | **Bez aktualizacji** PDF-a.                                                                                                                                                                               |
| D9  | Test w panelu na produkcji    | **Dopiero na spotkaniu z klientem (czwartek)** — Mateusz nie ma dostępu do panelu i nie wprowadza zmian treści bez niego. Do tego czasu żadnych edycji `src/content/realizacje/*.json` (reguła twarda 2). |

---

## 2. Model danych

Nowe pole wpisu: **`related`** — lista identyfikatorów realizacji
(NAZW PLIKÓW bez `.json`), w kolejności z panelu:

```json
"related": [
  "przemurowanie-sklepienia-w-milecicach",
  "nowa-wiezba-nad-stuletnim-balem-czernica"
]
```

- Identyfikator = **nazwa pliku**, czyli ten sam `entry.id`, który jest
  adresem podstrony `/realizacje/<id>/` (reguła `cms-realizacje.md`).
  Pole „Slug" NIE nadaje się — potrafi się rozjechać z plikiem
  (`przemurowanie-sklepienia-w-milecicach.json` ma w polu `…-w-milęcicach`).
- Opcjonalne jak `specs`: brak klucza (Sveltia przy
  `omit_empty_optional_fields`) i pusta lista są równoważne i dają `[]`.
- Klucz `related` (angielski, jak `specs`/`paras`/`gallery` — klucze JSON
  w projekcie są po angielsku, etykiety w panelu po polsku).

---

## 3. Panel (Sveltia 0.178.0) — co zweryfikowano, a co zostaje na czwartek

### 3.1 Konfiguracja pola (propozycja)

```yaml
# ── Inne realizacje z inwestycji ──
# Lista identyfikatorów (NAZW PLIKÓW) innych realizacji. Relacja zapisuje
# `{{slug}}` wpisu = nazwę pliku (zweryfikowane 2026-11-03, §3.2), czyli
# ten sam identyfikator co adres /realizacje/<plik>/. Filtr wyklucza
# bieżący wpis z selecta; duplikatów i usuniętych realizacji panel NIE
# pilnuje — robi to build (work-data.ts).
- label: "Inne realizacje z inwestycji"
  name: "related"
  widget: "list"
  label_singular: "Realizacja"
  required: false # pusta lista = brak sekcji w detalu
  hint: >-
    Opcjonalne. Dodaj realizacje z tej samej inwestycji — na stronie
    pojawią się na dole opisu jako lista linków. Kolejność jak tutaj.
    Bez pozycji sekcja w ogóle się nie wyświetla.
  field:
    label: "Realizacja"
    name: "realizacja"
    widget: "relation"
    collection: "realizacje"
    value_field: "{{slug}}"
    display_fields: ["{{title}} — {{place}} ({{year}})"]
    search_fields: ["title", "place"]
    dropdown_threshold: 0 # ZAWSZE select (domyślnie ≤5 opcji = radio)
    filters:
      - { field: "slug", values: ["{{slug}}"], exclude: true }
```

### 3.2 Zweryfikowane (2026-11-03)

Na przypiętej wersji panelu (ten sam plik `sveltia-cms.js` 0.178.0
z jsDelivr), uruchomionej lokalnie z backendem **`test-repo`** (magazyn
w przeglądarce, OPFS — zero kontaktu z GitHubem, R2 i produkcją), na
kopii obecnego `config.yml` z dopisanym polem i na 6 prawdziwych wpisach:

1. **Wykluczenie bieżącej realizacji DZIAŁA w 0.178.0.** Filtr
   `{field: slug, values: ["{{slug}}"], exclude: true}` jest w binarium
   (funkcja podstawiająca `{{slug}}` pod slug edytowanego wpisu), a select
   we wpisie „Dom z bala…" pokazał 5 pozostałych realizacji, bez niego.
   Uwaga: przy TWORZENIU nowego wpisu (zanim ma slug) filtr jest pusty —
   ale nowy wpis i tak nie występuje jeszcze na liście, więc nic nie wycieka.
2. **Wartość zapisana = NAZWA PLIKU.** Wybrałem „Przemurowanie sklepienia
   w Milęcicach" (plik `…-milecicach`, pole „Slug" `…-milęcicach`) —
   w JSON-ie wylądowało `"przemurowanie-sklepienia-w-milecicach"`. Dokładnie
   to, czego potrzebuje adres podstrony.
3. **Kształt JSON-a**: lista z jednym polem zapisuje się jako lista
   napisów (`"related": ["…", "…"]`), nie lista obiektów.
4. **Domyślnie to NIE jest select**: przy ≤ 5 opcjach (`dropdown_threshold`
   = 5) Sveltia rysuje przyciski radiowe (zrzut `panel-4-…`). Dziś
   realizacji jest 6, czyli w selekcie byłoby 5 → radio; po dodaniu
   siódmej panel sam przeskoczyłby na select. `dropdown_threshold: 0`
   daje select zawsze, zgodnie z prośbą.
5. **Duplikaty**: filtr NIE ukrywa realizacji wybranych już w innych
   pozycjach — klient może dodać tę samą dwa razy. Obsługuje to build (D6).

### 3.3 Do potwierdzenia na produkcji (czwartek, z klientem)

Backend `test-repo` dzieli z GitHubem logikę wpisów i pól, ale nie zapis
commitem. Na spotkaniu do sprawdzenia (lista kontrolna w §6, krok 9):
zapis wpisu z polem przez GitHub API, kształt JSON-a w commicie, deploy
i działające linki. Ryzyko uznaję za niskie (pkt 1–3 to logika panelu,
nie backendu).

---

## 4. Strona — zachowanie i przypadki brzegowe

### 4.1 Gdzie i jak

- Detal realizacji (`WorkDetail.astro`), ostatni blok treści **przed
  stopką „Udostępnij realizację"**: pod PARAMETRAMI, a bez nich pod
  opisem. Ten sam markup na obu progach (sheet < 1024 / modal ≥ 1024).
- Markup (szkic):

  ```html
  <nav class="dt-rel" aria-labelledby="dt-rel-h-<id>">
    <div class="dt-specs-h">
      <span id="dt-rel-h-<id>">INNE REALIZACJE Z INWESTYCJI</span><i></i>
    </div>
    <ul class="dt-rel-list">
      <li>
        <a class="dt-rel-a" href="/realizacje/<plik>/">
          <span class="dt-rel-meta">CZERNICA · 2024</span>
          <span class="dt-rel-t">Tytuł realizacji</span>
          <span class="dt-rel-arr" aria-hidden="true">→</span>
        </a>
      </li>
    </ul>
  </nav>
  ```

  `<nav>` z etykietą (to blok nawigacji), cała pozycja jest jednym
  linkiem (duże pole dotyku na telefonie), strzałka ukryta przed
  czytnikami. `id` jest unikalne, bo w DOM żyje naraz tylko jeden klon
  templatu. Nagłówek używa tej samej klasy co PARAMETRY — wygląd jeden
  do jednego bez kopiowania reguł.

- Styl: siatka `1fr auto` (meta + tytuł po lewej, strzałka po prawej,
  wyśrodkowana pionowo przy zawiniętym tytule), linie 1 px
  `rgba(33,29,24,.14)` między pozycjami (te same co linia nagłówka),
  tytuł Garamond 500 (mobile 18 px, desktop `clamp(16px,1.25vw,20px)`),
  meta mono 500 w kolorze akcentu jak `.dt-meta`. Desktop: hover =
  podkreślenie tytułu + strzałka przesuwa się o 4 px; ostatnia pozycja
  bez dolnej linii (linię zamyka stopka CTA — inaczej dwie kreski 36 px
  od siebie). `:focus-visible` = obrys jak na pozostałych kontrolkach
  detalu.

### 4.2 Klik

- Zwykły link. `open-detail.ts` i `overlay.ts` go nie przechwytują
  (sprawdzone w kodzie: delegacja detalu reaguje tylko na
  `[data-share]`, kadry, strzałki i kreski galerii; `overlay.ts` zamyka
  wyłącznie na `[data-overlay-close]` i klik POZA panelem). Link NIE
  dostaje `data-work-slug` — inaczej kafelkowa ścieżka „otwórz detal
  w miejscu" złapałaby go na liście.
- Przeglądarka ładuje `/realizacje/<plik>/` — podstronę z detalem
  otwartym od wejścia. „Wstecz" wraca do poprzedniej realizacji
  (z bfcache albo przez przeładowanie jej podstrony — oba warianty
  kończą się otwartym detalem A). Cmd/Ctrl+klik = nowa karta, „kopiuj
  adres linku" działa.
- Gest „przeciągnij w dół" szuflady nie koliduje: na mobile uzbraja go
  wyłącznie grabber/nagłówek, a na desktopie modal ma
  `data-overlay-kind="modal"` (lekcja z `sections.md`).

### 4.3 Rozwiązywanie odwołań (build)

Jedna czysta funkcja w `work-data.ts`, wołana w `workProjects()`
(`work-list.ts`) — JEDYNYM źródle listy dla `/realizacje/`, podstron
i zajawki na `/`. Dzięki temu zajawka (3 templaty) rozwiązuje odwołania
względem PEŁNEJ listy, nie tylko swoich trzech.

```ts
export interface RelatedLink { slug: string; title: string; place: string; year: string }
export function resolveRelated(projects: WorkProject[]): Map<string, RelatedLink[]>
```

Reguły (każda z testem jednostkowym):

| Przypadek                                         | Wynik                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| id istnieje                                       | pozycja w kolejności z panelu                                      |
| id nie istnieje (realizacja usunięta, literówka) | pominięte + `console.warn` z nazwą wpisu i id (widać w logu buildu) |
| id = bieżący wpis                                 | pominięte (panel na to nie pozwala, ale JSON da się popsuć)        |
| duplikat                                          | zostaje PIERWSZE wystąpienie                                       |
| pusty napis                                       | pominięte                                                          |
| zero ważnych pozycji                              | sekcji nie ma (jak PARAMETRY)                                      |

Ostrzeżenie zamiast błędu: reguła „test/build nie może wywracać się na
treści z panelu". Usunięcie realizacji w panelu NIE czyści odwołań
w innych wpisach (Sveltia tego nie robi) — link po prostu znika ze
strony, a martwe id zostaje w JSON-ie do najbliższego zapisu tamtego
wpisu. Skutek uboczny wart wiedzy: gdyby kiedyś powstała NOWA realizacja
o tej samej nazwie pliku, stare odwołanie „ożyje" i wskaże na nią.
Przemianowanie pliku panel nie robi (`cms-realizacje.md`), więc tę drogę
zerwania odwołań mamy z głowy.

### 4.4 Odstępy — jedyna nietrywialna zmiana CSS

Dziś dolny odstęp przed stopką ma OSTATNI blok: `.dt-specs`
(mobile `padding-bottom: 34px`; desktop rytm z `margin-top` stopki), albo
— bez parametrów — `.dt-about--last`. Trzeci możliwy blok wymaga
uogólnienia: odstęp końcowy dostaje ten blok, który faktycznie jest
ostatni (`last = rel ? "rel" : specs ? "specs" : "about"`), a pozostałe
go tracą. **Warunek akceptacji: dla wpisów BEZ powiązań render jest
identyczny co do piksela** z dzisiejszym (pomiar progiem zerowym, §5.3).

### 4.5 Czego zmiana NIE dotyka

`open-detail.ts`, `overlay.ts`, lightbox, historia przeglądarki, projnav,
paginacja, kafle, JSON-LD, sitemapa, `/polityka-prywatnosci/` (nowych
danych osobowych nie ma). SEO: linki leżą w `<template>` (jak cała treść
detalu), więc robot widzi je po wykonaniu JS — tak jak dziś opis
i parametry; podstrona realizacji ma własny canonical, nic się tu nie
zmienia. LHCI: `/` urośnie o kilkaset bajtów HTML tylko wtedy, gdy któryś
z trzech wpisów zajawki ma powiązania.

---

## 5. Testy

### 5.1 Unit (`pnpm test:unit`)

- `cms-contract.test.ts`: schemat akceptuje brak klucza i pustą listę
  (→ `[]`) oraz listę napisów; odrzuca nie-napisy. `config.yml`: pole
  `related` = `list`, `required: false`, wewnątrz `relation` na
  `realizacje`, `value_field: "{{slug}}"`, `dropdown_threshold: 0`,
  filtr samowykluczenia. Kontrakt na KAŻDYM wpisie produkcyjnym: każde
  id w `related` jest napisem (istnienie id NIE jest kontraktem — D6).
- `work-data.test.ts`: tabela §4.3 na danych syntetycznych (niezależnych
  od treści klienta — dziś żaden wpis produkcyjny nie ma powiązań).
- `fonts-subset.test.ts` przejdzie sam: nagłówek i tytuły nie wnoszą
  znaków spoza polskiego zakresu (sprawdzi strażnik).

### 5.2 E2E (`pnpm test:e2e`, treść produkcyjna)

W `work-index.spec.ts` (albo `work-links.spec.ts` — rozstrzygnąć przy
porcie, bliżej mu do linków):

- wpis Z powiązaniami: sekcja jest ostatnim blokiem treści przed
  `.dt-foot`, linki mają `href` = `/realizacje/<id>/` istniejących
  realizacji, klik ląduje na podstronie z otwartym detalem właściwej
  realizacji (tytuł dokumentu, `data-overlay-kind` bez zmian), „wstecz"
  wraca do poprzedniej; Cmd+klik nie otwiera detalu w miejscu;
- wpis BEZ powiązań: brak `.dt-rel`.
- **Dziś żaden wpis produkcyjny nie ma powiązań**, więc wariant „z"
  robi `test.skip` z jawnym powodem (wzorzec testu „bez parametrów" ze
  sesji 2026-09-14) i zacznie biegać, gdy klient doda pierwsze w panelu.
  Logikę pokrywają unity, wygląd — visual (fixture), więc luka do
  czwartku jest wyłącznie w ścieżce „klik w przeglądarce".
- axe: sekcja wchodzi do istniejącego skanu detalu (allowlista PUSTA
  zostaje pusta) — skan zobaczy ją dopiero z treścią z powiązaniami;
  do tego czasu kontrast i nazwy sprawdzam ręcznie przy porcie.

### 5.3 Visual (`pnpm build:visual && pnpm test:visual`)

- Fixture: wpis `dom-z-bala-przeniesiony-i-zrekonstruowany-czernica`
  (pierwszy otwierany w testach, ma parametry) dostaje `related` z trzema
  innymi wpisami fixture'u. Liczba wpisów bez zmian (strażnik
  `assertVisualFixture` spokojny).
- NOWY test w `tests/visual/work-index.spec.ts`: detal przewinięty do
  końca (`.dt-body` na dół) → `work-detail-related.png`, profile mobilne
  + `chromium-1920` (wzorzec `work-detail-open`). 4 nowe pliki na
  platformę.
- **Istniejące zrzuty: oczekiwany zasięg ZERO** — `work-detail-open`
  fotografuje górę detalu (sekcja jest pod zgięciem), `work-detail-video`
  i `-fullscreen` to galeria/podgląd. Zasięg ZMIERZYĆ progiem zerowym
  (procedura `testing.md`), nie zakładać. Jeśli coś wyjdzie, pokazuję
  diff przed regeneracją (reguła twarda 5).

---

## 6. Proces wdrożenia krok po kroku

Branch `feat/inne-realizacje`. Commity proponuję, wykonuje Mateusz.

1. **Schemat (Zod)** — `src/content.schema.ts`:
   `related: z.array(z.string()).default([])` z komentarzem (identyfikator
   = nazwa pliku; brak klucza = `[]`). Unit kontraktu schematu.
   → `pnpm test:unit`.
2. **Dane** — `work-data.ts`: typ `RelatedLink`, pole `related` w
   `WorkProject`/`ViewProject`, `resolveRelated()` wg tabeli §4.3;
   `work-list.ts`: rozwiązanie w `workProjects()` (przed `slice` zajawki).
   Unit `work-data.test.ts`. → `pnpm test:unit`.
3. **Widok** — `WorkDetail.astro`: blok `.dt-rel` + uogólnienie odstępu
   końcowego (§4.4) + style mobile/desktop wg makiety (§8), hover
   i `:focus-visible`. → `pnpm build`, kontrola ręczna na podglądzie
   (390 / 320 / 1440 / 1920) z treścią fixture'u (`pnpm build:visual`).
4. **Panel** — `public/admin/config.yml`: pole z §3.1 na końcu kolekcji
   (pod parametrami — kolejność pól w panelu = kolejność na stronie).
   Unit kontraktu `config.yml`. → `pnpm test:unit`.
   Lokalna próba panelu na `test-repo` (jak w §3.2) z FINALNYM configiem,
   bez commita czegokolwiek z tej próby.
5. **E2E** — testy z §5.2. → `pnpm test:e2e`.
6. **Visual** — fixture + nowy test z §5.3; pomiar zasięgu istniejących
   zrzutów progiem zerowym. → `pnpm build:visual` + `npx playwright test
--config … tests/visual/work-index.spec.ts --ignore-snapshots`
   (NIE `pnpm test:visual -- --ignore-snapshots` — pułapka z 4.6).
7. **Dokumentacja** — `.claude/rules/cms-realizacje.md` (schemat:
   `related[]`, kształt, samowykluczenie, duplikaty/usunięte = build),
   `.claude/rules/sections.md` (sekcja work: `.dt-rel` to zwykłe linki,
   bez `data-work-slug`; ostatni blok przejmuje odstęp), wpis w
   `CLAUDE.md` „Stan projektu".
8. **Bramki i baseline'y** — format:check / lint / typecheck / unit /
   build / e2e / visual. Commit kodu → workflow
   `update-visual-baselines.yml` (`spec: tests/visual/work-index.spec.ts`,
   `mode=changed` — dopisuje brakujące `work-detail-related`) → kontrola
   intruzów → darwin lokalnie na końcu → PR → zielone `quality` / `e2e`
   / `lighthouse` → merge.
   Proponowany commit: `feat(realizacje): related realizations section in detail`.
9. **Czwartek, panel na produkcji (z klientem)** — lista kontrolna:
   - pole „Inne realizacje z inwestycji" jest pod parametrami;
   - select nie zawiera edytowanej realizacji i jest selectem (nie radio);
   - zapis 2–3 pozycji → commit `Update Realizacja …` na `main`
     z `"related": ["<plik>", …]` (NAZWY PLIKÓW — szczególnie przy
     Milęcicach);
   - po deployu (~1–2 min) sekcja na stronie w kolejności z panelu,
     klik prowadzi na właściwą podstronę, „wstecz" wraca;
   - usunięcie wszystkich pozycji i zapis → sekcja znika.
   Na tym etapie zaczyna też biegać wariant e2e „z powiązaniami".
10. **Po czwartku** — jeśli coś odbiega od listy: poprawka osobnym PR-em
    (treści klienta nie poprawiam ręcznie — reguła twarda 2).

Merge przed czwartkiem jest bezpieczny: pole jest opcjonalne, a strona
bez powiązań renderuje się identycznie jak dziś (§4.4). Dzięki temu na
spotkaniu da się przetestować wszystko na produkcji.

---

## 7. Rozważone i odrzucone

- **Pole „Inwestycja" + automatyczne grupowanie** — mniej klikania i zero
  rozjazdów, ale klient opisał wprost ręczną listę, a grupowanie nie
  pozwala linkować realizacji „podobnych" spoza inwestycji (D1).
- **Automatyczna symetria** — nieprzewidywalna dla klienta i nie do
  wyłączenia z panelu (D2).
- **Jedno pole relacji `multiple: true`** (chipy) — mniej kliknięć, ale
  inny wzorzec niż znane ze szkolenia parametry i niż opis klienta (D3).
- **Podmiana detalu w miejscu (jak projnav)** — płynniej, ale nowa
  ścieżka w `open-detail.ts` (historia, licznik „REALIZACJA NN/NN",
  kontekst listy) za efekt, którego klient nie zamawiał. Do dołożenia
  później bez zmiany danych (D4).
- **Panel bez `dropdown_threshold`** — radio przy ≤ 5 opcjach, select
  powyżej: interfejs zmieniałby się sam przy siódmej realizacji (§3.2
  pkt 4).
- **Ostry kontrakt „każde id musi istnieć"** w unitach/buildzie —
  usunięcie realizacji w panelu blokowałoby CI i deploy (D6).

---

## 8. Makiety (2026-11-03)

Zrzuty powstały BEZ zmian w repo:

- **Strona**: `pnpm build` (treść produkcyjna) + preview, a sekcja
  WSTRZYKNIĘTA skryptem Playwrighta do otwartego, prawdziwego detalu
  (style jak w §4.1). Dane makiety: 4 pozycje — krótki tytuł („Więźba"),
  dwa realne, jeden celowo długi (3–4 wiersze na telefonie). Zdjęcia
  galerii lokalnie się nie ładują (endpoint `/cdn-cgi/image` istnieje
  tylko na produkcji) — czarny kadr to artefakt podglądu.
  Warianty: mobile 390 z parametrami / bez parametrów, mobile 320 (iPhone
  SE), desktop 1440 z parametrami / bez parametrów + hover na długim
  tytule, desktop 1920.
- **Panel**: Sveltia 0.178.0 z backendem `test-repo` (§3.2), kopia
  `config.yml` z polem z §3.1, 6 prawdziwych wpisów. Zrzuty: pole puste,
  rozwinięty select, trzy wybrane pozycje, odrzucony wariant radio.

Pliki makiet leżą w katalogu tymczasowym sesji (poza repo); gdyby miały
zostać — przenieść ręcznie, NIE do `docs/` (PNG-i w historii git na
zawsze).

---

## 9. Przebieg wdrożenia (2026-11-03)

Zgodnie z §6, z trzema doprecyzowaniami:

- **Wersja bez JS** — `WorkStaticDetail.astro` (blok `<noscript>`
  podstrony) dostał prostą listę linków pod parametrami. W planie jej nie
  było, a bez niej podstrona bez JS gubiłaby sekcję.
- **E2E w `work-links.spec.ts`** (warstwa adresów i nawigacji). Oczekiwana
  lista liczona tą samą `resolveRelated()` co build. Na treści produkcyjnej
  (zero powiązań) 3 z 4 wariantów robią `test.skip` z powodem; żeby
  sprawdzić, że NAPRAWDĘ działają, puściłem je raz na buildzie fixture'u
  (helper `realizacje.ts` tymczasowo na `tests/fixtures`, przywrócony,
  `git diff` czysty): **24 passed na 6 profilach**, axe na podstronie
  z sekcją: 0 naruszeń.
- **Kontrakt fixture'u** (`visual-fixture.test.ts`): pierwszy wpis ma
  3 powiązania i wszystkie trafiają we wpisy fixture'u — martwe odwołanie
  zniknęłoby ze zrzutu po cichu.

**Zasięg baseline'ów — ZMIERZONY progiem zerowym** (config + per-shot
w `work-index`/`index`, przywrócone): `work-index`, `index`, `chrome` —
**45 passed / 0 px różnicy**, czyli uogólnienie odstępu końcowego (§4.4)
nie zmieniło ani piksela. Jedyne braki: 4 × NOWY `work-detail-related`
(chromium-1920, webkit-iphone-se, webkit-iphone-14, chromium-pixel-5) —
do wygenerowania workflow linux (`spec: tests/visual/work-index.spec.ts`,
`mode=changed`) → darwin lokalnie na końcu.
