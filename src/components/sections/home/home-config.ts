// Konfiguracja sekcji strony głównej (Etap 4.2, docs/analiza-home.md).
// Stałe importują komponenty, moduł ruchu ORAZ testy e2e — zmiana progu
// czy amplitudy = jedna stała; @media w .astro trzymać W PARZE (CSS nie
// zaimportuje stałej — reguła sections.md).

/** Breakpoint strony głównej = breakpoint projektu (desktop ≥1024). */
export const HOME_DESKTOP_MIN_PX = 1024;

/** Ile realizacji pokazuje zajawka 02 (design: 3 karty; licznik mobile
 *  „JESZCZE N" = liczba wpisów − ten kap, karta licznika tylko przy N > 0).
 *  Lustro tej stałej dla testów: tests/helpers/realizacje.ts (HOME_MAX). */
export const HOME_REALIZACJE_MAX = 3;

// ── Dryf tła papieru (desktop; PaperBackdrop — od 4.3 wspólny dla
// `/` i `/realizacje/`; pętle: home-motion.ts + work-motion.ts) ──
/** Tempo tekstury tła względem treści. Eksport przesuwał
 *  background-position o 0.15·scroll na elemencie jadącym z treścią,
 *  czyli tekstura płynie względem viewportu w 1 − 0.15 = 0.85 tempa. */
export const PAPER_BG_SPEED = 0.85;

// ── Parallaxy mobile (odczyty ze skryptu eksportu — analiza §1) ──
/** Maksymalne wychylenie rycin [data-plxr] (px): ±10 % × 150 px. */
export const PLXR_MAX_PX = 15;
/** Amplituda zdjęć [data-plx]: ruch ±(amt/2)·wysokość kadru, a zapas kadru
 *  w CSS to top −(amt/2)·100 % / height (100+amt·100) % — D-U1: zapas ≥ ruch.
 *  Zmiana amplitudy wymaga zmiany PARY (top/height w HomeObsluga/HomeTradycja). */
export const PLX_AMT = 0.18;
