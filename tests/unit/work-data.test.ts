// Dane widoku realizacji (sesja linków — docs/analiza-linki-realizacji.md):
// identyfikator = NAZWA PLIKU (adres podstrony), meta podstrony z treści.
import { describe, expect, it } from "vitest";
import {
  entryToProject,
  resolveRelated,
  viewProject,
  WORK_DESCRIPTION_MAX,
  workDescription,
  workDocTitle,
} from "../../src/components/sections/work/work-data";

describe("entryToProject", () => {
  it("slug = nazwa pliku (entry.id), nie pole „Slug” z panelu", () => {
    // stan zastany na produkcji: klient zmienił pole, Sveltia nie
    // przemianowała pliku — adres MUSI iść za plikiem
    const p = entryToProject({
      id: "sklepienie-sobotka",
      data: { slug: "sklepienie-proszowka", order: 1, title: "T" },
    });
    expect(p.slug).toBe("sklepienie-sobotka");
    expect(p.title).toBe("T");
  });
});

describe("workDocTitle", () => {
  it("tytuł, miejscowość i rok + marka", () => {
    expect(
      workDocTitle({ title: "Dom z bala", place: "Czernica", year: "2023" }),
    ).toBe("Dom z bala (Czernica, 2023) — Pracownia EHa");
  });
});

describe("workDescription", () => {
  it("krótki pierwszy akapit przechodzi bez zmian (białe znaki znormalizowane)", () => {
    expect(workDescription({ paras: ["  Krótki\n opis.  ", "drugi"] })).toBe(
      "Krótki opis.",
    );
  });

  it("długi akapit tnie na granicy słowa, z wielokropkiem, w limicie", () => {
    const long = "słowo ".repeat(60).trim() + ".";
    const d = workDescription({ paras: [long] });
    expect(d.length).toBeLessThanOrEqual(WORK_DESCRIPTION_MAX);
    expect(d.endsWith("słowo…")).toBe(true);
  });

  it("brak akapitów = pusty opis (schemat i tak wymaga min. 1)", () => {
    expect(workDescription({ paras: [] })).toBe("");
  });
});

// „Inne realizacje w ramach inwestycji" (docs/analiza-inne-realizacje.md §4.3).
// Dane SYNTETYCZNE — kontrakt nie może zależeć od tego, co klient wpisał
// w panelu (dziś żaden wpis produkcyjny nie ma powiązań).
describe("resolveRelated", () => {
  const p = (slug: string, related: string[] = []) => ({
    slug,
    title: `Tytuł ${slug}`,
    place: `Miejsce ${slug}`,
    year: "2024",
    related,
  });

  it("rozwiązuje identyfikatory w kolejności z panelu (tytuł, miejsce, rok)", () => {
    const map = resolveRelated([p("a", ["c", "b"]), p("b"), p("c")]);
    expect(map.get("a")).toEqual([
      { slug: "c", title: "Tytuł c", place: "Miejsce c", year: "2024" },
      { slug: "b", title: "Tytuł b", place: "Miejsce b", year: "2024" },
    ]);
  });

  it("bez powiązań i przy braku klucza: pusta lista dla każdego wpisu", () => {
    const map = resolveRelated([
      p("a"),
      { ...p("b"), related: undefined as unknown as string[] },
    ]);
    expect(map.get("a")).toEqual([]);
    expect(map.get("b")).toEqual([]);
  });

  it("nieznane id (realizacja usunięta) i pusty napis: pominięte z ostrzeżeniem", () => {
    const warnings: string[] = [];
    const map = resolveRelated([p("a", ["usunieta", "", "b"]), p("b")], (m) =>
      warnings.push(m),
    );
    expect(map.get("a")?.map((l) => l.slug)).toEqual(["b"]);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain('"a"');
    expect(warnings[0]).toContain('"usunieta"');
  });

  it("wskazanie samego siebie: pominięte (bez ostrzeżenia)", () => {
    const warnings: string[] = [];
    const map = resolveRelated([p("a", ["a", "b"]), p("b")], (m) =>
      warnings.push(m),
    );
    expect(map.get("a")?.map((l) => l.slug)).toEqual(["b"]);
    expect(warnings).toEqual([]);
  });

  it("duplikat: zostaje pierwsze wystąpienie", () => {
    const map = resolveRelated([p("a", ["b", "c", "b"]), p("b"), p("c")]);
    expect(map.get("a")?.map((l) => l.slug)).toEqual(["b", "c"]);
  });

  it("brak symetrii (D2): B nie dostaje A tylko dlatego, że A wskazuje B", () => {
    const map = resolveRelated([p("a", ["b"]), p("b")]);
    expect(map.get("b")).toEqual([]);
  });
});

describe("viewProject — powiązania", () => {
  const base = {
    slug: "a",
    order: 1,
    title: "T",
    place: "P",
    year: "2024",
    paras: ["akapit"],
    gallery: [{ type: "photo" as const, image: "https://x/a.webp" }],
    specs: [],
    related: ["b"],
  };

  it("surowe identyfikatory zastępuje lista rozwiązana", () => {
    const link = { slug: "b", title: "B", place: "Q", year: "2023" };
    expect(viewProject(base, [link]).related).toEqual([link]);
  });

  it("bez rozwiązanej listy: pusto (nigdy surowe id w widoku)", () => {
    expect(viewProject(base).related).toEqual([]);
  });
});
