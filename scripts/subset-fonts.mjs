// Subsety polskie fontów (Etap 6 — audyt fontów wiszący od Etapu 3).
//
// DIAGNOZA: strona ładuje 12 plików woff2 (461 KB na „/" — 40 % transferu),
// z czego SZEŚĆ to subsety `latin-ext` Fontsource'a. Skan tekstu wszystkich
// 8 tras plus treści CMS pokazał, że z całego zakresu `latin-ext`
// (U+0100–02BA i dalej, ~800 znaków) serwis używa DOKŁADNIE 16 kodów:
// polskich ĄąĆćĘęŁłŃńŚśŹźŻż. Reszta to martwy balast — w samym Garamondzie
// 203 KB na 16 glifów.
//
// Ten skrypt tnie te sześć plików do polskiego alfabetu (harfbuzz przez
// subset-font). Wynik ląduje w src/assets/fonts/ i JEST COMMITOWANY —
// wzorzec optimize-images.mjs / make-icons.mjs: generat w repo, build
// niczego nie liczy. Dzięki src/assets/ (a nie public/) pliki przechodzą
// przez hashowanie Vite i dostają nagłówek immutable.
//
// ZAKRES ZNAKÓW jest CELOWO szerszy niż dzisiejsza treść: to pełny polski
// alfabet, więc klient może w panelu wpisać dowolne polskie słowo i nic się
// nie rozjedzie. Gdyby kiedyś doszedł inny język albo znak spoza tej listy
// (np. „€", „†"), trzeba go DOPISAĆ i przegenerować — inaczej przeglądarka
// pokaże go krojem zastępczym. Pilnuje tego kontrakt
// tests/unit/fonts-subset.test.ts (skan dist + porównanie z tą listą).
//
// Użycie:  node scripts/subset-fonts.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import subsetFont from "subset-font";

const require = createRequire(import.meta.url);

/** Pełny polski alfabet poza zakresem `latin` (ó/Ó siedzą w U+0000–00FF,
 *  więc obsługuje je plik `latin` i tu ich nie ma). */
export const SUBSET_CHARS = "ĄąĆćĘęŁłŃńŚśŹźŻż";

const OUT_DIR = new URL("../src/assets/fonts/", import.meta.url);

/** Pliki źródłowe = subsety `latin-ext` Fontsource'a. `variable` decyduje
 *  o zachowaniu osi wagi (Garamond 400–800, Plex Sans 100–700); Plex Mono
 *  jest statyczny, więc osi nie ma. */
const SOURCES = [
  [
    "@fontsource-variable/eb-garamond/files/eb-garamond-latin-ext-wght-normal.woff2",
    true,
  ],
  [
    "@fontsource-variable/eb-garamond/files/eb-garamond-latin-ext-wght-italic.woff2",
    true,
  ],
  [
    "@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-ext-wght-normal.woff2",
    true,
  ],
  [
    "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-400-normal.woff2",
    false,
  ],
  [
    "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-500-normal.woff2",
    false,
  ],
  [
    "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-600-normal.woff2",
    false,
  ],
];

await mkdir(OUT_DIR, { recursive: true });

let before = 0;
let after = 0;
for (const [specifier, variable] of SOURCES) {
  const source = await readFile(require.resolve(specifier));
  const subset = await subsetFont(source, SUBSET_CHARS, {
    targetFormat: "woff2",
    // `undefined` = zachowaj PEŁNY zakres osi (nie instancjonuj do jednej
    // wagi — nagłówki jadą po całej osi wght).
    variationAxes: variable ? { wght: undefined } : undefined,
  });
  const name = specifier.split("/").pop().replace(".woff2", "-pl.woff2");
  await writeFile(new URL(name, OUT_DIR), subset);
  before += source.length;
  after += subset.length;
  const pct = ((100 * subset.length) / source.length).toFixed(1);
  console.log(
    `${String(source.length).padStart(7)} → ${String(subset.length).padStart(6)} B (${pct}%)  ${name}`,
  );
}
console.log(
  `${String(before).padStart(7)} → ${String(after).padStart(6)} B razem — oszczędność ${before - after} B`,
);
