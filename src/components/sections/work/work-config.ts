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
