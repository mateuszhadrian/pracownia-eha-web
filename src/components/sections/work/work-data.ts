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
  year: string;
  description: string;
  gallery: WorkGalleryItem[];
  specs: WorkSpec[];
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
