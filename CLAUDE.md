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
  `WorkDetailOverlay`, lightbox, wideo) — skin zaadaptowany w Etapie 4.3
  (lightbox `contain` na czerni + klawiatura ←/→ — E7; jedyna zmiana
  mechanizmu = listener strzałek w `open-detail.ts`).
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
- **Etap 4.3 (/realizacje/) — WYKONANY** (2026-08-24, kod+testy;
  mini-analiza i decyzje portu: `docs/analiza-realizacje.md`):
  - Widok wg eksportu: nagłówek (kicker/h1/lead; desktop grid 1fr 1fr
    do dołu, rycina house8 — mobile rysowana `[data-ryc]` + parallax
    `[data-plxr]`), siatka kafli 4:3 (gradient, lupa narożnikowa,
    meta MIEJSCE · ROK + tytuł serif; desktop hover: przyciemnienie +
    pill „ZOBACZ REALIZACJĘ"; kafel = `<button>`), CTA `#241E17`
    z `plac-budowy-photo3` + stopka 4.1. **Drugi próg 700 px**
    (`WORK_GRID_TWO_COL_MIN_PX`): siatka 1→2 kolumny. Tło = wzorzec
    strony głównej (korekta Mateusza): `HomeBackdrop` awansował do
    WSPÓLNEGO `src/components/PaperBackdrop.astro` (`/` + `/realizacje/`,
    `.wk` z isolation + `--bg-cream`), dryf desktop w work-motion.ts
    (stała `PAPER_BG_SPEED` z home-config, kontrakt e2e na obu trasach).
  - **Paginacja E5 = czysty progressive enhancement**: SSR renderuje
    WSZYSTKIE kafle i template'y detalu; kontrolki w SSR z `hidden`,
    odsłania JS i tylko przy nadwyżce wpisów (desktop: strony po
    `WORK_PAGE_SIZE=4`, zmiana strony przewija do początku siatki;
    mobile: „Pokaż więcej" po `WORK_MOBILE_STEP=4`, dokłada bez skoku;
    przejście przez próg 1024 resetuje stan). **4 zamiast eksportowych
    6 = świadome odstępstwo (korekta Mateusza)** — przy 6 wpisach
    produkcji kontrolki są widoczne od ręki. Bez JS = pełna lista.
    **Projnav/licznik detalu = kontekst PEŁNEJ listy** (nie strony).
  - **Skin detalu na nietkniętym mechanizmie**: modal
    `min(1260px, max(720px, 100vw−180px)) × 86vh`, 57 % kadr / 43 %
    treść na papierze (paper-tile), licznik kadru lewy dolny róg +
    kwadratowe strzałki 52 px (dashes desktop schowane — design),
    tabela PARAMETRY z kropkowanym wypełniaczem, blok „CHCESZ WIĘCEJ
    INFORMACJI?" (bez `dt-more` delung); sheet 90 % z grabberem, meta+
    tytuł, karuzela 4:3 (`flex 0 0 300px`, gap 10 = stała JS
    `offsetWidth+10`, `scroll-snap-stop: always`), kreski-wskaźniki +
    licznik, stopka CTA `position: sticky` w strumieniu scrolla
    (GOTCHA: bloki treści w dt-body MUSZĄ mieć `flex: none` — flex
    column z overflow:hidden zgniata `.dt-txt` do paddingu). Papier
    w panelu = skan przez `background-attachment: local` na `.dt-body`
    (pod CAŁĄ scrollowaną treścią; eksportowa warstwa absolute kryła
    tylko pierwszy ekran — wada makiety, korekta Mateusza; „opacity"
    tekstury robi półprzezroczysta warstwa kremu); te same warstwy
    statycznie na panelu `.dt` (pas grabbera) i sticky stopce CTA
    (zamiast `#F1ECE0`, bez border-top — separację robi cień). Kamera
    na kadrze wideo desktop = 160 px (korekty Mateusza: 8× → 4×
    mobilnych 40 px, które zostają). Kreski-wskaźniki karuzeli:
    `onTrackScroll` maluje też `.on` (nie tylko licznik — w delung
    kreski były na mobile schowane, więc scroll ich nie dotykał)
    i renderują się TYLKO przy galerii ≤ `WORK_GALLERY_DASHES_MAX`
    (15) — dłuższy rząd by się nie mieścił, zostaje licznik.
    Miniatura wideo NIE renderuje się lokalnie (znany artefakt
    /cdn-cgi/media; prod zweryfikowany GET-em — HEAD zwraca 404,
    nie sugerować się nim).
    Rycina house1 w treści detalu STATYCZNA (świadome uproszczenie)
    i Z ALFĄ (lekcja blendów 4.2 §2a — `body{position:fixed}`).
  - **Lightbox E7**: kadr `object-fit: contain` na czystej czerni
    (`.lb-media` inset:0, bez ramy 330/412; wideo też contain), licznik
    mobile na stałym dolnym pasie; **klawiatura ←/→** w podglądzie
    ORAZ w galerii detalu na desktopie (jedyna zmiana open-detail.ts;
    bez zapętlenia — krańce jak disabled). Esc-hierarchia bez zmian.
    **Wideo E8** 1:1 (preload=none, playsinline, bez controls, badge
    „STUKNIJ/KLIKNIJ, ABY OBEJRZEĆ" z tłem wg designu — uppercase robi
    CSS, asercje e2e wersalikami). **Miniatura filmu JEDNĄ drogą** —
    `<img.dt-poster>` pod `<video>`, BEZ atrybutu `poster` (korekta
    Mateusza po produkcji: silniki malują atrybut ROZCIĄGNIĘTY,
    ignorując object-fit — WebKit — psuł miniaturę w galerii i tło
    grającego filmu w podglądzie; „dwie drogi" delung i tak nie
    działały w Chromium). Kamera w podglądzie mobile = LEWY DOLNY róg
    (w górnym nachodziła na chevron wyjścia); reguły zaktualizowane
    w sections.md i cms-realizacje.md.
  - Ruch za bramką `js-motion`: `work-motion.ts` rozszerzony o
    `[data-ryc]`/`[data-plxr]` (wzorce 4.2); reveale mobile w tempie
    delung; desktop statyczny. Bez nowych assetów (house8/house1/
    plac-budowy-photo3 już w repo). JS widoku: bundle strony 10,1 KB +
    work-motion 2,0 KB (mechanizm work w delung ≈ 20 KB).
  - Testy: e2e `work-index.spec.ts` (SSR bez JS, paginacja/„pokaż
    więcej" odporne na liczbę wpisów — przy 6 wpisach i stronie 4
    biegają warianty pozytywne; detal/projnav po pełnej liście,
    lightbox z klawiaturą
    i kontraktem contain-na-czerni, wideo funkcjonalnie, gesty CDP,
    collectPageIssues, strażnik scrolla, progi 1024 i 700); visual
    `work-index.spec.ts` na `useVisualFixtureGuard` (top, full po
    przejeździe, detal sheet/modal, lightbox, kadr wideo; wideo +
    `.dt-poster` POD MASKĄ); `index.spec.ts` przełączony na wspólny
    strażnik (`useHomeVisualFixtureGuard` usunięty z guards.ts); trasa
    `/realizacje/` wycięta ze `skeleton.spec.ts` z baseline'ami
    `skeleton-realizacje-*` (oba komplety, 24 pliki).
  - UWAGA: baseline'y `work-index-*`/`work-detail-*` NIE istnieją,
    a `chrome-*` ROZJADĄ się zamierzenie (zrzuty chrome'u robione na
    /realizacje/ — treść pod paskiem/za sheetem inna) — komplety
    linux+darwin generuje Mateusz w PR (workflow → darwin).
  - UWAGI dla 4.4: wzorzec bramki js-motion + work-motion gotowy do
    reużycia w widokach treściowych; deep-linki home→detal ŚWIADOMIE
    nie weszły (analiza §2 pkt 4 — ~10 linii, gdyby decyzja się
    zmieniła); obserwować blendy desktopowych rycin innych tras
    przy otwartym detalu na starym WebKit (lista wariantów alfa
    w analiza-home §2a).
- **Etap 4.4 cz. 1 (/ekipa-eha/) — WYKONANY** (2026-08-24, kod+testy;
  mini-analiza i decyzje portu: `docs/analiza-ekipa.md`):
  - Widok wg eksportu: hero z CIEMNYM zdjęciem (`eha-o-nas2`,
    luminosity na #362B20, maska wygasza w papier; mobile 420 px,
    desktop 70vh, h1 przy dole, `[data-navref]`), intro motto+akapit,
    pas `maciek-pod-sufitem`, biogramy Łukasz/Maciek (mobile karta
    portretu + h2 obok, desktop h2 z kreskowanym podkreśleniem + tekst
    2-kolumnowy `column-count`), 3 płyty tytułowe (house-old1 /
    technical-ryc / ekipa-budowlana1 z mgłą), CTA `ekipa-budowlana2`
    - stopka 4.1. Tło = wspólny `PaperBackdrop` (`.eka` isolation +
      `--bg-cream`, dryf desktop `PAPER_BG_SPEED`, kontrakt e2e).
      Jeden markup na oba progi (grid-areas/order); świadome duplikacje
      dOnly/mOnly: akapit „Tam, gdzie inni…" (s2) i rycina
      technical-elements (s3) — wzorzec stopki 4.1.
  - **Navbar dostał wariant `tone="dark"`** (NOWOŚĆ chrome — eksport
    obu drzew: pasek kremowy #F5EFE3 nad ciemnym hero, atrament po
    stanie solid): prop → `data-tone="dark"` na `.hdr`, czysty CSS
    (`:not([data-solid]):not([data-open])` — otwarty sheet wraca do
    atramentu), transition 0.3 s; mechanika progów/auto-hide
    NIETKNIĘTA, pozostałe trasy bez propa = zero zmian (baseline'y
    chrome-\* na /realizacje/ nietknięte).
  - **Zwijane akapity = WSPÓLNY moduł dla 4.4**
    (`sections/CollapsibleText.astro` + `collapsible.ts`): SSR pełny
    tekst + przycisk `hidden` (PE jak paginacja E5; ładowany ZAWSZE,
    działa przy reduce), `initCollapsibles()` zwija (`[data-collapsed]`
    na hoście, `aria-expanded`/`aria-controls`, etykiety „Czytaj
    dalej →"/„Zwiń ↑" przełącza CSS po aria); zwinięcie TYLKO mobile
    (@media w komponencie, para `CONTENT_DESKTOP_MIN_PX`
    z `content-config.ts`), wysokość per instancja przez `--clp-max`
    (ekipa 98/112 px; kompetencje podadzą 132/128). Bez animacji
    wysokości (eksport 1:1); „Zwiń" trzyma przycisk pod palcem
    (scrollBy o deltę — kontrakt e2e ±2 px).
  - **Ruch wspólnym modułem `sections/content-motion.ts`** (wzorzec
    work-motion + desktopowe `[data-rycsb]` i `[data-plx]` z 4.2;
    stałe z home-config): reveale/rysowanie mobile, rysowanie desktop
    (linia 60 %), parallaxy ±15 px / ±9 % kadru, dryf tła; kaskada
    rzędu domków w s2 przez nth-child animation-delay (0/.35/.7 s).
    Część 2 (kompetencje) importuje ten sam moduł.
  - Assety: 6 nowych fotografii WebP 1456 px q42–50 (eha-o-nas2 55 KB
    — LCP eager+fetchpriority, maciek-pod-sufitem, house-old1,
    technical-ryc, ekipa-budowlana1/2) + 2 ryciny Z ALFĄ (lekcja 4.2
    §2a — widoczne na mobile): `technical-elements-ryc` 6 KB
    i `eha-kolek-ryc-m` 560 px 42 KB (desktop zostaje na spłaszczonym
    kolek); portrety/plan/warsztat/domki reużyte z repo. Korekta a11y:
    podpisy portretów rgba .55→.65 (ratchet axe od pustej allowlisty).
    JS widoku: skrypt strony 0,9 KB + content-motion 2,2 KB (raw).
  - Testy: e2e `ekipa.spec.ts` (SSR bez JS z PEŁNYMI akapitami
    i ukrytymi przyciskami, zwijanie mobile z kontraktem braku skoku,
    desktop bez zwijania, navbar tone krem↔atrament z progami
    nav-config, CTA, reveal, dryf tła, strażnik scrolla, breakpoint
    flip); visual `ekipa.spec.ts` na `usePreviewGuard` (widok nie
    czyta kolekcji): ekipa-top / ekipa-full (zwinięte) /
    ekipa-full-open (rozwinięte, TYLKO mobile); trasa wycięta ze
    `skeleton.spec.ts` z baseline'ami `skeleton-ekipa-eha-*`
    (24 pliki). Bramki 2026-08-24: format/lint/typecheck/unit(80)/
    build/e2e(284)/visual `--ignore-snapshots`(90) zielone.
  - UWAGA: baseline'y `ekipa-*` NIE istnieją — komplety linux+darwin
    generuje Mateusz w PR (workflow → darwin).
  - **Lekcja webkit-CI (domknięcie PR-a)**: trzy race'y determinizmu
    zrzutów — (1) `.in` PO wstrzyknięciu freeze.css nie startuje
    animacji rysowania → zero zdarzeń → maska zostawała w stanie
    startowym: `drop()` w content-motion domyka stan od ręki, gdy
    `animation-name: none`; (2) wolny WebKit gubi zdarzenie scroll po
    programowym skoku → parallaxy z transformami ze środka przejazdu;
    (3) IO nie zdąża policzyć przecięć dołu strony w 140 ms pauzy →
    reveale ostatniej sekcji przepadały. (2)+(3) łata WSPÓLNY
    `revealSweep` w tests/helpers/visual.ts (pełne settle na dole +
    wymuszony przemalunek rAF po powrocie) — używają go specy ekipa
    i work-index; `index.spec.ts` ma STARY lokalny sweep (kandydat na
    przełączenie przy okazji — może wyleczyć „graniczny" baseline
    index-full webkit; wymaga decyzji, bo dotyka baseline'ów `/`).
    Do tego `expect.poll` na kolory paska (transition 0.3 s) i budżet
    20 s na fullPage (najcięższe blendy + software raster runnera);
    zrzuty fullPage ekipy mają per-shot `maxDiffPixelRatio: 0.001`,
    a work-index-full 0.0015 (decyzje Mateusza — WebKit dpr=2 sypie
    1-px szumem resamplingu na zdjęciach, a maszyny runnerów różnią
    się glifem 404-obrazka kafla preview; globalny próg 0.0005
    nietknięty). Kolejne dwie lekcje z domknięcia: (4) WebKit robi
    fullPage przez CHWILOWY resize viewportu → pętle parallaxu
    repaintują na resize wyłącznie przy zmianie SZEROKOŚCI
    (content-motion + work-motion; duch D-Q2 — nie szarpie też przy
    pasku URL); (5) pudełko `overflow: hidden` da się przewinąć
    PROGRAMOWO (scrollIntoView/fokus/szukajka) — zwinięty
    CollapsibleText używa `overflow: clip` (hidden jako fallback),
    a pętla dociskająca sweepa scrolluje wyłącznie dokument.
    Workflow baseline'ów uparcie renderuje ekipa-top SE ze schowaną
    ryciną (kontekstowa zagadka) — baseline trzyma bajty ACTUALI CI
    (stabilne między maszynami); po bot-commitach przywracać
    ekipa-top-linux SE i index-full-linux SE, gdy je nadpisze.
  - UWAGI dla 4.4 cz. 2 (kompetencje): konsumować `CollapsibleText`
    (collapsedMax 132/128 px z eksportu; przycisk bywa w osobnym
    kontenerze — stylować z poziomu strony) + `content-motion.ts` +
    `content-config.ts`; wzorzec strony = ekipa-eha.astro (tokeny
    `.eka` → własny prefiks, PaperBackdrop wg eksportu kompetencji —
    rozstrzygnąć w mini-analizie); jeśli hero kompetencji też ciemne →
    `<Navbar tone="dark" />` już gotowy; ciemny blok „świadome
    granice" = nowość (wzorzec HomeKontakt/wk-cta); ocenić na
    telefonie, czy ryciny ekipy nie są za blade (ewent. token
    `--ryc-vis` jak na `/` — analiza §4).
- **Etap 4.4 cz. 2 (/kompetencje-i-technologie/) — WYKONANY**
  (2026-08-25, kod+testy; mini-analiza i decyzje portu:
  `docs/analiza-kompetencje.md`):
  - Widok wg eksportu, prefiks `.kmp`, moduły cz. 1 KONSUMOWANE bez
    zmian mechanik (CollapsibleText/collapsible.ts, content-motion.ts,
    content-config.ts, `Navbar tone="dark"`, PaperBackdrop — dryf
    `PAPER_BG_SPEED`, kontrakt e2e). Hero jasne, ale pasek kremowy —
    czytelność robi górny gradient przyciemniający (mobile 118 px,
    desktop clamp(130,13vw,210)); `[data-navref]` na WRAPPERZE OBRAZU
    hero (430 px mobile / 62vh desktop — płyta tytułowa się nie
    wlicza). **Hero z JEDNYM h1 przez grid-overlap**: mobile obraz
    i tytuł w tej samej komórce (align-self:end), desktop rzędy
    `calc(62vh − overlap) auto` — obraz z jawną wysokością wystaje
    pod papierową płytę tytułową (kicker+lead dOnly; lead mobile =
    mOnly kopia w intro).
  - Sekcje: ciesielstwo / murarstwo / sklepienia (zwijane 132 px),
    ciemny pas TWORZYMY I ODTWARZAMY (desktop) / karty w pudle
    sklepień (mobile), fizyka budowli (bez zwijania, karta TRADYCJA
    I EKOLOGIA → /tradycja-i-ekologia/), instalacje (polaroid mobile,
    para kadrów — mobile flex z kartą 3:4 przez `--iph`, GOTCHA:
    karta 3:4 wymaga JAWNEJ szerokości `calc(--iph·0.75+16px)`,
    inaczej rośnie do max-content jednolinijkowego podpisu),
    świadome granice (zwijane 128 px; mobile JASNA sekcja + kadr
    końcowy czernica, desktop CIEMNY blok — czysty CSS na wspólnym
    markupie, pudło zwijane WSPÓLNE dla obu progów).
  - **Sekcje rzemiosł = świadome duplikacje dOnly/mOnly** (eksport ma
    dla nich realnie różne kompozycje): kicker+h2 wspólne (desktop
    często przez `display: contents` wewnątrz kart/kolumn), akapity/
    kadry/karty zduplikowane — treści powtarzane siedzą w stałych
    frontmattera (`CIES_P`/`MUR_P`/`*_CARDS`/`TWORZYMY`), żeby kopie
    nie mogły się rozjechać. Fizyka/instalacje/granice = jeden markup
    (grid-areas + @media).
  - Korekta a11y (ratchet axe, klasa z cz. 1): podpisy kadrów
    rgba .55 → .65 (eksportowe .55 na `#F3EDE1` = color-contrast
    serious).
  - Assety: 18 nowych WebP (hero 1456 eager+fetchpriority 76 KB;
    kadry `-full` 1456 = duże warianty assetów zajawek `/` — małe
    ZOSTAJĄ nietknięte, baseline'y `/` bez zmian; tła płyt ai 1200
    q40–42 pod mgłą .66/opacity .16; `dom-ryc-house5/7` Z ALFĄ,
    sharp alphaQuality 45); reużyte: ekologia-techno (1300),
    instalacje (polaroid), house2/3/4/6, paper-background. JS widoku:
    skrypt strony 0,4 KB + wspólne chunki collapsible 0,5 KB +
    content-motion 2,2 KB (≈3,2 KB ponad chrome).
  - Testy: e2e `kompetencje.spec.ts` (wzorzec ekipy; SSR bez JS
    z asercjami `:visible` tam, gdzie treść zduplikowana, [data-clp]
    ×4 z wysokościami 132/128, zwijanie bez skoku ±2 px, tone="dark"
    przez expect.poll, DWA CTA — tradycja+kontakt, reveal granic,
    dryf tła, strażnik scrolla, breakpoint flip); visual
    `kompetencje.spec.ts` na `usePreviewGuard` + WSPÓLNYM
    `revealSweep` (kompetencje-top / -full / -full-open mobile;
    fullPage timeout 20 s + per-shot 0.001 — klasa decyzji z cz. 1);
    trasa wycięta ze `skeleton.spec.ts` z baseline'ami
    `skeleton-kompetencje-i-technologie-*` (24 pliki). Bramki
    2026-08-25: format/lint/typecheck/unit(80)/build/e2e(317)/visual
    `--ignore-snapshots`(99) zielone.
  - UWAGA: baseline'y `kompetencje-*` NIE istnieją — komplety
    linux+darwin generuje Mateusz (workflow z kontrolą intruzów →
    darwin na końcu; znani intruzi bot-commitów: ekipa-top SE,
    index-full SE/14, work-index-full SE — przywracać
    `git checkout <sha-przed-botem> -- <plik>`).
  - UWAGI dla 4.5 (tradycja-i-ekologia + obsluga-budowy): wzorzec
    strony = kompetencje/ekipa (prefiks per widok, PaperBackdrop,
    tone navbara wg eksportu); tradycja = jedyna strona z ANIMOWANYM
    diagramEM (wjazd warstw + scaleX strzałek — port na CSS za bramką
    js-motion, wzorzec content-motion do rozszerzenia albo lokalny
    moduł) + efekt `.kolek`; obsługa budowy = najlżejsza (hero +
    3 sekcje + CTA); assety tradycji częściowo już w repo
    (ekologia-techno, eha-kolek-ryc, lisc/szkielet/wnetrze-ryc) +
    eksportowe `hero-tradycja-i-ekologia1`, `tradycja-i-ekologia-
drewno-ai1`, `cegla-rozbiorkowa`; grid-overlap hero z kompetencji
    do reużycia, jeśli eksport ma płytę tytułową na hero.
- **Etap 4.5 cz. 1 (/tradycja-i-ekologia/) — WYKONANY** (2026-08-25,
  kod+testy; mini-analiza i decyzje portu: `docs/analiza-tradycja.md`):
  - Widok wg eksportu, prefiks `.trd`, moduły 4.4 KONSUMOWANE bez zmian
    (CollapsibleText/collapsible.ts ×3 pudła po **132 px** — fz/up/tw,
    content-motion.ts, content-config.ts, `Navbar tone="dark"`,
    PaperBackdrop — dryf `PAPER_BG_SPEED`, kontrakt e2e). Hero BEZ
    płyty tytułowej: h1 wewnątrz hero (`[data-navref]` na całej sekcji;
    430 px mobile / **68vh** desktop), kolor h1 per próg czystym CSS
    (mobile atrament na wygaszonym dole kadru + maska fade, desktop
    krem na dolnym gradiencie + mono-etykieta dOnly).
  - Sekcje: manifest (mobile lead mOnly + JEDEN scalony akapit =
    `MAN_P.join(" ")`; desktop grid .62/1/1 z rysowaną ryciną liścia),
    ciemny pas materiałów (mOnly), fizyka budowli z **ANIMOWANYM
    DIAGRAMEM warstw**, upcycling (2 kadry dom-z-bala z badge'ami/
    podpisami), trwałość z efektem **kolka**, mikroklimat (jeden
    markup: grid akapitów + 3 karty), CTA → /kontakt/ (bez cytatu).
    Fizyka/upcycling/trwałość = świadome duplikacje dOnly/mOnly
    (wzorzec rzemiosł 4.4 cz. 2; treści w stałych frontmattera);
    manifest/mikroklimat/CTA = jeden markup.
  - **DIAGRAM + KOLEK = osobny mały moduł `tradycja-motion.ts`**
    (0,36 KB; content-motion NIETKNIĘTY): port animacji na **CSS
    TRANSITIONS zamiast keyframes** (wszystkie animacje eksportu są
    dwustanowe; freeze.css testów sadza wtedy stany końcowe natychmiast
    po `.in` — bez księgowości animationend/drop(), lekcja webkit-CI
    zaadresowana konstrukcyjnie); kaskada delayami transition-delay
    1:1 z eksportu (warstwy 0/.08/.16/.24/.32 s, strzałka scaleX .42 s,
    groty 1.3 s; kolek 2.2 s do opacity .14); uzbrojenie WYŁĄCZNIE pod
    `html.js-motion` + `@media <1024` (animacja mobile-only jak
    w eksporcie — desktopowa kopia diagramu bez atrybutu, statyczna);
    IO o parametrach revIO (rootMargin −10 %, threshold .01) —
    ŚWIADOME odstępstwo od eksportowego progu 30 %: kolek siedzi
    w zwiniętym pudle przycięty do ~31 % (próg .3 = flake na granicy),
    threshold .01 odpala deterministycznie także elementy przycięte.
    Bez JS / przy reduce diagram i kolek statyczne i kompletne (SSR).
  - **`revealSweep` w tests/helpers/visual.ts rozszerzony ADDYTYWNIE**
    o `[data-diag]:not(.in)` i `[data-kolek]:not(.in)` w selektorze
    maruderów (inne trasy nie mają tych atrybutów — zero wpływu na
    istniejące specy); diagram na zrzutach w stanach końcowych, BEZ
    maski.
  - Assety: 5 nowych WebP (hero 1456 q48 112 KB eager+fetchpriority,
    reużyty też jako tło pasa mikroklimatu; dom-z-bala4 1456 q42
    211 KB; dom-z-bala3 1456 q42 312 KB — portret, lazy; cegla-
    rozbiorkowa 1200 q42 pod mgłą .66; tradycja-i-ekologia-drewno-ai1
    1200 q42 pod opacity .34); reużyte: ekologia-techno (1300 =
    zoptymalizowany ekologia-techno-ai), house-old1 (CTA),
    eha-kolek-ryc-m (alfa), lisc-rycina1 (alfa), dom-ryc-house2/3/5
    (alfa) — ZERO nowych rycin. Korekta a11y (klasa 4.4): podpisy
    kadrów/etykiety krawędzi diagramu/podpis PARA WODNA rgba .5–.55 →
    **.65**. JS widoku: skrypt strony 0,4 KB + collapsible 0,55 KB +
    content-motion 2,3 KB + tradycja-motion 0,36 KB (≈3,6 KB raw ponad
    chrome; diagram+kolek = 0,36 KB).
  - Testy: e2e `tradycja.spec.ts` (wzorzec kompetencji; SSR bez JS
    z asercjami `:visible` przy duplikatach i KOMPLETNYM statycznym
    diagramem, [data-clp] ×3 po 132 px, zwijanie bez skoku ±2 px,
    tone="dark" przez expect.poll, diagram po rozwinięciu+dojechaniu
    do stanów końcowych przez expect.poll — warstwy/scaleX/groty,
    kolek do opacity .14, desktop-diagram statyczny bez uzbrojenia,
    CTA, reveal, dryf tła, strażnik scrolla, breakpoint flip); visual
    `tradycja.spec.ts` na `usePreviewGuard` + wspólnym `revealSweep`
    (tradycja-top / -full / -full-open mobile; fullPage timeout 20 s +
    per-shot 0.001, full-open 0.0025 — patrz niżej); trasa wycięta ze
    `skeleton.spec.ts` z baseline'ami
    `skeleton-tradycja-i-ekologia-*` (24 pliki). Bramki 2026-08-25:
    format/lint/typecheck/unit(80)/build/e2e(359)/visual
    `--ignore-snapshots`(108) zielone.
  - Baseline'y `tradycja-*` KOMPLETNE (2026-08-25): 15 linux
    (workflow) + 15 darwin (top+full × 6 profili, full-open × 3
    mobile); bot-commit nadpisał 3 znanych intruzów (index-full SE/14,
    ekipa-top SE) — przywrócone `git checkout <sha-przed-botem> --
<plik>` i zweryfikowane `cmp` bajt-w-bajt.
  - **Próg `*-full-open` podniesiony do 0.0025** (decyzja Mateusza;
    `FULLOPEN_MAX_DIFF_RATIO` w `kompetencje.spec.ts` i
    `tradycja.spec.ts`; zrzuty `*-full` zostają na 0.001, globalny
    0.0005 nietknięty): na webkit-iphone-14 rozwinięte akapity
    wpuszczają do kadru KOMPLET kadrów `[data-plx]` i pętla parallaxu
    ląduje o jedną klatkę rAF inaczej — zachowanie DWUSTANOWE (czysto
    albo dokładnie 6134 px = 0.00197 na kompetencjach, nigdy pomiędzy;
    tradycja otarła się raz o 2494 px = 0.00107). Diff = rzadki rozsyp
    ~8–10 px/wiersz po krawędziach detalu ZDJĘĆ w 8 pasmach, nie zwarte
    bloki — nie regresja layoutu. Stan zastany z 4.4 cz. 2, nie skutek
    PR-a tradycji (`revealSweep` rozszerzony czysto addytywnie).
  - `index-full` SE dalej BYWA graniczny w pełnym przebiegu, zielony
    w izolacji. **SPROSTOWANIE zastanego zapisu z 4.4 cz. 1**: notka,
    jakoby `index.spec.ts` siedział na STARYM lokalnym sweepie, jest
    NIEPRAWDZIWA — plik jest na wspólnym `revealSweep` od PR-a ekipy
    (`b3afc77`), więc sweepa NIE ma po co ruszać. Realna
    charakterystyka: `index-full.png` to JEDYNY zrzut fullPage
    w projekcie BEZ per-shot `maxDiffPixelRatio`, czyli jedzie na
    globalnym 0.0005, podczas gdy wszystkie pozostałe fullPage mają
    0.001–0.0025. Nadanie mu per-shot 0.001 (klasa decyzji 4.4) dotyka
    baseline'ów `/` i wymaga decyzji Mateusza — otwarty kandydat.
    Uwaga interpretacyjna: „~0.01" z logu Playwrighta to wartość
    ZAOKRĄGLONA (pisze `ratio 0.01` także przy faktycznym 0.00197) —
    nie wnioskować z niej, że progi rzędu 0.0025 nic nie dają.
- **Etap 4.5 cz. 2 (/obsluga-budowy/) — WYKONANY** (2026-08-25,
  kod+testy; mini-analiza i decyzje portu: `docs/analiza-obsluga.md`):
  - Najlżejszy widok serwisu, prefiks `.obs`, ZERO nowych mechanik:
    konsumuje `content-motion.ts`, `content-config.ts`, PaperBackdrop
    (dryf `PAPER_BG_SPEED`, kontrakt e2e), `Navbar tone="dark"`
    i stopkę 4.1. **Jedyny widok treściowy BEZ zwijanych akapitów** —
    skrypt eksportu nie ma funkcji `cv()` (analiza §1c), więc
    CollapsibleText/collapsible.ts NIE wchodzą, a spec visual nie ma
    zrzutu `*-full-open`. `tradycja-motion.ts` (diagram+kolek) świadomie
    nieimportowany.
  - Struktura: hero (mobile 430 px / desktop `flex:1`) + wstęp,
    3 sekcje (JEDEN PUNKT KONTAKTU / PEŁNA KONTROLA Z DYSTANSU /
    PODSUMOWANIE) + CTA → `/kontakt/` + mobilny pas domykający
    `maciek-kroi`. **Desktop: hero + wstęp = DOKŁADNIE jeden ekran**
    (`.obs-top { height: 100vh }`, hero `flex:1`, wstęp `flex:none`
    z akapitem w `column-count: 2`) — odwzorowanie `screenH` eksportu
    przy nakładkowym pasku; `[data-navref]` na `.obs-hero` (wzorzec
    kompetencji — wstęp nie może wliczać się do progu solidu).
  - **Sekcje jednym markupem przez grid-overlap** (zamiast duplikatów
    dOnly/mOnly): kadr i nagłówek dzielą komórkę gridu na mobile (kadr
    dostaje wysokość nagłówka automatycznie — bez zgadywania pikseli),
    a na desktopie kadr przechodzi w `position:absolute` (pas 34 %
    po lewej/prawej albo tło całej sekcji) i wypada z flow. Sekcja
    podsumowania trzyma CTA w swoim markupie: mobile grid `"ph"/"cta"`,
    desktop `"txt cta"`. Kolejność akapitów sekcji 04 (mobile
    akapit→motto→akapit, desktop motto→linia→grid) załatwia `order`
    vs `grid-template-areas` — bez kopii treści. Świadome duplikaty
    ograniczone do: motto (stała `MOTTO`), mono-tag hero, rycina
    wstępu, pas domykający i kreskowane linie desktopu.
  - **GOTCHA gridu (złapana przy porcie)**: absolutne dziecko
    kontenera gridu z JAWNYM `grid-area` ma za blok zawierający swoją
    KOMÓRKĘ, nie padding-box kontenera (CSS Grid §9.2) — kadr sekcji
    podsumowania z odziedziczonym `grid-area: txt` renderował się
    wielkości LEWEJ KOLUMNY zamiast pełnego bleedu; lekarstwo
    `grid-area: auto` w regule desktopowej (sekcji 03/04 nie dotyczy —
    tam kontener przestaje być gridem). Pilnuje tego SONDA UKŁADU
    w e2e, nie pixel-diff.
  - Assety: 2 nowe fotografie (`czas-na-twoj-ruch-naglowek` 1456 q42
    45 KB — tło pod ciężkim welonem; `maciek-kroi` 1000 q42 69 KB —
    pas mOnly, grayscale+luminosity) + `zuraw-rycina1-m` 460 px Z ALFĄ
    (105 KB; rycina widoczna na mobile MUSI mieć alfę — lekcja 4.2 §2a;
    460 px = dpr2 kadru 230 px, przy 560 px ta sama rycina waży 155 KB).
    Reużyte bez zmian: `ekipa-budowlana1` (hero, eager+fetchpriority,
    33 KB), `plac-budowy-photo2`, `plac-budowy-photo3` (świadomie BEZ
    wariantu `-full` — dekoracyjny pas pod sepią, upscale ≤1,15×),
    `koparka-rycina1`, `dom-ryc-house4/1` (alfa), `zuraw-rycina1`
    (dOnly). Korekta a11y NIE była potrzebna (eksport nie ma tu
    tekstów `rgba(...,.5–.55)`), allowlista axe zostaje PUSTA.
  - JS widoku: skrypt strony **0,3 KB** + content-motion 2,2 KB
    ≈ **2,5 KB raw ponad chrome** — najlżejszy widok treściowy
    (tradycja ≈ 3,6 KB). LHCI mierzy `/` i `/polityka-prywatnosci/`,
    więc budżetów ten PR nie rusza (progi NIETKNIĘTE).
  - Testy: e2e `obsluga.spec.ts` (SSR bez JS z asercjami `:visible`
    przy motcie, KONTRAKT braku `[data-clp]`, tone="dark" przez
    expect.poll, sonda „hero+wstęp = jeden ekran", sonda pełnego bleedu
    `.s3-ph`, sonda D-U1 zapasu kadrów `[data-plx]` ≥ `1 + PLX_AMT`,
    CTA, reveal, dryf tła, strażnik scrolla, breakpoint flip na
    `.obs-band`/`.s2-rule`/`.obs-hero-row`); visual `obsluga.spec.ts`
    na `usePreviewGuard` + wspólnym `revealSweep` (obsluga-top /
    obsluga-full; fullPage timeout 20 s + per-shot 0.001); trasa
    wycięta ze `skeleton.spec.ts` z baseline'ami
    `skeleton-obsluga-budowy-*` (24 pliki). **W `ROUTES` zostały DWIE
    trasy** — `/kontakt/` (Etap 5) i `/polityka-prywatnosci/` (4.6);
    plik znika z ostatnią z nich. Bramki 2026-08-25:
    format/lint/typecheck/unit(80)/build/e2e(400)/visual
    `--ignore-snapshots`(114) zielone.
  - UWAGA: baseline'y `obsluga-*` NIE istnieją — komplety linux+darwin
    generuje Mateusz (workflow z kontrolą intruzów → darwin na końcu;
    znani intruzi bot-commitów: `ekipa-top` SE, `index-full` SE/14,
    `work-index-full` SE — przywracać
    `git checkout <sha-przed-botem> -- <plik>`; lokalny
    `test:visual:update` lubi podprogowo przepisać `index-full` SE
    i `kompetencje-full-open` 14).
  - UWAGI dla 4.6 (/polityka-prywatnosci/): treść 9 sekcji z designu
    1:1, sticky spis treści, DATA obowiązywania, sloty antyscrapingowe
    (`contact-details.ts`); wzorzec strony = obsługa/tradycja (własny
    prefiks, PaperBackdrop wg eksportu, tone navbara z `navColor`);
    strona jest statyczna i tekstowa, więc `content-motion` może się
    okazać zbędny — rozstrzygnąć w mini-analizie.

## Dokumentacja

- Decyzje projektu (zapadłe — nie otwieraj na nowo):
  `docs/pracownia-eha-web-entrance-analysis.md` (E1–E14 + tabela §2).
- Instrukcja wykonawcza etapów: `docs/pracownia-eha-web-creation-process.md`
  (Część A: checklista; B: kroki; C: flow mediów klienta; D: backupy).
- Designy-referencje: `docs/design/README.md` + 8 plików HTML
  (breakpoint 1024 px, wzorce 390/1440; drugi próg 700 px w siatce
  realizacji).
