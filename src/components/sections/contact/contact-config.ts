// Widok /kontakt/ (Etap 5) — stałe konfiguracyjne. Decyzje portu:
// docs/analiza-kontakt.md.

/** Próg desktop/mobile — breakpoint projektu (D-K8). Trzymaj W PARZE
 *  z `@media (min-width: 1024px)` w sekcjach: CSS nie zaimportuje stałej.
 *  Importują ją testy e2e (nie hardkodują progu). */
export const CONTACT_DESKTOP_MIN_PX = 1024;

/** Pages Function w tym repo (functions/api/kontakt.ts). */
export const CONTACT_ENDPOINT = "/api/kontakt";

/** Klucz PUBLICZNY widgetu Turnstile `eha-kontakt` (Managed; hostname
 *  pracownia-eha.pl + pracownia-eha-web.pages.dev). Widget powstaje
 *  w Etapie 5 — do tego czasu placeholder (formularza jeszcze nie ma).
 *  Sekret żyje wyłącznie w zmiennych projektu Pages jako
 *  TURNSTILE_SECRET_KEY. */
export const TURNSTILE_SITE_KEY = "<TURNSTILE_SITE_KEY>";
export const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Ile czekamy na token — challenge w trybie managed może wymagać
 *  interakcji użytkownika, więc limit musi być ludzki, nie sieciowy. */
export const TURNSTILE_TIMEOUT_MS = 90_000;
