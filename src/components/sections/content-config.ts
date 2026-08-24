// Konfiguracja stron treściowych Etapu 4.4 (/ekipa-eha/ oraz — w części
// 2 — /kompetencje-i-technologie/; docs/analiza-ekipa.md). Stałe
// importują moduł ruchu (content-motion.ts) ORAZ testy e2e; @media
// w .astro trzymać W PARZE (CSS nie zaimportuje stałej — sections.md).

/** Breakpoint stron treściowych = breakpoint projektu (desktop ≥1024). */
export const CONTENT_DESKTOP_MIN_PX = 1024;
