// Kontrakt subsetów polskich (Etap 6). Subsety `latin-ext` w
// src/assets/fonts/ są GENERATEM (scripts/subset-fonts.mjs) i zawierają
// WYŁĄCZNIE znaki z listy SUBSET_CHARS. Jeżeli w treści serwisu pojawi się
// znak z zakresu `latin-ext` spoza tej listy (np. „€", „†", czeskie „ř"),
// przeglądarka narysuje go krojem ZASTĘPCZYM — i nikt tego nie zauważy,
// bo layout się nie wywróci. Ten test jest jedynym strażnikiem tej granicy.
//
// Skanujemy źródła treści (nie `dist`), żeby kontrakt działał bez builda:
// komponenty/strony .astro, słownik i18n oraz wpisy CMS.
import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REALIZACJE_DIR, realizacjeFiles } from "../helpers/realizacje";

/** Zakres `latin-ext` wg subsetów Google Fonts / Fontsource — musi być
 *  ZGODNY z `unicode-range` w src/styles/fonts.css. */
const LATIN_EXT: [number, number][] = [
  [0x0100, 0x02ba],
  [0x02bd, 0x02c5],
  [0x02c7, 0x02cc],
  [0x02ce, 0x02d7],
  [0x02dd, 0x02ff],
  [0x1d00, 0x1dbf],
  [0x1e00, 0x1e9f],
  [0x1ef2, 0x1eff],
  [0x2020, 0x2020],
  [0x20a0, 0x20ab],
  [0x20ad, 0x20c0],
  [0x2113, 0x2113],
  [0x2c60, 0x2c7f],
  [0xa720, 0xa7ff],
];

/** Pełny polski alfabet poza zakresem `latin` — kopia stałej z
 *  scripts/subset-fonts.mjs (skrypt jest .mjs bez typów, więc kontrakt
 *  porównuje się z jego ŹRÓDŁEM, nie z importem). */
const SUBSET_CHARS = "ĄąĆćĘęŁłŃńŚśŹźŻż";

const inLatinExt = (cp: number) =>
  LATIN_EXT.some(([a, b]) => cp >= a && cp <= b);

const SOURCES = [
  ...globSync("src/**/*.astro"),
  ...globSync("src/i18n/**/*.ts"),
  ...globSync("src/lib/**/*.ts"),
  // Treść z panelu też — literówka klienta w postaci znaku spoza subsetu
  // narysowałaby się krojem zastępczym w TYTULE realizacji i nikt by tego
  // nie zauważył. Katalog może nie istnieć (helper zwraca wtedy []).
  ...realizacjeFiles().map((name) => join(REALIZACJE_DIR, name)),
];

describe("subsety polskie fontów", () => {
  it("skrypt generujący deklaruje dokładnie te znaki co kontrakt", () => {
    const script = readFileSync("scripts/subset-fonts.mjs", "utf8");
    expect(script).toContain(`SUBSET_CHARS = "${SUBSET_CHARS}"`);
  });

  it("fonts.css wskazuje na wszystkie sześć wygenerowanych subsetów", () => {
    const css = readFileSync("src/styles/fonts.css", "utf8");
    for (const name of [
      "eb-garamond-latin-ext-wght-normal-pl",
      "eb-garamond-latin-ext-wght-italic-pl",
      "ibm-plex-sans-latin-ext-wght-normal-pl",
      "ibm-plex-mono-latin-ext-400-normal-pl",
      "ibm-plex-mono-latin-ext-500-normal-pl",
      "ibm-plex-mono-latin-ext-600-normal-pl",
    ]) {
      expect(css, `brak @font-face dla ${name}`).toContain(`${name}.woff2`);
    }
  });

  it("fonts.css NIE importuje gotowych arkuszy latin-ext Fontsource'a", () => {
    // Gdyby wróciły, przeglądarka pobrałaby ZNOWU 274 KB (nasze subsety
    // stałyby się martwym kodem, a test wyglądu i tak by przeszedł).
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    expect(layout).not.toMatch(/@fontsource-variable\/[a-z-]+\/index\.css/);
    expect(layout).not.toMatch(/@fontsource\/ibm-plex-mono\/\d{3}\.css/);
  });

  it("treść serwisu nie używa znaku latin-ext spoza subsetu", () => {
    const allowed = new Set([...SUBSET_CHARS].map((c) => c.codePointAt(0)!));
    const offenders = new Map<string, string[]>();
    for (const file of SOURCES) {
      for (const ch of new Set(readFileSync(file, "utf8"))) {
        const cp = ch.codePointAt(0)!;
        if (!inLatinExt(cp) || allowed.has(cp)) continue;
        const key = `U+${cp.toString(16).toUpperCase().padStart(4, "0")} ${ch}`;
        offenders.set(key, [...(offenders.get(key) ?? []), file]);
      }
    }
    expect(
      [...offenders].map(([k, v]) => `${k} → ${v[0]}`),
      "znak z latin-ext poza subsetem: dopisz go do SUBSET_CHARS " +
        "w scripts/subset-fonts.mjs i przegeneruj pliki",
    ).toEqual([]);
  });
});
