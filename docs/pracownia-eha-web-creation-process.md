# pracownia-eha.pl — proces stworzenia strony: instrukcja wykonawcza

> **Status:** INSTRUKCJA WYKONAWCZA (2026-08-19), zgodna z decyzjami
> E1–E14 z `pracownia-eha-web-entrance-analysis.md`. Dokument powstał
> w repo `delung-web`, docelowo przenosi się do katalogu projektu
> `~/Projects/eha/pracownia-eha-web` — celowo nie jest wpisany do
> `docs/README.md` tego repo.
>
> **Układ:** Część A = wersja skrócona (checklista). Część B = pełna
> instrukcja etapami (kod + kroki poza kodem, klik po kliku tam, gdzie
> trzeba). Część C = flow mediów dla klienta. Część D = backupy.
>
> **Podział ról jak przy delung.pl:** kroki „w kodzie" wykonuje Claude
> w sesjach w nowym repo; kroki „w chmurze" (panele GitHub / Cloudflare /
> The Camels / Resend) klikasz Ty. **Commituje wyłącznie Mateusz** —
> zasada przechodzi do nowego repo razem z blokadami
> w `.claude/settings.json`.
>
> **Założenie robocze (E2):** klient przekazuje login+hasło do panelu
> The Camels. Cała integracja domeny to WYMIENNA sekcja B.1B z punktem
> GO/NO-GO przed jedyną nieodwracalną akcją (zmiana NS). Jeśli klient
> odmówi dostępu — podmieniamy tylko sekcję 1B na wariant „klient klika
> wg instrukcji" (osobny dokument do wygenerowania wtedy).
>
> **Co można robić PRZED odpowiedzią klienta:** Etap 0 w całości,
> Etap 1A (repo + Pages na `pages.dev`), z Etapu 2 wszystko poza custom
> domenami `media.`/`auth.` (bucket, token, konto `eha-cms`, OAuth App,
> Worker na `workers.dev`, schemat, panel na localhost/pages.dev).
> Twardo od strefy CF zależą dopiero: custom domains Pages,
> `media./auth./send.`, Resend, Search Console.

---

## CZĘŚĆ A — WERSJA SKRÓCONA (checklista całości)

**Etap 0 — bootstrap repo (kod, dzień 1)**

- [ ] `~/Projects/eha/pracownia-eha-web` = kopia delung-web bez `.git`/generatów/baseline'ów/treści CMS
- [ ] Wycięcie: widoki delung (home/oferta/kategorie/proces/o-nas/contact-markup/polityka-treść), aparat kategorii, opinie, BackButton; **mechanizm work ZOSTAJE**
- [ ] Parametryzacja miejsc „delung" (lista §5 analizy)
- [ ] Tokeny „papier/atrament" + fonty (EB Garamond, IBM Plex Sans, IBM Plex Mono — Fontsource + preloady); logo EH/A z base64 → jeden SVG
- [ ] `routes.ts` — 8 tras 1:1 mobile/desktop (bez redirectów), strony-szkielety
- [ ] Pipeline obrazów: przemianowanie assetów (ASCII, scalenie dubli) + `optimize-images.mjs` → WebP; `paper-background` → mały tileable
- [ ] Ekosystem `.claude` przepisany (CLAUDE.md, settings, rules, skille)
- [ ] Świeży `docs/` (README-indeks + analiza + ta instrukcja; `docs/design/export` już jest)
- [ ] Zielone: `format:check`, `lint`, `typecheck`, `test:unit`, `build`; grep „delung" = 0

**Etap 1A — repo + „pusta" produkcja na pages.dev (bez domeny)**

- [ ] Repo GitHub `mateuszhadrian/pracownia-eha-web` (**publiczne**) + push
- [ ] Ruleset `main-protection` (PR + required check `quality`)
- [ ] Cloudflare Pages: connect, `pnpm build`/`dist`/`NODE_VERSION=22` → `pracownia-eha-web.pages.dev`

**Etap 1B — INTEGRACJA THE CAMELS (wymienna sekcja; wymaga dostępów)**

- [ ] Od klienta: login+hasło panelu The Camels (+ potwierdzenie dostępu do DirectAdmin)
- [ ] Inwentarz strefy DNS z DirectAdmin (komplet rekordów, zwłaszcza pocztowe — zapis do menedżera)
- [ ] DNSSEC: sprawdź; jeśli aktywny → wyłącz → czekaj na zdjęcie DS **zanim** ruszysz NS
- [ ] Strefa `pracownia-eha.pl` w Cloudflare — rekordy pocztowe przepisane RĘCZNIE 1:1 (DNS only); bez A/CNAME placeholdera
- [ ] **GO/NO-GO** → zmiana NS w The Camels → status Active → **test poczty `eha@`** (wyślij/odbierz + nagłówki PASS)
- [ ] Pages → Custom domains: `pracownia-eha.pl` + `www.pracownia-eha.pl`

**Etap 2 — CMS + media**

- [ ] R2: bucket `eha-media` (EU) + token (Object R&W, tylko ten bucket); custom domain `media.pracownia-eha.pl` + Image Transformations + CORS (po 1B)
- [ ] Konto GitHub `eha-cms` (mail `eha@pracownia-eha.pl`, collaborator Write, User-bypass Always w rulesecie — przez API)
- [ ] OAuth App „Panel treści — pracownia-eha.pl" + Worker `sveltia-cms-auth-eha` (sekrety, `ALLOWED_DOMAINS`) → docelowo `auth.pracownia-eha.pl`
- [ ] `config.yml` (z `site_domain`!) + `content.schema.ts` (trzy miejsca naraz; schemat §6.1 analizy: bez kategorii, galeria wariantowa, slug ASCII)
- [ ] Weryfikacja uploadu MP4 przez panel do R2 (w delung działało — plan B: pole URL)
- [ ] 6 testowych wpisów wg `DATA` designu **przez panel** + PRAWDZIWE filmy klienta (HandBrake, Część C)

**Etap 3 — testy/CI na szkielecie**

- [ ] Specy adaptowane do tras eha; helper `realizacje.ts` + `test.skip` (testy odporne na treść z panelu OD RAZU)
- [ ] Fixture wizualny eha (`tests/fixtures/realizacje`: ~5 wpisów, 1 z wideo) + `build:visual`
- [ ] Pierwsze baseline'y (kolejność NA ZAWSZE: kod → workflow linux → darwin na końcu)
- [ ] Budżety LHCI z pomiaru + zapas; required checks: `quality`+`e2e`+`lighthouse`; allowlista axe PUSTA

