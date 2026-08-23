// Wpisy kolekcji realizacji czytane wprost z plików JSON — tak samo, jak robi
// to build. Testy dzięki temu nie hardkodują treści CMS-a: liczą to, co realnie
// leży w repo.
//
// KATALOG MOŻE NIE ISTNIEĆ. Git nie przechowuje pustych katalogów, więc
// usunięcie w panelu ostatniej realizacji kasuje cały `src/content/realizacje`.
// Wcześniej trzy pliki testowe wołały `readdirSync` przy ładowaniu modułu, więc
// wywracały się PRZED uruchomieniem czegokolwiek — `quality` i `prod-smoke`
// czerwone z komunikatem `ENOENT: scandir` zamiast informacji „nie ma treści"
// (zdarzyło się realnie 2026-08-06). Build tego stanu nie ma za złe: strona
// buduje się i deployuje bez wpisów, tylko z pustą listą i pustą sceną na
// stronie głównej.
//
// Uwaga: to NIE jest fixture testów wizualnych (`tests/fixtures/realizacje`,
// `pnpm build:visual`) — tamten jest zamrożony i niezależny od treści
// produkcyjnej. Reguła: `.claude/rules/testing.md`.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const REALIZACJE_DIR = fileURLToPath(
  new URL("../../src/content/realizacje", import.meta.url),
);

/** Nazwy plików wpisów; pusta tablica, gdy katalogu nie ma. */
export function realizacjeFiles(): string[] {
  if (!existsSync(REALIZACJE_DIR)) return [];
  return readdirSync(REALIZACJE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();
}

/** Surowa treść wpisu (JSON prosto z pliku). */
export function readRealizacja<T>(name: string): T {
  return JSON.parse(readFileSync(join(REALIZACJE_DIR, name), "utf8")) as T;
}

/** Wpisy posortowane jak na stronie (rosnąco po `order`). */
export function readRealizacje<T extends { order: number }>(): T[] {
  return realizacjeFiles()
    .map((name) => readRealizacja<T>(name))
    .sort((a, b) => a.order - b.order);
}

/** Ile realizacji pokazuje zajawka na stronie głównej (kap z HomeRealizacje). */
export const HOME_MAX = 3;

// ── Fixture testów WIZUALNYCH (tests/fixtures/realizacje) ──
// Zamrożony zestaw, na którym stoją baseline'y (`pnpm build:visual`).
// Niezależny od treści produkcyjnej: NIE synchronizować po zmianach klienta
// (reguła testing.md). Czytany tak samo odpornie jak produkcja — katalog
// mógłby nie istnieć w kopii repo sprzed Etapu 3.
export const FIXTURE_DIR = fileURLToPath(
  new URL("../fixtures/realizacje", import.meta.url),
);

/** Nazwy plików wpisów fixture'u; pusta tablica, gdy katalogu nie ma. */
export function fixtureFiles(): string[] {
  if (!existsSync(FIXTURE_DIR)) return [];
  return readdirSync(FIXTURE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();
}

/** Surowa treść wpisu fixture'u. */
export function readFixture<T>(name: string): T {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf8")) as T;
}

/** Wszystkie URL-e mediów R2 z podanych plików (surowe dopasowanie
 *  tekstowe — schemat nie wnika w typ pozycji). */
export function collectMediaUrls(
  files: string[],
  read: (name: string) => unknown,
): string[] {
  const urls = new Set<string>();
  for (const name of files) {
    const raw = JSON.stringify(read(name));
    for (const match of raw.matchAll(
      /https:\/\/media\.pracownia-eha\.pl\/[^"\s]+/g,
    )) {
      urls.add(match[0]);
    }
  }
  return [...urls];
}
