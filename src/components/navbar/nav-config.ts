// Breakpoint chrome'u (i całego projektu): desktop ≥1024, mobile <1024.
// Stałą importuje skrypt Navbara; ten sam próg siedzi w @media komponentów
// chrome'u oraz w :root global.css (--pad/--col) — utrzymywać W PARZE
// (CSS nie zaimportuje stałej).
export const NAV_DESKTOP_MIN_PX = 1024;

// ── Auto-hide paska (E11, desktop-only) — progi odczytane z eksportów
// designów (docs/analiza-chrome.md §1). Importują je skrypt Navbara
// ORAZ testy e2e (navigation.spec.ts) — zmiana progu = jedna stała.
/** Do tej pozycji scrolla pasek jest zawsze widoczny. */
export const NAV_TOP_ALWAYS_PX = 70;
/** Delta scrolla w dół (px/zdarzenie) uznawana za ruch chowający pasek. */
export const NAV_DOWN_DELTA_PX = 2;
/** Skumulowany scroll w górę, po którym pasek wraca. */
export const NAV_UP_REVEAL_PX = 60;
/** Minimalna wysokość górnej strefy kursora (pokazuje pasek). */
export const NAV_ZONE_MIN_PX = 96;
/** …albo ten ułamek wysokości okna — liczy się większa z wartości. */
export const NAV_ZONE_VH = 0.12;
/** Zapas strefy kursora pod dolną krawędzią otwartego dropdownu „O nas"
 *  (gotcha z designu: pasek nie może uciec spod otwartego panelu). */
export const NAV_ZONE_PANEL_PAD_PX = 48;

// ── Stan „solid" (papierowe tło + cień po zjechaniu z góry strony).
/** Z hero ([data-navref], Etap 4.2): solid od `wysokość hero - zapas`. */
export const NAV_SOLID_HERO_PAD_PX = 40;
/** Bez hero (szkielety/strony treściowe): solid zaraz po ruszeniu scrolla. */
export const NAV_SOLID_FALLBACK_PX = 8;

// (Glow mobile z 4.1 wycięty w korekcie 4.2 — decyzja Mateusza: mobile
// używa tego samego stanu „solid" co desktop; stałe NAV_GLOW_* usunięte.)
