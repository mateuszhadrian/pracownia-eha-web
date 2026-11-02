// Dane widoku realizacji (sesja linków — docs/analiza-linki-realizacji.md):
// identyfikator = NAZWA PLIKU (adres podstrony), meta podstrony z treści.
import { describe, expect, it } from "vitest";
import {
  entryToProject,
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
    ).toBe("Dom z bala (Czernica, 2023) — Pracownia EH/A");
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
