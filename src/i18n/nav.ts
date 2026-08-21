import {
  CONTACT_PATH,
  EKIPA_PATH,
  KOMPETENCJE_PATH,
  OBSLUGA_PATH,
  POLICY_PATH,
  TRADYCJA_PATH,
  WORK_INDEX_PATH,
} from "@/lib/routes";

// Pozycje menu głównego (PL-only). Docelowy wzorzec z designów eha:
// „O nas" jako dropdown (Ekipa EH/A / Kompetencje i technologie /
// Tradycja i ekologia) + Realizacje, Obsługa budowy, Kontakt — dropdown
// i auto-hide wchodzą w Etapie 4.1. Na szkielecie Etapu 0 lista jest
// PŁASKA (wszystkie trasy klikalne od pierwszego builda).
export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { id: "ekipa", label: "Ekipa EH/A", href: EKIPA_PATH },
  { id: "kompetencje", label: "Kompetencje", href: KOMPETENCJE_PATH },
  { id: "tradycja", label: "Tradycja", href: TRADYCJA_PATH },
  { id: "realizacje", label: "Realizacje", href: WORK_INDEX_PATH },
  { id: "obsluga", label: "Obsługa budowy", href: OBSLUGA_PATH },
  { id: "kontakt", label: "Kontakt", href: CONTACT_PATH },
];

// Nawigacja stopki = pełna mapa strony (7 tras + polityka prywatności).
export const footerNavItems: NavItem[] = [
  { id: "ekipa", label: "Ekipa EH/A", href: EKIPA_PATH },
  {
    id: "kompetencje",
    label: "Kompetencje i technologie",
    href: KOMPETENCJE_PATH,
  },
  { id: "tradycja", label: "Tradycja i ekologia", href: TRADYCJA_PATH },
  { id: "realizacje", label: "Realizacje", href: WORK_INDEX_PATH },
  { id: "obsluga", label: "Obsługa budowy", href: OBSLUGA_PATH },
  { id: "kontakt", label: "Kontakt", href: CONTACT_PATH },
  { id: "polityka", label: "Polityka prywatności", href: POLICY_PATH },
];

export function navLabel(item: NavItem): string {
  return item.label;
}
