// Konfiguracja widoku realizacji (Etap 4.3, docs/analiza-realizacje.md).
// Stałe importują komponenty, skrypt widoku ORAZ testy e2e — zmiana progu
// czy rozmiaru strony = jedna stała; @media w .astro trzymać W PARZE
// (CSS nie zaimportuje stałej — reguła sections.md).

/** Breakpoint projektu: <1024 mobile (bottom sheet detalu, „pokaż
 *  więcej"), ≥1024 desktop (modal, paginacja). Konsumenci:
 *  open-detail.ts, work-motion.ts, realizacje.astro. Parę stała↔@media
 *  pilnuje kontrakt breakpoint w tests/e2e/work-index.spec.ts. */
export const WORK_DESKTOP_MIN_PX = 1024;

/** Drugi próg — WYŁĄCZNIE siatka kafli: 1 kolumna → 2 kolumny
 *  (odczyt eksportu: `gridCols: w >= 700`). */
export const WORK_GRID_TWO_COL_MIN_PX = 700;

/** Rozmiar strony paginacji desktop (E5). Design pokazywał 6 kafli —
 *  4 to świadome ODSTĘPSTWO (decyzja Mateusza z korekt 4.3).
 *  SSR renderuje wszystkie kafle, JS ukrywa. */
export const WORK_PAGE_SIZE = 4;

/** Krok przycisku „Pokaż więcej realizacji" mobile (E5) — 4 jak wyżej
 *  (start = pierwszy krok, każde kliknięcie dokłada kolejny). */
export const WORK_MOBILE_STEP = 4;

/** Maks. liczba pozycji galerii, przy której detal renderuje
 *  kreski-wskaźniki pod karuzelą (korekta Mateusza): powyżej rząd
 *  kresek przestałby się mieścić — zostaje sam licznik 01/NN. */
export const WORK_GALLERY_DASHES_MAX = 15;

/** Ile czekać, zanim pokażemy wskaźnik „ładuję wideo" po tapnięciu
 *  w kadr (sesja poprawek wizualnych). Pomiar na pliku z R2, throttling
 *  CDP, `play` → `playing`: ~650 ms przy zimnym cache bez ograniczeń,
 *  ~390 ms przy ciepłym, ~1,9 s na Fast 3G, ~7,2 s na Slow 3G. Próg
 *  400 ms zjada w całości przypadek „film już w cache" — tam wskaźnik
 *  w ogóle się nie zapala, i dobrze. */
export const VIDEO_LOADING_DELAY_MS = 400;

/** Minimalny czas WIDOCZNOŚCI wskaźnika, gdy już się zapalił. Bez tego
 *  przy zimnym cache i dobrym łączu (650 ms do `playing`) plakietka
 *  mignęłaby na 250 ms — zmierzone 121 ms w przebiegu z ciepłym cache
 *  przy niższym progu. Migający komunikat jest gorszy niż jego brak,
 *  więc po zapłonie trzymamy go do końca tego okna (film w tym czasie
 *  już gra pod spodem — plakietka tylko dogasa). */
export const VIDEO_LOADING_MIN_MS = 600;

/** Bezpiecznik: po tylu ms bez `playing` wracamy do podpowiedzi
 *  „…, aby obejrzeć". Chroni przed wiecznym „ładuję" tam, gdzie
 *  odtwarzanie NIE ruszy i nie poleci `error` — sztandarowy przypadek
 *  to iOS Low Power Mode, który potrafi odrzucić `play()` po cichu. */
export const VIDEO_LOADING_TIMEOUT_MS = 15_000;
