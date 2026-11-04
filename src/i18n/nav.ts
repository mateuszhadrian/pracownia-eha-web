import {
  CONTACT_PATH,
  EKIPA_PATH,
  KOMPETENCJE_PATH,
  TRADYCJA_PATH,
  WORK_INDEX_PATH,
} from "@/lib/routes";

// Pozycje menu głównego (PL-only) wg designów eha (Etap 4.1):
// pozycja zbiorcza „O nas" (dropdown na desktopie / akordeon w sheecie)
// z dwiema podstronami + trzy pozycje płaskie. Stopka składa kolumny
// z tych samych tablic (O NAS = aboutNavItems + polityka w komponencie;
// OFERTA/STRONY = mainNavItems).
//
// ŚWIADOME ODSTĘPSTWO OD DESIGNÓW (prośba klienta, 2026-11-04):
// „Kompetencje i technologie" wyszły z „O nas" na miejsce „Obsługi
// budowy" w rzędzie głównym, a „Obsługa budowy" NIE MA pozycji w menu
// ani w stopce. Podstrona /obsluga-budowy/ dalej istnieje (sitemapa,
// linki z zajawki 04 na stronie głównej) — nie przywracaj jej tutaj.
export interface NavItem {
  id: string;
  label: string;
  href: string;
}

/** Etykieta pozycji zbiorczej — wspólna dla dropdownu i akordeonu. */
export const ABOUT_LABEL = "O nas";

/** Podstrony „O nas" (dropdown desktop / akordeon w menu mobilnym). */
export const aboutNavItems: NavItem[] = [
  { id: "ekipa", label: "Ekipa EH/A", href: EKIPA_PATH },
  { id: "tradycja", label: "Tradycja i ekologia", href: TRADYCJA_PATH },
];

/** Pozycje płaskie menu głównego (po „O nas"). */
export const mainNavItems: NavItem[] = [
  { id: "realizacje", label: "Realizacje", href: WORK_INDEX_PATH },
  {
    id: "kompetencje",
    label: "Kompetencje i technologie",
    href: KOMPETENCJE_PATH,
  },
  { id: "kontakt", label: "Kontakt", href: CONTACT_PATH },
];
