# Indeks dokumentacji — status plików

> Konwencja jak w delung-web/hadrianm-web: każdy plik `.md` bezpośrednio
> w `docs/` ma tu wpis ze statusem. **Dodajesz nowy plik do `docs/`?
> Dopisz go tutaj.** Zmieniasz decyzję opisaną w którymś dokumencie?
> Zaktualizuj jego status/adnotacje i ten indeks.
>
> Podkatalog `design/` = referencje designów (eksporty HTML z Claude
> Design) — poza indeksem, patrz `design/README.md`.

## ✅ Aktualne — źródła prawdy

| Plik                                    | Czego dotyczy                                                                                                                                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pracownia-eha-web-entrance-analysis.md` | **Analiza wejściowa** projektu pracownia-eha.pl: decyzje podjęte (E1–E14), architektura docelowa, różnice względem delung-web (w tym integracja z domeną i pocztą w The Camels), schemat CMS, routing/SEO, ryzyka                        |
| `pracownia-eha-web-creation-process.md`  | **Instrukcja wykonawcza** budowy strony: Część A (checklista), Część B (Etapy 0–7 krok po kroku, z wymienną sekcją 1B The Camels), Część C (flow mediów klienta), Część D (backupy)                                                     |
| `optional-todos.md`                      | **Zadania cykliczne i świadomie odłożone**: odświeżanie Workera auth i Sveltii, backup R2, oraz lista pozycji odłożonych osobną decyzją (kolizja plakietki z `×`, wariant znaku dla faviconu przy dpr 1, zamrożenie `[data-plx]` w `revealSweep`, monospaced „ZADZWOŃ DO NAS")            |
| `analiza-chrome.md`                      | **Mini-analiza portu chrome'u globalnego** (Etap 4.1): navbar z auto-hide i dropdownem, menu-sheet, stopka                                                                                                                                                                              |
| `analiza-home.md`                        | **Mini-analiza strony głównej** (Etap 4.2): hero, 6 zajawek, bramka `js-motion`, korekty po testach na telefonach (§2a — lekcje blendów i `--svh`)                                                                                                                                      |
| `analiza-realizacje.md`                  | **Mini-analiza `/realizacje/`** (Etap 4.3): siatka i próg 700 px, paginacja E5, skin detalu na nietkniętym mechanizmie, lightbox E7, wideo E8                                                                                                                                            |
| `analiza-ekipa.md`                       | **Mini-analiza `/ekipa-eha/`** (Etap 4.4 cz. 1): hero ciemne i `Navbar tone="dark"`, biogramy, wspólne moduły `CollapsibleText` i `content-motion`                                                                                                                                       |
| `analiza-kompetencje.md`                 | **Mini-analiza `/kompetencje-i-technologie/`** (Etap 4.4 cz. 2): hero z grid-overlap, sekcje rzemiosł jako duplikacje dOnly/mOnly, „świadome granice"                                                                                                                                    |
| `analiza-tradycja.md`                    | **Mini-analiza `/tradycja-i-ekologia/`** (Etap 4.5 cz. 1): animowany diagram warstw i efekt kolka na CSS transitions (`tradycja-motion.ts`)                                                                                                                                              |
| `analiza-obsluga.md`                     | **Mini-analiza `/obsluga-budowy/`** (Etap 4.5 cz. 2): najlżejszy widok, sekcje jednym markupem przez grid-overlap, gotcha bloku zawierającego przy `grid-area`                                                                                                                           |
| `analiza-polityka.md`                    | **Mini-analiza `/polityka-prywatnosci/`** (Etap 4.6): dokument prawny, spis treści na czystych kotwicach, sloty antyscrapingowe z czytelnym fallbackiem                                                                                                                                  |
| `analiza-kontakt.md`                     | **Mini-analiza `/kontakt/`** (Etap 5): formularz E9, sticky kolumna z doliczonym paskiem, dwie pułapki designu (piąte pole, pusty kwadrat RODO)                                                                                                                                          |
| `daily-workflow.md`                      | **Codzienny proces pracy** (od Etapu 1A): feature branch → `/test` → PR → `quality` → merge → auto-deploy; konwencja commitów, zakazy (`git add .`, baseline'y), tabela checków z celowo czerwonymi `e2e`/`prod-smoke` do Etapów 3/1B     |
