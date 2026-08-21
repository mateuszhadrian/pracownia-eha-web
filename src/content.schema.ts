// Schemat wpisu Realizacji — CZYSTY Zod, bez importów z "astro:content",
// żeby dało się go używać poza pipeline'em Astro (kontrakt CMS w testach
// jednostkowych: tests/unit/cms-contract.test.ts). Konsumowany przez
// src/content.config.ts (walidacja w buildzie) — jedno źródło prawdy.
//
// PL-only — bez pól {pl,en}. BEZ pola `category` (E5 — eha nie ma
// kategorii ani filtrów; płaska lista). Gallery jako lista WARIANTÓW
// (pozycja to ALBO zdjęcie, ALBO film — panel wymusza to sam przez
// `types`/`typeKey`), specs jako pary label/value. Pola `cover` NIE MA:
// kaflem realizacji jest pierwsza pozycja galerii, która z tego powodu
// musi być zdjęciem.
//
// Docelowy schemat eha (§6.1 analizy: place, paras[] zamiast description)
// wchodzi w Etapie 2 RAZEM z config.yml i komponentami.
// Zmiana schematu = zmiana w TRZECH miejscach naraz (reguła cms-realizacje):
// ten plik, public/admin/config.yml, src/components/sections/work/*.
import { z } from "zod";

// Pozycja obrazu w kadrze (CSS object-position, np. "50% 42%") — opcjonalna.
// Dotyczy też klatki filmu: miniatura jest przycinana do tego samego
// kadru galerii co zdjęcia.
const position = z.string().optional();

// Warianty pozycji galerii. Dyskryminator `type` zapisuje sam panel
// (`typeKey` Sveltii, domyślnie "type") — dzięki temu klient nie może
// wypełnić zdjęcia i filmu naraz, bo widzi pola tylko jednego wariantu.
const photoItem = z.object({
  type: z.literal("photo"),
  image: z.string(),
  position,
});
const videoItem = z.object({
  type: z.literal("video"),
  video: z.string(), // URL MP4 w R2 — obecność pozycji tego typu = badge play
  duration: z.string().optional(), // "0:24" — podpis ORAZ środek klatki miniatury
  position,
});

export const realizacjaSchema = z.object({
  slug: z.string(), // np. "dom-z-bala-czernica" — nazwa pliku = slug (konwencja Sveltii)
  order: z.number().default(0), // kolejność na liście (mniejsze = wyżej)
  title: z.string(), // np. "Dom z bala przeniesiony i zrekonstruowany"
  year: z.string(), // np. "2023"
  description: z.string(), // opis (Etap 2: wymiana na paras[] wg §6.1)
  // Galeria detalu. PIERWSZA POZYCJA JEST KAFLEM realizacji na /realizacje/
  // i na stronie głównej — dlatego musi być zdjęciem.
  // Sveltia nie ma walidacji zależnej od miejsca na liście, więc ten jeden
  // warunek łapie dopiero Zod: `pnpm test:unit` w 2 s, build w CI.
  gallery: z
    .array(z.discriminatedUnion("type", [photoItem, videoItem]))
    .min(1)
    .superRefine((items, ctx) => {
      if (items.length > 0 && items[0].type !== "photo") {
        ctx.addIssue({
          code: "custom",
          path: [0],
          // Komunikat mówi o polu i czynności, nie o ścieżce Zoda — to jest
          // tekst, który Mateusz zobaczy w raporcie i przeczyta klientowi.
          message:
            "Pierwsza pozycja galerii jest kaflem realizacji na liście — musi być zdjęciem. Przenieś film na dalszą pozycję.",
        });
      }
    }),
  // RODZAJ OBIEKTU / ZAKRES / ROK … — pary z designu (7 par).
  specs: z.array(z.object({ label: z.string(), value: z.string() })),
});
