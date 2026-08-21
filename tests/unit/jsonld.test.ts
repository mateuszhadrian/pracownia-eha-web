// Kontrakt danych strukturalnych (dane wpisane w Etapie 0, węzły wchodzą
// na strony w Etapie 6). Najważniejsza asercja to antyscrapingowa:
// JSON-LD renderuje się statycznie do dist/, więc telefon albo e-mail
// w węźle złamałby kontrakt D-CH5 (sloty contact-details).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BUSINESS,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  localBusiness,
  webSite,
} from "../../src/lib/jsonld";

const SITE = "https://pracownia-eha.pl";
const business = localBusiness(SITE);
const site = webSite(SITE);

// Te same ciągi, których pilnuje test surowego HTML w navigation.spec.ts.
const FORBIDDEN = [
  "eha@pracownia-eha.pl",
  "696513743",
  "696 513 743",
  "533328356",
  "533 328 356",
];

describe("antyscraping (D-CH5)", () => {
  it("węzły nie niosą telefonów ani e-maila w żadnej postaci", () => {
    for (const node of [business, site]) {
      const serialized = JSON.stringify(node);
      for (const needle of FORBIDDEN) {
        expect(serialized.includes(needle), `JSON-LD zawiera „${needle}”`).toBe(
          false,
        );
      }
      // Rekurencyjnie — węzły @graph siedzą w tablicy, więc sprawdzanie
      // kluczy samego korzenia niczego by nie pilnowało.
      const keysDeep = (value: unknown): string[] =>
        Array.isArray(value)
          ? value.flatMap(keysDeep)
          : value && typeof value === "object"
            ? Object.entries(value).flatMap(([k, v]) => [k, ...keysDeep(v)])
            : [];
      expect(keysDeep(node)).not.toContain("telephone");
      expect(keysDeep(node)).not.toContain("email");
    }
  });

  it("moduł danych firmy nie importuje contact-details", () => {
    const source = readFileSync("src/lib/jsonld.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'].*contact-details/);
  });
});

describe("localBusiness()", () => {
  it("jest podtypem LocalBusiness (profil remontowy) z adresem i @id", () => {
    expect(business["@context"]).toBe("https://schema.org");
    expect(business["@type"]).toBe("HomeAndConstructionBusiness");
    expect(business["@id"]).toBe(`${SITE}/#firma`);
    expect(business.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: "Strzyżowiec 30",
      postalCode: "59-610",
      addressLocality: "Wleń",
      addressCountry: "PL",
    });
  });

  it("adresy obrazów i strony są absolutne (podglądy i walidator wymagają URL)", () => {
    for (const url of [business.url, business.image, business.logo]) {
      expect(String(url).startsWith(`${SITE}/`)).toBe(true);
    }
  });

  it("godziny: pn.–pt. 08:00–16:00, bez weekendu", () => {
    const hours = business.openingHoursSpecification as {
      dayOfWeek: string[];
      opens: string;
      closes: string;
    }[];
    expect(hours).toHaveLength(1);
    expect(hours[0].dayOfWeek).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ]);
    expect([hours[0].opens, hours[0].closes]).toEqual(["08:00", "16:00"]);
    expect(hours.flatMap((h) => h.dayOfWeek)).not.toContain("Saturday");
    expect(hours.flatMap((h) => h.dayOfWeek)).not.toContain("Sunday");
  });

  it("niesie NIP i zasięg oraz oba profile social", () => {
    expect(business.vatID).toBe("PL5272449969");
    expect(business.areaServed).toMatchObject({
      "@type": "Country",
      name: "Polska",
    });
    expect(business.sameAs).toEqual([INSTAGRAM_URL, FACEBOOK_URL]);
  });
});

describe("webSite()", () => {
  const graph = site["@graph"] as Record<string, unknown>[];
  const node = (type: string) => graph.find((n) => n["@type"] === type)!;

  it("emituje DWA węzły najwyższego poziomu: WebSite i Organization", () => {
    // Zagnieżdżona Organization nie była wykrywana przez Rich Results Test
    // na „/" (lekcja delung D-E6) — stąd @graph. Nie zwijaj tego z powrotem
    // do publisher-obiektu.
    expect(graph).toHaveLength(2);
    expect(node("WebSite")).toBeTruthy();
    expect(node("Organization")).toBeTruthy();
  });

  it("WebSite wskazuje wydawcę SAMĄ referencją @id (bez duplikatu danych)", () => {
    const website = node("WebSite");
    expect(website.inLanguage).toBe("pl-PL");
    expect(website.publisher).toEqual({ "@id": business["@id"] });
  });

  it("Organization niesie logo i ten sam @id co węzeł firmy z /kontakt/", () => {
    const org = node("Organization");
    expect(org["@id"]).toBe(business["@id"]);
    expect(org.logo).toMatchObject({ "@type": "ImageObject" });
    expect(String((org.logo as { url: string }).url)).toContain(
      "/og-image.png",
    );
    expect(org.url).toBe(business.url);
    expect(org.sameAs).toEqual(business.sameAs);
  });

  it("NIE deklaruje SearchAction (strona nie ma wyszukiwarki)", () => {
    expect(JSON.stringify(site)).not.toContain("SearchAction");
  });
});

describe("spójność z resztą strony", () => {
  it("adresy Instagrama i Facebooka zgadzają się ze stopką", () => {
    const footer = readFileSync("src/components/Footer.astro", "utf8");
    expect(footer).toContain(INSTAGRAM_URL);
    expect(footer).toContain(FACEBOOK_URL);
  });

  it("adres z JSON-LD zgadza się z tym drukowanym w stopce", () => {
    const footer = readFileSync("src/components/Footer.astro", "utf8");
    expect(footer).toContain(BUSINESS.street);
    expect(footer).toContain(BUSINESS.locality);
    // NIP w stopce drukowany z myślnikami (527-244-99-69), w JSON-LD jako
    // vatID PL5272449969 — porównujemy po samych cyfrach.
    const digits = BUSINESS.vatID.replace(/\D/g, "");
    expect(footer.replace(/-/g, "")).toContain(digits);
  });
});
