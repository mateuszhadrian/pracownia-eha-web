# Testy — kontrakt projektu

Harness odziedziczony z szablonu (konfiguracja Playwright/Vitest/axe/LHCI,
6 profili, helpery); liczby szablonu NIE obowiązują — baseline'y i budżety
eha zmierzone od nowa w Etapie 3 (2026-08-23). STAN po Etapie 3: specy e2e
`navigation`, `seo`, `a11y`, `policy`, `smoke` na 8 trasach; visual:
`tests/visual/skeleton.spec.ts` (8 tras × 6 profili, viewport + pełna
strona, wideo pod maską) + `chrome.spec.ts` (pasek desktop, otwarty sheet
mobile); fixture `tests/fixtures/realizacje` = 5 wpisów (1 z wideo);
baseline'y darwin+linux w `tests/visual/__screenshots__/`. Etap 4 wymienia
trasy po jednym PR-ze: widok dostaje WŁASNY spec visual, a jego wpis
w `skeleton.spec.ts` znika razem z baseline'ami `skeleton-<trasa>-*`
w tym samym PR (ostatni wpis = skasowanie pliku).

## Co zmieniasz → co uruchamiasz

| Zmiana                                                        | Warstwa (komenda)                       |
| ------------------------------------------------------------- | --------------------------------------- |
| `src/content.schema.ts` / `content.config.ts` / nowy wpis CMS | `pnpm test:unit` (kontrakt CMS)         |
| `src/i18n/**`, `src/lib/img.ts`, `src/lib/contact-form.ts`    | `pnpm test:unit`                        |
| `src/scripts/**`, navbar, Work/overlaye, kontakt              | `pnpm test:e2e`                         |
| Każda zmiana wyglądu                                          | `pnpm build:visual && pnpm test:visual` |
| Przed release                                                 | pełne `pnpm test` + `/release-check`    |

## Zasady twarde

- Testy wizualne WYŁĄCZNIE na preview (webServer configu, port 4399 — na
  4321 często wisi dev do telefonu). Helper `assertPreview` wykrywa
  `/@vite/client` i przerywa — nie obchodź go.
