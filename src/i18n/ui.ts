// Słownik PL-only (wzorzec z szablonu — bez EN). Mechanizm useTranslations
// zostaje uśpiony na jednym języku: Lang = "pl", zero martwych kluczy.
// Widoki portowane w Etapie 4 trzymają teksty INLINE w komponentach —
// tutaj zostają wyłącznie meta stron, których używają strony i testy.
// Opisy meta = wersje robocze szkieletu; szlif per widok w Etapach 4–6.
export const defaultLang = "pl";

export const ui = {
  pl: {
    "meta.title": "Pracownia EH/A — remonty domów z historią",
    "ekipaPage.title": "Ekipa EHa — Pracownia EHa",
    "ekipaPage.description":
      "Poznaj ekipę Pracowni EHa — Łukasza i Maćka. Remonty domów z historią: ciesielstwo, murarstwo i fizyka budowli.",
    "kompetencjePage.title": "Kompetencje i technologie — Pracownia EHa",
    "kompetencjePage.description":
      "Ciesielstwo, murarstwo, sklepienia, fizyka budowli i instalacje — kompetencje i technologie Pracowni EHa.",
    "tradycjaPage.title": "Tradycja i ekologia — Pracownia EHa",
    "tradycjaPage.description":
      "Tradycyjne techniki budowlane i ekologia w remontach domów z historią — podejście Pracowni EHa.",
    "obslugaPage.title": "Obsługa budowy — Pracownia EHa",
    "obslugaPage.description":
      "Obsługa budowy z jednym punktem kontaktu — logistyka, dostawy i harmonogram po naszej stronie. Pełna kontrola remontu z dystansu. Pracownia EHa.",
    "workPage.title": "Realizacje — Pracownia EHa",
    "workPage.description":
      "Realizacje Pracowni EHa — remonty domów z historią: ciesielstwo, murarstwo, sklepienia, fizyka budowli i instalacje.",
    // Tytuł polityki jest KONTRAKTEM testu (tests/e2e/policy.spec.ts,
    // Etap 3) — zmiana wymaga poprawki w spechu.
    "policyPage.title": "Polityka prywatności — Pracownia EHa",
    "policyPage.description":
      "Polityka prywatności serwisu pracownia-eha.pl — kto jest administratorem danych, jakie dane przetwarzamy, na jakiej podstawie, jak długo i jakie masz prawa.",
    // Strona 404 (src/pages/404.astro) — bez description: noindex.
    "notFoundPage.title": "Nie znaleziono strony — Pracownia EHa",
    "contactPage.title": "Kontakt — Pracownia EHa",
    "contactPage.description":
      "Skontaktuj się z Pracownią EHa — formularz kontaktowy, telefon i e-mail. Opisz dom i zakres prac, odezwiemy się, aby porozmawiać o remoncie.",
  },
} as const;
