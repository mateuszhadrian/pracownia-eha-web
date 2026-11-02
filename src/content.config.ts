import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { realizacjaSchema } from "./content.schema";

// Katalog treści realizacji. Produkcja czyta src/content/realizacje (pisze go
// Sveltia), ale testy WIZUALNE muszą stać na treści NIEZMIENNEJ: baseline to
// obraz, więc każde dodanie/usunięcie/przestawienie realizacji przez klienta
// rozjeżdżałoby zrzuty siatki, szyny filtrów, liczników, sceny na stronie
// głównej i detalu — czyli blokowałoby WSZYSTKIE PR-y do czasu regeneracji
// baseline'ów (zdarzyło się realnie przy pierwszym wpisie klienta, 2026-08-05).
// Dlatego `pnpm build:visual` przestawia kolekcję na zamrożony zestaw
// tests/fixtures/realizacje. Testy e2e (funkcjonalne) NIE używają tej ścieżki —
// czytają treść produkcyjną dynamicznie i są na jej zmiany odporne.
const REALIZACJE_DIR = process.env.REALIZACJE_DIR ?? "./src/content/realizacje";

const realizacje = defineCollection({
  // Każda realizacja = jeden plik JSON w katalogu wyżej.
  // Schemat: src/content.schema.ts (czysty Zod — współdzielony z testami).
  // `generateId` JAWNIE = nazwa pliku bez `.json`. Domyślny generateId
  // loadera glob bierze pole `slug` z treści, jeśli istnieje — a to pole
  // klient zmienia w panelu (Sveltia NIE przemianowuje wtedy pliku) i może
  // wpisać w nim polskie znaki. Identyfikator jest adresem podstrony
  // `/realizacje/<id>/`, który klient rozsyła ludziom, więc musi być
  // stabilny i ASCII — czyli nazwą pliku (docs/analiza-linki-realizacji.md;
  // złapane przy merge'u treści klienta 2026-11-02: dwa wpisy z polem
  // innym niż nazwa pliku dały adresy w rodzaju „…-w-milęcicach").
  loader: glob({
    pattern: "**/*.json",
    base: REALIZACJE_DIR,
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: realizacjaSchema,
});

export const collections = { realizacje };
