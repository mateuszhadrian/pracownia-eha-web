---
paths:
  - "src/content/**"
  - "src/content.schema.ts"
  - "src/content.config.ts"
  - "public/admin/**"
  - "src/lib/img.ts"
  - "src/components/sections/work/**"
---

# CMS (Sveltia) + Realizacje + media R2 — reguły

## Własność plików

- `src/content/realizacje/*.json` pisze WYŁĄCZNIE Sveltia (panel `/admin`,
  commituje przez GitHub API na `main`, omijając husky). Ręczna edycja
  zabroniona (jest hook-guard); pliki są w `.prettierignore` — Sveltia ma
  własny formater (tablice zawsze wielolinijkowe).

- **Nazwa pliku wpisu = pole „Slug", zawsze przepuszczone przez ASCII**
  (`slug: { encoding: ascii, clean_accents: true }` w `config.yml`). Bez tego
  tekst wklejony przez klienta z telefonu potrafi trafić do nazwy pliku
  w formie ROZŁOŻONEJ (NFD) — wygląda identycznie, ale na macOS git widzi
  wtedy ten sam plik dwa razy (śledzony pod NFD, nieśledzony pod NFC).
  **Nigdy `git add .` / `git add -A` w tym repo** — dodałoby obie ścieżki
  i na Linuksie powstałyby duplikaty wpisów. Zmiana pola „Slug" w panelu
  PRZEMIANOWUJE plik (Sveltia robi operację `move`), więc to jest droga
  naprawy starych nazw; pliki w R2 zostają nietknięte.
- **Zero wpisów to stan dopuszczalny** (klient może usunąć wszystko w panelu):
  build przechodzi, Cloudflare deployuje, `/realizacje/` pokazuje pustą
  listę. Uwaga: usunięcie ostatniego wpisu kasuje CAŁY katalog
  `src/content/realizacje` (git nie przechowuje pustych katalogów) — testy
  muszą to przeżyć, patrz `.claude/rules/testing.md`. Czerwony jest wtedy
  dokładnie jeden test: kontrakt „katalog zawiera co najmniej jeden wpis"
  (od Etapu 2 bez `.skipIf` — treść weszła panelem).

## Schemat danych — zmiana w TRZECH miejscach naraz

1. Zod: `src/content.schema.ts` — źródło prawdy (czysty Zod, współdzielony
   z testem kontraktu CMS); `src/content.config.ts` tylko go importuje
   i podpina do kolekcji (walidacja w buildzie),
2. panel: `public/admin/config.yml` (definicje pól — PL-only, bez {pl,en}),
3. konsumenci: `src/components/sections/work/*`.
   Niespójność = build przechodzi lokalnie, a wpis z panelu wybucha w CI.

