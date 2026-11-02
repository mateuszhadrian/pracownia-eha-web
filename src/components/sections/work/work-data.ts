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
}

// Postać widokowa: wpis + WYLICZONY kafel.
export type ViewProject = Omit<WorkProject, "order"> & {
  cover: { image: string; position?: string };
};

// Normalizacja wpisu do postaci konsumowanej przez komponenty.
// `cover` NIE jest polem wpisu — liczymy go z pierwszej pozycji galerii,
// żeby kafel siatki (WorkIndexCard) i zajawki dostały gotowy kształt danych.
export function viewProject(p: WorkProject): ViewProject {
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
  return {
    ...p,
    cover: { image: first.image, position: first.position },
  };
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
  return `${p.title} (${p.place}, ${p.year}) — Pracownia EH/A`;
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
