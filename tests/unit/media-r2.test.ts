// Dostępność mediów R2: HEAD do każdego URL-a media.pracownia-eha.pl z JSON-ów
// realizacji — PRODUKCYJNYCH (src/content/realizacje) i z FIXTURE'U testów
// wizualnych (tests/fixtures/realizacje; te same pliki R2, więc sprzątanie
// bucketa, które zepsułoby baseline'y, wychodzi tu, nie w pixel-diffie).
// Zewnętrzna sieć = flaky ⇒ test nie biega w CI W OGÓLE (ani na PR-ach, ani
// na main — żaden workflow nie ustawia zmiennej); odpala się wyłącznie
// z CHECK_REMOTE_MEDIA=1: ręcznie i w /release-check.
// Wpisy czytane przez helper (reguła testing.md: nigdy goły readdirSync —
// katalog produkcyjny może nie istnieć).
import { describe, expect, it } from "vitest";
import {
  collectMediaUrls,
  fixtureFiles,
  readFixture,
  readRealizacja,
  realizacjeFiles,
} from "../helpers/realizacje";

describe.skipIf(!process.env.CHECK_REMOTE_MEDIA)(
  "media R2: każdy URL media.pracownia-eha.pl odpowiada na HEAD",
  () => {
    it("wszystkie media istnieją w R2", { timeout: 60_000 }, async () => {
      const urls = [
        ...new Set([
          ...collectMediaUrls(realizacjeFiles(), readRealizacja),
          ...collectMediaUrls(fixtureFiles(), readFixture),
        ]),
      ];
      expect(urls.length).toBeGreaterThan(0);

      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { method: "HEAD" });
            return { url, ok: res.ok, status: res.status };
          } catch (error) {
            return { url, ok: false, status: String(error) };
          }
        }),
      );

      const broken = results.filter((r) => !r.ok);
      expect(
        broken,
        `Niedostępne media:\n${broken.map((b) => `${b.status} ${b.url}`).join("\n")}`,
      ).toEqual([]);
    });
  },
);
