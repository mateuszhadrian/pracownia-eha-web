// Dane realizacji żyją w plikach JSON kolekcji `realizacje`
// (src/content/realizacje/*.json, schemat w src/content.schema.ts).
// Tu zostają wyłącznie typy (PL-only) i normalizacja wpisu do postaci
// konsumowanej przez komponenty.
//
// BEZ aparatu kategorii (E5 — eha to płaska lista realizacji): gallery +
// specs, BEZ pola cover — kaflem jest pierwsza pozycja galerii.

// Pozycja galerii detalu to WARIANT: albo zdjęcie, albo film — nigdy oba
// (panel wymusza to polami, schemat Zod dyskryminatorem `type`).
// Film nie ma własnego zdjęcia: miniatura powstaje z klatki (videoFrameAt).
export interface WorkGalleryPhoto {
  type: "photo";
  image: string;
  position?: string;
}
export interface WorkGalleryVideo {
  type: "video";
  video: string;
  duration?: string;
  position?: string;
}
export type WorkGalleryItem = WorkGalleryPhoto | WorkGalleryVideo;

// Para tabeli parametrów detalu (RODZAJ OBIEKTU / ZAKRES / …).
interface WorkSpec {
  label: string;
  value: string;
}

// Kształt wpisu kolekcji (zgodny z realizacjaSchema).
export interface WorkProject {
  slug: string;
  order: number;
  title: string;
  place: string; // miejscowość — uppercase robi CSS (design: „CZERNICA — 2023")
  year: string;
  paras: string[]; // opis detalu jako akapity (min 1; design: 3)
  gallery: WorkGalleryItem[];
  specs: WorkSpec[]; // opcjonalne w CMS — schemat daje [] (blok PARAMETRY ukryty)
  // „Inne realizacje w ramach inwestycji": identyfikatory (NAZWY PLIKÓW) w kolejności
  // z panelu; opcjonalne — schemat daje []. Surowe, mogą wskazywać realizacje
  // usunięte — dla widoku rozwiązuje je resolveRelated().
  related: string[];
}

// Pozycja sekcji „Inne realizacje w ramach inwestycji" — rozwiązane odwołanie,
// wszystko, czego potrzebuje link w detalu (adres liczy workDetailPath).
export interface RelatedLink {
  slug: string;
  title: string;
  place: string;
  year: string;
}

// Postać widokowa: wpis + WYLICZONY kafel + ROZWIĄZANE powiązania.
export type ViewProject = Omit<WorkProject, "order" | "related"> & {
  cover: { image: string; position?: string };
  related: RelatedLink[];
};

// Normalizacja wpisu do postaci konsumowanej przez komponenty.
// `cover` NIE jest polem wpisu — liczymy go z pierwszej pozycji galerii,
// żeby kafel siatki (WorkIndexCard) i zajawki dostały gotowy kształt danych.
export function viewProject(
  p: WorkProject,
  related: RelatedLink[] = [],
): ViewProject {
  const first = p.gallery[0];
  // Schemat gwarantuje zdjęcie na pierwszej pozycji (.superRefine), więc ta
  // gałąź jest nieosiągalna dla treści, która przeszła walidację. Rzucamy
  // zamiast cichego pustego kafla: gdyby ktoś ominął schemat (np. woła tę
  // funkcję z ręcznie sklejonym obiektem), ma się dowiedzieć od razu.
  if (first?.type !== "photo") {
    throw new Error(
      `Realizacja "${p.slug}": pierwsza pozycja galerii musi być zdjęciem (jest kaflem na liście).`,
    );
  }
  // surowe identyfikatory (`p.related`) zastępuje lista rozwiązana
  return {
    ...p,
    cover: { image: first.image, position: first.position },
    related,
  };
}

// Rozwiązanie odwołań „Inne realizacje w ramach inwestycji" względem PEŁNEJ listy
// (docs/analiza-inne-realizacje.md §4.3). Panel wyklucza bieżący wpis
// z selecta, ale NIE pilnuje duplikatów ani realizacji usuniętych później
// (Sveltia nie czyści odwołań w innych wpisach) — robi to ta funkcja:
//  • id istnieje → pozycja w kolejności z panelu,
//  • id nieznane / pusty napis → pominięte + ostrzeżenie (log buildu),
//  • id = bieżący wpis → pominięte (JSON da się popsuć poza panelem),
//  • duplikat → zostaje pierwsze wystąpienie.
// Ostrzeżenie zamiast błędu: treść z panelu nie może wywracać builda
// (reguła cms-realizacje / testing.md). Zero ważnych pozycji = pusta lista,
// a detal nie renderuje wtedy sekcji w ogóle.
export function resolveRelated(
  projects: Pick<
    WorkProject,
    "slug" | "title" | "place" | "year" | "related"
  >[],
  warn: (msg: string) => void = () => {},
): Map<string, RelatedLink[]> {
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const out = new Map<string, RelatedLink[]>();
  for (const p of projects) {
    const seen = new Set<string>();
    const links: RelatedLink[] = [];
    for (const id of p.related ?? []) {
      if (id === p.slug || seen.has(id)) continue;
      const target = bySlug.get(id);
      if (!target) {
        warn(
          `Realizacja "${p.slug}": pomijam powiązanie "${id}" — nie ma takiej realizacji (usunięta?).`,
        );
        continue;
      }
      seen.add(id);
      links.push({
        slug: target.slug,
        title: target.title,
        place: target.place,
        year: target.year,
      });
    }
    out.set(p.slug, links);
  }
  return out;
}

// IDENTYFIKATOR realizacji = NAZWA PLIKU wpisu (`entry.id` — loader w
// content.config.ts ma JAWNY `generateId` z nazwy pliku; domyślny brałby
// pole `slug` z treści),
// a NIE wartość pola „Slug" z panelu (docs/analiza-linki-realizacji.md §2.1).
// Powód zmierzony na produkcji: klient zmienił w panelu pole „Slug"
// (2026-09-17), a Sveltia 0.178.0 NIE przemianowała pliku — pole i nazwa
// pliku potrafią się rozjechać. Nazwa pliku jest stabilna (panel jej nie
// zmienia) i zawsze ASCII (`slug: {encoding: ascii}` w config.yml), więc
// tylko ona nadaje się na adres podstrony `/realizacje/<id>/`, który klient
// rozsyła ludziom. Jeden identyfikator wszędzie: adres, template detalu
// (`data-work-detail`), kafle (`data-work-slug`) i historia przeglądarki.
export function entryToProject(entry: {
  id: string;
  data: unknown;
}): WorkProject {
  return { ...(entry.data as WorkProject), slug: entry.id };
}

/** `<title>` podstrony realizacji — także `document.title` przy otwartym
 *  detalu (open-detail.ts czyta go z `data-doc-title` templatu). */
export function workDocTitle(p: Pick<WorkProject, "title" | "place" | "year">) {
  return `${p.title} (${p.place}, ${p.year}) — Pracownia EHa`;
}

/** Meta description podstrony: pierwszy akapit przycięty na granicy słowa
 *  do ~155 znaków (tyle Google pokazuje w wyniku bez ucinania). */
export const WORK_DESCRIPTION_MAX = 155;
export function workDescription(p: Pick<WorkProject, "paras">): string {
  const text = (p.paras[0] ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= WORK_DESCRIPTION_MAX) return text;
  const cut = text.slice(0, WORK_DESCRIPTION_MAX - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 60 ? cut.slice(0, space) : cut).replace(/[\s,;:.—–-]+$/, "")}…`;
}