- Testy wizualne stoją na **ZAMROŻONEJ treści realizacji**
  (`tests/fixtures/realizacje` — świeży fixture eha powstaje w Etapie 3:
  ~5 wpisów, 1 pozycja z wideo), bo baseline to obraz: realizacja
  dodana/usunięta/przestawiona w panelu rozjeżdżałaby zrzuty siatki,
  paginacji, liczników, zajawki na stronie głównej i detalu — czyli
  blokowała WSZYSTKIE PR-y do czasu regeneracji baseline'ów (zdarzyło się
  realnie w szablonie, 2026-08-05). Stąd
  `pnpm build:visual` (przestawia `REALIZACJE_DIR` w `content.config.ts`)
  zamiast `pnpm build`; strażnik `assertVisualFixture` porównuje liczbę
  wpisów w `dist` z fixture i przerywa z instrukcją zamiast pixel-diffa.
  **Fixture jest niezależny od treści produkcyjnej** — nie synchronizuj go
  z `src/content/realizacje` i nie „aktualizuj" po zmianach klienta; zmieniaj
  wyłącznie wtedy, gdy zrzut ma świadomie pokazać inny UKŁAD (wtedy = nowe
  baseline'y w tym samym PR). Testy e2e funkcjonalne fixture'u NIE używają:
  czytają treść produkcyjną dynamicznie i są na jej zmiany odporne.
- **Test NIE MOŻE wywracać się na treści z panelu.** Wpisy realizacji czyta
  się wyłącznie przez `tests/helpers/realizacje.ts` (`realizacjeFiles()` /
  `readRealizacje()`) — nigdy gołym `readdirSync` na `src/content/realizacje`:
  git nie przechowuje pustych katalogów, więc usunięcie ostatniego wpisu
  w panelu kasuje CAŁY katalog i goły odczyt wywraca moduł przy jego
  ładowaniu, czyli przed uruchomieniem czegokolwiek (`quality` i
  `prod-smoke` czerwone z `ENOENT` — incydent szablonu 2026-08-06;
  reguła obowiązuje tu OD PIERWSZEGO speca). Testy zależne od liczby
  wpisów robią `test.skip(...)` z jawnym powodem — pusta albo krótka
  lista jest stanem dopuszczalnym (strona buduje się i deployuje).
  JEDYNYM sygnałem o braku treści jest kontrakt „katalog zawiera co
  najmniej jeden wpis" w `tests/unit/cms-contract.test.ts` — to on ma
  świecić na czerwono, z komunikatem napisanym dla człowieka.
- Baseline'y (`tests/visual/__screenshots__/`, commitowane): DWA komplety
  per plik — `*-darwin.png` (lokalnie: `pnpm test:visual:update`) i
  `*-linux.png` (ręcznie wyzwalany workflow `update-visual-baselines.yml`,
  bot-commit na branch PR-a; awaryjnie Docker
  `mcr.microsoft.com/playwright:v<wersja>-noble`). Zamierzona zmiana
  wyglądu = kod + OBA komplety w jednym PR. Kolejność NA ZAWSZE:
  kod → workflow linux → commit darwin na końcu (bot-push nie wyzwala CI).
- **Zielony zrzut NIE znaczy „baseline aktualny"** — różnica może siedzieć
  pod per-shot `maxDiffPixelRatio`. Żeby ZMIERZYĆ, ile realnie się
  rozjechało, ustaw w specu na czas JEDNEGO przebiegu
  `maxDiffPixelRatio: 0` i `maxDiffPixels: 0`, odczytaj liczbę z logu
  i przywróć plik (`git diff` na specu musi wyjść czysty). Żaden baseline
  nie jest przy tym ruszany. Tańsze i pewniejsze niż budowanie `main`
  w `git worktree` (Etap 6: `polityka-top` na trzech profilach mobilnych
  przechodził na zielono z NIEAKTUALNĄ datą dokumentu prawnego — 42–43 px).
- **Kontrakt geometryczny mierz SUB-PIKSELOWO** (`getBoundingClientRect`),
  nigdy przez `offsetHeight`. Sonda D-U1 w `obsluga.spec.ts` porównywała
  dwie niezależnie zaokrąglone liczby całkowite i rozjechały się
  w PRZECIWNE strony: kadr 241,594 → 242 (w górę), obraz 285,078 → 285
  (w dół), więc próg `round(kadr × 1,18)` wypadł 1 px NAD realną
  geometrią przy faktycznym niedoborze **0,0029 px**. Test przechodził
  wcześniej z zapasem DOKŁADNIE 0 px, więc wywracała go dowolna zmiana
  wysokości sekcji (na mobile kadr bierze wysokość nagłówka z komórki
  gridu). Lekarstwo: rect + jawna stała tolerancji (`SUBPIXEL_TOL_PX
= 0.5`) — realne naruszenie to dziesiątki pikseli, więc tolerancja go
  nie przepuści. Objaw diagnostyczny: **czerwone także w IZOLACJI, czyli
  z definicji NIE flake**, przy mikroskopijnej różnicy.
- **Próg per-shot podnoś dopiero po POLICZENIU SUFITU klasy, nie „z
  zapasem".** Wzorzec z sesji poprawek klienta (`index-full` 0.006 →
  0.008): awaria „parallax osiadł na innej klatce" może dotknąć
  WYŁĄCZNIE kadrów `[data-plx]`, bo reszta strony jest zablokowana co
  do piksela. Policz więc, ile procent dokumentu zajmują te kadry
  (`/` mobile: dwa kadry 258 + 209 px na 6434 px = 7,3 %) — to jest
  surowy sufit klasy (0.0726). Playwright liczy PERCEPCYJNIE, ~10×
  łagodniej (zmierzone: surowe 0.0632 → zgłoszone 0.00622), więc sufit
  percepcyjny ≈ 0.0071 i próg 0.008 pokrywa klasę CAŁĄ, zamiast
  „chyba wystarczy". Kontrolnie: realna regresja layoutu na tej samej
  stronie to 0.10–0.27, czyli 12–34× wyżej. Dopasowanie pasm diffu do
  wysokości kadrów co do wiersza (258/208 vs 258/209) jest dowodem
  mechanizmu — bez niego nie podnoś progu.
