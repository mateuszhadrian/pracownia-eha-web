// Telefony i e-mail firmowy dla chrome'u (navbar, sheet menu, stopka)
// oraz widoków (kontakt, polityka). Antyscraping (kontrakt D-CH5
// odziedziczony z szablonu): pełne ciągi NIE istnieją w bundle'u ani
// w statycznym HTML — składane z fragmentów dopiero w JS po załadowaniu
// strony (sloty [data-tel]/[data-mail] startują ukryte; bez JS chrome nie
// pokazuje numeru — spójnie z polityką prywatności).
// Ten moduł jest JEDYNYM miejscem w projekcie, które zna fragmenty numerów
// i adresu; JSON-LD celowo nie dostaje ani telefonu, ani maila.
//
// Pracownia EH/A ma DWA telefony (sloty per-osoba — rozszerzenie wzorca
// szablonu): a[data-tel="maciek"] i a[data-tel="lukasz"].

export type PhonePerson = "maciek" | "lukasz";

const PHONE_PARTS: Record<PhonePerson, readonly number[]> = {
  maciek: [48, 696, 513, 743],
  lukasz: [48, 533, 328, 356],
};

const EMAIL_PARTS = ["eha", "pracownia-eha", "pl"] as const;

export const buildPhoneHref = (person: PhonePerson): string =>
  "tel:+" + PHONE_PARTS[person].join("");

export const buildPhoneDisplay = (person: PhonePerson): string =>
  "+" + PHONE_PARTS[person][0] + " " + PHONE_PARTS[person].slice(1).join(" ");

export const buildEmail = (): string =>
  EMAIL_PARTS[0] +
  String.fromCharCode(64) +
  EMAIL_PARTS[1] +
  "." +
  EMAIL_PARTS[2];

/** Wypełnia sloty telefonów/maila w DOM (chrome renderuje je puste+hidden).
 *  Kotwica z wewnętrznym [data-slot] (np. wiersz z etykietą MACIEK/ŁUKASZ —
 *  etykieta zostaje) dostaje tekst do slotu; bez slotu — w textContent całej
 *  kotwicy. Wariant `data-fill="href"` (np. „Zadzwoń teraz" w CTA):
 *  podmieniamy WYŁĄCZNIE cel linku, etykieta kotwicy zostaje nietknięta. */
export function fillContactSlots(root: ParentNode = document): void {
  const fill = (
    a: HTMLAnchorElement,
    mode: string | undefined,
    href: string,
    text: string,
  ) => {
    a.href = href;
    if (mode !== "href") {
      (a.querySelector<HTMLElement>("[data-slot]") ?? a).textContent = text;
    }
    a.hidden = false;
  };
  root.querySelectorAll<HTMLAnchorElement>("a[data-tel]").forEach((a) => {
    const person: PhonePerson =
      a.dataset.tel === "lukasz" ? "lukasz" : "maciek";
    fill(a, a.dataset.fill, buildPhoneHref(person), buildPhoneDisplay(person));
  });
  root.querySelectorAll<HTMLAnchorElement>("a[data-mail]").forEach((a) => {
    const email = buildEmail();
    fill(a, a.dataset.fill, "mailto:" + email, email);
  });
}
