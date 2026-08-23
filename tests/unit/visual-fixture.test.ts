// Kontrakt FIXTURE'U testów wizualnych (tests/fixtures/realizacje): zamrożony
// zestaw, na którym stoją baseline'y (`pnpm build:visual` przestawia
// REALIZACJE_DIR). Build waliduje go schematem dopiero w CI (job e2e) —
// ten test daje sygnał w sekundę w `quality`, zanim ktoś zepsuje fixture
// „przy okazji". Fixture jest NIEZALEŻNY od treści produkcyjnej — nie ma tu
// porównań z src/content/realizacje i nie wolno ich dodawać (testing.md).
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { realizacjaSchema } from "../../src/content.schema";
import {
  collectMediaUrls,
  fixtureFiles,
  readFixture,
} from "../helpers/realizacje";

type Entry = z.infer<typeof realizacjaSchema>;

const files = fixtureFiles();
const entries = files.map((name) => readFixture<Entry>(name));

describe("fixture wizualny: tests/fixtures/realizacje", () => {
  // Liczba wpisów jest częścią baseline'ów (siatka, paginacja, zajawka na
  // stronie głównej) — zmiana = świadoma decyzja i nowe baseline'y w tym
  // samym PR, nigdy „dosypanie" wpisu.
  it("ma dokładnie 5 wpisów (Etap 3)", () => {
    expect(files).toHaveLength(5);
  });

  it.each(files)("%s: zgodny ze schemą §6.1", (name) => {
    const result = realizacjaSchema.safeParse(readFixture(name));
    expect(
      result.success,
      result.success ? "" : `${name}:\n${z.prettifyError(result.error)}`,
    ).toBe(true);
  });

  it("nazwa pliku = slug (konwencja Sveltii, jak w produkcji)", () => {
    for (const name of files) {
      expect(readFixture<Entry>(name).slug).toBe(name.replace(/\.json$/, ""));
    }
  });

  it("slugi i wartości order są unikalne (stabilna kolejność zrzutów)", () => {
    expect(new Set(entries.map((e) => e.slug)).size).toBe(entries.length);
    expect(new Set(entries.map((e) => e.order)).size).toBe(entries.length);
  });

  // Jeden wpis z filmem: zrzuty detalu z wideo (pod maską) i kontrakt
  // „miniatura = klatka filmu" potrzebują dokładnie jednego takiego kafla;
  // więcej = więcej masek i mniej testowanej powierzchni.
  it("dokładnie jeden wpis ma pozycję wideo", () => {
    const withVideo = entries.filter((e) =>
      e.gallery.some((g) => g.type === "video"),
    );
    expect(withVideo.map((e) => e.slug)).toEqual([
      "dom-z-bala-przeniesiony-i-zrekonstruowany-czernica",
    ]);
  });

  // Media to te same pliki R2, co w treści testowej Etapu 2 — lokalnie
  // renderują się jako znane 404 (deterministyczne tło), a na produkcji
  // istnieją; CHECK_REMOTE_MEDIA=1 (media-r2.test.ts) sprawdza także je.
  it("wszystkie media wskazują na media.pracownia-eha.pl/realizacje/", () => {
    const urls = collectMediaUrls(files, readFixture);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/media\.pracownia-eha\.pl\/realizacje\//);
    }
  });
});
