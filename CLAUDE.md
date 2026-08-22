# pracownia-eha-web — CLAUDE.md

Strona firmowa klienta **Pracownia EH/A** (remonty domów z historią) —
`pracownia-eha.pl`. Astro 6 **static** (bez SSR), **PL-only** (bez `/en/`).
Hosting: Cloudflare Pages, deploy automatyczny z gałęzi `main` →
**main = produkcja** (od Etapu 1A). Main będzie chroniony (required
checks: `quality`, potem `e2e` + `lighthouse` od Etapu 3) — zmiany idą
przez feature branch → PR → zielone checki → merge; bez pracy wprost
na main.

Projekt budowany wg instrukcji wykonawczej
`docs/pracownia-eha-web-creation-process.md` (Etapy 0–7; decyzje E1–E14:
`docs/pracownia-eha-web-entrance-analysis.md` — NIE otwieraj ich na nowo).
Kod startowy = kopia delung-web (trzeci przebieg „przepisu":
hadrianm → delung → eha; infrastruktura i mechanizm detalu/lightboxa/wideo
zostają, widoki budowane od nowa wg `docs/design/` — patrz
`docs/design/README.md`).

## Zasady twarde

1. **NIGDY nie wykonuj `git commit` ani `git push`** — commituje wyłącznie
   Mateusz. Twoja rola: zostawić zmiany w working tree i ZAPROPONOWAĆ
   treść commita (conventional commits ze scope, po angielsku, np.
   `feat(realizacje): …`, `fix(chrome): …`, `docs(cms): …`). Blokada jest
   też egzekwowana w `.claude/settings.json`.
2. **Nie edytuj `src/content/realizacje/*.json`** — te pliki pisze Sveltia
   CMS (własny formater, commituje przez GitHub API). Zmiany treści robi
   się w panelu `/admin`. Wyjątek wymaga wyraźnej zgody Mateusza.
3. **Nie dotykaj `dist/` i `.astro/`** — generowane.
4. Sekrety (`.env*`, tokeny Cloudflare/GitHub, klucze R2/Resend/Turnstile)
   — nie czytaj, nie loguj.
5. **Nie aktualizuj baseline'ów wizualnych** (`tests/visual/__screenshots__/`)
   bez pokazania diffu i zgody Mateusza (blokada też w settings.json).
   Aktualizacja wyłącznie przez `pnpm test:visual:update` po akceptacji;
   komplet linuksowy → workflow `update-visual-baselines.yml`. Święta
   kolejność: kod → workflow linux → commit darwin na końcu.
6. Schemat CMS zmieniaj zawsze w **TRZECH miejscach naraz**
   (`content.schema.ts` / `public/admin/config.yml` / komponenty work) —
   reguła `.claude/rules/cms-realizacje.md`.

## Mapa projektu (czym eha różni się od szablonu delung)

- **8 tras** (`src/lib/routes.ts`): `/`, `/ekipa-eha/`,
  `/kompetencje-i-technologie/`, `/tradycja-i-ekologia/`, `/realizacje/`,
  `/obsluga-budowy/`, `/kontakt/`, `/polityka-prywatnosci/`. Mobile 1:1
  desktop — ŻADNYCH redirectów. Breakpoint projektu: **1024 px**;
  drugi próg **700 px** tylko w siatce realizacji (Etap 4.3).
