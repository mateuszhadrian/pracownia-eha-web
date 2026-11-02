// Kontrakt imgAt() — jedyne miejsce wiedzy o rozmiarach obrazów (Cloudflare
// Image Transformations). imgAt czyta import.meta.env.DEV w momencie
// wywołania, więc stubujemy env per test (vi.stubEnv wspiera boolean dla DEV).
import { afterEach, describe, expect, it, vi } from "vitest";
import { imgAt, ogImageAt, videoFrameAt } from "../../src/lib/img";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("imgAt: produkcja (DEV=false)", () => {
  it("buduje URL /cdn-cgi/image z szerokością 960 (full) i 320 (mobile) + format=auto", () => {
    vi.stubEnv("DEV", false);
    const src = "https://media.pracownia-eha.pl/realizacje/aura-desktop.webp";
    expect(imgAt(src, "full")).toBe(
      `/cdn-cgi/image/width=960,format=auto/${src}`,
    );
    expect(imgAt(src, "mobile")).toBe(
      `/cdn-cgi/image/width=320,format=auto/${src}`,
    );
  });

  it("zdejmuje wiodący '/' ze starych ścieżek repo (unika //)", () => {
    vi.stubEnv("DEV", false);
    expect(imgAt("/realizacje/foo.webp", "full")).toBe(
      "/cdn-cgi/image/width=960,format=auto/realizacje/foo.webp",
    );
  });
});

describe("imgAt: dev (DEV=true)", () => {
  it("zwraca oryginał bez zmian — endpoint /cdn-cgi/image nie istnieje lokalnie", () => {
    vi.stubEnv("DEV", true);
    const src = "https://media.pracownia-eha.pl/realizacje/aura-desktop.webp";
    expect(imgAt(src, "full")).toBe(src);
    expect(imgAt(src, "mobile")).toBe(src);
  });
});

// Miniatura filmu (D-RP4): po remoncie panelu pozycja galerii z filmem nie ma
// własnego zdjęcia, więc to JEDYNE źródło plakatu. Klatkę bierzemy ze ŚRODKA,
// a środek liczymy z opisowego pola „Długość wideo" wypełnianego odręcznie —
// stąd nacisk na to, co się dzieje przy wartościach nietypowych.
describe("videoFrameAt: produkcja (DEV=false)", () => {
  const src = "https://media.pracownia-eha.pl/realizacje/klip.mp4";
  const frame = (t: number) =>
    `/cdn-cgi/media/mode=frame,time=${t}s,width=960/${src}`;

  it("bierze klatkę ze środka filmu (m:ss)", () => {
    vi.stubEnv("DEV", false);
    expect(videoFrameAt(src, "0:24")).toBe(frame(12));
    expect(videoFrameAt(src, "1:05")).toBe(frame(32)); // 65 s → 32 s
  });

  it("przyjmuje też same sekundy", () => {
    vi.stubEnv("DEV", false);
    expect(videoFrameAt(src, "30")).toBe(frame(15));
  });

  it("brak długości, śmieć i klip krótszy niż 3 s spadają na 1 s", () => {
    vi.stubEnv("DEV", false);
    expect(videoFrameAt(src)).toBe(frame(1));
    expect(videoFrameAt(src, "ok. pół minuty")).toBe(frame(1));
    expect(videoFrameAt(src, "0:02")).toBe(frame(1));
  });

  it("zdejmuje wiodący '/' ze ścieżek repo (unika //)", () => {
    vi.stubEnv("DEV", false);
    expect(videoFrameAt("/realizacje/klip.mp4", "0:10")).toBe(
      "/cdn-cgi/media/mode=frame,time=5s,width=960/realizacje/klip.mp4",
    );
  });
});

describe("videoFrameAt: dev (DEV=true)", () => {
  it("nie zwraca postera — endpoint /cdn-cgi/media nie istnieje lokalnie", () => {
    vi.stubEnv("DEV", true);
    // Świadomie undefined, a nie adres 404: lepszy brak plakatu niż zepsuty.
    expect(
      videoFrameAt(
        "https://media.pracownia-eha.pl/realizacje/klip.mp4",
        "0:24",
      ),
    ).toBeUndefined();
  });
});

// Podgląd linku podstrony realizacji (sesja linków) — og:image musi być
// ABSOLUTNY, w JPEG (crawlery komunikatorów), w kadrze 1200×630, a pole
// „Kadr" przechodzi na gravity transformacji.
describe("ogImageAt", () => {
  const src = "https://media.pracownia-eha.pl/realizacje/okladka.jpg";
  const site = "https://pracownia-eha.pl";

  it("produkcja: absolutny /cdn-cgi/image 1200×630 cover JPEG", () => {
    vi.stubEnv("DEV", false);
    expect(ogImageAt(src, site)).toBe(
      `${site}/cdn-cgi/image/width=1200,height=630,fit=cover,format=jpeg/${src}`,
    );
  });

  it("„Kadr” w procentach → gravity XxY (ułamki 0–1)", () => {
    vi.stubEnv("DEV", false);
    expect(ogImageAt(src, site, "50% 42%")).toContain(
      "format=jpeg,gravity=0.5x0.42/",
    );
    expect(ogImageAt(src, site, "0% 100%")).toContain("gravity=0x1/");
  });

  it("inny zapis „Kadru” = bez gravity (środek)", () => {
    vi.stubEnv("DEV", false);
    for (const pos of ["center", "50%", "top left", "", undefined]) {
      expect(ogImageAt(src, site, pos)).not.toContain("gravity");
    }
  });

  it("dev: oryginał (endpoint nie istnieje lokalnie)", () => {
    vi.stubEnv("DEV", true);
    expect(ogImageAt(src, site)).toBe(src);
  });
});
