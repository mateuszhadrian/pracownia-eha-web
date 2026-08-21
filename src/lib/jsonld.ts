// Dane strukturalne schema.org — JEDYNE źródło danych firmy dla JSON-LD.
// STAN Etapu 0: dane Pracowni EH/A wpisane, ale węzły NIE są jeszcze
// renderowane na stronach — podpięcie, geo, walidacja validator.schema.org
// i ostateczny kształt = Etap 6 (§9 analizy: /kontakt/ =
// HomeAndConstructionBusiness, / = @graph WebSite + samodzielna
// Organization — nie zagnieżdżać w publisher).
//
// KONTRAKT ANTYSCRAPINGOWY (D-CH5 z szablonu): ten moduł CELOWO nie zna
// telefonów ani e-maila i nie wolno mu ich poznać. Fragmenty numerów/adresu
// żyją wyłącznie w src/lib/contact-details.ts i są składane w JS po
// załadowaniu strony; JSON-LD renderuje się statycznie do dist/, więc pole
// `telephone` czy `email` wpisałoby pełny ciąg wprost do źródła.
// Pilnuje tego test unit (tests/unit/jsonld.test.ts).

/** Profil na Instagramie — ten sam adres co w Footer.astro
 *  (spójności pilnuje kontrakt w tests/unit/jsonld.test.ts). */
export const INSTAGRAM_URL = "https://www.instagram.com/pracowniaeha/";

/** Profil na Facebooku — jak wyżej (eha ma i IG, i FB — inaczej niż w szablonie). */
export const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61574396106209";

/** Dane firmy — wspólne dla wszystkich węzłów (rejestrowe z §1 analizy). */
export const BUSINESS = {
  name: "Pracownia EH/A",
  legalName: "Pracownia Łukasz Jarosz-Jarszewski",
  description:
    "Remonty domów z historią: ciesielstwo, murarstwo, sklepienia, " +
    "fizyka budowli i instalacje.",
  street: "Strzyżowiec 30",
  postalCode: "59-610",
  locality: "Wleń",
  country: "PL",
  vatID: "PL5272449969",
  areaServed: "Polska",
} as const;

/** Godziny „Na budowie pn.–pt. 8:00–16:00" (ustalenie z analizy §9).
 *  Weekend nieobecny = zamknięte (schema.org czyta brak wpisu tak samo
 *  jak jawne zero godzin). */
const OPENING_HOURS = [
  {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "16:00",
  },
] as const;

const abs = (site: string | URL, path: string) =>
  new URL(path, typeof site === "string" ? site : site.href).href;

/** Węzeł firmy dla /kontakt/ — `HomeAndConstructionBusiness` to podtyp
 *  `LocalBusiness` dla profilu remontowego (decyzja robocza §5.5 analizy;
 *  potwierdzenie + geo w Etapie 6). */
export function localBusiness(site: string | URL): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": abs(site, "/#firma"),
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    url: abs(site, "/"),
    image: abs(site, "/og-image.png"),
    logo: abs(site, "/og-image.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.locality,
      addressCountry: BUSINESS.country,
    },
    openingHoursSpecification: OPENING_HOURS.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...slot.days],
      opens: slot.opens,
      closes: slot.closes,
    })),
    areaServed: { "@type": "Country", name: BUSINESS.areaServed },
    vatID: BUSINESS.vatID,
    sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
  };
}

/** Strona główna: DWA węzły najwyższego poziomu w `@graph` — `WebSite`
 *  i `Organization` (lekcja D-E6 z szablonu: Organization zagnieżdżona
 *  w `publisher` nie była wykrywana przez Rich Results Test; dane
 *  organizacji z `logo` mają stać na stronie głównej SAMODZIELNIE,
 *  `publisher` zostaje czystą referencją `@id`).
 *
 *  BEZ `SearchAction` — strona nie ma wyszukiwarki, a deklarowanie
 *  nieistniejącego endpointu to błąd walidacji. */
export function webSite(site: string | URL): Record<string, unknown> {
  const organizationId = abs(site, "/#firma");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": abs(site, "/#strona"),
        url: abs(site, "/"),
        name: BUSINESS.name,
        inLanguage: "pl-PL",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: BUSINESS.name,
        legalName: BUSINESS.legalName,
        description: BUSINESS.description,
        url: abs(site, "/"),
        logo: { "@type": "ImageObject", url: abs(site, "/og-image.png") },
        image: abs(site, "/og-image.png"),
        sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
      },
    ],
  };
}
