// Słownik PL-only (wzorzec z szablonu — bez EN). Mechanizm useTranslations
// zostaje uśpiony na jednym języku: Lang = "pl", zero martwych kluczy.
// Widoki portowane w Etapie 4 trzymają teksty INLINE w komponentach —
// tutaj zostają wyłącznie meta stron, których używają strony i testy.
// Opisy meta = wersje robocze szkieletu; szlif per widok w Etapach 4–6.
export const defaultLang = "pl";

export const ui = {
  pl: {
    "meta.title": "Pracownia EH/A — remonty domów z historią",
    "workPage.title": "Realizacje — Pracownia EH/A",
    "workPage.description":
      "Realizacje Pracowni EH/A — remonty domów z historią: ciesielstwo, murarstwo, sklepienia, fizyka budowli i instalacje.",
    "contactPage.title": "Kontakt — Pracownia EH/A",
    "contactPage.description":
      "Skontaktuj się z Pracownią EH/A — formularz kontaktowy, telefon i e-mail. Opisz dom i zakres prac, odezwiemy się, aby porozmawiać o remoncie.",
  },
} as const;