- Schemat DOCELOWY (§6.1 analizy, od Etapu 2): `slug`, `order`, `title`,
  `place`, `year`, `paras[]` (min 1, hint „najlepiej 3 akapity"),
  `gallery[]` (min 1), `specs[] {label, value}` (min 1, hint „7 par jak
  w designie"). **BEZ pola `category`** (E5 — eha nie ma kategorii ani
  filtrów) i bez `description` (zastąpione przez `paras`).
- **Pola `cover` NIE MA.** Kaflem realizacji na `/realizacje/` i w zajawce
  na stronie głównej jest **pierwsza pozycja galerii**; `viewProject()`
  (`work-data.ts`) wylicza z niej `cover` dla komponentów.
- **Pozycja galerii to WARIANT, nie suma pól** — albo zdjęcie, albo film:
  - `{type: "photo", image, position?}`
  - `{type: "video", video, duration?, position?}` — **bez `image`**
    Wymusza to sam panel (`types`/`typeKey` Sveltii), więc klient nie może
    wypełnić obu naraz. Dyskryminator `type` zapisuje Sveltia.
- **Pierwsza pozycja musi być zdjęciem** (jest kaflem). Panel nie umie
  warunku „na tej pozycji", więc łapie to dopiero `.superRefine` w Zodzie —
  komunikat jest napisany dla klienta, nie dla programisty. Nie zamieniaj go
  na domyślny tekst Zoda.
- Miniatura filmu **nie jest osobnym plikiem**: powstaje z klatki filmu
  (`videoFrameAt()` w `src/lib/img.ts` → `/cdn-cgi/media/mode=frame`).
  Środek liczony z pola `duration` („0:24" → `time=12s`), brak/śmieć → 1 s.
  Klatka trafia w markup JEDNĄ drogą — `<img class="dt-poster">` pod
  `<video>`, **BEZ atrybutu `poster`** (korekta po produkcji 4.3: silniki
  malują obraz z atrybutu rozciągnięty, ignorując `object-fit`; a Chromium
  przy `preload="none"` po plakat i tak nie sięga w ogóle — pomiar
  z szablonu). Nie kasuj `<img.dt-poster>` i nie przywracaj atrybutu.

## Media (Cloudflare R2) — konfiguracja wchodzi w Etapie 2

- Bucket `eha-media` (EU), domena publiczna `https://media.pracownia-eha.pl`,
  prefix `realizacje/`. Zdjęcia i wideo NIE trafiają do repo.
  `account_id`/`access_key_id` w `config.yml` są jawne (token
  `eha-media-sveltia`, Object R&W, scope tylko `eha-media`); Secret Access
  Key żyje w menedżerze haseł i w pamięci przeglądarki panelu.
- Sveltia wgrywa do R2 przez pola wpisu: Image (zdjęcia) oraz `file`
  (wideo MP4 — plan A potwierdzony w szablonie na tej samej przypiętej
  wersji Sveltii; krok weryfikacyjny w Etapie 2 zostaje). Upload przez
  bibliotekę Assets poza polami NIE trafia do R2. Sveltia NIE kasuje
  plików z R2 przy usuwaniu wpisu — osierocone pliki trzeba sprzątać
  ręcznie w dashboardzie R2 (przy wideo istotniejsze niż przy zdjęciach).
- Rozmiary obrazów: wyłącznie przez `imgAt()` (`src/lib/img.ts`) —
  Cloudflare Image Transformations (`/cdn-cgi/image/...`). W dev endpoint
  nie istnieje → funkcja zwraca oryginał; NIE debuguj „złych rozmiarów"
  lokalnie.
- Wideo BEZ transformacji — sam plik serwowany wprost z R2
  (`<video preload="none">` + `<img.dt-poster>` z `videoFrameAt(...)`).
  **Miniatura to klatka
  z tego samego filmu** (Media Transformations, JPEG, cache 20 dni). Limity
  pliku: H.264+AAC, 1080p, ≤ ~30 MB/klip (preset HandBrake „Pracownia
  EH/A – strona www", Część C instrukcji).
- Oba endpointy `/cdn-cgi/` (`image` i `media`) istnieją **wyłącznie na
  produkcji** — lokalnie 404. `imgAt()` oddaje wtedy oryginał, `videoFrameAt()`
  nie zwraca postera; kolektor problemów w testach (`tests/helpers/guards.ts`)
  filtruje oba. NIE debuguj miniatur ani rozmiarów lokalnie.
- Dostępności mediów NIE pilnuje żadne CI: schemat sprawdza tylko, że adres
  jest napisem. `tests/unit/media-r2.test.ts` (HEAD po każdym URL-u) biega
  wyłącznie z `CHECK_REMOTE_MEDIA=1` — ręcznie i w `/release-check`. Po
  sprzątaniu bucketa odpal go sam.

## Autoryzacja panelu — wchodzi w Etapie 2

- Logowanie przez Worker `sveltia-cms-auth-eha` (`base_url` w config.yml —
  `https://auth.pracownia-eha.pl`). Worker to OSOBNY deploy dla eha
  (czysty branding i kill-switch).
- `site_domain: pracownia-eha.pl` w config.yml jest OBOWIĄZKOWE: bez niego
  panel na localhoscie wysyła `site_id=cms.netlify.com` (dziedzictwo
  Netlify w Sveltii) i wpada na ALLOWED_DOMAINS Workera.
- Klient loguje się kontem technicznym `pracownia-eha-cms` (login `eha-cms` był zajęty) (collaborator write
  wyłącznie do tego repo); konto dostanie wpis User-bypass (tryb Always)
  w rulesecie `main-protection` — dodawany przez API (UI repo osobistego
  nie wyszukuje userów) — commituje na `main` z panelu; ludzie chodzą
  przez PR-y (właściciel bez bypassu).
- Wersja Sveltii w `public/admin/index.html` jest PRZYPIĘTA (0.178.0,
  odziedziczona). Przy bumpie: przegląd changelogu + procedura sondy
  binarium (wzorzec w repo szablonu — patrz CLAUDE.md); nigdy w dniu szkolenia klienta.
