---
paths:
  - "src/components/sections/**"
---

# Sekcje strony — gotchas

Sekcje eha powstają w Etapie 4 (po jednej, pętla mini-analiza →
implementacja → testy → PR) — mini-analizy per widok lądują w `docs/`.
Poniżej reguły wspólne odziedziczone z szablonu + gotchas jedynej sekcji,
która przeżyła kopię w całości (work) i mechaniki formularza (contact).

## Wspólne

- Moduły ruchu (`*-motion.ts`) ładowane DYNAMICZNIE tylko przy
  `prefers-reduced-motion: no-preference`; bez JS / przy reduce sekcja
  renderuje pełną, statyczną treść. Animacje eksportów (reveale `.rev`,
  „rysowanie" rycin `.ryc`, parallaxy `.plx`, diagram `.lay`) portujemy
  na CSS + IntersectionObserver za bramką `js-motion` — triggery zawsze
  na scrollu DOKUMENTU (scroll w kontenerze eksportów = artefakt).
- **BEZ GSAP i bez bibliotek scrolla** — ruch sekcji to własne pętle rAF
  i `IntersectionObserver` (wzorzec `work-motion.ts`); nie przywracaj
  bibliotek ruchu.
- Breakpoint projektu: **1024 px** (spójnie z designami — desktop ≥1024,
  mobile <1024). Testy importują stałą `*_DESKTOP_MIN_PX` z configu
  sekcji, a `@media` w `.astro` trzymamy z nią W PARZE (CSS nie
  zaimportuje stałej). **Drugi próg 700 px** dotyczy WYŁĄCZNIE siatki
  realizacji (1 kolumna → 2 kolumny; Etap 4.3) — do kontraktu breakpoint
  obok 1024. Progów 760/768/861 z wcześniejszych szablonów w kodzie
  nie ma.
- Warstwy testów po zmianie: `.claude/rules/testing.md`; sekcje dostają
  własne specy w `tests/visual/` razem z widokami (Etap 4).

## Work (`wk` / `dt`) — realizacje (mechanizm z szablonu, skin w 4.3)

- **eha NIE MA kategorii ani filtrów** (E5) — płaska lista + paginacja
  z designu: SSR renderuje WSZYSTKIE kafle i `<template data-work-detail>`,
  JS tylko ukrywa (desktop: paginacja, mobile: „pokaż więcej"); bez JS =
  pełna lista.
- Track karuzeli mobile wymaga `scroll-snap-stop: always` (bez tego szybki
  swipe przeskakuje kilka kafli naraz).
- **Parallax musi mieć zapas ≥ ruch** (lekcja D-U1 szablonu): element
  z `data-par` przesuwa się o `data-par × wysokość hosta`, więc obraz musi
  wystawać poza kadr co najmniej o tyle — zapasem jest albo skala
  (`s ≥ 1 + 2 × data-par`), albo wysokość (`top: -amt%` /
  `height: (100+2·amt)%`). Pamiętaj: preflight Tailwinda ma
  `img { max-width: 100% }` — bez `max-width: none` zapas powstaje tylko
  w pionie. **Testy wizualne tego NIE pilnują** — kafle realizacji są na
  preview pustymi ramkami; strażnikiem musi być sonda układu w e2e.
- Detal realizacji: JEDEN overlay `#work-detail` na szkielecie
  `overlay.ts` (`WorkDetailOverlay.astro`) — wariant modal (≥1024) ↔
  bottom sheet (<1024) to czysty CSS przy `WORK_DESKTOP_MIN_PX`;
  zmiana progu przy otwartej nakładce zamyka ją (miejsce galerii w DOM
  jest per-próg — `open-detail.ts`). Znane twarde założenia portu
  (pilnować przy skinowaniu w 4.3): gap toru zaszyty w JS
  (`offsetWidth + 10`), kolejność `.dt` przed `.lb` w DOM, projnav
  zakłada panel ≤ 92vw.
- Lightbox eha (E7): mechanika szablonu + DWIE adaptacje — kadr = całe
  zdjęcie `object-fit: contain` na czarnym pełnym ekranie (bez ramy;
  wideo też `contain` — filmy klienta bywają pion/poziom) oraz
  klawiatura ←/→ w podglądzie I w galerii detalu na desktopie.
  Esc-hierarchia bez zmian (podgląd → detal).
- Pozycja galerii to WARIANT: albo zdjęcie, albo film
  (`.claude/rules/cms-realizacje.md`). Pierwsza pozycja jest KAFLEM
  realizacji, więc musi być zdjęciem — `viewProject()` liczy z niej
  `cover`, dzięki czemu konsumenci kafla nie wiedzą o zmianie.
- Galeria detalu: zdjęcia przez `imgAt()`, wideo
  `<video preload="none" poster playsinline>` — miniaturą jest **klatka ze
  środka filmu** (`videoFrameAt()`), nie osobne zdjęcie. Klatka idzie
  DWOMA drogami: `<img class="dt-poster">` pod `<video>` i atrybut `poster`
  (ten sam URL = jedno pobranie). **Nie kasuj tego `<img>` jako duplikatu**:
  przy `preload="none"` Chromium nie pobiera plakatu NIGDY — zmierzone
  w szablonie na produkcji (Firefox 7/7, WebKit 1/1, Chromium 0/7),
  a `preload="metadata"` tego nie zmienia. Kadr wideo na zrzutach
  wizualnych jest pod maską — `.dt-poster` też musi tam być. BEZ
  `controls` i bez własnego znaku play: ikonka kamery `[data-cam]` oraz
  podpowiedź `[data-cam-hint]` („STUKNIJ/KLIKNIJ, ABY OBEJRZEĆ" — oba
  warianty w SSR, przełącza `@media`), tap w kadr galerii startuje film
  i otwiera podgląd pełnoekranowy (`[data-lightbox]`), w podglądzie
  tap = pauza↔play; odtwarzanie testuj funkcjonalnie w e2e.

## Chrome (navbar/stopka) — Etap 4.1

- Navbar eha ma AUTO-HIDE (E11): chowanie przy scrollu w dół, powrót po
  ~60 px scrolla w górę LUB gdy kursor w górnej strefie; przy otwartym
  dropdownie „O nas" strefa kursora jest rozszerzana (gotcha z designu —
  nav nie może uciec spod otwartego panelu). E2E auto-hide od razu.
- Menu mobilne = bottom sheet na `overlay.ts` z akordeonem „O nas";
  stopka sheeta: dwa telefony MACIEK/ŁUKASZ przez sloty
  `contact-details.ts` (antyscraping!).

## Contact (`kt`) — /kontakt/ (Etap 5)

- Mechanika formularza w `contact-ui.ts` (ładowana ZAWSZE — to funkcja,
  nie dekoracja); markup sekcji powstaje w Etapie 5 wg `kontakt.html`.
- Telefony i e-mail: sloty `a[data-tel="maciek|lukasz"]`/`[data-mail]`
  - `[data-slot]` wypełniane przez `fillContactSlots`
    (`src/lib/contact-details.ts`, wołane przez skrypt Navbara) — nie
    „upraszczaj" do jawnego `tel:`/`mailto:` w markupie (D-CH5).
- Pola wg E9: **4 pola wszędzie** (5. pole desktopu z eksportu = pomyłka):
  imię i nazwisko, **telefon LUB e-mail** (jedno pole, walidacja
  alternatywna po OBU stronach), lokalizacja inwestycji, opis.
  Auto-potwierdzenie (mail #2) TYLKO gdy podano e-mail. Bez checkboxa
  RODO — notka z linkiem do polityki.
- Honeypot jest `readonly` (autofill Chrome'a nie wypełnia readonly;
  focus zdejmuje atrybut w `contact-ui.ts`) — nie usuwaj atrybutu.
- Turnstile ładowany leniwie (pierwszy `focusin` w formularzu) — nie
  przenoś do eager loadu.
- Pola mobile mają PODŁOGĘ `font-size: 16px` (Safari iOS zoomuje stronę
  przy focusie mniejszego pola i zostawia ją zoomniętą).
- Breakpoint: `CONTACT_DESKTOP_MIN_PX = 1024` z `contact-config.ts`
  (importują go testy e2e; `@media` w parze).
- Pułapki klienckie mają serwerowy odpowiednik w `functions/api/kontakt.ts`
  (Pages Function: honeypot, czas wypełnienia, weryfikacja Turnstile) —
  zmiany po jednej stronie kontraktu wymagają przeglądu drugiej.