- ZAKAZ regenerowania baseline'u w celu „naprawienia" czerwonego testu bez
  pokazania diffu Mateuszowi i jego zgody (blokada Edit/Write także
  w settings.json). Nigdy nie „naprawiaj" rozjazdu darwin↔linux globalnym
  progiem — od tego jest `{platform}` w ścieżce snapshotów.
- Wideo na zrzutach zawsze przez maskę (klatka wideo to loteria);
  odtwarzanie wideo detalu realizacji testuj funkcjonalnie w e2e (Etap 4.4).
- NIE emuluj `prefers-reduced-motion: reduce` (bramka w BaseLayout = testy
  „przechodzą" na martwej stronie); świadome, punktowe wyjątki per test
  weryfikujące ścieżkę reduce są dozwolone — oznaczaj je komentarzem.
- a11y (axe): allowlista znanych naruszeń w `tests/e2e/a11y.spec.ts` to
  RATCHET — startujemy od PUSTEJ; wpis wolno usunąć po realnej poprawie;
  nowych nie dopisuj bez decyzji Mateusza.
- LHCI: RATCHET od Etapu 3. Pomiar bazowy szkieletu „/" na runnerze CI
  (run 32652597911, mediana z 3): mobile perf 0,95 / LCP 2862 ms / TBT 0 /
  CLS 0; desktop perf 1,00 / LCP 652 ms; script 4,2 KB, total 332 KB,
  7 plików fontów (280 KB). Budżety (`lighthouserc*.cjs`, URL-e `/` +
  `/polityka-prywatnosci/`) Z ZAPASEM na Etap 4: mobile perf ≥ 0,80,
  LCP ≤ 5000, TBT ≤ 200, CLS ≤ 0,05, script ≤ 40 KB, total ≤ 1,2 MB;
  desktop perf ≥ 0,90, LCP ≤ 2000, TBT ≤ 200, CLS ≤ 0,05, script ≤ 40 KB,
  total ≤ 2 MB; fonty ≤ 8 (warn). Progi zacieśniamy wolno, tylko świadomą
  decyzją Mateusza (osobny commit), po pomiarze w CI (`lhci collect`
  z `numberOfRuns=5`, potem `node scripts/lhci-median.mjs`). Lokalny
  `lhci` wypada gorzej niż CI (mnożnik CPU) — nie jest podstawą ratchetu.
  ⚠️ **WARIANCJA RUNNERA: ±1300 ms na LCP przy ZEROWEJ zmianie bajtów**
  (Etap 6). Dwa przebiegi CI na identycznym co do bajta
  `resource-summary` dały na „/" FCP 1144 → 2308 i LCP 4153 → 5447
  (runy 33071049182 i 33073106228). Wniosek operacyjny: (1) każdy próg
  bliżej niż ~1,3 s od mediany zamieni bramkę w loterię — LCP 5000
  zostaje, mimo że mediana jest dziś dużo niżej; (2) pojedynczy czerwony
  `lighthouse` na LCP NIE dowodzi regresji — najpierw porównaj
  `resource-summary` obu runów, i dopiero różnica w BAJTACH jest
  sygnałem. Stan po Etapie 6 (audyt fontów): fonty na „/" 457 780 →
  210 616 B, total 1 364 096 → 1 110 071 B; **12 plików fontów zostaje
  12** (subsetowanie tnie bajty, nie żądania), więc warn `fonty ≤ 8`
  świeci ZAWSZE — dlatego RATCHET Etapu 6 (osobny commit) przestawił
  `font:count` na 12 (opis stanu) i dołożył NOWY error
  `resource-summary:font:size` ≤ 230 000 (zmierzone w CI 214 267 B,
  ~7 % zapasu), a `numberOfRuns` poszło 3 → 5 w obu configach.
  **`total`, `perf`, `LCP` i `script` zostały NIETKNIĘTE** — zapas na
  nich pracuje na treść klienta (okładki realizacji z R2 wchodzą na „/")
  i na wariancję runnera; bramka padająca od zdjęć wgranych w panelu to
  ten sam błąd, przed którym ostrzega reguła „test nie może wywracać się
  na treści z panelu".
- Test mediów R2 (`CHECK_REMOTE_MEDIA=1`) tylko poza ścieżką PR
  (zewnętrzna sieć = flaky). ⚠️ **Ta zasada ma dziś WYŁOM**: kontrakty
  odtwarzania wideo w `work-index.spec.ts` (`is-loading` → `is-playing`)
  pobierają realny plik z `media.pracownia-eha.pl`, bo `pnpm test:e2e`
  buduje treść produkcyjną. To JEDYNE testy e2e zależne od zewnętrznego
  CDN-a i już raz wywróciły `main` (run 33258429686: 15 s czekania na
  `is-playing`, slajd stał na `is-loading`, dwa profile WebKit; ten sam
  kod 40 minut wcześniej dał 676 passed; rerun padł drugi raz, a kolejny
  przebieg przeszedł czysto — trzy porażki w dwóch przebiegach, potem
  zero. Klasyczny test przerywany: „przepuść rerun i zobacz" NIE jest tu
  strategią).
  **ROZWIĄZANE bramką `CHECK_REMOTE_MEDIA`** na describe — te dwa testy
  nie biegają w CI w ogóle, tylko z jawną zmienną i w `/release-check`
  (dopisana tam osobna komenda; to JEDYNE miejsce, gdzie ten kontrakt
  jeszcze biega). Dwie ślepe uliczki, żeby nikt nie szedł nimi drugi raz:
  (a) **stub nie działa** — podmiana filmu na mały plik przez
  `page.route` wywraca asercję „stany rozłączne", bo przy materiale
  w PEŁNI zbuforowanym symulowane `waiting` natychmiast wraca do
  `playing`; ten test wymaga dużego, CZĘŚCIOWO zbuforowanego wideo;
  (b) **większy timeout nie działa** — przy 40 s klasy szły
  `lb-slide` → `is-loading` → `lb-slide`, a powrót do podpowiedzi
  zachodzi tylko na `pause`/`error`/`abort`, czyli pobieranie zostało
  PRZERWANE, nie spowolnione.
- Wersje `playwright` i `@playwright/test` podnoś PARĄ (jeden zestaw
  binariów); bump = też tag obrazu Dockera w procedurze baseline'ów.
- Profile Playwright: 6 (chromium-1920/1366, firefox, webkit-SE/14,
  pixel-5). Breakpoint projektu 1024 px ⇒ iPhone'y i Pixel zawsze dostają
  widok mobile, chromium-1366/1920 desktop. Drugi próg 700 px (siatka
  realizacji, Etap 4.3) — pod ten sam wzorzec kontraktu breakpoint
  (`tests/helpers/breakpoint.ts`).

## Czego emulacja NIE wykrywa → fizyczne urządzenie

Limit warstwy GPU Androida (karuzele/sheety); iOS Low Power Mode (wideo
na tap ma działać); zwijany toolbar Safari (metryki viewportu / późny
refresh); zimny cache + realne łącze; dotyk fizyczny (snap karuzel,
swipe-down sheetów, feel natywnego scrolla). Przy zmianach w tych obszarach
poproś Mateusza o test na telefonie i wskaż, na co patrzeć.
