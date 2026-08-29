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
  w repo delung-web); `TURNSTILE_SITE_KEY` = placeholder `<...>`
  (WYPEŁNIONY prawdziwym site keyem w Etapie 5, 2026-08-26).
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
- **Etap 4.6 (/polityka-prywatnosci/) — WYKONANY** (2026-08-25,
  kod+testy; mini-analiza i decyzje portu: `docs/analiza-polityka.md`):
  - Jedyny DOKUMENT PRAWNY serwisu, prefiks `.pp` (NARZUCONY przez
    uśpiony kontrakt Etapu 3), ZERO nowych mechanik: konsumuje
    `content-motion.ts`, `content-config.ts`, `PaperBackdrop` (dryf
    `PAPER_BG_SPEED`, kontrakt e2e) i stopkę 4.1. Bez zwijanych
    akapitów (`grep -c 'cv(' = 0` jak w obsłudze) ⇒ CollapsibleText/
    `collapsible.ts` NIE wchodzą i nie ma zrzutu `*-full-open`.
  - **Navbar DOMYŚLNY** (eksport nie ma `navColor`/`logoCol`) i —
    PIERWSZA taka trasa widokowa — **BEZ `[data-navref]`**: strona nie
    ma hero, więc stan solid wchodzi na fallbacku
    `NAV_SOLID_FALLBACK_PX` (8 px) z 4.1. Kontrakt w e2e.
  - Struktura: nagłówek (mobile `--hdr-h + 4px` = eksportowe 96 px;
    desktop `--hdr-h + clamp(48,4.8vw,78)` — eksport mierzył od DOŁU
    paska w flow, nasz jest fixed), pasmo daty `#3A3428`, dokument
    (wstęp + spis + 9 sekcji), pas „PYTANIA O DANE" `#F1EBDD`.
    **Treść obu drzew eksportu jest identyczna co do znaku** (diff
    tekstu gałęzi `sc-if`) — różni się TYLKO miejsce akapitu wstępnego,
    więc idzie JEDEN markup na `grid-template-areas: "toc lead" "toc
secs"` (mobile: kolumna w kolejności DOM). Jedyna duplikacja
    dOnly/mOnly wynika z PLIKU, nie z treści: rycina gołębia.
  - **Spis treści = czyste kotwice** `<a href="#pp-NN">` +
    `scroll-margin-top: calc(var(--hdr-h) + 18px)` (bez tego nagłówek
    ląduje POD fixed paskiem — kontrakt e2e mierzy pozycję po
    kliknięciu na obu progach). Desktop: `position: sticky` z
    `top: calc(var(--hdr-h) + clamp(28px,2.8vw,44px))` i
    `align-self: start` (rozciągnięty grid-item nie ma po czym jechać).
    Eksportowy `jump()` skakał JS-em — port działa BEZ JS.
    **Świadome odstępstwo: bez `scroll-behavior: smooth`** — `smooth`
    na `html` przechwytuje każde programowe `window.scrollTo` (także
    w `scrollPageTo`/`revealSweep`), a długi płynny przejazd przechodzi
    przez heurystykę auto-hide paska. Przywrócenie = jedna reguła CSS
    - `scroll-behavior: auto !important` w `freeze.css`; baseline'ów
      nie rusza.
  - **Sloty antyscrapingowe z CZYTELNYM fallbackiem SSR** (decyzja
    Mateusza — odstępstwo od chrome'u): kotwice `a[data-tel]`/
    `a[data-mail]` w `.pp` NIE startują `hidden`, tylko z etykietą
    zastępczą („e-mail", „numer Maćka") i `href="/kontakt/"`;
    `fillContactSlots()` podmienia tekst i href. Pełnych ciągów w HTML
    dalej NIE MA (D-CH5 nienaruszony), a bez JS dokument prawny
    pozostaje spójny. Administrator jest w SSR zidentyfikowany nazwą,
    adresem, NIP-em i REGON-em.
  - **Treść 1:1 z designu**, uzupełniona o 4 decyzje Mateusza
    (placeholdery eksportu były świadomie puste): `[DOMENA]` →
    `pracownia-eha.pl`; **OBOWIĄZUJE OD 01.09.2026 / WERSJA 1.0**
    (ta sama data w chipie sekcji 09 — jedna stała);
    `[DOSTAWCA POCZTY E-MAIL]` → **The Camels**, serwery w Polsce
    (EOG), bez transferu poza EOG; retencja **5 lat / 12 miesięcy**.
    Plus jedna dopisana klauzula: karta Resend mówi „potwierdzenie…,
    jeśli podasz adres e-mail" (E9 = telefon LUB e-mail). Weryfikacja
    z kodem: `functions/api/kontakt.ts` nic nie utrwala (KV = licznik
    `quota:YYYY-MM-DD`), IP idzie do Turnstile jako `remoteip`,
    Web Analytics wchodzi w Etapie 6 — data 01.09.2026 tego nie
    wyprzedza.
  - Assety: **2 warianty jednego nowego pliku, ZERO fotografii** —
    `golab-poczt-rycina1-m.webp` (320 px, alfa q42/aq45, 40 KB, mOnly,
    `data-ryc="r"` + `data-plxr`) i `golab-poczt-rycina1.webp` (560 px,
    spłaszczona q45, 22 KB, dOnly, statyczna). Wzorzec `zuraw-rycina1`
    z 4.5 cz. 2; jeden wspólny plik z alfą ważyłby 98 KB.
    Korekta a11y (klasa 4.4/4.5, axe ZŁAPAŁ ją realnie): numery spisu
    `rgba(87,101,74,.9)` na pudle `#F3EDE1` dawały 4,34:1 przy mono
    11 px → pełny `var(--accent)` = 5,35:1 (ten sam token dostały
    numery listy praw); `WERSJA 1.0` `rgba(228,220,200,.6)` → `.72`;
    `SPIS TREŚCI` i `OSTATNIA AKTUALIZACJA` `.55` → `.65`.
    Allowlista axe dalej **PUSTA**.
  - JS widoku: skrypt strony **0,32 KB** + content-motion 2,2 KB
    ≈ **2,5 KB raw ponad chrome** — remis z obsługą o najlżejszy widok.
  - **LHCI: ten widok JEST bramkowany** (jeden z dwóch mierzonych
    URL-i). Pomiar lokalny (mediana z 3, main vs PR na tej samej
    maszynie): mobile perf 0,92 → **0,79** (budżet ≥ 0,80), LCP
    3305 → **4816 ms** (budżet 5000), total 470 → 611 KB, script 8 KB,
    TBT 0, CLS 0; desktop perf **0,99**/LCP 939 ms — wszystko
    z zapasem. **Cała różnica to FONTY, nie treść**: Lighthouse nie
    pobiera ŻADNEJ z rycin (obie `lazy`, pod zgięciem), a doszło
    5 plików (+188 KB): italik Garamonda latin+ext (134 KB — jeden
    cytat w sekcji 02), mono-500 latin+ext, mono-ext-600. Pozostałe
    trasy treściowe ładują te same 12 plików od 4.2; polityka po
    prostu jest MIERZONA. W tym samym przebiegu lokalnym `/` wypada
    GORZEJ (0,74/LCP 6025) i w CI przechodzi ⇒ polityka też powinna.
    **Progów NIE ruszano** — kandydat pozostaje ten sam co od Etapu 3:
    audyt subsetów (same `latin-ext` Garamonda = 199 KB na trzy polskie
    znaki), Etap 6.
  - Testy: `policy.spec.ts` (Etap 3, jeden profil desktop) — **uśpiony
    kontrakt 9 sekcji AKTYWNY** (skip przestał wchodzić), dołożone
    kontrakty treści niezależne od profilu: spis treści opisuje
    dokładnie te sekcje, które są (kotwica → istniejące `id`, etykieta
    = `h2`), pasmo daty wypełnione, **strażnik „zero placeholderów
    `[...]`"**. Nowy `polityka.spec.ts` (6 profili) — SSR bez JS
    (9 sekcji, karty 3+3, prawa 6, spis jako kotwice, sloty z
    fallbackiem), skok ze spisu pod paskiem, sticky + układ gridu
    desktop, brak `[data-navref]`/`[data-clp]`/`[data-plx]`/
    `[data-rycsb]`, sloty po JS, D-CH5 na surowym HTML, CTA, reveal,
    dryf tła, collectPageIssues, strażnik scrolla, breakpoint flip.
    Visual `polityka.spec.ts` na `usePreviewGuard` + wspólnym
    `revealSweep` (polityka-top / -full; fullPage timeout 20 s +
    per-shot 0.001). Trasa wycięta ze `skeleton.spec.ts` z baseline'ami
    `skeleton-polityka-prywatnosci-*` (24 pliki) — **w `ROUTES`
    została JEDNA trasa `/kontakt/`; plik znika w Etapie 5**.
    Bramki 2026-08-25: format/lint/typecheck/unit(80)/build/e2e(470)/
    visual `--ignore-snapshots`(120) zielone.
  - UWAGA: baseline'y `polityka-*` NIE istnieją — komplety
    linux+darwin generuje Mateusz (workflow z kontrolą intruzów →
    darwin na końcu; znani intruzi bot-commitów: `ekipa-top` SE,
    `index-full` SE/14, `work-index-full` SE — przywracać
    `git checkout <sha-przed-botem> -- <plik>`). **Pułapka złapana
    w tej sesji: `pnpm test:visual -- --ignore-snapshots` NIE przekazuje
    flagi**, więc Playwright DOPISAŁ 12 brakujących baseline'ów darwin
    (usunięte; żadne istniejące nie zostało ruszone). Filtrować
    wyłącznie przez `npx playwright test …`.
  - Baseline'y `polityka-*` KOMPLETNE (2026-08-25): 12 linux
    (workflow) + 12 darwin (top + full × 6 profili). Bot ruszył JEDNEGO
    intruza (`webkit-iphone-se/ekipa-top-linux`), a lokalny
    `test:visual:update` przepisał `webkit-iphone-se/index-full-darwin`
    — oba przywrócone z SHA ostatniego commita CZŁOWIEKA i zweryfikowane
    `cmp` bajt-w-bajt.
  - **KOREKTA skali znanego flake'a `index-full` SE**: zapis z 4.5 cz. 2
    („diff ≈ 1827 px = ratio 0.0008, rozsyp 1,2–6,3 px na wiersz")
    opisuje TYLKO jeden z jego przebiegów. W tej sesji ten sam zrzut
    przepisał się z różnicą **104 112 px = ratio 0.0457**, 1404 wiersze,
    do **227 px na wiersz przy szerokości 320** — czyli ZWARTE PASMA,
    które wg przepisu diagnostycznego czyta się jako „realna regresja
    layoutu". Regresji NIE BYŁO: wysokość dokumentu identyczna co do
    piksela (320×7124), a test w IZOLACJI przeszedł względem
    przywróconego baseline'u — czyli renderu `/` nic nie zmieniło
    (PR nie dotyka ani jednego pliku, od którego zależy `/`; jedyny
    wspólny to `ui.ts`, gdzie doszły same klucze `policyPage.*`).
    Mechanizm: transientny stan pętli ruchu (parallaxy `[data-plx]`
    kadrów) w momencie zszywania fullPage pod obciążeniem — pasma
    pokrywają się ze ZDJĘCIAMI, nie z tekstem. **Wniosek operacyjny:
    przy `index-full` SE gęstość pasm NIE rozstrzyga — rozstrzyga
    przebieg w izolacji. Nigdy nie przyjmować przepisanego baseline'u
    „bo ratio duże, więc pewnie realne".**
  - UWAGI dla Etapu 5 (/kontakt/): formularz E9 — 4 pola wszędzie
    (5. pole desktopu eksportu = pomyłka), walidacja alternatywna
    telefon LUB e-mail po OBU stronach, honeypot `readonly`, Turnstile
    leniwie (pierwszy `focusin`), podłoga `font-size: 16px` na mobile,
    `contact-ui.ts` ładowany ZAWSZE (funkcja, nie dekoracja);
    `functions/api/kontakt.ts` jest DZIŚ wersją odziedziczoną z delung
    (zawsze wysyła potwierdzenie na `data.email`) — przepisać pod E9,
    inaczej rozjedzie się z kartą Resend w polityce; sloty
    antyscrapingowe wg wzorca `.pp` (fallback czytelny) albo chrome'u
    (`hidden`) — rozstrzygnąć w mini-analizie kontaktu; po tym PR-ze
    `skeleton.spec.ts` znika razem z baseline'ami `skeleton-kontakt-*`.
- **Poprawki wizualne po 4.6 — WYKONANE** (2026-08-25, zgłoszenie
  Mateusza z telefonów; branch `feat/poprawki-wizualne`). Trzy korekty,
  ZERO nowych mechanik; dwie z nich UNIEWAŻNIAJĄ wcześniejsze
  rozstrzygnięcia opisane wyżej:
  - **Hero mobile: logo mierzone, nie szacowane** (zastępuje zapis
    z 4.2 „logo kurczy się budżetem wysokości"). Stary model liczył
    szerokość logo z formuły `(--svh − --hdr-h − 1208px + 190vw)`, czyli
    SZACOWAŁ wysokość reszty treści modelem liniowym wykalibrowanym na
    390 i 375 px; górny cap `clamp(234px, 33vw, 300px)` przy
    szerokościach telefonów redukował się do PŁASKICH 234 px. Każde
    urządzenie spoza kalibracji dostawało ZARAZEM za małe logo i pustkę
    pod CTA (zgłoszone z iPhone'a 15 Pro; Android był OK). Teraz
    `.hero-in` ma na mobile `justify-content: flex-end` (CTA kotwiczy
    się przy dolnym marginesie 44 px), a `.hero-logo` jest JEDYNYM
    rosnącym elementem kolumny (`flex: 1 1 0` + `aspect-ratio` z SVG,
    `min-height: 80px`, `max-height: min(248px, 63vw)`) — dostaje
    dokładnie tyle, ile przeglądarka naprawdę zmierzy. Cap dobrany
    pomiarem sepii logotypu na zrzutach Mateusza: stan docelowy = znak
    49,4 % szerokości ekranu ⇒ element ≈ 227 px przy 393 px (stan przed
    poprawką: 23,0 % ⇒ ≈ 106 px). Desktop NIETKNIĘTY (wraca
    `justify-content: center` i stała szerokość). D-Q2 zostaje: wysokość
    hero dalej liczy się z przypinanego `--svh`, więc chowany pasek URL
    nie rusza logo (kontrakt e2e przechodzi bez zmian). Stała
    `--logo-wh` usunięta — nie ma już czego mnożyć.
  - **Tło paska przeżywa otwarcie menu.** `overlay.ts` blokuje scroll
    przez `body{position:fixed;top:-scrollY}`, co ZERUJE `window.scrollY`
    i odpala `scroll` — handler przeliczał próg na pozycji 0 i gasił
    `[data-solid]` dokładnie w chwili otwarcia sheeta. Stan zamrożony
    flagą `sheetOpen` w skrypcie Navbara (deklaracja MUSI stać przed
    `onScroll` — pierwsze wywołanie leci przed sekcją menu, TDZ).
    Zamrażamy stan ZASTANY, więc na górze strony otwarcie menu dalej
    NIE zapala tła (oba kierunki w kontrakcie e2e).
  - **`tone="dark"` nie znika przy otwartym sheecie** (zastępuje zapis
    z 4.4 cz. 1 „przy otwartym sheecie ikona X wraca do atramentu"):
    `:not([data-open])` zdjęte z reguł tonu. Uzasadnienie się nie
    broniło — sheet to DOLNA szuflada, pasek zostaje nad ciemnym hero,
    w dodatku POD zasłoną `.sheet-ov` (z-index 100 > 50 paska), więc
    atramentowy znak lądował na ciemnym tle pod ciemną zasłoną. Nad
    papierem pasek ma w tym momencie `[data-solid]`, które i tak wyłącza
    ten wariant.
  - Testy: `home.spec.ts` — stary test „logo się skaluje" rozwinięty
    w describe z TRZEMA kontraktami (hero mieści się na niskim ekranie;
    CTA kotwiczy się 40–48 px nad dolną krawędzią; wyższy ekran = większe
    logo — wysokość ustawiana PRZED nawigacją, bo zmiana po załadowaniu
    przypina `--svh`). `navigation.spec.ts` — trzy nowe kontrakty
    chrome'u (tło przeżywa otwarcie menu / na górze się nie zapala /
    ton kremowy przeżywa otwarcie menu na `/obsluga-budowy/`).
  - **Zasięg baseline'ów (zmierzony, nie oszacowany)**: TYLKO `index-*`
    na profilach mobilnych — `webkit-iphone-14` i `chromium-pixel-5`
    (top + full). Desktop, `chrome-*` i wszystkie pozostałe trasy
    BEZ ZMIAN (fixy 2–3 nie ruszają żadnego istniejącego zrzutu: sheet
    fotografowany jest na `/realizacje/` u góry strony, bez solidu
    i bez ciemnego tonu). `webkit-iphone-se/index-top` też przeszedł
    BEZ ZMIAN — na 320×568 logo stoi na podłodze 80 px po obu stronach
    zmiany, a treść i tak przerasta pierwszy ekran; różnica na
    `webkit-iphone-se/index-full` (1674 px) to ZNANY flake tego zrzutu,
    nie skutek PR-a.
  - **Bot-commit ruszył 7 plików zamiast 4 — trzej intruzi, w tym JEDEN
    NOWY** (przywrócone z SHA ostatniego commita człowieka, `cmp`
    bajt-w-bajt):
    - **`firefox-desktop/kompetencje-full-linux` — NOWY intruz, dopisz
      do listy**: zmienił się sam WYMIAR dokumentu, 1920×**7355 →
      7354** (1 px na 7,4 tys.). Trasa niezwiązana ze zmianą, a 1 px to
      akumulacja zaokrągleń sub-pikselowych Firefoksa.
    - `webkit-iphone-se/ekipa-top-linux` — stary znajomy (5575 px
      w JEDNYM paśmie y 454–555, dokładnie tam, gdzie siedzi rycina).
    - `webkit-iphone-se/index-full-linux` — **flake w wersji „dużej":
      110 405 px = ratio 0,048**, 11 pasm, do 73 px/wiersz. Rozstrzyga
      NIE gęstość pasm, tylko dwa fakty: (1) `index-top` na SE bot
      ZOSTAWIŁ nietknięty, więc statyczny układ hero się nie zmienił;
      (2) wysokość dokumentu identyczna co do piksela (320×7124) —
      realna zmiana hero przesunęłaby całą stronę i zmieniła wysokość.
      Dwa z pasm (y 2978–3087 i 3199–3308) mają POZYCJE identyczne
      z darwinowym przebiegiem tego flake'a z PR-a polityki. To ta sama
      klasa zjawiska co zapisane wyżej 0,0457 — teraz potwierdzona
      także na linuksie.
      ⚠️ **SPROSTOWANIE (ta sama sesja, po przebiegu kontrolnym):**
      `webkit-iphone-se/index-full` NIE był tu czystym intruzem —
      przywrócenie go było BŁĘDEM, cofniętym. Szczegóły w lekcji niżej.
  - **LEKCJA: podłoga logo jako WYSOKOŚĆ vs SZEROKOŚĆ = mierzalny
    sub-piksel** (kosztowała jeden fałszywy alarm „to flake"). Objaw:
    po przywróceniu starego baseline'u `index-full`/SE przebieg
    kontrolny dał 3495 px (ratio 0,0015) i — kluczowe — **był czerwony
    TAKŻE W IZOLACJI**, czyli wypadł z definicji flake'a. Rozstrzygnął
    go **test przesunięcia o 1 px**, szybszy niż analiza pasm: diff
    liczony z przesunięciem `+1` spadał w pasmach do ZERA (1380 → 0,
    1258 → 0), czyli treść jest identyczna, a część strony jedzie o
    piksel niżej. Pomiar DOM na WebKicie 320×568 (`main` vs PR) podał
    przyczynę co do setnych: wysokość logo **79,984 → 80,000 px**
    (+0,016), hero 560,813 → 560,828, sekcja 01 652,813 → 652,828,
    wysokość dokumentu BEZ ZMIAN (7124). Powód: stara podłoga była
    podana jako SZEROKOŚĆ (`80px × proporcja` ⇒ wysokość 79,984), nowa
    jako WYSOKOŚĆ (równe 80). Przy dpr=2 te 16 tysięcznych piksela
    przewracają zaokrąglenie rastra i kilka wierszy tekstu ląduje 1 px
    niżej. Dotyczy WYŁĄCZNIE iPhone'a SE — jedynego profilu, na którym
    logo w ogóle stoi na podłodze.
    **Wnioski operacyjne:** (1) przy podejrzeniu flake'a na fullPage
    rób NAJPIERW test przesunięcia ±1 px — rozstrzyga w sekundy;
    (2) „czerwone w izolacji" wyklucza flake, nawet gdy ratio jest
    mikroskopijne; (3) zmiana wymiaru wiodącego (width ↔ height) przy
    `aspect-ratio` to realna zmiana renderu, nie kosmetyka.
  - **Próg `index-full` = 0.0025** (decyzja Mateusza; wariant B).
    `index-full.png` był JEDYNYM zrzutem fullPage w projekcie BEZ
    per-shot `maxDiffPixelRatio` — jechał na globalnym 0.0005, gdy
    wszystkie pozostałe fullPage mają 0.001–0.0025, i regularnie świecił
    na czerwono na webkit-iphone-se przy różnicach, których żaden inny
    widok by nie zgłosił (trzy sesje diagnostyczne: 4.5 cz. 2, PR
    polityki, poprawki po 4.6). Wartość = ta sama klasa co
    `*-full-open`; realna regresja layoutu na `/` to DZIESIĄTKI tysięcy
    px (0,02–0,05), więc próg jej nie przepuści. Globalny 0.0005
    w `playwright.config.ts` NIETKNIĘTY. Kandydat odkładany od 4.5 cz. 2
    — zamknięty.
- **Etap 5 (/kontakt/ + formularz E9) — WYKONANY** (kod 2026-08-25,
  infrastruktura 2026-08-26/27; mini-analiza i decyzje portu:
  `docs/analiza-kontakt.md`). **Formularz DZIAŁA na produkcji** —
  przetestowany oba warianty E9, klient potwierdził odbiór w skrzynce
  `eha@`. Zasoby i przebieg wdrożenia niżej (Faza A = bez klienta,
  Faza B = z klientem).
  - OSTATNI widok serwisu i jedyny z FUNKCJĄ. Warstwa wizualna =
    zwykły port w klasie 4.4–4.6: prefiks `.kt`, ZERO nowych mechanik
    (konsumuje `content-motion.ts`, `content-config.ts`,
    `PaperBackdrop` z dryfem `PAPER_BG_SPEED`, `Navbar tone="dark"`,
    stopkę 4.1). Bez zwijanych akapitów (`grep -c 'cv(' = 0`) ⇒
    `CollapsibleText`/`collapsible.ts` NIE wchodzą i nie ma zrzutu
    `*-full-open`. **`contact-motion.ts` NIE POWSTAŁ** (komentarz
    w `contact-ui.ts` odziedziczony z delunga był myślący życzeniowo —
    sprostowany): słownictwo eksportu (`rev`/`ryc`/`plxr`/`rycsb`/
    `bgRef`) pokrywa wspólny moduł treściowy.
  - **JEDEN markup na oba progi, bez duplikatów dOnly/mOnly treści.**
    Widok nie ma ani jednego bloku o różnej TREŚCI — różni się tylko
    KOMPOZYCJA (mobile: płaski stos sekcji; desktop: dwie kolumny,
    lewa = jedna sticky karta). Port robi to **`display: contents`**
    na `.kt-card`/`.kt-main` na mobile + `order` w kolejności eksportu
    (telefony → godziny → „napisz wiadomość" → e-mail → formularz →
    dane firmowe → pudło rejestrowe → social); na desktopie kontenery
    wracają do flexa i `order` przestaje działać. To samo zagnieżdżone
    na `.kt-reg` (mobile: bordowane pudło; desktop: `contents`, jego
    dwa panele wchodzą do karty). Warianty per-próg ograniczone do:
    mono-etykiety `E-MAIL` (dOnly), kreskowanej linii nad „napisz
    wiadomość" (mOnly) i par wariantów rycin.
  - **Sticky kolumna z doliczonym paskiem**: eksportowe
    `clamp(104px,8.6cqw,136px)` mierzył od góry kontenera z paskiem
    72 px W FLOW; nasz jest FIXED, więc
    `top: calc(var(--hdr-h) + clamp(32px, calc(8.6vw - 72px), 64px))`
    (przy 1440 = 123,84 px, czyli 1:1 z eksportem) + `align-self:
start` (lekcja spisu treści z polityki). Hero NISKIE
    (`clamp(230px,20vw,320px)` desktop / `--hdr-h + 4px` mobile),
    `[data-navref]` na hero, treść hero kotwiczona do dołu przez
    `grid-template-areas: "kick lead" / "title lead"`.
  - **DWIE pułapki designu potwierdzone liczbowo i NIE portowane**
    (E9): piąte pole desktopu (`04 · ZAKRES PRAC`) — wszystkie inne
    placeholdery występują w pliku 2×, ten 1×, więc to pomyłka; OPIS
    wraca na desktopie do numeru `04`, a w gridzie 2-kolumnowym
    zostaje po nim pusta komórka obok `03` (świadome — forma czyta się
    dobrze, bo `04 · OPIS` i tak idzie na całą szerokość). Druga: RODO
    renderowane jako pusty `<span>` 16×16 z ramką (nie `<input>`) —
    zostaje sama notka z linkiem do polityki. Obie gałęzie eksportu
    miały przy kwadraciku RÓŻNY tekst, co potwierdza niedopracowanie.
  - **Kontrakt pól przepisany pod E9** (`src/lib/contact-form.ts`):
    `name` / **`contact`** / **`place`** / `message` (+ `firma`,
    `elapsed`, `lang`, `cf-turnstile-response`). Pola `email`, `phone`
    i `temat`/`TOPICS` USUNIĘTE (formularz eha nie ma tematu, a
    polityka ich nie deklaruje). Nowe: `PHONE_RE` (po normalizacji
    opcjonalny „+" i 9–15 cyfr), `PLACE_MAX = 120`, **`classifyContact()`**
    — JEDNO źródło prawdy rozbioru pola 02 dla klienta i serwera;
    obsługuje też wpis mieszany („jan@x.pl, 600 000 000" → oba pola,
    `kind: "email"`). Lokalizacja OPCJONALNA (decyzja Mateusza).
    `buildNotifyEmail` niesie telefon / e-mail / lokalizację (brak =
    „—") i temat `[pracownia-eha.pl] {miejscowość}: zapytanie od {imię}`.
  - **`functions/api/kontakt.ts` pod E9**: odczyt `contact`/`place`,
    `reply_to` maila #1 = adres nadawcy ALBO `CONTACT_TO` przy samym
    telefonie (Resend odrzuca pusty Reply-To), **mail #2 wysyłany
    WYŁĄCZNIE gdy `data.email !== ""`**. To nie kosmetyka: karta
    „Resend" w sekcji 04 `/polityka-prywatnosci/` mówi „automatyczne
    potwierdzenie do Ciebie, **jeśli podasz adres e-mail**" — bez tej
    zmiany kod rozjeżdżałby się z opublikowanym dokumentem prawnym.
    KV dalej trzyma WYŁĄCZNIE licznik `quota:YYYY-MM-DD`.
    Warstwy antyspamowe NIETKNIĘTE (honeypot `readonly`, min-czas,
    Turnstile leniwie + `execute` przy submit, WAF, KV quota).
  - `contact-ui.ts`: `[data-f="email"]`/`#kt-email` →
    `[data-f="contact"]`/`#kt-contact`, walidacja przez
    `classifyContact`. Mechanika Turnstile/honeypotu/ekranu `.sent`
    bez zmian. **Komunikaty walidacji siedzą w SSR**
    (`<span class="kt-err">`, pokazuje je CSS przy `.err`) — zero
    tekstów w JS.
  - **Sloty antyscrapingowe: wariant „czytelny fallback"** (decyzja
    Mateusza — odstępstwo od chrome'u ORAZ od `.pp`): kotwice
    `a[data-tel]`/`a[data-mail]` renderują się widoczne, **BEZ `href`**,
    z etykietą zastępczą w `[data-slot]` („numer telefonu" / „adres
    e-mail"); `fillContactSlots()` podmienia tekst i dokłada `href`.
    Link do `/kontakt/` z polityki nie miałby tu sensu, a wariant
    `hidden` zostawiłby stronę kontaktową bez JEDNEJ danej. Stąd
    punktowy `eslint-disable astro/jsx-a11y/anchor-is-valid` (3 kotwice)
    i `<noscript>` tłumaczący, dlaczego numeru nie widać. D-CH5
    zweryfikowany na `dist`: 0 wystąpień numerów i maila.
  - Assety: **JEDEN nowy plik** — `kalamaz-rycina1-m.webp` (300 px,
    alfa q42/aq45, 29 KB; rycina widoczna na mobile MUSI mieć alfę —
    lekcja 4.2 §2a). Reużyte bez zmian: `telefon-rycina1(-m)`,
    `kalamaz-rycina1` (dOnly), `dom-ryc-house4`,
    `golab-poczt-rycina1(-m)` z 4.6, `koparka-rycina1` w stopce.
    **ZERO fotografii** (drugi taki widok po polityce) ⇒ zero
    `[data-plx]`. Rycina telefonu na ciemnym hero: desktop wariant
    spłaszczony z `invert(1) sepia(.3)` + `mix-blend-mode: screen`
    (wzorzec HomeKontakt), mobile wariant z alfą, sam `filter`.
  - GOTCHA złapana przy porcie: **rycina rysowana na OBU progach nie
    może być jednym elementem** z `data-ryc` i `data-rycsb` naraz —
    content-motion obserwuje oba atrybuty niezależnie i progi wejścia
    by się nawzajem wyprzedzały; `dom-ryc-house4` i rycina hero idą
    jako para mOnly/dOnly (wzorzec 4.5 cz. 2). Druga: sekcje BEZ tła
    muszą mieć na mobile `padding-inline` wewnątrz PEŁNEJ szerokości
    (a nie zwężoną skrzynkę) — inaczej `overflow: hidden` przycina
    ryciny na krawędzi kolumny tekstu zamiast na krawędzi ekranu.
  - Korekty a11y (klasa 4.4–4.6, axe ZŁAPAŁ obie realnie): etykiety
    MACIEK/ŁUKASZ w kaflach `rgba(245,239,227,.75)` na `#57654A` =
    3,87:1 przy mono 9,5 px → `.9` (4,78:1); linki do polityki w notce
    RODO i w paśmie dolnym były odróżnialne SAMYM KOLOREM
    (`link-in-text-block`; Tailwind preflight zdejmuje podkreślenie) →
    kreska `border-bottom` wzorem `.pp-link`. Allowlista axe dalej
    **PUSTA**.
  - JS widoku: skrypt strony **3,6 KB raw / 1,9 KB gzip** (zawiera
    CAŁY `contact-ui.ts` — logika ładowana ZAWSZE) + `content-motion`
    2,3 KB raw (import dynamiczny). **Turnstile NIE wchodzi do bundla
    wejściowego**: 0 wystąpień `challenges.cloudflare.com` w
    `dist/kontakt/index.html`, skrypt dociąga się przy pierwszym
    `focusin` (kontrakt w e2e). LHCI mierzy `/` i
    `/polityka-prywatnosci/`, więc budżetów ten PR nie rusza.
  - Testy: unit `contact-form.test.ts` PRZEPISANY pod E9 (warianty
    telefon / e-mail / oba / żadne, granice, honeypot, min-czas,
    higiena maili); nowy e2e `kontakt.spec.ts` (SSR bez JS z 4 polami
    i sensownym `method`/`action`, brak checkboxa RODO, brak
    `[data-clp]`/`[data-plx]`, honeypot `readonly` + `tabindex=-1`,
    D-CH5 na surowym HTML, sloty po JS, walidacja alternatywna na
    **deterministycznym zegarze** (`Date.now` z przesuwanym skewem —
    bez czekania MIN_FILL_MS), stub Turnstile + stub endpointu, ekran
    `.sent`, „wyślij kolejną", błąd `.kt-srv`, leniwy Turnstile,
    sticky kolumna, `tone="dark"` przez `expect.poll`, reveal, dryf
    tła, `collectPageIssues`, strażnik scrolla, breakpoint flip);
    visual `kontakt.spec.ts` na `usePreviewGuard` + wspólnym
    `revealSweep` (kontakt-top / kontakt-full; fullPage timeout 20 s +
    per-shot 0.001). `smoke.spec.ts` dostał asercję `.kt-form` + 4 pól
    i nowy kontrakt pól w sondzie POST.
  - **`tests/visual/skeleton.spec.ts` SKASOWANY** razem z baseline'ami
    `skeleton-kontakt-*` (24 pliki, `git rm`) — była to ostatnia trasa
    szkieletu. Plik znika z repo.
  - **Próg `index-full` podniesiony 0.0025 → 0.006** (decyzja Mateusza;
    stała `FULLPAGE_MAX_DIFF_RATIO` w `tests/visual/index.spec.ts`,
    globalny 0.0005 NIETKNIĘTY). Objaw: `webkit-iphone-se/index-full`
    czerwony w CI na 9923 px = 0.00435. Rozpoznanie przeprowadzone do
    końca, bo trzy zastane heurystyki dawały tu SPRZECZNE odpowiedzi:
    (1) render `/` z buildu gałęzi i z buildu `origin/main` na TEJ SAMEJ
    maszynie jest identyczny CO DO PIKSELA (0 różnic, 640×12272 — build
    main w osobnym `git worktree`), więc PR nie jest przyczyną;
    (2) actual z CI jest **bajt-w-bajt równy** zrzutowi z workflow
    baseline'ów, a dwa niezależne przebiegi nie powtórzyłyby losowego
    stanu — więc to NIE jest flake w rozumieniu „raz tak, raz siak";
    (3) poprzednie CI na main było z tym baseline'em ZIELONE, więc
    baseline nie jest przeterminowany. Rozstrzygnęły OGLĘDZINY pasma:
    tekst stoi piksel w piksel, przesuwa się WYŁĄCZNIE zdjęcie w tle —
    pętla parallaxu `[data-plx]` osiadła na innej klatce przy zszywaniu
    fullPage. Punkt osiadania zależy od obciążenia runnera, a to zmienia
    się przy KAŻDEJ zmianie składu zestawu wizualnego (tu: zniknął
    `skeleton.spec.ts`, doszedł `kontakt.spec.ts` → inny przydział na
    4 workerów). Stąd próg na całą klasę zamiast przyjmowania zrzutu
    bota: zapas do realnej regresji (0,02–0,05) zostaje 3–8×.
    ⚠️ **Uwaga interpretacyjna na przyszłość**: surowy diff tego zrzutu
    to 220 103 px, a Playwright raportuje 9 923 — liczy PERCEPCYJNIE
    (próg koloru), więc „liczba różnych pikseli" z własnego skryptu
    i liczba z logu Playwrighta to DWIE RÓŻNE metryki i nie wolno ich
    porównywać. Lekarstwo strukturalne (zamrożenie transformów
    `[data-plx]` przed zrzutem fullPage w `revealSweep`) unieważniłoby
    baseline'y wszystkich widoków z kadrami — kandydat na Etap 6.
  - **`/` zmienia się w buildzie, ale NIE w renderze** (sprawdzone przy
    powyższej diagnozie i przy fail'u LHCI): odkąd `kontakt.astro` jest
    DRUGIM konsumentem `PaperBackdrop`, Astro przenosi jego CSS
    z inline'owego `<style>` do już linkowanego `BaseLayout.css`.
    Lista skryptów `/` bez zmian, łączne bajty HTML+CSS 96 256 → 96 239
    (−17 B), render identyczny co do piksela. Przy każdym przyszłym
    czerwonym LHCI na `/` zaczynaj od tego porównania — hash
    `BaseLayout.*.css` MOŻE się zmienić bez żadnego wpływu na wynik.
  - Bramki 2026-08-25: format/lint/typecheck/unit(**86**, było 80)/
    build/e2e(**598 passed / 482 skipped**, było 485/457)/visual
    `--ignore-snapshots`(**126 z 156 zaplanowanych**, było 120 ze 150 —
    skeleton miał JEDEN test na trasę, kontakt ma dwa) zielone.
  - UWAGA: baseline'y `kontakt-*` NIE istnieją — komplety linux+darwin
    generuje Mateusz (workflow z kontrolą intruzów → darwin na końcu;
    znani intruzi bot-commitów: `ekipa-top` SE, `index-full` SE/14,
    `work-index-full` SE oraz `kompetencje-full` firefox-desktop —
    przywracać `git checkout <sha-przed-botem> -- <plik>`).
  - **FAZA A infrastruktury — WYKONANA** (2026-08-26; wszystko, co dało
    się zrobić bez klienta): - widget Turnstile **`eha-kontakt`** (Managed, hostname
    `pracownia-eha.pl` + `pracownia-eha-web.pages.dev`, bez
    pre-clearance; `localhost` CELOWO nie dodany — e2e stubuje
    `window.turnstile`); site key w repo
    (`contact-config.ts`, commit „feat(kontakt): real turnstile site
    key"), secret w zmiennych Pages jako `TURNSTILE_SECRET_KEY`
    (Production + Preview, Encrypt). - KV **`eha-kontakt-quota`** (id `0663ed39…`) + binding
    **`KONTAKT_KV`** w Pages (Production + Preview). - WAF strefy `pracownia-eha.pl`: reguła **`kontakt-form-burst`** —
    wyrażenie `(http.request.uri.path eq "/api/kontakt" and
http.request.method eq "POST")`, 3 requesty / 10 s, charakterystyka
    IP (na free jedyna, select wyszarzony), akcja Block 10 s.
    Reguła NIE obejmuje `pages.dev` (to nie jest strefa w koncie) —
    preview chroni sam bezpiecznik KV. - **Weryfikacja na produkcji** (2026-08-26): formularz → POST
    `/api/kontakt` → **502 `{"ok":false,"error":"send"}`** z logiem
    `kontakt: mail #1 nie wyszedł (HTTP 401)` — czyli Turnstile
    i secret DZIAŁAJĄ, wywraca się dopiero brak `RESEND_API_KEY`;
    klucz `quota:RRRR-MM-DD` w KV nalicza się poprawnie; seria POST-ów
    dała 3× 200 → 429 i sama puściła po 10 s (te z 429 NIE dotarły do
    Function — WAF tnie na brzegu). - **LEKCJE**: (1) `wrangler kv key list/get` w v4 czyta DOMYŚLNIE
    LOKALNY magazyn i pokazuje pustkę — do produkcji ZAWSZE
    `--remote`, inaczej wyciągniesz fałszywy wniosek „binding nie
    działa"; (2) `wrangler pages deployment tail` w trybie
    nieinteraktywnym wymaga ID deploymentu (`pages deployment list`),
    samo `--environment production` nie wystarczy; (3) `timeout(1)`
    nie istnieje na darwinie; (4) jednorazowy 502 od Cloudflare
    (HTML z `retry-after: 60`, „Host: Error") to NIE nasz kod —
    transient brzegu; nasz 502 jest zawsze JSON-em. Rozstrzyga
    `content-type` odpowiedzi. - Sonda diagnostyczna bez skutków ubocznych: POST z `elapsed=0`
    idzie ścieżką bot-trapa (200, przed Turnstile/KV/Resendem) —
    bezpieczne do testowania WAF-a; POST z pustym
    `cf-turnstile-response` i `elapsed>4000` daje 403 i dowodzi, że
    Function w ogóle wstaje.
  - **FAZA B infrastruktury — WYKONANA** (2026-08-26/27, z klientem
    na linii; klient potrzebny był w DWÓCH momentach po ~3 min:
    kliknięcie linku weryfikacyjnego i potwierdzenie skrzynki): - **Konto Resend** na `eha@pracownia-eha.pl` — osobne, zwykłe konto
    na hasło (NIE przez GitHub/Google, bo idzie do klienta w Etapie 7),
    **MFA/TOTP włączone** (Resend trzyma to w `Profile` → „Enable MFA",
    NIE w ustawieniach zespołu); hasło, Setup Key i recovery codes
    w menedżerze haseł Mateusza do rozliczenia w Etapie 7.
    ⚠️ **SPROSTOWANIE premisy z instrukcji wykonawczej**: plan free
    daje dziś **3 domeny na konto**, nie jedną (`Domains 0/3`,
    transakcyjne 100/dobę i 3000/mies.). Osobne konto zostaje mimo to —
    uzasadnia je WŁASNOŚĆ (Etap 7), nie limit. - **Domena `send.pracownia-eha.pl`**, region **EU (`eu-west-1`,
    Irlandia)** — region jest NIEODWRACALNY (zmiana = skasować i dodać
    od nowa). Apeks świadomie NIE dodany: `pracownia-eha.pl` obsługuje
    skrzynkę klienta w The Camels.
    **Custom Return-Path zostawiony na domyślnym `send`**, przez co
    wpisy MX/SPF siedzą na `send.send.pracownia-eha.pl` (podwójny
    człon — to POPRAWNE, nie literówka).
    **Tracking Subdomain CELOWO PUSTY**: śledzenie otwarć/kliknięć
    przepisywałoby linki i profilowało odbiorcę, czego opublikowana
    polityka prywatności NIE deklaruje (rozjazd kodu z dokumentem
    prawnym), a do tego psuje dostarczalność. - **Wpisy DNS** (Cloudflare, strefa `pracownia-eha.pl`; MX i TXT nie
    mają w ogóle przełącznika proxy — „DNS only" dotyczyłoby CNAME,
    o który Resend nie poprosił):
    `TXT resend._domainkey.send` = klucz DKIM (218 znaków),
    `MX send.send` = `feedback-smtp.eu-west-1.amazonses.com` prio 10,
    `TXT send.send` = `v=spf1 include:amazonses.com ~all`.
    ⚠️ **Pułapka nazwy DKIM**: w strefie `pracownia-eha.pl` wpisuje się
    `resend._domainkey.send`, a NIE `resend._domainkey` — to drugie
    utworzyłoby wpis na apeksie i weryfikacja by nie przeszła. - **Preflight i kontrola po zmianie** (`dig`, przed i po): apeks
    NIENARUSZONY — `MX 10 mail.pracownia-eha.pl`,
    `TXT v=spf1 a mx ip4:5.252.231.188 ~all`, `_dmarc` = `v=DMARC1;
p=none`. DMARC bez `sp=` i bez ostrego dopasowania ⇒ maile
    z subdomeny nie są odrzucane. DKIM porównany bajt-w-bajt
    z wartością z panelu Resenda. - **Klucz API** `eha-pages-kontakt` — uprawnienie **Sending access**
    (nie Full access), zawężony do `send.pracownia-eha.pl`; pokazuje
    się RAZ. Wartość → zmienna Pages **`RESEND_API_KEY`**
    (Production + Preview, Encrypt). - **Retry deployment** (`66c51568`, commit `a4caa08`) — zmienne Pages
    działają WYŁĄCZNIE od nowego builda. Objaw pominięcia: dalej
    `502 send` przy poprawnym kluczu. - **Testy realnej wysyłki** (oba warianty E9, log Function czysty —
    ZERO linii `console.error`):
    sam telefon → `200 {"ok":true}`, JEDEN mail na `eha@`,
    `replyTo: eha@` (brak adresu nadawcy), `E-mail: —` w treści,
    temat `[pracownia-eha.pl] Jelenia Góra: zapytanie od …`;
    e-mail → `200`, DWA maile, `replyTo` = adres nadawcy,
    `Lokalizacja inwestycji: —` i temat BEZ członu miejscowości.
    Licznik `quota:2026-08-26` naliczał każdą próbę (2 → 3 → 4). - **Potwierdzenie klienta**: wiadomości dotarły do skrzynki `eha@`,
    poza spamem. - **LEKCJA**: podgląd żądania w logach Resenda **zjada złamania
    linii** w polach `text` i `html` (widać to po tym, że OBA je tracą,
    choć kod skleja je `\n`) — nie diagnozować z tego „zlepionego
    maila"; prawdziwy układ widać dopiero w skrzynce odbiorcy.
  - UWAGI dla Etapu 6: JSON-LD `HomeAndConstructionBusiness` na
    `/kontakt/` (węzeł JEST w `jsonld.ts`, ale NIE jest renderowany) +
    geo i `@graph` na `/`; **Cloudflare Web Analytics — polityka JUŻ go
    deklaruje, więc TRZEBA go włączyć**; brand polish (favicon +
    `make-icons.mjs`); Search Console + sitemap; UptimeRobot; audyt
    subsetów fontów (kandydat wiszący od Etapu 3); ewentualne
    zacieśnienie LCP osobnym commitem.
  - UWAGI dla Etapu 7: 2FA konta CMS `pracownia-eha-cms` (celowo
    wyłączone do tej pory) na telefonie klienta; **przekazanie konta
    Resend** — hasło + Setup Key MFA są u Mateusza, przeniesienie MFA na
    telefon klienta bez resetu konta wymaga tego Setup Keya; backupy
    (Część D instrukcji). Konto Resend, domena i skrzynka są WŁASNOŚCIĄ
    KLIENTA — inaczej niż w delung (Etap 7 pkt 1).
- **Poprawki wizualne przed Etapem 6 — WYKONANE** (2026-08-27, zgłoszenie
  Mateusza po przejrzeniu produkcji; branch `fix/poprawki-wizualne-2`).
  Dziewięć korekt, ZERO nowych mechanik ruchu; trzy z nich UNIEWAŻNIAJĄ
  wcześniejsze rozstrzygnięcia zapisane wyżej.
  - **1. Detal realizacji otwiera się PROSTO z zajawki 02 na `/`**
    (UNIEWAŻNIA `docs/analiza-realizacje.md` §2 pkt 4 „karty zajawki NIE
    dostają deep-linków do detalu — zostają płaskie linki na
    /realizacje/"): kafle karuzeli mobile i polaroidy desktop klonują
    `<template data-work-detail>` do wspólnego `#work-detail` (modal
    ≥1024 / sheet <1024), dokładnie jak na `/realizacje/` i jak w
    delungu — `open-detail.ts` był na to przygotowany od początku
    (jego nagłówek mówi „współdzielony przez siatkę /realizacje/ **i
    zajawkę strony głównej**"). Na listę przenoszą WYŁĄCZNIE CTA
    „Zobacz wszystkie realizacje" (`zaj-out` desktop / `zaj-bar` mobile)
    i mobilny kafel-licznik „JESZCZE N".
    - **GOTCHA (nowa, kosztowałaby zakrytą nakładkę)**: templaty
      i `<WorkDetailOverlay />` MUSZĄ stać POZA `main.home` (są
      w `index.astro` po `<Footer />`, jak w `realizacje.astro`).
      `.home` ma `isolation: isolate` (PaperBackdrop), więc `.dt-ov`
      z `z-index: 100` trafiłby do JEGO kontekstu układania, a `.hdr`
      (`z-index: 50`, rodzeństwo `main`) malowałby się NA modalu.
      Delung renderował nakładkę wewnątrz sekcji — u nas by nie zadziałało.
      Pilnuje tego kontrakt strukturalny w `home.spec.ts`.
    - Kafel zostaje `<a href={WORK_INDEX_PATH}>`, a NIE `<button>` jak na
      `/realizacje/`: tam bez JS pełna lista leży tuż obok, więc martwy
      klik nic nie kosztuje, a tu `href` to jedyne dojście do treści.
      JS robi `preventDefault` DOPIERO po udanym otwarciu — stąd
      `openWorkDetail()` zwraca teraz `boolean` (zmiana addytywna,
      `realizacje.astro` ignoruje wynik). Modyfikatory (Cmd/Ctrl/Shift)
      przepuszczane — „otwórz w nowej karcie" działa.
    - Kontekst projnav/licznika = kafle zajawki („REALIZACJA 01 / 03"),
      z dedupem po slugu: mobile i desktop to DWA komplety tego samego
      zbioru (dOnly/mOnly), bez dedupu licznik pokazywałby 6.
    - Lista „pierwsze 3 po `order`" wyjechała do wspólnego modułu
      `home-realizacje-data.ts` — czytają go kafle (`HomeRealizacje`)
      i templaty (`index.astro`), więc kopie nie mogą się rozjechać.
    - Koszt zmierzony (`pnpm build` vs build `main` w worktree):
      `/index.html` 49 042 → 72 063 B raw (+23 KB, ~+3 KB gzip — trzy
      templaty detalu); JS `/` rośnie o `open-detail` 8 093 B raw /
      2 795 B gzip + 520 B skryptu zajawki, czyli ~7 → ~15,5 KB raw
      (budżet LHCI 40 KB). **LHCI mierzy `/`, więc ten PR rusza budżety
      strony głównej.** Obrazy z `<template>` NIE są pobierane (treść
      inertna) — zero kosztu dla LCP.
  - **2. Zamrożenie stanu paska na czas KAŻDEJ nakładki**
    (`Navbar.astro`, `onScroll` dostał na wejściu
    `if (sheetOpen || document.body.style.position === "fixed") return`).
    `overlay.ts` blokuje scroll przez `body{position:fixed;top:-scrollY}`,
    co ZERUJE `window.scrollY`; flaga `sheetOpen` z poprawek po 4.6
    wstaje TYLKO dla menu mobilnego, więc detal realizacji gasił papierowe
    tło paska (zmierzone: solid=true → false → true). Czytamy teraz wprost
    blokadę z overlay.ts, więc bramka obejmuje każdą nakładkę.
    **Drugi, groźniejszy objaw złapany przy okazji**: stara wersja
    aktualizowała `lastY = y` PRZED sprawdzeniem flagi, więc powrót z 0 do
    zapamiętanej pozycji przy zamknięciu dawał `d = +1337` — dla auto-hide
    „gwałtowny scroll w dół" — i pasek CHOWAŁ SIĘ tuż po zamknięciu
    modala. Menu tego nie ujawniało (auto-hide jest desktop-only, menu
    mobile-only). Stąd pełny early-return zamiast samego `setSolid`.
  - **3. Placeholder pola 04 · OPIS** na `/kontakt/`: „Dom przysłupowy
    z 1820 r., …" → „Opisz swój problem lub zadaj pytanie. Im więcej
    szczegółów, tym lepiej." **Świadome odstępstwo od eksportu**
    (decyzja Mateusza). Kontrakt pól i przepływ maili BEZ ZMIAN, więc
    przegląd `/polityka-prywatnosci/` NIE był potrzebny — polityka
    wylicza dane, nie teksty podpowiedzi.
  - **4. Wskaźnik bieżącej strony w navbarze desktop = PODKREŚLENIE**
    (SPROSTOWANIE zapisu z 4.1 „design nie ma wskaźnika aktywnej strony,
    aria-current zostaje dla a11y" — **ma go**, tylko Claude Design
    renderuje bieżącą pozycję jako `<a>` BEZ `href` i łatwo ją przeoczyć).
    Eksporty dają DWA warianty, zależnie od tonu paska:
    `realizacje.html` → `1px solid rgba(87,101,74,.6)`,
    `obsluga-budowy.html` / `kontakt.html` → `1px solid currentColor`.
    Miejsce na kreskę było zarezerwowane od 4.1 (`.nav-link` ma
    `border-bottom: 1px solid transparent`), tylko nigdy jej nie
    zapalono; zamiast tego port dał `color: var(--hdr-accent)` — ciemną
    zieleń, która na ciemnym hero praktycznie znikała (zgłoszenie
    z `/obsluga-budowy/` i `/kontakt/`). Kolor TEKSTU wraca do koloru
    paska; `currentColor` sam podąża za tonem, więc po wejściu w `solid`
    kreska wraca do zieleni bez dodatkowej reguły.
  - **5. Submenu „O NAS" było NIEWIDOCZNE na 5 z 8 tras** — wszystkich
    z `tone="dark"` (ekipa, kompetencje, tradycja, obsługa, kontakt).
    Przyczyna to PRZECIEKAJĄCY TOKEN, nie brak stylu: `.drop-link` brał
    `color: var(--hdr-ink)`, a wariant `tone="dark"` przestawia
    `--hdr-ink` na krem `#f5efe3` — na nieprzezroczystym panelu `#fffdf8`
    daje to **kontrast 1,06 : 1** (zmierzone). Lekarstwo przywraca token
    NA PANELU (`.nav-drop { --hdr-ink: #211d18 }`), a nie łata samego
    `.drop-link` — każda przyszła treść panelu dostaje poprawny kolor za
    darmo. Po zmianie 16,48 : 1 (pozycja bieżąca, zieleń: 6,14 : 1).
  - **6. Ryciny hero nachodziły na kicker „01 · EKIPA EH/A"** (mobile).
    NIE była to rycina sekcji 01 (`.ek-ryc` stoi 157 px niżej), tylko
    `.hr-m2`/`.hr-m3` z HERO — kotwiczone do DOŁU hero i celowo zeń
    wystające (`bottom: -92px` / `-70px`), więc ich odległość od początku
    sekcji 01 nie zależy od wysokości ekranu. Zmierzony najgorszy
    przypadek przez CAŁY przejazd scrolla (parallax `[data-plxr]` ±15 px):
    hr-m2 **−25 px**, hr-m3 **−2 px** na pięciu profilach telefonów.
    Lekarstwo: `.ek-txt` padding-top 74 → **106 px** (+32) — przesuwa się
    TREŚĆ, ryciny hero nietknięte (decyzja Mateusza: „podoba mi się, jak
    ta rycina jest osadzona"). Po zmianie zapas 8–11 px / 31–34 px;
    `.ek-duo` się nie kurczy, dokument rośnie o 32 px. Zmiana TYLKO
    w sekcji 01 — jest jedyną, nad którą stoi hero.
  - **7. Gołąb na `/kontakt/` mobile miał uciętą głowę.** Element wystaje
    44 px poza prawą krawędź (szer. 168 px, `right: -44px`), a
    `.kt-social` ma `overflow: hidden` — ekran ucinał prawe ~26 %
    rysunku, czyli dokładnie głowę z dziobem. Lekarstwo:
    `.kt-social-ryc.mOnly { transform: scaleX(-1) }` — gołąb leci w lewo,
    głowa ląduje w kadrze, a poza krawędź wychodzi skrzydło. Kompozycja
    i kotwiczenie BEZ ZMIAN. **Selektor MUSI mieć `.mOnly`**:
    `.kt-social-ryc` to klasa WSPÓLNA obu wariantów, a reguła desktopowa
    nadpisuje tylko right/top/width — pierwsza wersja odbiła też rycinę
    desktopową (złapane kontraktem e2e).
  - **8. Ryciny desktopowe `/kontakt/` ucinane od DOŁU** (kałamarz
    i gołąb). Sekcje `.kt-write`/`.kt-social` mają `overflow: hidden`,
    a ryciny są od nich WYŻSZE: kałamarz 254–292 px w sekcji 142–164 px
    (wystaje 101–114), gołąb 272–318 px w sekcji 211–245 px (75–94).
    `overflow` jest potrzebny na MOBILE (tam ryciny celowo wychodzą za
    krawędź EKRANU), a na desktopie żadna nie wystaje w bok — zwalniamy
    więc wyłącznie oś PIONOWĄ.
    - **GOTCHA**: para `overflow-x: hidden` + `overflow-y: visible` NIE
      zadziała — przeglądarka podmienia wtedy `visible` na `auto` i robi
      ze sekcji scroller. Musi być `overflow-x: clip`, które tego nie
      wymusza. Kontrakt e2e pilnuje, że strona nie dostała poziomego
      scrolla.
    - **`.kt-formsec` dostał `position: relative`** — to jest to
      „chowanie się za kontenerem": był `static`, więc jego tło malowało
      się w warstwie tła bloków, czyli POD absolutną ryciną; po zmianie
      oba są pozycjonowane z `z-index: auto` i decyduje kolejność drzewa
      (`.kt-write` wcześniej → rycina POD formularzem).
    - Gołąb schowka nie potrzebuje: pod `.kt-social` jest 195 px wolnego
      papieru do stopki, a wystaje 80 px (zmierzone: kończy się 109–123 px
      nad stopką). To istotne — stopka jest ciemna, a rycina ma
      `mix-blend-mode: multiply`, więc wjechawszy na nią po prostu by
      zniknęła.
  - **9. Tag „KONTAKT 7 DNI W TYGODNIU · BUDOWA PN–PT 8–16" zostawiał
    sierotę** — na `/kontakt/` I w zajawce 06 na `/`. Jeden ciąg ma
    326 px, a kolumna mobile 260–326 px: przy 375 px w drugim wierszu
    zostawało SAMO „16", przy 360 px „8–16", a przy 390 px stał dokładnie
    na styk (326 = 326), więc pękał od byle zmiany metryki fontu.
    Na `/` było gorzej — łamał się na KAŻDEJ szerokości mobilnej,
    a na desktopie 1366/1440 też zostawiała się sierota („8–16" i „16").
    Lekarstwo w obu miejscach: dwa człony z `white-space: nowrap`
    - kropka jako osobny `<span>`; mobile układa je w kolumnie, desktop
      skleja. Dzięki `nowrap` łamanie ZAWSZE wypada na kropce.
    * **GOTCHA specyficzności**: wyłączenie separatora musi iść przez
      `:not(.kt-tag-sep)` na regule blokowej, a NIE osobną regułą
      `.kt-tag-sep { display: none }` — ta ma (0,1,0) i przegrywa
      z `.kt-tag-hours > span` (0,1,1), przez co kropka zostawała jako
      TRZECI wiersz.
  - **10. Wskaźnik ładowania wideo w podglądzie realizacji** (zgłoszenie
    Mateusza: „widać tylko kadr, użytkownik myśli, że to zdjęcie").
    Przyczyna: `open-detail.ts` chował podpowiedź na zdarzeniu **`play`**,
    które leci NATYCHMIAST po wywołaniu `play()`, zanim spadnie choćby
    bajt. Zmierzone `play` → `playing` na pliku z R2 (throttling CDP):
    **0,65 s** bez ograniczeń (0,39 s przy ciepłym cache), **2,0 s** na
    Fast 3G, **7,5 s** na Slow 3G; do tego `waiting` W TRAKCIE filmu
    (3× na Fast 3G) — tam też nie było żadnego znaku.
    - Slajd podglądu ma teraz TRZY ROZŁĄCZNE stany: spoczynek
      („…, aby obejrzeć") → `is-loading` („POCZEKAJ, ŁADUJĘ WIDEO"
      - kropki) → `is-playing` (bez znaków). `play`/`waiting`/`stalled`
        uzbrajają, `playing` gasi, `pause`/`error`/`abort` wracają do
        podpowiedzi. Plakietka to TA SAMA co podpowiedź — podmieniamy
        treść, nie wprowadzamy nowego znaku wizualnego. Ikonka kamery
        zostaje widoczna przy ładowaniu (film jeszcze nie gra).
    - **Stany MUSZĄ być rozłączne**: `.is-playing` chowa CAŁĄ plakietkę,
      więc przy zacięciu w trakcie (`waiting`) wskaźnik byłby niewidoczny
      dokładnie wtedy, gdy jest najbardziej potrzebny — `armLoading`
      zdejmuje `is-playing` przed zapaleniem `is-loading`.
    - Trzy stałe w `work-config.ts` (importują je testy):
      `VIDEO_LOADING_DELAY_MS = 400` (próg zapłonu — zjada w całości
      przypadek „film w cache", gdzie wskaźnik w ogóle się nie pokazuje),
      `VIDEO_LOADING_MIN_MS = 600` (minimalny czas widoczności — przy
      progu 250 ms plakietka mignęła na **121 ms**, a migający komunikat
      jest gorszy niż jego brak), `VIDEO_LOADING_TIMEOUT_MS = 15 000`
      (bezpiecznik: iOS Low Power Mode potrafi odrzucić `play()` po
      cichu, bez `error` — plus `.catch()` na `play()`).
    - Kropki: TRZY osobne `@keyframes` o tym samym cyklu 1,2 s i różnym
      PROGU zapalenia (25/50/75 %). Jedna animacja + `animation-delay`
      NIE działa — delay przesuwa cały cykl, więc kropki gasłyby po
      kolei i w odwrotnej kolejności. Rysuje je `content: "."` z
      `::before`, bo między sąsiednimi `<b>` prettier wstawia białe
      znaki, które renderują się jako spacje („. . ." zamiast „...").
      Bez ruchu (reduce) kropki są WIDOCZNE i statyczne.
    - Zmierzone po zmianie: cache ciepły — wskaźnik NIE pokazuje się
      wcale; Fast 3G — 1448 ms; Slow 3G — 6725 ms; WebKit bez
      throttlingu — 645 ms (minimum zadziałało).
    - **Trzecie świadome odstępstwo od „mechanizm work 1:1"** (po
      klawiaturze ←/→ z E7 i `boolean` z `openWorkDetail`), addytywne:
      dochodzą listenery i klasa, przepływ otwierania/klonowania/
      nawigacji nietknięty.
  - Korekty a11y NIE były potrzebne — allowlista axe dalej **PUSTA**.
    Kontrast submenu poprawiony z 1,06 na 16,48 : 1 (pkt 5).
  - Testy: nowe kontrakty w `home.spec.ts` (detal z zajawki + kontrakt
    „nakładka poza main.home" + tło paska przeżywa otwarcie detalu +
    ryciny hero vs kicker 01 przez CAŁY przejazd scrolla + tag godzin
    06), `navigation.spec.ts` (kreska per ton, powrót do zieleni po
    solid, czytelność submenu na trzech ciemnych trasach),
    `kontakt.spec.ts` (tag godzin, odbicie gołębia per próg, sonda
    „ryciny wychodzą poza sekcję" + brak poziomego scrolla),
    `work-index.spec.ts` (wskaźnik ładowania na OBU progach + helper
    `showEntry`). Bramki 2026-08-27: format/lint/typecheck/unit(86)/
    build/e2e(**664 passed / 500 skipped**, było 598/482) zielone.
  - **LEKCJA: kruchy test na wyścigu z timerem.** Pierwsza wersja
    kontraktu wskaźnika asertowała „jeszcze nie zapalone" zaraz po
    `waiting` — zielona w izolacji, CZERWONA w pełnym przebiegu, bo
    ścigała się z timerem 400 ms. Przepisana na pomiar czasu WEWNĄTRZ
    przeglądarki (`MutationObserver` + `performance.now()`), który
    sprawdza faktyczny kontrakt „nie migamy". Trzy kolejne pełne
    przebiegi zielone. Wzorzec do reużycia przy każdym kontrakcie
    opartym na opóźnieniu.
  - **LEKCJA: zielony test wizualny NIE znaczy „baseline aktualny".**
    W tej sesji na 34 zmienione pliki tylko **10 świeciło na czerwono** —
    reszta to nieaktualna treść mieszcząca się pod per-shot
    `maxDiffPixelRatio`. Klasyczny przykład: placeholder pola OPIS
    zmienia ~1500 px na KAŻDYM z sześciu `kontakt-full`, ale desktopowe
    obrazy są 2–3× większe, więc ta sama różnica schodzi pod próg
    0.001 (limit dla 1920×2537 to ~4871 px). Zasięg trzeba mierzyć
    porównaniem render-do-renderu (build `main` w `git worktree` albo
    cofnięcie reguły przez `page.addStyleTag`), a nie listą czerwonych.
    ⚠️ Przy takim pomiarze: surowy diff kanałów ≠ liczba z logu
    Playwrighta (ta jest PERCEPCYJNA) — własne liczby mówią WYŁĄCZNIE
    „czy render się zmienił", nigdy „czy test zaświeci". I zawsze
    weryfikować szum bazowy dwoma identycznymi przebiegami (tu: 0 px).
  - **Zasięg baseline'ów: 34 pliki na platformę mają NIEAKTUALNĄ treść,
    ale realnie przepisanych zostało 10** — patrz lekcja o trybie
    `changed` niżej. Pełna lista tras, których render się zmienił
    (🔴 = przekroczyło próg i zostało zregenerowane):
    - `index-full` × 3 mobile 🔴 (pkt 6 — dokument +32 px, i pkt 9)
    - `index-full` × chromium-1366 (820 px) i firefox-desktop (887 px) —
      pkt 9, pod progiem
    - `kontakt-full` × 3 mobile 🔴 (pkt 3, 7, 9) i × 3 desktop (pkt 4, 8)
    - `kontakt-top` × chromium-pixel-5 🔴 (1722 px) i webkit-iphone-14
      (42 px, powtarzalne) — pkt 9; **webkit-iphone-se: 0 px, bez zmian**
    - `kontakt-top` × 3 desktop (pkt 4, 8)
    - `chrome-bar` × 3 desktop 🔴 (pkt 4)
    - `chrome-dropdown`, `work-index-top`, `work-index-full` × 3 desktop
      (pkt 4) — 9 plików
    - `obsluga-top`, `obsluga-full` × 3 desktop (pkt 4) — 6 plików
    - **ZERO plików**: pkt 1 i 2 (potwierdzone trzema pełnymi przebiegami
      wizualnymi) oraz pkt 10 — `.dt-hint-load` ma `display: none`,
      a oba zrzuty wideo są bezpieczne z definicji: `work-detail-video`
      fotografuje galerię (film nie gra), a `work-detail-fullscreen`
      klika PIERWSZY slajd, który regułą projektu zawsze jest zdjęciem.
  - **LEKCJA: `--update-snapshots` przepisuje TYLKO zrzuty powyżej progu**
    (Playwright 1.61, domyślny tryb `changed`). Workflow baseline'ów
    ruszył **10 plików z 34**, których render realnie się zmienił —
    dokładnie ten sam zbiór, który świecił na czerwono, i ANI JEDNEGO
    intruza. Pozostałe 24 zostają ze świadomym, drobnym długiem: ich
    różnice mieszczą się pod per-shot `maxDiffPixelRatio`, więc Playwright
    uznaje je za nieistotne percepcyjnie. **Nie forsowaliśmy
    `--update-snapshots=all`** — te 24 pliki ważą **43,3 MB na platformę
    (86,6 MB dla obu)**, a bloby PNG zostają w historii git na zawsze;
    to zła wymiana za różnice, których nikt nie zobaczy. Konsekwencja do
    zapamiętania: przy NASTĘPNEJ zmianie na tych trasach diff pokaże
    sumę starej i nowej różnicy — jeśli wyjdzie „za duży", sprawdź tę
    listę, zanim uznasz to za regresję.
  - **NOWY ZNANY INTRUZ: `kompetencje-full-open` na `webkit-iphone-se`.**
    Wyszedł dopiero w przebiegu kontrolnym po bot-commicie (11. czerwony
    obok oczekiwanych 10), a w IZOLACJI jest zielony w trzech kolejnych
    przebiegach — czyli flake wg definicji `testing.md`. To ta sama klasa
    co próg `FULLOPEN_MAX_DIFF_RATIO` podniesiony w 4.5 cz. 1
    (dwustanowa pętla parallaxu przy rozwiniętych akapitach), tyle że
    dotąd widziana na `webkit-iphone-14`. Trasa kompetencji NIE jest
    dotknięta żadną z poprawek tej sesji (zmierzony pasek nawigacji na
    niej: 0 px). **Przy `pnpm test:visual:update` sprawdzić, czy się nie
    przepisał, i przywrócić** — dopisz go do listy obok `ekipa-top` SE,
    `index-full` SE/14, `work-index-full` SE i `kompetencje-full`
    firefox-desktop.
  - **ZNANY, NIETKNIĘTY**: w podglądzie pełnoekranowym na desktopie
    plakietka nachodzi na przycisk `×` o 44 px — stan ZASTANY od 4.3
    (hint w spoczynku ma prawą krawędź na 1906 px i `×` też: 1862–1906),
    nie regresja tej sesji. Dotąd rzucało się w oczy rzadko (hint
    w podglądzie widać tylko po pauzie); od pkt 10 plakietka pojawia się
    przy każdym wolniejszym starcie. Lekarstwo = jedna reguła
    (`right: 64px` dla hintu w `.lb-media`); decyzja Mateusza odłożona.
  - UWAGI dla Etapu 6: LHCI mierzy `/`, a strona główna urosła o ~23 KB
    HTML i ~8 KB JS (pkt 1) — **odczytać budżety z pierwszego runa CI
    tego PR-a** i dopiero potem wracać do audytu subsetów fontów.
- **Etap 6 (SEO, pomiar, polish) — WYKONANY** (2026-08-27/29; branch
  `feat/etap6-seo`). Pięć pozycji kodowych; dwie z nich UNIEWAŻNIAJĄ
  zapisy wyżej, a jedna (fonty) była największym długiem projektu.
  - **1. JSON-LD podpięty.** Stan zastany zweryfikowany na `dist`:
    **0 wystąpień** `application/ld+json`, a `seo.spec.ts` miał
    strażnik ODWROTNY („JSON-LD nie występuje przed Etapem 6") —
    do wymiany, nie do dopisania obok. Teraz `/kontakt/` =
    `localBusiness()` (`HomeAndConstructionBusiness` + `geo`), `/` =
    `webSite()` (`@graph`: `WebSite` + samodzielna `Organization`),
    oba przez `<JsonLd slot="head" …>`. Pozostałe 6 tras: 0 węzłów
    (kontrakt).
    - **`geo`**: 50.973319, 15.675724 (Strzyżowiec 30 — współrzędne
      podał Mateusz; zaokrąglone do 6 miejsc ≈ 0,1 m, dalsze cyfry to
      szum odczytu z mapy). Liczby, nie ciągi.
    - **Bazą URL-i jest `Astro.site`, nie `Astro.url`** — świadome
      odstępstwo od wzorca canonicala w `BaseLayout`: `@id` to
      identyfikator firmy i musi być TEN SAM na produkcji, preview
      i w dev, inaczej `Organization` z `/` i firma z `/kontakt/`
      przestają być tym samym bytem.
    - Koszt zmierzony (build `main` w `git worktree`, ta sama maszyna):
      `/` 72 636 → 73 436 B raw (+800), gzip 12 988 → 13 288 (+300);
      `/kontakt/` 23 634 → 24 666 (+1032), gzip 7 133 → 7 564 (+431).
    - **Walidacja `validator.schema.org`: 0 błędów / 0 ostrzeżeń** na
      obu trasach. API zmieniło parametr — działa `POST` z polem
      **`html`** (nie `textValue`/`url`); `textValue` zwraca
      `fetchError: NOT_FOUND`, a nadużycie kończy się `429`.
    - ⚠️ **ZMIERZONE, nierozstrzygnięte**: walidator przy `@graph`
      z `publisher: {"@id": …}` raportuje **1 obiekt (sam WebSite)** —
      identycznie jak przy `publisher` zagnieżdżonym inline, czyli
      w wariancie, którego zakazuje lekcja D-E6. Bez `publisher` widzi
      **2 obiekty**. Wszędzie 0 błędów. Nie rozstrzygnięto, czy to
      zwijanie WIDOKU, czy utrata tripli — zrzut surowej odpowiedzi
      przerwał limit 429. **Decyzja Mateusza: zostawiamy `publisher`**
      (utrata realnej krawędzi semantycznej po to, żeby UI walidatora
      pokazał dwa kafelki, to zła wymiana). Kandydat do domknięcia.
  - **2. Ikony: „placeholdery z 19.08" to była NIEPRAWDA** (SPROSTOWANIE
    zapisu z Etapu 0 i `capture-scripts.md`). Uruchomienie
    `make-icons.mjs` bez zmian dało wyjście **bajt w bajt identyczne**
    z plikami w `public/` — to był już finalny wynik z prawdziwego
    wektora, tylko nikt go po Etapie 0.4 nie przejrzał. Wartość była
    w tym, CO w tych plikach jest:
    - **Kadr**: znaczek jest PODŁUŻNY (1,42:1), więc wpisany w kwadrat
      zostawiał **41 % pustej wysokości**, i to niesymetrycznie —
      marginesy 41/42 lewo-prawo, ale **81 górny wobec 129 dolnego**
      (render 512). Teraz przycięcie do bboxu tuszu + wyśrodkowanie
      z `ICON_PAD = 6 %`: marginesy **31/31/98/98**, znak z 83,8 % →
      88 % szerokości kadru.
    - **16 px = szara plama**: monogram jest włosowy, kreski schodzą
      poniżej piksela. Rastry **≤ `ICON_BOLD_MAX_PX` (32)** dostają
      obrys `ICON_BOLD_STROKE` (700 jednostek wewnętrznych svg);
      48/180/192/512 zostają WŁOSOWE. Kontener ICO trzyma osobne
      obrazki per rozmiar — dokładnie po to jest. Próg 32 px, bo przy
      dpr 2 przeglądarka bierze do zakładki obrazek 32 px i rysuje go
      w 16 CSS px.
    - **`public/favicon.svg` stał się GENERATEM** (było: bajtowa kopia
      `src/assets/logo/eha-logo-sign.svg`, dwa pliki bez powiązania).
      To nie kosmetyka: Chrome/Firefox/Safari wolą
      `rel=icon type="image/svg+xml"`, więc wykadrowanie samych rastrów
      dałoby INNĄ IKONĘ zależnie od przeglądarki. Skrypt przelicza mu
      sam `viewBox` (ścieżek nie rusza); SVG i `icon-512.png` mają ten
      sam kadr **z dokładnością do 1 px**. `eha-logo-sign.svg`
      (maska CSS Navbara i stopki) NIETKNIĘTY. Strażnik `GENERAT:`
      w `seo.spec.ts`.
      ⚠️ **Granica poprawki**: pogrubienie NIE dotyczy SVG (SVG nie zna
      rozmiaru docelowego), więc przy dpr 1 przeglądarka preferująca
      SVG dalej dostanie wersję włosową. Przy dpr 2 rysuje się w 32 px
      i jest czytelna. Domknięcie = osobny, cięższy wariant znaku,
      czyli decyzja projektowa — ODŁOŻONE.
    - Tło `og-image` → `#f5efe3` (token `--bg`; było `#f4f1ea`).
      `site.webmanifest`: `theme_color`/`background_color`
      `#ffffff` → `#f5efe3` — manifest został pominięty przy korekcie
      Etapu 4.2 (białe dawało biały pas na Androidzie).
    - Rozmiary: favicon.svg 22 279 → 22 157, favicon.ico 2 068 → 2 491,
      apple-touch 3 009 → 3 776, icon-192 3 109 → 4 063, icon-512
      7 611 → 10 738, og-image 6 687 → 6 720 B (razem +7,2 KB).
      Żaden z tych plików NIE jest na ścieżce krytycznej.
  - **3. AUDYT SUBSETÓW FONTÓW — dług wiszący od Etapu 3, zamknięty.**
    - Diagnoza: skan tekstu 8 tras + treści CMS pokazał, że z całego
      zakresu `latin-ext` (~800 znaków) serwis używa **DOKŁADNIE 16
      kodów** — polskich `ĄąĆćĘęŁłŃńŚśŹźŻż`, i niczego więcej
      (`←`/`→` są poza oboma zakresami, jak dotąd). Za te 16 glifów
      płaciliśmy **274 576 B** w sześciu plikach; sam `latin-ext`
      Garamonda (113 928 B) był **2,6× cięższy** niż jego `latin`.
    - Lekarstwo: `scripts/subset-fonts.mjs` (nowa devDependency
      `subset-font` — harfbuzz; wzorzec `sharp` w `optimize-images.mjs`)
      tnie te sześć plików do polskiego alfabetu. Generaty
      w `src/assets/fonts/` (**27 412 B**, commitowane) — w `src/`,
      a nie `public/`, żeby przeszły przez hashowanie Vite i dostały
      `immutable`.
    - `src/styles/fonts.css` (NOWY) — 9 WŁASNYCH `@font-face`. Kroje
      ZMIENNE nie mają w Fontsource wejść per subset, więc ich
      `index.css` wyleciał w całości; Plex Mono ma `latin-400/500/600.css`
      i dalej idzie gotowcem. **Zero polegania na kolejności kaskady** —
      dla każdego zakresu istnieje dokładnie JEDNA deklaracja.
      Deskryptory (`font-display`, zakresy wag, `unicode-range`)
      przepisane 1:1 z arkuszy Fontsource'a.
    - **GOTCHA Vite**: trzy subsety mono (2,6–3,4 KB) wpadły pod
      domyślny `assetsInlineLimit` (4096 B) i Vite wkleił je **jako
      base64 do CSS**, czyli ~11,5 KB bajtów kroju wylądowało
      w arkuszu BLOKUJĄCYM RENDER zamiast dogrywać się przez
      `font-display: swap`. Stąd `assetsInlineLimit` wyłączony dla
      `.woff2` w `astro.config.mjs` (pozostałe assety bez zmian).
    - **GOTCHA CSS**: `*/` wewnątrz komentarza (`@fontsource*/index.css`)
      zamyka komentarz — parser Tailwinda 4 wywraca build z mylącym
      „Unterminated string".
    - Pomiar (ciała odpowiedzi, `/`, mobile, ten sam build produkcyjny):
      fonty **457 780 → 210 616 B**, CSS **106 390 → 98 723**
      (Fontsource deklarował ~35 `@font-face`, my 12), dokument
      72 636 → 73 442 (JSON-LD), **razem 1 364 096 → 1 110 071 B
      (−254 025)**. Liczba żądań bez zmian (43). `dist`: **35 plików
      woff2 / 816 884 B → 12 / 210 616 B**.
    - LHCI lokalnie, oba buildy pod rząd na tej samej maszynie:
      `/` perf 0,74 → **0,81**, LCP 6019 → **4749 ms**, total 1123 →
      **881 KB**; `/polityka-prywatnosci/` perf 0,79 → **0,89**,
      LCP 4825 → **3456 ms**, total 611 → **369 KB**.
    - **ZASIĘG BASELINE'ÓW = ZERO, zmierzone TRZEMA drogami** (to nie
      jest przypadek „zielone, ale nieaktualne"):
      (1) metryki tekstu — szerokości `ĄĆĘŁŃŚŹŻ` przy wagach 400/800,
      100/700, 400/600 + italik, w chromium/webkit/firefox: identyczne
      co do TRZECIEGO miejsca po przecinku z buildem `main`
      (495,406 / 507,500 / 298,500 …); oś zmiennej wagi żyje;
      (2) rasteryzacja — 6 par (oryginał vs subset) × 3 silniki
      × 4 rozmiary (11/16/28/96 px) × wagi, dpr 2: **0 różnych pikseli,
      max delta kanału 0**;
      (3) pełny zestaw wizualny: 126 passed.
    - Kontrakt `tests/unit/fonts-subset.test.ts`: znak z `latin-ext`
      spoza subsetu w źródłach ALBO w treści z panelu = czerwony test
      z instrukcją. Bez niego taki znak narysowałby się krojem
      zastępczym i NIKT BY NIE ZAUWAŻYŁ (layout się nie wywraca).
    - Zakres znaków = **sam polski, świadomie**. Zmierzone rozszerzenie
      o czeski/słowacki: 27 412 → **40 844 B** (+13,4 KB) na scenariusz,
      który nie wystąpił, a strażnik i tak go złapie.
  - **4. Budżety LHCI — przejrzane w PR #21 BEZ ruszania progów; ratchet
    wszedł OSOBNYM commitem po zielonym CI (opis niżej, „Domknięcie
    Etapu 6").**
    - `main` po merge PR #20 był CZERWONY (run 33073106228): mobile LCP
      `/` **5446,77 ms** przy budżecie 5000, perf 0,77.
    - **Kluczowa liczba: wariancja runnera to ±1300 ms na LCP przy
      ZEROWEJ zmianie bajtów.** Run PR #20 (33071049182) i run `main`
      po merge mają `resource-summary` identyczne CO DO BAJTA
      (script 13 043, font 461 443, image 631 935, total 1 150 024),
      a dały FCP 1144 → 2308 i LCP 4153 → 5447. Każdy próg bliżej niż
      ~1,3 s od mediany zamieni bramkę w loterię — dlatego **LCP 5000
      zostaje**, mimo że mediana jest dziś dużo niżej.
    - `total ≤ 1,2 MB` miał przed tą sesją **4,2 % zapasu**
      (1 150 024 z 1 200 000); po audycie fontów ~25 %. Zapas ma
      pracować na Etap 7 — nie zacieśniamy.
    - **Warn `resource-summary:font:count ≤ 8` daje 12 od Etapu 4.2
      i nigdy nie zgaśnie**: subsetowanie tnie BAJTY, nie żądania;
      zejście do 8 = usunięcie kroju albo wagi, czyli zmiana designu.
      Ostrzeżenie, które świeci zawsze, przestaje być sygnałem.
    - KANDYDAT na OSOBNY commit po zielonym CI tej gałęzi: warn count
      8 → 12; NOWY error `resource-summary:font:size` ≤ 230 000
      (ratchet od zmierzonych 210 616 B, ~9 % zapasu); `numberOfRuns`
      3 → 5. W `lighthouserc.cjs` zmieniony WYŁĄCZNIE komentarz
      (`git diff` bez ani jednej linii z progiem).
  - **5. Polityka prywatności — przegląd PRAWNY, nie tylko data.**
    Zgoda Mateusza na modyfikację treści („byle prawnie jak najlepiej").
    - **Data rozdzielona na DWIE** (UNIEWAŻNIA zapis z 4.6 „OBOWIĄZUJE
      OD 01.09.2026 / WERSJA 1.0"). Pierwotna wartość leżała
      w PRZYSZŁOŚCI, a serwis przetwarza dane od **2026-08-26**
      (formularz na produkcji: Turnstile/WAF widzą IP, Resend wysyła
      pocztę), w Etapie 6 dochodzą Web Analytics i zgłoszenie sitemapy.
      Opublikowany dokument mówiący o sobie „jeszcze nie obowiązuję" to
      dokładnie ten rozjazd, którego ta strona ma nie dopuszczać.
      Teraz: `EFFECTIVE_DATE` = **25.08.2026** (dzień pierwszej
      publikacji — ZWERYFIKOWANY w gicie: commit `79d4842`, merge do
      `main`; data wcześniejsza byłaby fikcją, bo dokumentu nie było),
      `UPDATED_DATE` = **29.08.2026** (dzień redakcji; sesja stała dwa
      dni, więc wartość poszła za dniem realnego wyjścia zmiany),
      `VERSION` = **1.1**. Sekcja 09 obiecywała „istotne zmiany będą
      odnotowane nową DATĄ OBOWIĄZYWANIA" — co w tej konstrukcji byłoby
      nieprawdą, więc przepisana na numer wersji + datę aktualizacji.
    - **Wykaz danych statystyki był ZAMKNIĘTY i NIEPEŁNY.** Zdanie
      „Zliczane są **wyłącznie** odsłony, adresy podstron, kraj oraz
      rodzaj urządzenia i przeglądarki" pomijało trzy rzeczy, które
      Cloudflare Web Analytics realnie zbiera (zweryfikowane
      w `developers.cloudflare.com` + blogu wdrożeniowym, 2026-08-27):
      wymiary to **Country, Host, Path, Referer, Device type, Browser,
      Operating system, Navigation type** plus odsłony/wizyty,
      **page load time i Core Web Vitals**. Brakowało ODSYŁACZA
      (a to na nim liczą się „wizyty"), SYSTEMU OPERACYJNEGO
      i POMIARÓW SZYBKOŚCI. Dziś kierunek rozjazdu jest nieszkodliwy
      (deklarujemy coś, czego nie zbieramy) — po włączeniu Analytics
      stałby się szkodliwy. **Warunek konieczny dla zadania B6.**
    - **Prawo sprzeciwu wyodrębnione — art. 21 ust. 4 RODO** („jasno
      i ODRĘBNIE od wszelkich innych informacji"). Było pozycją 05
      w wyliczance sześciu praw, a całe przetwarzanie stoi na
      art. 6 ust. 1 lit. f. Teraz własny, wyróżniony akapit z opisem
      skutku sprzeciwu.
    - **Brak IOD powiedziany wprost — art. 13 ust. 1 lit. b** („jeżeli
      ma to zastosowanie"). Obowiązku nie ma (art. 37 ust. 1), ale
      milczenie czyta się jak przeoczenie.
    - **Termin odpowiedzi — art. 12 ust. 3**: „bez zbędnej zwłoki,
      najpóźniej w ciągu miesiąca".
    - **Retencja statystyki — art. 13 ust. 2 lit. a**: było odesłanie
      („zgodnie z ich politykami retencji"), jest liczba — pełne dane
      **7 dni**, potem tylko postać **próbkowana (~10 % zdarzeń)**.
      ⚠️ Cloudflare pisze „aggregated down to around 10%", co jest
      PRÓBKOWANIEM, nie agregacją — pierwsza redakcja tego zdania była
      nieścisła i została poprawiona.
    - Dopisane, dlaczego nie ma banera cookie (nic nie zapisujemy
      w urządzeniu — Cloudflare: „We don't use any client-side state,
      like cookies or localStorage"; „We don't «fingerprint»
      individuals via their IP address, User Agent string").
    - Zweryfikowane i NIEZMIENIONE: administrator z NIP/REGON,
      podstawy prawne per cel, odbiorcy, transfer poza EOG (SCC + DPF),
      retencja korespondencji, skarga do PUODO, dobrowolność, brak
      decyzji automatycznych, sloty antyscrapingowe (D-CH5).
  - **Testy**: unit **91 passed** (było 86 — doszły geo i cztery
    kontrakty subsetów); e2e — `seo.spec.ts` przepisany (strażnik
    odwrotny → 4 kontrakty JSON-LD + `GENERAT:` faviconu + kolory
    manifestu), `policy.spec.ts` +3 kontrakty (data nie z przyszłości,
    obowiązkowe elementy art. 13/21, kompletność wykazu statystyki).
  - **ZASIĘG BASELINE'ÓW: tylko `/polityka-prywatnosci/`, 9 z 12
    zrzutów czerwonych.** `polityka-full` × 6 profili (dokument urósł
    o 5 akapitów: 1366 4822→5179, 1920 5726→6168, SE 7519→8503 px;
    ratio 0,16–0,26) oraz `polityka-top` × 3 desktopy (2 385 / 11 131 /
    11 595 px). **`polityka-top` × 3 mobile przechodzi na ZIELONO, ale
    ma nieaktualną treść** — zmierzone przy progu zbitym do zera:
    **42–43 px** (stara data i „WERSJA 1.0"). Podręcznikowy przypadek
    lekcji „zielony ≠ aktualny". **Decyzja: `--update-snapshots=all`
    ZAWĘŻONE do `tests/visual/polityka.spec.ts`** — 24 pliki (12 na
    platformę). `polityka-full` (~38 MB obu platform) i tak jest
    przepisywane, więc dołożenie `polityka-top` (**6,7 MB**) podnosi
    koszt trasy o 17 %; alternatywą była nieaktualna DATA DOKUMENTU
    PRAWNEGO w baselinie. Inna klasa decyzji niż odrzucone 86,6 MB
    z poprzedniej sesji. Fonty i ikony: zasięg ZERO (zmierzone).
  - **LEKCJA: pomiar „ile realnie się rozjechało" przez zbicie progu
    do zera.** Zamiast zgadywać, czy zielony zrzut ma aktualną treść,
    ustaw w specu na czas JEDNEGO przebiegu `maxDiffPixelRatio: 0`
    i `maxDiffPixels: 0`, odczytaj liczbę i przywróć plik (`git diff`
    na specu musi wyjść czysty). Żaden baseline nie jest przy tym
    ruszany. To jest tańsze i pewniejsze niż budowanie `main`
    w worktree.
  - **LEKCJA: `git worktree` + symlink do `node_modules` psuje build
    Tailwinda.** `pnpm build` w worktree wywraca się na sprawdzeniu
    zależności, a `npx astro build` przechodzi, ale utility w rodzaju
    `font-serif` nie powstają — strona renderuje się z domyślnym
    stosem Tailwinda. Objaw przy pomiarze: `getComputedStyle(h1)`
    zwraca `ui-sans-serif, system-ui…` zamiast Garamonda. Zanim
    porównasz cokolwiek z buildem `main`, SPRAWDŹ, że serwowana strona
    ma właściwe kroje.
  - **LEKCJA: port 4400 na maszynie Mateusza zajmuje `preview`
    delunga.** Pomiar poszedł przeciwko CUDZEJ stronie i dał bezsensowne
    liczby (w HTML był `KategorieSheets.css`, którego eha nie ma).
    Przy ręcznym `astro preview` zawsze zweryfikuj, CO serwuje port —
    np. `curl -s localhost:PORT | grep -o 'BaseLayout[^"]*css'`.
  - **Domknięcie Etapu 6 — panele, ratchet i DWA SPROSTOWANIA**
    (2026-08-29, po merge'u PR #21 jako `f92bf4e`).
    - **Panele WYKONANE**: Cloudflare Web Analytics (szczegóły niżej),
      Google Search Console — property **domenowa** `pracownia-eha.pl`
      zweryfikowana metodą „Dostawca nazwy domeny" (integracja
      Cloudflare'a dodała TXT sama, bez duplikatu; apeks ma teraz DWA
      rekordy TXT: SPF klienta + `google-site-verification=vwkgyDGE…`,
      MX/\_dmarc/`send.send` NIETKNIĘTE — zweryfikowane `digiem` przed
      i po), sitemapa `https://pracownia-eha.pl/sitemap-index.xml`
      przesłana; UptimeRobot — monitor **Keyword** („incident when
      keyword does NOT exist", fraza `Pracownia EH/A`, 5 min, alert na
      mail Mateusza). Świadome odstępstwo od instrukcji, która mówiła
      HTTP(s): keyword łapie dodatkowo „200, ale pusta strona" — przy
      buildzie statycznym realniejsza awaria niż padnięcie hostingu;
      fraza zweryfikowana w SUROWYM HTML (5 wystąpień na „/", m.in.
      w JSON-LD i `og:title`), więc nie wymaga JS.
      ⚠️ **Konto UptimeRobot zostaje przy Mateuszu** (alerty są dla tego,
      kto naprawia), inaczej niż Resend. Search Console założona na jego
      koncie Google obok `delung.pl` — klienta dodać jako WŁAŚCICIELA
      w Etapie 7 (`Ustawienia → Użytkownicy i uprawnienia`), nie
      przenosić property.
    - **SPROSTOWANIE 1 — Web Analytics był włączony od 2026-08-22, a nie
      „wchodzi w Etapie 6"** (unieważnia zapis w instrukcji wykonawczej
      §Etap 6 pkt 3 ORAZ moją diagnozę w pkt 5 wyżej). Witryna
      w panelu ma „Created 7 days ago" i „Automatic setup" — powstała
      razem z domeną w Etapie 1B. Realnym zadaniem Etapu 6 było
      **przestawienie trybu**: stało na **„Enable, excluding visitor
      data in the EU"**, czyli beacon NIE był wstrzykiwany odwiedzającym
      z UE. Dla serwisu PL-only znaczyło to, że nie zbieraliśmy
      praktycznie nic — te 12 odsłon w panelu to ruch spoza UE (boty).
      Po przełączeniu na **„Enable"** beacon pojawił się w 15 sekund.
    - **SPROSTOWANIE 2 — wniosek z A5 był ODWRÓCONY.** Pisałem
      „deklarujemy statystykę, której nie zbieramy" (kierunek
      nieszkodliwy). Prawda była gorsza: **zbieraliśmy** (choć śladowo,
      bo tylko spoza UE) **przy niepełnym wykazie danych** w
      opublikowanym dokumencie. Poprawka wykazu z pkt 5 nie była więc
      zapobiegawcza, tylko NAPRAWCZA — i dobrze, że weszła na produkcję
      PRZED przestawieniem trybu. Kolejność wyszła właściwa, choć
      z innego powodu, niż zakładałem.
    - **Beacon — zmierzone**: wstrzykiwany na `pracownia-eha.pl`
      i `www`, **NIE na `pages.dev`** (ruch z preview nie zaśmieca
      statystyk). `<script type="module">` z SRI, token jawny z natury.
      **28 467 B raw / 9 509 B gzip** (moje wcześniejsze „~6 KB" było
      błędne). **Zero wpływu na LHCI** — beacona nie ma w `dist`,
      a `lighthouserc*.cjs` mierzy `staticDistDir: "./dist"`.
    - **RATCHET budżetów** (osobny commit, decyzja Mateusza) na podstawie
      zielonego CI **run 33256736588**: mobile „/" perf **0,84** /
      LCP **4261 ms** / total **902 376 B**; `/polityka-prywatnosci/`
      **0,92** / **3341 ms** / **378 221 B**; desktop „/" **0,99** /
      888 ms, polityka **1,00** / 732 ms; fonty **214 267 B** (12 plików)
      na obu trasach. Wobec czerwonego `main` sprzed Etapu 6
      (run 33073106228): perf 0,77 → 0,84, LCP **5447 → 4261 ms**,
      total **1 150 024 → 902 376 B**. Ciekawostka o precyzji: z rozmiarów
      plików przewidywałem oszczędność 247 164 B, CI zmierzył **247 176 B**
      — różnica 12 bajtów.
      Zmienione TRZY rzeczy: warn `font:count` 8 → **12** (opis stanu),
      NOWY error `font:size` ≤ **230 000** (~7 % zapasu), `numberOfRuns`
      3 → **5** w OBU configach. **CELOWO nie ruszono `total`, `perf`,
      `LCP` ani `script`** — zapas na nich pracuje na treść klienta
      (okładki realizacji z R2 na „/") i na wariancję runnera; bramka
      padająca od zdjęć wgranych w panelu to scenariusz, przed którym
      ostrzega `testing.md`.
    - **NOWY ZNANY FLAKE: testy wideo są JEDYNYMI w e2e, które zależą od
      zewnętrznego CDN-a.** Pierwszy przebieg CI na `main` po merge'u
      (run 33258429686) dał `e2e` 1 failed / 673 passed:
      `work-index.spec.ts:553` i `:642` na `webkit-iphone-se`
      i `-14` czekały 15 s na klasę `is-playing`, a slajd stał na
      `is-loading` — czyli film z R2 nie ruszył. To NIE jest regresja
      Etapu 6: ten sam kod dał 676 passed 40 minut wcześniej na gałęzi
      (run 33256736588) i lokalnie, a żadna zmiana tej sesji nie dotyka
      mechanizmu work ani R2. `pnpm test:e2e` buduje treść PRODUKCYJNĄ,
      więc film pobiera się z `media.pracownia-eha.pl` — dokładnie ta
      klasa, przed którą ostrzega `testing.md` („zewnętrzna sieć =
      flaky"). Kandydat na Etap 7: przenieść trzy asercje odtwarzania za
      bramkę `CHECK_REMOTE_MEDIA` albo podnieść limit; wskaźnik
      ładowania (klasy `is-loading`/`is-playing`) da się testować na
      stubie, bez sieci.
    - **DWIE PUŁAPKI WERYFIKACYJNE, które kosztowały czas w tej sesji:**
      (1) **na Cloudflare Pages „HTTP 200" niczego nie dowodzi** —
      zmyślona nazwa `nie-ma-takiego-pliku-xyz.woff2` też zwraca 200,
      z 73 442 bajtami `index.html`; rozstrzyga `content-type` i rozmiar,
      a najlepiej to, co realnie ładuje przeglądarka. Przy okazji: stare,
      zahaszowane pliki fontów z poprzednich wdrożeń DALEJ odpowiadają
      200 (Pages trzyma assety poprzednich deploymentów) — nic ich nie
      referencjonuje, przeglądarka pobiera 12 właściwych plików;
      (2) **`grep -c` liczy LINIE, nie wystąpienia** — sitemapa
      w jednej linii dała „1 URL" zamiast 8, a regex `[a-z0-9.-]` na
      nazwach plików Vite nie trafiał, bo hash zawiera WIELKIE litery
      i podkreślenie (`D-uohVev`, `KM6_XOKs`). Obie pomyłki wyglądały
      jak awaria wdrożenia i nią nie były.
  - UWAGI dla Etapu 7: konto CMS `pracownia-eha-cms` — włączyć 2FA na
    telefonie klienta; **przekazanie konta Resend** (hasło + Setup Key
    MFA u Mateusza); backupy (Część D instrukcji); domknąć trzy
    świadomie odłożone sprawy: (a) kolizja plakietki z `×` w podglądzie
    pełnoekranowym desktop (`right: 64px`), (b) cięższy wariant znaku
    dla faviconu przy dpr 1, (c) ratchet budżetów LHCI po zielonym CI
    (font count 8 → 12, nowy font size ≤ 230 000, numberOfRuns 3 → 5).

## Dokumentacja

- Decyzje projektu (zapadłe — nie otwieraj na nowo):
  `docs/pracownia-eha-web-entrance-analysis.md` (E1–E14 + tabela §2).
- Instrukcja wykonawcza etapów: `docs/pracownia-eha-web-creation-process.md`
  (Część A: checklista; B: kroki; C: flow mediów klienta; D: backupy).
- Designy-referencje: `docs/design/README.md` + 8 plików HTML
  (breakpoint 1024 px, wzorce 390/1440; drugi próg 700 px w siatce
  realizacji).