**Etap 4 — widoki (po jednym PR, pętla mini-analiza → implementacja → testy → baseline'y)**

- [ ] 4.1 Chrome: navbar (dropdown „O nas", **auto-hide**), menu bottom sheet z akordeonem, stopka (2 kolumny, 2 telefony, IG+FB, „NA GÓRĘ")
- [ ] 4.2 Strona główna (hero + 6 zajawek)
- [ ] 4.3 `/realizacje/`: siatka (próg 700) + paginacja/„pokaż więcej" + **port detalu i lightboxa z delung** (kadr `contain`, klawiatura) + wideo
- [ ] 4.4 `/ekipa-eha/` + `/kompetencje-i-technologie/` (wspólny wzorzec zwijanych akapitów)
- [ ] 4.5 `/tradycja-i-ekologia/` (diagram) + `/obsluga-budowy/`
- [ ] 4.6 `/polityka-prywatnosci/` (9 sekcji + sticky spis treści + DATA obowiązywania)

**Etap 5 — formularz + `/kontakt/`**

- [ ] Resend: **osobne konto klienta** na `eha@pracownia-eha.pl` + domena `send.pracownia-eha.pl` (DKIM/SPF) + API key
- [ ] Turnstile `eha-kontakt` (Managed; `pracownia-eha.pl` + `pracownia-eha-web.pages.dev`)
- [ ] KV `eha-kontakt-quota` + binding `KONTAKT_KV`; Pages env `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` (Prod+Preview)
- [ ] Reguła WAF `kontakt-form-burst` (3 POST-y/10 s na `/api/kontakt`)
- [ ] Kod: 4 pola (E9), „telefon LUB e-mail" (auto-potwierdzenie tylko przy e-mailu), notka o polityce zamiast checkboxa; testy antyspamu

**Etap 6 — SEO/pomiar/polish**

- [ ] `favicon.svg` (wektor logo EH/A) → `make-icons.mjs` (komplet ikon + og-image)
- [ ] JSON-LD: `/kontakt/` = `HomeAndConstructionBusiness` (BEZ tel/mail), `/` = `@graph` WebSite + samodzielna Organization
- [ ] Cloudflare Web Analytics (polityka JUŻ go deklaruje), Search Console + sitemap, UptimeRobot
- [ ] Fizyczny test na telefonach (checklista §B.6.6) + `/release-check`; przegląd budżetów (zacieśnienie = osobny commit)

**Etap 7 — umowa i przekazanie**

- [ ] Umowa (draft → prawnik): abonament managed, **kill-switch z uwzględnieniem tego, że DOMENA NALEŻY DO KLIENTA** (§B.7.1)
- [ ] Instrukcja panelu PL + flow mediów (Część C); 2FA `eha-cms` na telefonie klienta
- [ ] Przekazanie: panel, konto Resend, ewentualne hasła The Camels (jeśli zmieniane); szkolenie na żywo

---

## CZĘŚĆ B — PEŁNA INSTRUKCJA

### Etap 0 — bootstrap repo (kod, lokalnie)

**Cel:** działający lokalnie, „pusty ale żywy" projekt eha z całą
infrastrukturą delung i bez jego treści.

**0.1 Kopia projektu.**

```bash
mkdir -p ~/Projects/eha/pracownia-eha-web
rsync -a ~/Projects/delung-web/ ~/Projects/eha/pracownia-eha-web/ \
  --exclude .git --exclude node_modules --exclude dist --exclude .astro \
  --exclude test-results --exclude playwright-report \
  --exclude "tests/visual/__screenshots__" \
  --exclude "src/content/realizacje" \
  --exclude "tests/fixtures/realizacje" \
  --exclude docs \
  --exclude .claude/settings.local.json
cd ~/Projects/eha/pracownia-eha-web && git init && git checkout -b main
pnpm install && pnpm build   # sanity punktu wyjścia (pusta kolekcja = OK)
```

`docs/` delung zostaje w delung (`--exclude docs` chroni też istniejący
`docs/design/export` eha przed nadpisaniem). Utwórz świeży `docs/` z:
`README.md` (indeks statusów — konwencja delung/hadrianm),
`pracownia-eha-web-entrance-analysis.md`,
`pracownia-eha-web-creation-process.md` (ten plik). `docs/design/`
dostaje własny `README.md` (mapa plik→route + tabela przemianowań
assetów z 0.6). Eksporty przegląda się wprost z dysku; są referencją
WYGLĄDU I ZACHOWANIA, nie implementacji (zasada z §3 analizy).

**0.2 Wycinanie (w tej kolejności, po każdej grupie `pnpm typecheck`):**

1. Widoki delung: `sections/home/**`, `sections/oferta/**`
   (+ `KategorieSheets.astro`, `kat-sheets.ts`), `sections/proces/**`,
   `sections/o-nas/**`, markup `sections/contact/*` (mechanika
   formularza — `contact-ui.ts`, `contact-config.ts`, `functions/`,
   `lib/contact-form.ts` — ZOSTAJE do adaptacji), treść `PolicyPage`,
   strony-wrappery; `src/pages/*` → 8 szkieletów eha (0.5); trasa
   `/kategorie/` i jej redirect znikają całkiem.
2. Aparat kategorii: `src/lib/categories.ts`, w `work-data.ts` funkcje
   `workRail`/`categoriesWithWork` + typy kategorii (**`viewProject`
   zostaje** — kafel z pierwszej pozycji galerii), deep-linki filtrów
   w `open-detail`-konsumentach, testy kontraktu kategorii, pole
   `category` ze schematu (trzy miejsca naraz!).
3. **`sections/work/**` ZOSTAJE W CAŁOŚCI** (overlay `#work-detail`,
   `open-detail.ts`, lightbox, wideo, `WorkDetail*`) — skin i model
   danych do adaptacji w Etapie 4.3; `src/scripts/overlay.ts` bez zmian.
4. Treści/dane delung: `src/lib/opinie.ts` (eha nie ma sekcji opinii),
   `src/lib/jsonld.ts` (zostaje plik, dane do przepisania w Etapie 6),
   `src/assets/**` delung, og-image/ikony/`site.webmanifest`
   (placeholdery z logo EH/A do Etapu 6), `favicon.svg` delung.
5. `ui/BackButton.astro` + `src/scripts/back-link.ts` + delegacja
   w `BaseLayout` — kasujemy (w delung uśpione; eha nie ma
   wstecz-przycisków w designie).
6. `i18n/ui.ts` → odchudzony słownik eha (bez martwych kluczy delung).

**0.3 Parametryzacja** — konkrety wpisywane teraz:

- `astro.config.mjs`: `site: "https://pracownia-eha.pl"`.
- `package.json`: `name: "pracownia-eha-web"`, `test:smoke:prod` →
  `BASE_URL=https://pracownia-eha.pl`.
- `public/robots.txt`: `Sitemap: https://pracownia-eha.pl/sitemap-index.xml`
  (+ `Disallow: /admin` zostaje).
- `.github/workflows/prod-smoke.yml`: URL-e → `https://pracownia-eha.pl`.
- `.claude/settings.json`: allow `curl … pracownia-eha.pl`; blokady bez zmian.
- `src/lib/contact-form.ts`: `CONTACT_TO="eha@pracownia-eha.pl"`,
  `CONTACT_FROM_NOTIFY="Formularz pracownia-eha.pl
  <no-reply@send.pracownia-eha.pl>"`, `CONTACT_FROM_CONFIRM="Pracownia
  EH/A <no-reply@send.pracownia-eha.pl>"`, temat `[pracownia-eha.pl] …`,
  stopki/podpisy wg designu kontakt. Zmiany pól (4 pola, telefon-LUB-mail)
  → Etap 5 (tu tylko adresy/treści).
- `src/lib/contact-details.ts`: **DWA telefony** (+48 696 513 743
  MACIEK, +48 533 328 356 ŁUKASZ) + mail `eha@` — sloty per-osoba
  (`data-slot` rozszerzony); kontrakt antyscrapingowy e2e na SUROWYM
  HTML obejmuje oba numery i mail.
- `Navbar`/`Footer`/`LoadingOverlay`: logo EH/A (SVG z 0.4),
  © 2026 PRACOWNIA EH/A, social: Instagram
  `https://www.instagram.com/pracowniaeha/` **i Facebook**
  (`profile.php?id=61574396106209`) — inaczej niż delung, FB zostaje.
- `public/admin/index.html`: title „Panel treści — pracownia-eha.pl"
  (wersja Sveltii przypięta — odziedziczona 0.178.0; przy bump sprawdź
  changelog, procedura sondy binarium z analizy remontu panelu delung).
- `lighthouserc*.cjs`: progi na luźne wartości tymczasowe (realne
  budżety = Etap 3), komentarze z liczbami delung usunięte.

**0.4 Design tokens + fonty (E10).**

- Z eksportów wyciągnij paletę „papieru/atramentu" i typografię do
  `:root` w `global.css` (jedno źródło prawdy). Breakpoint projektu:
  **1024 px** (jak delung — bez zmian). Skalowanie desktopu z eksportów
  (`cqw`, mnożniki `--k`/`--w` w JS) przełóż na `clamp()`/tokeny —
  artefakty środowiska DC nie wchodzą.
- Fonty self-hosted przez Fontsource: **EB Garamond** (400/500/600
  + italiki 400/500), **IBM Plex Sans** (400/500/600), **IBM Plex Mono**
  (400/500/600). Decyzja robocza w tym kroku: pakiety variable vs
  statyczne wagi — test A/B na otwartym eksporcie z podmienionym
  `font-family` (wzorzec wyboru Archivo w delung). Preloady krytycznych
  subsetów latin/latin-ext w `BaseLayout` + bramka anty-FOUC zostaje.
  **Google Fonts z eksportów NIE wchodzi** (FOUC + polityka
  prywatności deklaruje wyłącznie Cloudflare/Resend).
- **Logo:** w każdym eksporcie siedzi jako ~258 KB base64
  (maski CSS `.eha-logo-full`/`.eha-logo-sign`) — wyciągnij RAZ,
  zwektoryzuj/zoptymalizuj do jednego SVG (+ wariant „sam znaczek" pod
  ikony w Etapie 6); do repo wchodzi tylko zoptymalizowany plik.

**0.5 Routing.** `src/lib/routes.ts` — 8 tras: `/`, `/ekipa-eha/`,
`/kompetencje-i-technologie/`, `/tradycja-i-ekologia/`, `/realizacje/`,
`/obsluga-budowy/`, `/kontakt/`, `/polityka-prywatnosci/`. **Mobile 1:1
desktop — ŻADNYCH redirectów** (prostiej niż delung). Strony-szkielety
(nagłówek + stopka) dla wszystkich tras od razu — działająca nawigacja
przed treścią.

**0.6 Obrazy statyczne + porządek w assetach (E14).**

- Przemianowanie w `docs/design/export/assets/` PRZED optymalizacją:
  ASCII bez polskich znaków (`łukasz-test-portrait.png` →
  `lukasz-portrait.png`), bez członów „test", spójne rozszerzenia
  (`maciek-kroi.JPG` → `.jpg`), literówki (`haouse` → `house`),
  scalenie 4 par duplikatów bajt w bajt. Tabela stare→nowe do
  `docs/design/README.md` (referencje w eksportach HTML zostają
  po staremu — to tylko podgląd).
- Sekcje statyczne: `node scripts/optimize-images.mjs <src> <out.webp>
  [szer] [q]` → WebP w `src/assets/`; osobne warianty desktop/mobile
  tam, gdzie mobile wymaga odciążenia. **`paper-background.png`
  (2,2 MB, tło każdej strony i panelu) → mały tileable WebP** —
  najwyższy priorytet.
- Obrazy/filmy REALIZACJI nie idą do repo — od początku R2 + `imgAt()`
  (Etap 2); przed uploadem panelem też przepuść przez optymalizację
  (higiena: nie wgrywać > ~10 MB).

**0.7 Ekosystem `.claude`.** Przepisz `CLAUDE.md` (mapa eha, te same
zasady twarde 1–6, stan projektu od zera), `rules/` adaptowane:
`cms-realizacje.md` (schemat bez kategorii, reguła „trzy miejsca naraz"
zostaje), `testing.md` (kontrakt bez zmian koncepcyjnych + próg 700 px
siatki realizacji dopisany do kontraktów breakpoint), `sections.md`,
`scroll.md` (scroll natywny — bez zmian). Skille: `/test`,
`/release-check`, `/verify-mobile`, `/new-realizacja` (pola eha).
Hooki bez zmian (guard-realizacje, format-file, remind-tests,
stop-typecheck).

**0.8 Weryfikacja etapu:** `pnpm format:check && pnpm lint && pnpm
typecheck && pnpm test:unit && pnpm build && pnpm preview` — strona
szkieletowa działa; grep kontrolny:
`grep -ri "delung" src public functions .github .claude` → 0 trafień.

### Etap 1A — repo GitHub + „pusta" produkcja na pages.dev

**Cel:** pipeline produkcyjny żyje ZANIM powstanie treść — i zanim
klient odpowie w sprawie domeny.

1. **GitHub:** nowe repo `mateuszhadrian/pracownia-eha-web`
   (**Public** — świadoma decyzja E12, jak delung: ruleset egzekwowany
   za darmo; zero sekretów w repo), push main.
2. **Ruleset `main-protection`:** Settings → Rules → Rulesets → New →
   target `main`; Require a pull request + Require status checks:
   `quality` (komplet 3 checków dobijesz w Etapie 3). Od teraz praca
   wyłącznie feature branch → PR (daily workflow delung).
3. **Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to
   Git → `pracownia-eha-web`, branch `main`; preset **Astro**, build
   `pnpm build`, output `dist`, env `NODE_VERSION=22`. Save and Deploy
   → `pracownia-eha-web.pages.dev` serwuje szkielet.

### Etap 1B — INTEGRACJA Z THE CAMELS (wymienna sekcja)

**Cel:** `pracownia-eha.pl` wskazuje Pages, a poczta `eha@` działa BEZ
JEDNEJ MINUTY przerwy. Zasada nadrzędna: rejestracja domeny i hosting
poczty ZOSTAJĄ w The Camels — przenosimy wyłącznie obsługę DNS
(delegację NS) do Cloudflare.

> ⚠️ Jedyna nieodwracalna „na już" akcja w całej sekcji to krok 1B.5
> (zmiana NS) — wszystko przed nim można robić od razu po otrzymaniu
> dostępów, niczego klientowi nie psując. Rollback: powrót NS na
> serwery The Camels przywraca stan zastany (ich strefa zostaje
> nienaruszona — NIE kasuj jej po migracji).

**1B.0 Dostępy i pytania do klienta (checklista):**

- login + hasło do **panelu klienta The Camels** (zarządzanie domeną:
  nameserwery, DNSSEC) — pytanie już wysłane;
- dostęp do **DirectAdmin** hostingu (bywa osobne logowanie z panelu
  klienta — poproś o oba, jeśli są rozdzielone);
- na czym klient czyta pocztę `eha@` (webmail / telefon / Outlook) —
  do testu po migracji i do instrukcji przekazania;
- (już potwierdzone) poczta stoi na hostingu The Camels; jedyny adres
  to `eha@pracownia-eha.pl`; placeholder może zniknąć.

**1B.1 Inwentarz strefy DNS (DirectAdmin).** Zaloguj się do
DirectAdmin → sekcja **DNS Management** (nazwa może być „Zarządzanie
DNS"/„DNS Administration" zależnie od skórki). Zrób KOMPLETNY zrzut
wszystkich rekordów (zrzut ekranu + przepisany tekst do menedżera
haseł/notatek). Szczególna uwaga na pocztowe:

- **MX** `@` (host serwera poczty The Camels + priorytet),
- **SPF** (TXT `@`, zwykle `v=spf1 … ~all` ze wskazaniem serwera),
- **DKIM** (TXT `x._domainkey` — DirectAdmin generuje własny selektor;
  skopiuj klucz CO DO ZNAKU),
- **DMARC** (TXT `_dmarc`) — jeśli brak, dodamy własny `p=none` w CF,
- `mail.` / `webmail.` / `smtp.` / `pop.` / `imap.` (A/CNAME),
- `autoconfig.` / `autodiscover.` (CNAME/SRV — autokonfiguracja
  klientów pocztowych),
- pozostałe TXT (weryfikacje) i wszystko, czego nie rozpoznajesz —
  przepisz, wyjaśnisz później; lepiej przenieść za dużo niż za mało.

Rekordów A/CNAME kierujących `@`/`www` na hosting (placeholder
DirectAdmin) NIE będziemy przenosić — strona ma wskazywać Pages.

**1B.2 DNSSEC.** W panelu klienta The Camels przy domenie sprawdź
status DNSSEC. Jeśli **włączony**: wyłącz i POCZEKAJ na zdjęcie
rekordu DS z rejestru NASK zanim ruszysz nameserwery (kontrola:
DNSViz albo `whois pracownia-eha.pl` → „Unsigned"; panele potrafią
długo pokazywać „w trakcie"). Ta sama pułapka co OVH przy delung —
osierocony DS = SERVFAIL na całej domenie. Jeśli wyłączony: krok
odhaczony.

**1B.3 Strefa w Cloudflare.** Cloudflare → Add a domain →
`pracownia-eha.pl` (plan Free). Skan rekordów potraktuj WYŁĄCZNIE jako
podpowiedź — komplet przepisz ręcznie z inwentarza 1B.1 (skan gubi
zwłaszcza TXT/SRV/DKIM). Rekordy pocztowe **DNS only** (szara
chmurka!). Nie dodawaj jeszcze rekordów dla `media./auth./send.` —
wejdą w Etapach 2/5. Cloudflare pokaże parę nameserwerów do
ustawienia — zanotuj.

**1B.4 GO/NO-GO — checklista przed zmianą NS:**

- [ ] wszystkie rekordy pocztowe z inwentarza są w strefie CF (porównanie
      linia po linii), DNS only,
- [ ] DS zdjęty / DNSSEC był wyłączony,
- [ ] Pages działa na `pages.dev` (jest na co przełączać),
- [ ] klient uprzedzony, że placeholder zniknie (zaakceptowane),
- [ ] eksport/zrzut strefy The Camels zachowany (rollback + Część D).

**1B.5 Przełączenie NS.** W panelu klienta The Camels przy domenie:
zmiana serwerów DNS na parę z 1B.3 (opcja „własne serwery DNS").
Po propagacji strefa w CF przechodzi w **Active** (od minut do
kilkunastu godzin). Następnie:

1. **TEST POCZTY (najważniejszy krok):** wyślij mail NA `eha@` z
   zewnątrz i Z `eha@` na swój adres (webmail The Camels); w odebranym
   mailu sprawdź nagłówki: SPF=pass, DKIM=pass, DMARC=pass. Dopiero
   zielony test = migracja DNS uznana za udaną.
2. Pages → projekt → **Custom domains** → `pracownia-eha.pl` +
   `www.pracownia-eha.pl` (CF sam doda rekordy). Sprawdź
   `https://pracownia-eha.pl` → szkielet strony.
3. Eksport świeżej strefy CF (DNS → Export) do notatek (Część D).

**1B.6 Co dalej (nie teraz):** `media.` (Etap 2), `auth.` (Etap 2),
`send.` (Etap 5), TXT Search Console (Etap 6).

### Etap 2 — CMS (Sveltia) + media (R2) + logowanie klienta

**Cel:** panel `/admin` działa dla Ciebie i klienta, zdjęcia i wideo
lądują w R2, treści testowe wgrane ścieżką docelową (E13).

1. **R2:** Cloudflare → R2 → Create bucket `eha-media` (location **EU**
   — nieodwracalne) → po 1B: Settings → Custom domain
   `media.pracownia-eha.pl`. Włącz Image Transformations dla strefy
   `pracownia-eha.pl` („Resize images from any origin" wyłączone).
   CORS bucketu: `https://pracownia-eha.pl` + `http://localhost:4321`
   (GET/PUT/HEAD, ExposeHeaders ETag). **R2 API token** (Object Read &
   Write, scope tylko `eha-media`) → Account ID / Access Key ID /
   Secret Access Key do menedżera haseł.
2. **`imgAt()`/`videoFrameAt()`:** bez zmian koncepcyjnych — podmiana
   domeny na `media.pracownia-eha.pl`; test `media-r2`/`img` → nowy
   regex. Wideo bez transformacji (wprost z R2); miniatura filmu =
   klatka `/cdn-cgi/media/mode=frame` (jak delung po remoncie panelu).
3. **Konto techniczne `eha-cms`:** załóż konto GitHub (mail
   `eha@pracownia-eha.pl`; recovery codes do Twojego menedżera).
   W repo: Settings → Collaborators → add `eha-cms` (**Write**).
   W rulesecie **User-bypass Always dla `eha-cms` przez API** (lekcja
   delung: UI repo osobistego nie wyszukuje userów) — Sveltia commituje
   prosto na main, to jedyny legalny wyjątek. 2FA na telefonie klienta
   w Etapie 7.
4. **OAuth App** (konto `mateuszhadrian`): Developer settings → New
   OAuth App: name `Panel treści — pracownia-eha.pl`, homepage
   `https://pracownia-eha.pl`, callback `https://<worker>/callback`
   (docelowo `https://auth.pracownia-eha.pl/callback`). Client ID +
   Secret do menedżera.
5. **Worker auth (osobny dla eha):**

   ```bash
   git clone --depth 1 https://github.com/sveltia/sveltia-cms-auth /tmp/sveltia-cms-auth
   cd /tmp/sveltia-cms-auth
   # w wrangler.toml zmień name na: sveltia-cms-auth-eha
   npx wrangler deploy
   ```

   Variables and Secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
   (Encrypt), `ALLOWED_DOMAINS = pracownia-eha.pl,localhost`
   (+ czasowo, wąsko: `pracownia-eha-web.pages.dev` — usuń po
   podpięciu domeny; nigdy `*.pages.dev`). Po 1B: Custom domain
   `auth.pracownia-eha.pl` → popraw callback OAuth App i `base_url`
   w config.yml (**trzy miejsca spójnie**). Wpisz Workera do
   optional-todos (odświeżenie co 3–6 mies.).
6. **`public/admin/config.yml`:**

   ```yaml
   backend:
     name: github
     repo: mateuszhadrian/pracownia-eha-web
     branch: main
     base_url: https://auth.pracownia-eha.pl
     site_domain: pracownia-eha.pl   # bez tego localhost wysyła zły site_id (gotcha delung)
   media_libraries:
     cloudflare_r2:
       account_id: <ACCOUNT_ID>
       access_key_id: <ACCESS_KEY_ID>   # secret NIE wchodzi do repo —
       bucket: eha-media                # Sveltia pyta o niego w panelu
       public_url: https://media.pracownia-eha.pl
       prefix: "realizacje/"
       jurisdiction: eu
   slug:
     encoding: ascii
     clean_accents: true               # nazwy plików wpisów zawsze ASCII (lekcja delung)
   output:
     omit_empty_optional_fields: true
   ```

7. **Schemat kolekcji** — trzy miejsca naraz (`content.schema.ts` +
   `config.yml` + komponenty work), pola wg §6.1 analizy: `slug`,
   `order`, `title`, `place`, `year`, `paras[]` (min 1, hint
   „najlepiej 3 akapity"), `gallery[]` **wariantowa** (`types`/`typeKey`
   Sveltii: Zdjęcie {image, position?} ALBO Film {video, duration?};
   min 1; `.superRefine`: pierwsza pozycja MUSI być zdjęciem —
   komunikat pisany dla klienta + `hint` pod polem), `specs[]`
   {label, value} (min 1, hint „7 par jak w designie"). BEZ pól:
   `category`, `cover`, opis SEO. JSON-y pisze wyłącznie Sveltia
   (guard-hook + `.prettierignore`).
8. **Weryfikacja uploadu wideo (dawny spike):** wgraj przez panel
   testowy MP4 (~20 MB) → plik w R2, URL `https://media.pracownia-eha.pl/…`
   gra w `<video>`, range requests działają. W delung Plan A działał
   na tej samej wersji Sveltii — to weryfikacja, nie badanie. Plan B
   w odwodzie: pole `video` jako string z walidacją prefiksu.
   Pamiętaj: upload do R2 działa TYLKO przez pola edytora wpisu
   (globalny widok Assets = cichy no-op).
9. **Treści testowe = 6 wpisów wg `DATA` z `realizacje.html`**
   (place/year/title/paras/params gotowe w designie) **przez panel**:
   zdjęcia z eksportu (po optymalizacji 0.6, < 10 MB) + **prawdziwe
   filmy klienta** przygotowane presetem HandBrake (Część C) — E8.
   Przy pierwszym uploadzie panel poprosi o R2 Secret Access Key.
   Weryfikacja: `git pull` + `pnpm test:unit` (kontrakt CMS).

### Etap 3 — testy/CI na szkielecie

1. **Specy:** zostają `navigation`, `seo`, `a11y`, `policy`, `smoke`
   (adaptowane do 8 tras eha); specy sekcji powstają z widokami
   w Etapie 4 (`test.skip` na szkielecie tam, gdzie trzeba).
   Konfiguracja Playwright (6 profili), `assertPreview`, port 4399,
   maskowanie wideo — bez zmian. **Od pierwszego speca:** wpisy
   realizacji wyłącznie przez `tests/helpers/realizacje.ts`, testy
   zależne od liczby wpisów robią `test.skip` z powodem (lekcja
   incydentu delung 2026-08-06 — reguła jest już w kopii, pilnuj jej
   przy adaptacji).
2. **Fixture wizualny eha:** świeży `tests/fixtures/realizacje`
   (~5 wpisów z treści testowych, w tym 1 z wideo) — NIE synchronizowany
   z produkcją; `pnpm build:visual` przestawia `REALIZACJE_DIR`,
   strażnik `assertVisualFixture` bez zmian.
3. **Baseline'y:** darwin lokalnie (`pnpm test:visual:update` — za
   Twoją zgodą), linux workflowem `update-visual-baselines.yml`;
   kolejność NA ZAWSZE: kod → workflow linux → commit darwin na końcu.
4. **LHCI:** zmierz szkielet+home w CI, budżety **z zapasem na przyrost
   sekcji**; ratchet od tego momentu (podnoszenie tylko Twoją decyzją,
   osobne commity). Allowlista axe: PUSTA (kontrasty etykiet IBM Plex
   Mono na „papierze" rozwiązuj w tokenach, nie allowlistą).
5. **Ruleset:** required checks `quality` + `e2e` + `lighthouse`.
   Od teraz pełny daily workflow (feature branch → `/test` → PR →
   3 checki → merge → auto-deploy → prod smoke).

### Etap 4 — widoki (po jednym PR)

> **Tryb pracy (sprawdzony w delung):** każda część w OSOBNEJ, świeżej
> sesji Claude Code; przed implementacją mini-analiza `analiza-*.md`
> w `docs/` (decyzje portu z referencji); między częściami Mateusz
> testuje zmergowany widok (preview/produkcja/fizyczny telefon),
> poprawki osobnym promptem korekty. Pętla: mini-analiza →
> implementacja → testy unit/e2e/visual → baseline'y darwin+linux → PR.

**4.1 Chrome globalny.**

- Navbar wg designów: logo, pozycje Realizacje / Obsługa budowy /
  Kontakt + **dropdown „O nas"** (3 podstrony; toggle na KLIK, chevron,
  panel na „papierze"); **auto-hide**: chowanie przy scrollu w dół,
  powrót po ~60 px scrolla w górę LUB gdy kursor w górnej strefie
  ekranu; gotcha z designu: przy otwartym dropdownie strefa kursora
  jest rozszerzana, żeby nav nie uciekł spod otwartego panelu.
  E2E auto-hide od razu (scroll w dół chowa, w górę pokazuje, otwarty
  dropdown blokuje chowanie). Stała progu + `@media` w parze,
  kontrakt `expectBreakpointFlip`.
- **Menu mobilne = bottom sheet na `overlay.ts`** (markup w Navbarze,
  wzorzec delung): grabber, scrim, Esc, swipe-down (gest `touch*`
  z kopii — nie ruszać), kaskadowe wjazdy pozycji, **akordeon „O nas"**,
  stopka z dwoma telefonami MACIEK/ŁUKASZ przez sloty
  `contact-details.ts` (antyscraping!), hamburger→X.
- Stopka: 2 kolumny linków (O NAS / OFERTA), blok kontaktowy
  (2 telefony + mail przez sloty), IG+FB, NIP/REGON, polityka,
  „NA GÓRĘ ↑" (podpiąć — w eksporcie martwy `href="#"`). Stopka
  wchodzi też na `/realizacje/` (brak w eksporcie = niedoróbka, E14).

**4.2 Strona główna** (`index.html`): hero + 6 zajawek (ekipa,
realizacje, kompetencje, obsługa budowy, tradycja, kontakt) + stopka.
Ruch bez GSAP, za motion-gate `js-motion`: reveale `.rev`, „rysowanie"
rycin maską (port `.ryc` na czysty CSS + IntersectionObserver na
scrollu DOKUMENTU), parallaxy `.plx` (pamiętaj o preflighcie Tailwinda:
`img { max-width: 100% }` dławi zapasy > 100 % — lekcja D-U/D-W delung;
zapas kadru zamiast odsłaniania tła). Bez JS/reduce strona w pełni
statyczna. Najcięższa strona eksportu — obrazy zajawek przez warianty
WebP z 0.6, LCP pilnowane od pierwszego PR-a.

**4.3 `/realizacje/`** (najcięższy widok — dlatego zaraz po stronie
głównej; maksimum czasu na korekty po testach na telefonie):

- **Siatka kafli** z kolekcji (kafel = pierwsza pozycja galerii przez
  `viewProject`; place+year uppercase, tytuł): 1 kolumna → 2 kolumny
  przy **700 px** (drugi próg — do kontraktu breakpoint obok 1024).
- **Paginacja (E5):** SSR renderuje WSZYSTKIE kafle i WSZYSTKIE
  `<template data-work-detail>`; JS ukrywa kafle poza bieżącą stroną
  (desktop: paginacja) / poza licznikiem (mobile: „pokaż więcej").
  Bez JS = pełna lista (progressive enhancement). Rozmiar strony =
  odczyt z designu w mini-analizie. Projnav dostaje kontekst PEŁNEJ
  listy (do potwierdzenia w mini-analizie).
- **Detal:** port mechanizmu delung 1:1 (jeden overlay `#work-detail`,
  modal↔sheet przy 1024, klonowanie z `<template>`, `placeGal`,
  zamknięcie przy zmianie progu, projnav przejazdem za krawędź) —
  skin wg designu eha: modal 57 % zdjęcie / 43 % treść, sheet 90 %
  z grabberem, karuzela 4:3 scroll-snap (`scroll-snap-stop: always`)
  z kropkami i licznikiem. ⚠️ Znane twarde założenia portu: gap toru
  zaszyty w JS (`offsetWidth + 10`) — zsynchronizować ze skinem;
  kolejność `.dt` przed `.lb` w DOM; projnav zakłada panel ≤ 92vw.
- **Lightbox (E7):** mechanika delung (otwarcie tapem w kadr, mobile
  swipe-snap + chevron + swipe-down `touch-action: pan-x` + licznik,
  desktop strzałki/dashes/X, Esc capture'em zamyka TYLKO podgląd,
  powrót na oglądany kadr, fokus na kontener) z DWIEMA adaptacjami:
  (1) **kadr = całe zdjęcie, `object-fit: contain`** na czarnym pełnym
  ekranie (bez ramy 330/412; licznik mobilny na stały dolny pas;
  wideo też `contain` — filmy klienta mogą być pion/poziom);
  (2) **klawiatura ←/→** przełącza kadry w podglądzie ORAZ w galerii
  detalu na desktopie (wg designu; Esc-hierarchia bez zmian).
- **Wideo (E8):** flow delung bez zmian — `preload="none"`,
  `playsinline`, BEZ `controls`, ikonka kamery `[data-cam]` +
  podpowiedź `[data-cam-hint]` („STUKNIJ/KLIKNIJ, ABY OBEJRZEĆ" wg
  designu eha, oba warianty w SSR), tap w kadr startuje film i otwiera
  podgląd z grającym klipem, w podglądzie tap = pauza↔play, poster
  DWIEMA drogami (gotcha Chromium), miniatura = klatka ze środka.
- **E2E:** paginacja/„pokaż więcej" (odporne na liczbę wpisów), detal
  otwarcie/zamknięcie/projnav, lightbox (klawiatura!), wideo
  funkcjonalnie (`paused===false` bez sieci), gesty przez
  `Input.dispatchTouchEvent` (kontrakty z kopii delung). Visual: detal,
  lightbox, wideo pod maską (`video` + `.dt-poster`).

**4.4 `/ekipa-eha/` + `/kompetencje-i-technologie/`** (jeden wzorzec,
dwa PR-y): hero, sekcje treściowe, **zwijane akapity** („Czytaj dalej"
↔ „Zwiń", maska gradientowa) — wspólny moduł dla obu stron; mozaiki
kadrów, płyty tytułowe, „świadome granice" (ciemny blok). Biogramy
Łukasz/Maciek z portretami (przemianowane assety z 0.6).

**4.5 `/tradycja-i-ekologia/` + `/obsluga-budowy/`:** tradycja =
jedyna strona z **animowanym diagramem** (wjazd warstw + `scaleX`
strzałek — port na CSS za motion-gate) i efektem `.kolek`; obsługa
budowy = najlżejsza strona (hero + 3 sekcje + CTA).

**4.6 `/polityka-prywatnosci/`:** treść 9 sekcji z designu 1:1 (już
opisuje docelowy stack: Cloudflare Pages/WAF/Turnstile/Web Analytics +
Resend, brak cookies — NICZEGO w treści nie „poprawiać" bez decyzji),
spis treści ze skokami (desktop sticky pod `--hdr-h`), **wstawić datę
obowiązywania** (pasmo daty w designie puste), telefony/mail przez
sloty antyscrapingowe.

### Etap 5 — formularz kontaktowy + `/kontakt/`

1. **Resend (E4):** załóż **osobne konto klienta** na
   `eha@pracownia-eha.pl` (free plan = 1 domena/konto; Twoje konto
   zajęte przez hadrianm, konto delunga przez delung). 2FA + Setup Key
   i hasło u Ciebie do rozliczenia (przekazanie w Etapie 7). Domains →
   Add `send.pracownia-eha.pl`, **region EU** → w Cloudflare DNS
   rekordy wg wskazań Resend (MX feedback-smtp na `send.`, TXT SPF
   amazonses na `send.`, TXT DKIM `resend._domainkey`) — wszystko
   **DNS only**, rekordy głównej domeny (poczta The Camels!)
   NIETKNIĘTE → Verify → API key.
2. **Turnstile:** Add widget `eha-kontakt` (Managed), domeny
   `pracownia-eha.pl` + `pracownia-eha-web.pages.dev` → site key do
   `contact-config.ts`, secret do Pages.
3. **KV:** Create namespace `eha-kontakt-quota`; Pages → Bindings →
   KV `KONTAKT_KV` → namespace.
4. **Pages env (Production + Preview):** `RESEND_API_KEY`,
   `TURNSTILE_SECRET_KEY` (Encrypt).
5. **WAF:** reguła `kontakt-form-burst` — rate limiting 3 POST-y/10 s
   na `/api/kontakt` (jak delung; dzienny bezpiecznik siedzi w KV).
6. **Kod (E9):** widok `/kontakt/` wg `kontakt.html` (hero, split
   kontaktowy z dwoma telefonami przez sloty, formularz, dane firmowe,
   social). **4 pola wszędzie** (5. pole desktopu z eksportu = pomyłka,
   NIE portować): imię i nazwisko, **telefon LUB e-mail** (jedno pole),
   lokalizacja inwestycji, opis. Walidacja pola kontaktu po OBU
   stronach: poprawny telefon LUB poprawny e-mail, z czytelnym
   komunikatem; **auto-potwierdzenie (mail #2) wysyłane TYLKO gdy
   podano e-mail** — przy telefonie idzie samo powiadomienie do
   `eha@`. **Bez checkboxa RODO** — notka „Wysyłając wiadomość
   akceptujesz politykę prywatności" z linkiem (wzorzec delung).
   Warstwy antyspamowe z kopii bez zmian (honeypot + min-czas +
   Turnstile execute-przy-submit + WAF + KV quota + higiena treści).
   Potwierdzenie = stan `.sent` karty, błąd = `.kt-srv` (bez toastów).
7. **Testy:** e2e antyspam (deterministyczny zegar, stub Turnstile,
   readonly-honeypot), warianty telefon/e-mail/nic, prod-smoke
   formularza po deployu.

### Etap 6 — SEO, pomiar, polish

1. **Brand polish:** `public/favicon.svg` = prawdziwy wektor znaczka
   EH/A (odrys z logo; weryfikacja pixel-diffem wobec oryginału —
   procedura delung) → `node scripts/make-icons.mjs` (komplet ikon bez
   alfy + og-image 1200×630 z pełnym logo na „papierze"; pilnuj
   kompresji).
2. **JSON-LD** (`src/lib/jsonld.ts` — jedyne źródło danych firmy;
   celowo BEZ telefonu i maila — zasada D-CH5): `/kontakt/` =
   **`HomeAndConstructionBusiness`** (nazwa rejestrowa + marka, adres
   Strzyżowiec 30, geo, godziny „pn.–pt. 08–16", NIP, `sameAs` IG+FB);
   `/` = `@graph` z `WebSite` + SAMODZIELNĄ `Organization` (nie
   zagnieżdżać w `publisher`); walidacja `validator.schema.org` (RRT
   nie raportuje Organization na `/`).
3. **Cloudflare Web Analytics:** auto-injection w strefie (RUM w panelu
   strefy; beacon nie liczy się do budżetu skryptów) — polityka JUŻ go
   deklaruje, więc TRZEBA go włączyć (zgodność treści ze stanem).
4. **Google Search Console:** property domenowa `pracownia-eha.pl`
   (TXT w DNS) → Submit sitemap
   `https://pracownia-eha.pl/sitemap-index.xml`.
5. **Uptime:** UptimeRobot → HTTPS `https://pracownia-eha.pl`, 5 min,
   alert na Twój mail.
6. **Fizyczny test na telefonach** (emulacja NIE wykrywa): limit
   warstwy GPU Androida (karuzele/sheety/lightbox), iOS Low Power Mode
   (wideo na tap ma działać), zwijany toolbar Safari, zimny cache +
   realne łącze, dotyk fizyczny (snap karuzel, swipe-down sheetów,
   swipe lightboxa, auto-hide navbara przy scrollu palcem).
7. Data polityki prywatności wstawiona (jeśli nie w 4.6);
   `/release-check` przed ogłoszeniem klientowi; przegląd budżetów
   LHCI — zacieśnienie do zmierzonego baseline'u = osobna decyzja
   i osobny commit.

### Etap 7 — umowa i przekazanie

1. **Umowa** (draft z Claude → prawnik): zakres
   (projekt+wdrożenie+utrzymanie managed), abonament (hosting/utrzymanie
   na Twoich kontach Cloudflare/GitHub). **⚠️ RÓŻNICA WZGLĘDEM DELUNG —
   domena i skrzynka NALEŻĄ DO KLIENTA** (rejestracja i poczta w jego
   The Camels): kill-switch obejmuje deploy Pages, `ALLOWED_DOMAINS`
   Workera, collaboratora `eha-cms` i strefę DNS w Twoim CF — ale
   klient może w każdej chwili cofnąć delegację NS w swoim panelu.
   Opisać to w umowie uczciwie (dźwignia = kod, hosting i panel, nie
   domena); doprecyzować, czyje są konta Cloudflare/Resend/GitHub
   i warunki ewentualnej migracji po rozliczeniu.
2. **Instrukcja panelu dla klienta** (PL, nietechniczna, ze zrzutami):
   logowanie `eha-cms`, dodanie/edycja/usuwanie realizacji, zdjęcia,
   flow wideo (Część C), R2 Secret Key przy pierwszym uploadzie na
   nowym urządzeniu, zasada „pierwsza pozycja galerii = zdjęcie",
   czego NIE ruszać.
3. **2FA `eha-cms`** na telefonie klienta (TOTP); recovery codes u Ciebie.
4. **Przekazanie dostępów:** panel (`eha-cms`), **konto Resend
   klienta** (2FA na jego telefonie, Setup Key u Ciebie do pełnego
   rozliczenia), hasła The Camels — jeśli były zmieniane, oddać/
   potwierdzić z klientem (jego własność).
5. **Szkolenie na żywo:** wspólnie dodajecie realizację od zera
   (zdjęcia + film + teksty) i patrzycie, jak po ~2 min build
   publikuje ją na `pracownia-eha.pl`.
6. Po przekazaniu: wymiana treści testowych na docelowe (jeśli klient
   chce inne) — przez panel, w jego rękach, z Twoją asystą.

---

## CZĘŚĆ C — FLOW MEDIÓW DLA KLIENTA

### C.1 Zdjęcia

1. **Jednorazowo na iPhonie:** Ustawienia → Aparat → Formaty →
   „Najbardziej zgodne" (JPEG zamiast HEIC — transformacje Cloudflare
   nie przetworzą HEIC). Android domyślnie JPEG — OK.
2. Klient wgrywa zdjęcia prosto z telefonu/komputera przez panel
   (pola Zdjęcie → R2). Higiena: nie wgrywać plików > ~10 MB.
3. Kadr: pole `position` (opcjonalne) — pokazać na szkoleniu,
   „nice to have".
4. **Pierwsza pozycja galerii MUSI być zdjęciem** (to kafel listy) —
   panel tego nie zablokuje przy zapisie (walidacja per-pole Sveltii),
   pilnuje `hint` pod polem i komunikat builda; wpisać do instrukcji
   klienta wprost.

### C.2 Wideo — preset HandBrake „Pracownia EH/A – strona www"

Klient MA już filmy (E8) — pierwszą partię przygotowujecie wspólnie
w Etapie 2, przy okazji instalując mu HandBrake z wyeksportowanym
presetem (Presets → Export → `.json`):

- kontener MP4, **H.264** (x264), profil High, **web optimized /
  faststart ✔** (start odtwarzania bez pobrania całości),
- 1080p (downscale z 4K), 30 fps (albo „same as source" przy 24/25),
- **Dimensions → Anamorphic: None/Off** (etykieta zależy od wersji
  HandBrake — na Macu „Off"; = kwadratowe piksele, SAR 1:1;
  NIE „Automatic") —
  KRYTYCZNE: ekstraktor miniatur `/cdn-cgi/media` ignoruje flagę
  proporcji piksela, więc plik anamorficzny odtwarza się dobrze, ale
  daje ZGNIECIONĄ miniaturę (incydent z klipem testowym 2026-08-24 —
  diagnoza i naprawa ffmpeg w `.claude/rules/cms-realizacje.md`);
  Resolution Limit 1080p z „Optimal size" zostaje,
- jakość RF **22–23**, audio AAC 128 kbps (albo bez audio — na stronie
  start bez dźwięku),
- efekt: klip 20–30 s → zwykle 5–15 MB.

**Krok po kroku dla klienta:** przegraj film na komputer → HandBrake →
przeciągnij plik → preset „Pracownia EH/A – strona www" → Start →
gotowy `.mp4` przeciągnij w panelu do pozycji **Film** w galerii
realizacji (+ pole „Długość wideo", np. `0:24` — z niego liczy się
miniatura-klatka). Miniatury NIE trzeba robić — strona sama bierze
klatkę ze środka klipu.

### C.3 Ewolucja (gdy MVP uwiera)

Opcje automatycznej „wrzutni" identyczne jak w instrukcji delung
(Część C.3 tamtej instrukcji): folder-watchdog na Twoim Macu (0 zł) →
mini-wrzutnia Worker → Cloudflare Stream (płatne, najbardziej „samo
się dzieje"). Start = HandBrake; eskalacja tylko, jeśli klient
realnie wrzuca często i marudzi.

---

## CZĘŚĆ D — BACKUPY (przegląd; wdrożenie poziomu 1 wcześnie)

Inwentarz i poziomy identyczne koncepcyjnie z Częścią D instrukcji
delung — tu różnice i minimum:

- **Priorytet nr 1: media w R2** (`eha-media` = jedyna kopia; R2 bez
  wersjonowania): `rclone sync r2:eha-media ~/Backups/eha-media
  --backup-dir …` (cron/launchd albo ręcznie co tydzień; przy wideo
  ważniejsze niż przy zdjęciach). Sprzątanie sierot R2 (Sveltia nie
  kasuje mediów przy usuwaniu wpisu) PRZED porównywaniem rozmiarów.
- **Strefa DNS — tu WAŻNIEJSZA niż w delung:** eksport strefy CF po
  KAŻDEJ zmianie (DNS → Export zone file). Strefa w The Camels służy
  jako rollback tylko na początku — z czasem się zdezaktualizuje
  (send./auth./media./TXT GSC istnieją tylko w CF), więc jedynym
  wiarygodnym odtworzeniem jest świeży eksport CF. NIE kasować strefy
  The Camels, ale też NIE traktować jej jako aktualnej kopii.
- **Kod + JSON-y:** git (pełna historia na każdym klonie) + okresowy
  `git clone --mirror` na dysk zewnętrzny.
- **Rejestr konfiguracji** (nazwy bucketów/Workerów/env — bez wartości
  sekretów; wartości w menedżerze haseł) + procedura awaryjna „deploy
  gdzie indziej w < 1 h" — jak delung D.4 (strona statyczna; warunek:
  aktualny eksport DNS + kopia mediów).
- Poziom 2 (off-site: Actions cron + rclone → Backblaze B2 / restic)
  — do wdrożenia po starcie, wpis w optional-todos.

---

_Kolejny krok po akceptacji: sesja „Etap 0" w katalogu
`~/Projects/eha/pracownia-eha-web` (bootstrap + wycinanie +
parametryzacja) — można zaczynać NATYCHMIAST, plus Twoje kroki
z Etapu 1A (repo, Pages na pages.dev). Etap 1B rusza, gdy klient odda
dostępy do The Camels; w razie odmowy podmieniamy tylko sekcję 1B na
wariant „klient klika" (osobny dokument). Umowa (Etap 7.1) — osobna
sesja robocza w dowolnym momencie._
