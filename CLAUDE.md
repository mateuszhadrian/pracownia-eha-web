# pracownia-eha-web — CLAUDE.md

Strona firmowa klienta **Pracownia EH/A** (remonty domów z historią) —
`pracownia-eha.pl`. Astro 6 **static** (bez SSR), **PL-only** (bez `/en/`).
Hosting: Cloudflare Pages, deploy automatyczny z gałęzi `main` →
**main = produkcja** (od Etapu 1A). Main chroniony rulesetem (required
checks: `quality` + `e2e` + `lighthouse` od Etapu 3) — zmiany idą
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
  UWAGI dla kolejnych etapów: JSON-LD ma dane eha, ale węzły NIE są
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
- **Etap 2 (CMS + media + logowanie) — WYKONANY** (2026-08-23):
  - chmura: R2 `eha-media` (EU) + `media.pracownia-eha.pl` (Image
    Transformations „This zone only", CORS prod + localhost:4321), token
    `eha-media-sveltia` (Object R&W, scope bucket; `account_id` /
    `access_key_id` jawne w `config.yml`, Secret w menedżerze haseł);
    konto GitHub **`pracownia-eha-cms`** (login `eha-cms` był zajęty;
    mail `eha@`, collaborator write, 2FA celowo wyłączone do Etapu 7;
    **User-bypass Always w rulesecie** — `actor_type: "User"`, dodany
    przez `gh api`, jak w delung); Worker `sveltia-cms-auth-eha` →
    `auth.pracownia-eha.pl` (nowsza sveltia-cms-auth: flow postMessage,
    `/auth` odpowiada 200; zmienne `GITHUB_CLIENT_ID`,
    `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS=pracownia-eha.pl,localhost` —
    ⚠️ zmiana zmiennych w dashboardzie tworzy WERSJĘ, którą trzeba
    jeszcze WDROŻYĆ: `wrangler versions deploy <id>@100%`; ponowny
    `wrangler deploy` bez `keep_vars = true` czyści zmienne); OAuth App „Panel
    treści — pracownia-eha.pl".
  - kod: schemat docelowy §6.1 w trzech miejscach (`place`, `paras[]`
    min 1, `specs` min 1) + testy kontraktu (w tym strażnik „R2 bez
    placeholderów": lokalnie skip z powodem, w CI pada).
  - weryfikacje: logowanie `/admin` kontem `pracownia-eha-cms` OK;
    spike MP4 24 MB przez pole edytora → R2, `206` + `Content-Range`
    (plan A potwierdzony); 6 wpisów testowych wg `DATA` z designu
    (zdjęcia z eksportu; TEN SAM film testowy w 3 wpisach, `0:31` —
    klient podmieni na prawdziwe presetem HandBrake); `.skipIf`
    z kontraktu „≥1 wpis" usunięty; `CHECK_REMOTE_MEDIA=1` zielony.
  - `e2e` na main CELOWO czerwony do Etapu 3 (brak fixture'u visual).
- **Etap 3 (testy/CI na szkielecie) — WYKONANY** (2026-08-23):
  - specy e2e przejrzane (wpisy tylko przez `tests/helpers/realizacje.ts`;
    `media-r2.test.ts` też na helperze i sprawdza URL-e fixture'u);
    allowlista axe PUSTA (0 naruszeń na 8 trasach × 2 profile).
  - fixture wizualny `tests/fixtures/realizacje` (5 wpisów wg `DATA`
    designu, 1 z wideo — `dom-z-bala…czernica`; media = te same pliki R2
    co treść testowa) + kontrakt `tests/unit/visual-fixture.test.ts`;
    helpery `fixtureFiles()`/`readFixture()`/`collectMediaUrls()`.
  - visual: `tests/visual/skeleton.spec.ts` (8 tras × 6 profili, top +
    fullPage, wideo pod maską) + `chrome.spec.ts` (pasek / sheet);
    na szkielecie `usePreviewGuard` — `useVisualFixtureGuard` liczy
    `<template data-work-detail>` i wchodzi z widokiem 4.3. Baseline'y
    darwin (`pnpm test:visual:update`) + linux (workflow).
  - LHCI: budżety z pomiaru CI (run 32652597911) — liczby w
    `.claude/rules/testing.md`; URL-e `/` + `/polityka-prywatnosci/`.
  - ruleset `main-protection`: required `quality`+`e2e`+`lighthouse`
    (`gh api -X PUT … --input`, bypass User 319944435 zachowany).
    UWAGI dla Etapu 4: każdy widok = własny spec visual + usunięcie trasy
    z `skeleton.spec.ts` (i jej baseline'ów) w tym samym PR; po 4.2
    zmierz LCP hero w CI i rozważ zacieśnienie LCP mobile (5000 to zapas
    z delung); 7 plików fontów (280 KB) to dziś 47 % render delay LCP
    mobile — kandydat na audyt subsetów (latin-ext) w Etapie 6.
- **Etap 4.1 (chrome globalny) — WYKONANY** (2026-08-23, kod+testy;
  mini-analiza i decyzje portu: `docs/analiza-chrome.md`):
  - Navbar FIXED nakładkowy wg designów: desktop — dropdown „O nas"
    (klik, chevron, panel na papierze, Esc/klik-poza zamyka) + AUTO-HIDE
    E11 1:1 z eksportów (progi 70/2/60 px, strefa kursora
    `max(96px,12vh)`, przy otwartym dropdownie rozszerzona do panelu
    +48 px, schowanie zamyka dropdown; stałe w `nav-config.ts`, importują
    je testy); stan `data-solid` (papier+cień) od `[data-navref]`-40 px
    (hero 4.2), fallback 8 px; mobile — bez auto-hide (wzorzec 8/8
    eksportów), glow czytelności rAF-lerp (WYCIĘTY w korekcie 4.2 —
    mobile używa odtąd stanu solid jak desktop), burger 2 kreski→X. Skin nav
    delung (fala liter, halo) wycięty. `--hdr-h` w :root global.css
    (92/72 px) + pomiar JS; SkeletonPage odsuwa treść pod fixed pasek.
  - Menu mobilne: sheet przeskórowany na papier (mechanika overlay.ts
    NIETKNIĘTA), akordeon „O nas" (`max-height`, aria-expanded), kaskada
    wjazdów, stopka sheeta z DWOMA telefonami przez sloty; rycina
    `dom-ryc-house1.webp` lazy.
  - Stopka wg designu (`#211D18`/krem): desktop pasmo brandowe
    (znaczek+motto+rycina koparki) + 3 kolumny O NAS/OFERTA/KONTAKT,
    mobile tabela etykieta/wartość (STRONY zamiast OFERTA — tak
    w eksporcie; kolejność wierszy 1:1, OBSZAR zduplikowany dOnly/mOnly);
    „NA GÓRĘ ↑" = `<button data-totop>` (smooth, reduce=skok — WYCIĘTY
    w korekcie 4.2, kredyt hadrianm przeszedł na jego miejsce); decyzje
    Mateusza: kredyt hadrianm zostaje w pasie dolnym, dane = tylko
    NIP/REGON/godziny (adres wyłącznie w JSON-LD — kontrakt
    `jsonld.test.ts` zaktualizowany), sociale finalne. Znaczek logo =
    maska CSS na cache'owanym SVG (NIE inline — 22 KB/szt.).
  - Nowe assety: `koparka-rycina1.webp` (420 px q45, 135 KB),
    `dom-ryc-house1.webp` (24 KB); `nav.ts` przepisany na
    `aboutNavItems`/`mainNavItems` (+`ABOUT_LABEL`); gutter chrome'u
    desktop = `clamp(60px, 9.72vw, 160px)` (--g eksportów; sekcje 4.2+
    pewnie przejmą — dziś tylko w chrome).
  - Testy: navigation.spec — kontrakty auto-hide (w dół chowa / ≥60 px
    w górę pokazuje / u góry zawsze / kursor przywołuje / otwarty
    dropdown blokuje przez rozszerzoną strefę), dropdown, akordeon,
    NA GÓRĘ, sloty stopki, `expectBreakpointFlip(1024)`; chrome.spec —
    +dropdown otwarty (clip 400 px) i sheet z akordeonem; policy.spec
    selektor stopki. Bramki 2026-08-23 zielone: format/lint/typecheck/
    unit(80)/build/e2e(117)/visual `--ignore-snapshots`(60).
  - UWAGA: baseline'y visual (skeleton-_ + chrome-_) CELOWO rozjechane —
    komplety linux+darwin generuje Mateusz w PR (workflow → darwin);
    desktop ładuje 9 plików fontów (doszły italiki Garamonda przez motto
    stopki i mono-600 przez etykiety) — budżet „fonty ≤ 8" da WARN na
    desktopie, progów nie ruszano (audyt fontów = Etap 6).
- **Etap 4.2 (strona główna) — WYKONANY** (2026-08-24, kod+testy;
  mini-analiza i decyzje portu: `docs/analiza-home.md`):
  - `/` wg eksportu: hero z `[data-navref]` (pasek solid od
    `heroH − 40 px`; hero = pierwszy ekran pod paskiem —
    `100svh − --hdr-h`, ŚWIADOMIE svh, nie dvh: dvh szarpie treścią przy
    zwijaniu paska Safari) + 6 zajawek (`sections/home/Home*.astro`,
    wspólna czwórka nagłówkowa `HomeSectionHead`) + stopka 4.1.
  - **Zajawka 02 CZYTA KOLEKCJĘ CMS** (pierwsze 3 wpisy po `order` przez
    `viewProject`, okładki `imgAt`; licznik mobile „JESZCZE N" tylko przy
    N > 0; pusta kolekcja = zajawka bez kart). Kap =
    `HOME_REALIZACJE_MAX` w `home-config.ts` (importują komponent
    i testy).
  - Ruch za bramką `html.js-motion` (inline przed paintem) +
    `home-motion.ts` ładowany dynamicznie przy no-preference: reveale
    `[data-rev]` (IO .3, mobile), rysowanie rycin maską `[data-ryc]`
    (mobile) / `[data-rycsb]` (desktop, IO z rootMargin −40% = linia
    60% viewportu; maska SCHODZI po animationend — lekcja D-Q1),
    `[data-kolek]`, parallaxy `[data-plxr]` ±15 px / `[data-plx]`
    ±9% kadru (zapas top −9%/height 118% w CSS — D-U1) jedną pętlą rAF.
    Bez JS/reduce strona kompletna i statyczna.
  - Assety: ~30 WebP w `src/assets/` — RYCINY SPŁASZCZONE na biel
    (alfa WebP jest bezstratna i ważyła 10×; w markupie multiply,
    a na ciemnym panelu 06 invert+screen); `--g` przeniesiony do
    global.css (`:root` ≥1024), Navbar/Footer przełączone na token.
  - Tło `/` = `HomeBackdrop` (korekta Mateusza): prawdziwy skan
    `paper-background.webp` na bazie `--bg-cream` (`.home` z isolation,
    tekstura z-index −1; kafelek body zostaje pod innymi trasami).
    Mobile cover 1:1 z treścią; desktop repeat-y + DRYF 0.85× tempa
    treści (`PAPER_BG_SPEED`) — element fixed przesuwany transformem
    modulo okres w home-motion.ts (kompozytor, bez przemalowań — D-Q1),
    pod bramką js-motion; kontrakt w e2e.
  - Korekty po testach Mateusza na telefonach (wszystkie z kontraktami
    e2e; szczegóły analiza §2a): karuzela 02 mobile z CSS scroll-snap
    (`x mandatory` + `scroll-snap-stop: always` — kontrakt sections.md);
    hero mobile ZAWSZE mieści się w pierwszym ekranie — logo kurczy się
    budżetem wysokości (podłoga 80 px), desktop bez zmian; reveale
    tekstów w tempie delung (przejścia 0.7/0.8 s, 22 px, IO −10 % —
    eksportowe 0.68 s odbierane jako migotanie); **D-Q2 przeniesione na
    eha** — `home-viewport.ts` (ładowany zawsze) z sondą 100svh mrozi
    `--svh` dopiero, gdy pasek URL rusza webview (Galaxy S20 FE), sekcje
    i parallaxy liczą z var(--svh)/vpH(); `theme-color` → #f5efe3
    (biały pas Androida przy zwijaniu paska URL); **glow mobile z 4.1
    wycięty** — pasek mobilny dostaje ten sam stan `data-solid`
    (papier + twarda krawędź 1 px, fade 0.3 s) co desktop, ten sam próg
    `heroH − 40`/fallback 8 px, wszystkie trasy; stałe `NAV_GLOW_*`
    usunięte, auto-hide dalej desktop-only; **ryciny widoczne na mobile
    wróciły do WebP z alfą** (iPhone SE 2020: `body{position:fixed}`
    sheeta gubi w starym WebKicie mix-blend-mode i spłaszczone na biel
    ryciny świeciły białym kontenerem; alfa degraduje się niewidocznie
    — desktopowe zostają spłaszczone, ⚠️ przy overlayu 4.3 może
    dotknąć desktopu, uwaga w analizie §2a); ryciny hero mobile rysują
    się SEKWENCYJNIE po wejściu (lewa 0 s → prawa górna 1 s → dolne
    2 s; `[data-ryc-auto]` + animation-delay, autostart bez IO).
  - Testy: e2e `home.spec.ts` (SSR bez JS, navref/solid, hero = pierwszy
    ekran, CTA + linki zajawek, zajawka z kolekcji odporna na liczbę
    wpisów, sloty 06, reveal po dojechaniu, strażnik natywnego scrolla,
    `expectBreakpointFlip(1024)`); visual `index.spec.ts`
    (`useHomeVisualFixtureGuard` — NOWY strażnik liczący karty zajawki,
    bo `<template data-work-detail>` wejdzie z 4.3; index-top +
    index-full po przejeździe rewealującym — szybki przelot gubi wpisy
    IO); trasa `/` wycięta ze `skeleton.spec.ts` z baseline'ami.
  - Bramki 2026-08-24: format/lint/typecheck/unit(80)/build/e2e(169)/
    visual `--ignore-snapshots`(66) zielone. LHCI lokalnie (CI = ratchet):
    mobile perf 0.79\*/LCP 4811 ms (element = h1; \*lokalny mnożnik CPU,
    skeleton w CI miał 0.95/2862), total 962 KB, obrazy 470 KB,
    JS 7 KB; desktop perf 0.99/LCP 956 ms, total 1028 KB. Fontów 12
    (doszły italiki + ext) → WARN budżetu „≤ 8" oczekiwany (audyt Etap 6).
  - UWAGI dla 4.3: baseline'y `index-*` generuje Mateusz (workflow →
    darwin); przy widoku `/realizacje/` przełączyć `index.spec.ts`
    z `useHomeVisualFixtureGuard` na wspólny `useVisualFixtureGuard`
    (albo zostawić oba — decyzja przy porcie); karty 02 linkują płasko na
    `/realizacje/` — ewentualne deep-linki do detalu rozstrzygnąć w 4.3;
    po merge'u odczytać LCP mobile `/` z runa CI (kandydat na
    zacieśnienie osobnym commitem).

## Dokumentacja

- Decyzje projektu (zapadłe — nie otwieraj na nowo):
  `docs/pracownia-eha-web-entrance-analysis.md` (E1–E14 + tabela §2).
- Instrukcja wykonawcza etapów: `docs/pracownia-eha-web-creation-process.md`
  (Część A: checklista; B: kroki; C: flow mediów klienta; D: backupy).
- Designy-referencje: `docs/design/README.md` + 8 plików HTML
  (breakpoint 1024 px, wzorce 390/1440; drugi próg 700 px w siatce
  realizacji).
