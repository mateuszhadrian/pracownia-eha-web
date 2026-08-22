// Kontrakt CMS: każdy JSON zapisany przez Sveltię w src/content/realizacje/
// przechodzi schemę Zod (src/content.schema.ts — ta sama, którą waliduje
// build). Build też to łapie, ale ten test daje sygnał w 2 s i czytelny
// raport błędów zamiast wybuchu w środku `astro build`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { realizacjaSchema } from "../../src/content.schema";
import { readRealizacja, realizacjeFiles } from "../helpers/realizacje";

// Katalog może nie istnieć — patrz komentarz w helperze. Zero wpisów zapala
// TYLKO asercję niżej; reszta pliku (kontrakty schematu i panelu) biega dalej.
const files = realizacjeFiles();

describe("kontrakt CMS: src/content/realizacje/*.json", () => {
  // ⚠️ TYMCZASOWY skipIf (Etap 0): kolekcja jest pusta, bo treść wchodzi
  // WYŁĄCZNIE przez panel w Etapie 2 (E13 — zero hardkodu realizacji).
  // W Etapie 2, razem z pierwszymi wpisami, USUŃ `.skipIf(...)` — od tego
  // momentu pusty katalog ma świecić dokładnie tym jednym testem
  // (reguła cms-realizacje.md).
  it.skipIf(files.length === 0)(
    "katalog zawiera co najmniej jeden wpis",
    () => {
      expect(
        files.length,
        "Brak realizacji w src/content/realizacje. Strona zbuduje się i wdroży " +
          "bez nich, ale lista będzie pusta, a scena na stronie głównej — pustym " +
          "blokiem. Dodaj co najmniej jedną realizację w panelu /admin.",
      ).toBeGreaterThan(0);
    },
  );

  it.each(files)("%s: poprawny JSON zgodny ze schemą", (name) => {
    const data: unknown = readRealizacja(name);
    const result = realizacjaSchema.safeParse(data);
    expect(
      result.success,
      result.success ? "" : `${name}:\n${z.prettifyError(result.error)}`,
    ).toBe(true);
  });

  // Kafel realizacji na /realizacje/ i w scenie na stronie głównej to
  // pierwsza pozycja galerii (D-RP2) — film w tym miejscu zostawiłby listę
  // bez okładki. Panel tego nie wymusi (nie ma warunku „na tej pozycji"),
  // więc jedynym strażnikiem jest schemat. Test sprawdza obie strony:
  // że poprawny wpis przechodzi i że film na pierwszej pozycji NIE przechodzi.
  describe("pierwsza pozycja galerii musi być zdjęciem (D-RP3)", () => {
    const base = {
      slug: "test",
      order: 1,
      title: "Test",
      place: "Czernica",
      year: "2026",
      paras: ["opis"],
      specs: [{ label: "Rodzaj obiektu", value: "Dom zrębowy" }],
    };
    const photo = {
      type: "photo",
      image: "https://media.pracownia-eha.pl/a.webp",
    };
    const video = {
      type: "video",
      video: "https://media.pracownia-eha.pl/a.mp4",
    };

    it("zdjęcie na pierwszej pozycji: przechodzi", () => {
      expect(
        realizacjaSchema.safeParse({ ...base, gallery: [photo, video] })
          .success,
      ).toBe(true);
    });

    it("film na pierwszej pozycji: odrzucony, z komunikatem dla klienta", () => {
      const r = realizacjaSchema.safeParse({
        ...base,
        gallery: [video, photo],
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(z.prettifyError(r.error)).toContain("musi być zdjęciem");
      }
    });

    it("pozycja nie może nieść zdjęcia i filmu naraz (wariant, nie suma)", () => {
      const r = realizacjaSchema.safeParse({
        ...base,
        gallery: [{ ...photo, video: "https://media.pracownia-eha.pl/a.mp4" }],
      });
      // Nadmiarowy klucz `video` w wariancie „photo" jest ignorowany przez
      // schemat — istotne jest to, że pozycja NIE staje się przez to filmem.
      expect(r.success && "video" in r.data.gallery[0]).toBe(false);
    });
  });

  // Schemat docelowy §6.1 (Etap 2): opis jako akapity i parametry mają
  // minimum 1 pozycję, miejscowość jest wymagana. Panel pokazuje hinty
  // („najlepiej 3 akapity", „7 par"), ale egzekwuje to dopiero schemat.
  describe("schemat §6.1: place, paras[] (min 1), specs[] (min 1)", () => {
    const ok = {
      slug: "test",
      order: 1,
      title: "Test",
      place: "Czernica",
      year: "2026",
      paras: ["akapit"],
      gallery: [
        { type: "photo", image: "https://media.pracownia-eha.pl/a.webp" },
      ],
      specs: [{ label: "Rodzaj obiektu", value: "Dom zrębowy" }],
    };

    it("komplet pól przechodzi", () => {
      expect(realizacjaSchema.safeParse(ok).success).toBe(true);
    });

    it.each([
      ["brak miejscowości", { ...ok, place: undefined }],
      ["pusta lista akapitów", { ...ok, paras: [] }],
      ["pusty akapit", { ...ok, paras: [""] }],
      ["pusta lista parametrów", { ...ok, specs: [] }],
      [
        "stare pole description zamiast paras",
        { ...ok, paras: undefined, description: "opis" },
      ],
    ])("%s: odrzucony", (_name, data) => {
      expect(realizacjaSchema.safeParse(data).success).toBe(false);
    });
  });

  it("slugi wpisów są unikalne", () => {
    const slugs = files.map(
      (name) => readRealizacja<{ slug: string }>(name).slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

// eha nie ma kategorii (E5) — pilnujemy, żeby pole nie wróciło do panelu
// bez zmiany schematu (zmiana zawsze w trzech miejscach naraz).
describe("kontrakt CMS: brak pola kategorii w config.yml (E5)", () => {
  const CONFIG = fileURLToPath(
    new URL("../../public/admin/config.yml", import.meta.url),
  );

  it("config.yml nie definiuje pola category", () => {
    const yml = readFileSync(CONFIG, "utf8");
    expect(yml).not.toContain('name: "category"');
  });
});

// Trzy miejsca naraz (reguła cms-realizacje): pola schematu §6.1 muszą mieć
// odpowiedniki w panelu — inaczej klient nie ma jak ich wypełnić, a build
// odrzuca każdy nowy wpis.
describe("kontrakt CMS: pola §6.1 w config.yml", () => {
  const CONFIG = fileURLToPath(
    new URL("../../public/admin/config.yml", import.meta.url),
  );
  const yml = readFileSync(CONFIG, "utf8");

  it("panel ma pola place i paras, nie ma już description", () => {
    expect(yml).toContain('name: "place"');
    expect(yml).toContain('name: "paras"');
    expect(yml).not.toContain('name: "description"');
  });

  it("paras i specs mają min: 1 (jak schemat Zod)", () => {
    for (const field of ["paras", "specs"]) {
      const block = yml.slice(yml.indexOf(`name: "${field}"`));
      const nextField = block.indexOf("\n      - ", 1);
      const own = nextField === -1 ? block : block.slice(0, nextField);
      expect(own, `pole ${field}`).toMatch(/^\s*min: 1/m);
    }
  });

  // Placeholder `<ACCOUNT_ID>` = panel nie wgra ani jednego zdjęcia.
  // Lokalnie (w trakcie uzupełniania) test jest pomijany z jawnym powodem,
  // ale w CI PADA — PR z placeholderem nie ma prawa wejść na main.
  const r2 = yml.slice(yml.indexOf("cloudflare_r2:"), yml.indexOf("output:"));
  const hasPlaceholder = /<ACCOUNT_ID>|<ACCESS_KEY_ID>/.test(r2);
  it.skipIf(hasPlaceholder && !process.env.CI)(
    "dane R2 nie są placeholderami (lokalnie: pominięte do czasu uzupełnienia config.yml)",
    () => {
      expect(
        hasPlaceholder,
        "public/admin/config.yml: account_id/access_key_id R2 to wciąż placeholdery <…>. " +
          "Account ID = 32 znaki hex (Cloudflare → R2 → Overview), NIE Token value.",
      ).toBe(false);
    },
  );
  it("account_id i access_key_id R2 mają format 32 znaków hex (gdy wpisane)", () => {
    for (const key of ["account_id", "access_key_id"]) {
      const m = r2.match(new RegExp(`^\\s*${key}: "([^"]*)"`, "m"));
      expect(m, `brak ${key}`).not.toBeNull();
      const v = m?.[1] ?? "";
      if (v.startsWith("<")) continue; // placeholder — łapie test wyżej
      expect(v, `${key} nie wygląda na ID Cloudflare`).toMatch(
        /^[0-9a-f]{32}$/,
      );
    }
  });
});

// Wykluczenie „zdjęcie ALBO film" jest własnością PANELU (warianty listy),
// a nie tylko schematu — jeśli ktoś wyrzuci `types` z config.yml, walidacja
// Zoda dalej będzie zielona, a klient znów zobaczy oba pola naraz i dowie
// się o błędzie dopiero z czerwonego builda. Ten test tego pilnuje.
describe("kontrakt CMS: warianty pozycji galerii w config.yml", () => {
  const CONFIG = fileURLToPath(
    new URL("../../public/admin/config.yml", import.meta.url),
  );
  const yml = readFileSync(CONFIG, "utf8");

  it("galeria ma dokładnie dwa warianty: photo i video", () => {
    // Nazwy wariantów stoją na poziomie pozycji listy `types:` (wcięcie 12
    // po sformatowaniu Prettierem); pola wewnątrz wariantu są głębiej i mają
    // przecinek na końcu — stąd kotwica na końcu linii.
    const names = [...yml.matchAll(/^ {12}name: "(photo|video)"$/gm)].map(
      (m) => m[1],
    );
    expect(names).toEqual(["photo", "video"]);
  });

  it("nie ma już osobnego pola „Kafel (cover)”", () => {
    expect(yml).not.toContain('name: "cover"');
  });

  it("wariant „photo” niesie zdjęcie, wariant „video” — plik filmu", () => {
    const photoBlock = yml.slice(
      yml.indexOf('name: "photo"'),
      yml.indexOf('name: "video"'),
    );
    const videoBlock = yml.slice(yml.indexOf('name: "video"'));
    expect(photoBlock).toContain('name: "image"');
    expect(photoBlock).not.toContain('name: "video"');
    expect(videoBlock).toContain('widget: "file"');
    expect(videoBlock).not.toContain('name: "image"');
  });
});