- **BEZ kategorii realizacji** (E5) — płaska lista + paginacja z designu
  (desktop: paginacja, mobile: „pokaż więcej"); aparat kategorii wycięty
  w Etapie 0.
- **Mechanizm detalu realizacji zostaje z szablonu 1:1**
  (`src/scripts/overlay.ts`, `sections/work/**`: `open-detail.ts`,
  `WorkDetailOverlay`, lightbox, wideo) — skin i model danych do adaptacji
  w Etapie 4.3 (lightbox `contain` + klawiatura ←/→ — E7).
- **Navbar docelowo Z auto-hide** (E11 — nowość względem szablonu) oraz
  dropdown „O nas"; wchodzi w Etapie 4.1. Scroll NATYWNY na dokumencie
  (`.claude/rules/scroll.md`).
- **DWA telefony** (MACIEK/ŁUKASZ) + mail `eha@` — sloty antyscrapingowe
  per-osoba w `src/lib/contact-details.ts` (`a[data-tel="maciek|lukasz"]`,
  `a[data-mail]`); pełnych ciągów NIE MA w statycznym HTML.
- **Tokeny „papier/atrament"** w `src/styles/global.css`; fonty (E10):
  EB Garamond Variable + IBM Plex Sans Variable + IBM Plex Mono statyczne
  (Fontsource, self-host; Google Fonts NIE wchodzi). Tło stron =
  `src/assets/paper-tile.webp`.
- **Eksporty designów** (`docs/design/export/*.html`) = referencja WYGLĄDU
  I ZACHOWANIA, nie implementacji — ich podwójne drzewa markupu w JS,
  scroll w kontenerze `fixed` i mnożniki `--k`/`--w` to artefakty Claude
  Design. Assety eksportów są POZA repo (`.gitignore`).

## Komendy

- `pnpm dev` — dev server (port 4321)
- `pnpm build` / `pnpm preview`
- `pnpm typecheck` — `astro check` (obejmuje też testy)
- `pnpm lint` / `pnpm lint:fix` / `pnpm format` / `pnpm format:check`
- Testy (kontrakt: `.claude/rules/testing.md`): `pnpm test` (wszystko);
  `pnpm test:unit` (Vitest, sekundy); `pnpm test:e2e` (Playwright:
  funkcjonalne+a11y+SEO); `pnpm test:visual` (screenshoty vs baseline;
  wymaga `pnpm build`; webServer sam wstaje na 4399);
  `pnpm test:visual:update` (nowe baseline'y — TYLKO za zgodą Mateusza);
  `pnpm test:smoke:prod` (smoke przeciw produkcji pracownia-eha.pl)
- `node scripts/optimize-images.mjs <src> <out.webp> [szer] [q]` —
  PNG/JPG z eksportów designów → WebP do `src/assets/`
- `node scripts/make-icons.mjs` — komplet ikon marki + og-image z wektora
  `public/favicon.svg` (placeholdery do Etapu 6; nie podmieniaj plików
  ręcznie)
- CI (GitHub Actions) na push/PR — 3 joby: `quality` (format:check →
  lint → typecheck → test:unit → build), `e2e` (test:e2e + test:visual
  na artefakcie dist), `lighthouse` (budżety w lighthouserc\* — do
  Etapu 3 luźne wartości tymczasowe). Po merge'u do main dodatkowo
  `prod-smoke.yml`. Lokalnie husky: pre-commit lint-staged, commit-msg
  commitlint.

## Stan projektu (aktualizuj po każdym etapie!)

- **Etap 0 (bootstrap) — WYKONANY** (2026-08-19): kopia delung-web bez
  `.git`/generatów/baseline'ów/treści; wycięte widoki delung + aparat
  kategorii + opinie + BackButton (mechanizm work ZOSTAŁ w całości);
  parametryzacja na pracownia-eha.pl (adresy, formularz, config.yml
  z placeholderami R2, manifest, ikony-placeholdery z logo EH/A);
  tokeny „papier/atrament" + fonty E10 (variable Garamond/Plex Sans,
  statyczny Plex Mono — decyzja z testu A/B na eksporcie: brak wersji
  variable Plex Mono w Fontsource, a warianty wizualnie nierozróżnialne
  przy mniejszych bajtach variable); logo zwektoryzowane z base64
  eksportów (`src/assets/logo/eha-logo.svg` + wariant „sam znaczek");
  8 tras-szkieletów z działającą nawigacją; assety eksportów
  przemianowane + 4 duble scalone (tabela w `docs/design/README.md`),
  `paper-background.png` 2,2 MB → tileable `paper-tile.webp` 12 KB;
  ekosystem `.claude` przepisany na eha.
  UWAGI dla kolejnych etapów: kontrakt „katalog ma ≥1 wpis"
  w `cms-contract.test.ts` ma TYMCZASOWY `.skipIf` (usunąć w Etapie 2
  razem z pierwszymi wpisami); JSON-LD ma dane eha, ale węzły NIE są
  renderowane (podpięcie + geo = Etap 6); specy sekcji szablonu
  skasowane — wracają z widokami w Etapie 4 (mechanizm work bez
  własnych speców do 4.3; przy porcie zajrzyj do speców work
  w repo delung-web); `TURNSTILE_SITE_KEY` = placeholder `<...>` (Etap 5).
- **Etap 1A (repo + Pages) — WYKONANY** (2026-08-22): repo publiczne
  `mateuszhadrian/pracownia-eha-web`, ruleset `main-protection`
  (id 21158063; required check `quality`), Cloudflare Pages
  `pracownia-eha-web.pages.dev` (`pnpm build`/`dist`/NODE_VERSION=22).
- **Etap 1B (The Camels/DNS) — WYKONANY** (2026-08-22): domena
  `pracownia-eha.pl` + `www` Active, poczta `eha@` przetestowana
  (SPF/DKIM/DMARC = PASS), `prod-smoke` zielony.
- **Etap 2 (CMS + media + logowanie) — W TOKU** (2026-08-22):
  - chmura WYKONANA: R2 `eha-media` (EU) + `media.pracownia-eha.pl`
    (Image Transformations „This zone only", CORS prod + localhost:4321),
    token `eha-media-sveltia` (Object R&W, scope bucket); konto GitHub
    **`pracownia-eha-cms`** (login `eha-cms` był zajęty; mail `eha@`,
    collaborator write, 2FA celowo wyłączone do Etapu 7); Worker
    `sveltia-cms-auth-eha` → `auth.pracownia-eha.pl` (nowsza wersja
    sveltia-cms-auth: flow postMessage, `/auth` odpowiada 200, nie 302;
    `ALLOWED_DOMAINS=pracownia-eha.pl,localhost`); OAuth App „Panel
    treści — pracownia-eha.pl" (callback `auth.pracownia-eha.pl/callback`).
  - kod WYKONANY: schemat docelowy §6.1 w trzech miejscach (`place`,
    `paras[]` min 1, `specs` min 1) + testy kontraktu; `config.yml`
    z `access_key_id` R2.
  - DO DOMKNIĘCIA: `account_id` R2 w `config.yml` (32 hex — test
    kontraktu „dane R2 nie są placeholderami" pilnuje); User-bypass
    Always dla `pracownia-eha-cms` w rulesecie (gh api); logowanie do
    `/admin`; spike MP4 (~20 MB) → R2 + range requests; 6 wpisów wg
    `DATA` z `docs/design/export/realizacje.html` przez panel (zdjęcia
    po `optimize-images.mjs`; filmy klienta presetem HandBrake — jeśli
    brak, dobić później); po pierwszych wpisach USUNĄĆ `.skipIf`
    z kontraktu „katalog ma ≥1 wpis" (`tests/unit/cms-contract.test.ts`).

## Dokumentacja

- Decyzje projektu (zapadłe — nie otwieraj na nowo):
  `docs/pracownia-eha-web-entrance-analysis.md` (E1–E14 + tabela §2).
- Instrukcja wykonawcza etapów: `docs/pracownia-eha-web-creation-process.md`
  (Część A: checklista; B: kroki; C: flow mediów klienta; D: backupy).
- Designy-referencje: `docs/design/README.md` + 8 plików HTML
  (breakpoint 1024 px, wzorce 390/1440; drugi próg 700 px w siatce
  realizacji).
