// Wspólne źródło danych zajawki 02 — pierwsze HOME_REALIZACJE_MAX wpisów
// kolekcji po `order`, w postaci widokowej (viewProject liczy kafel
// z pierwszej pozycji galerii).
//
// Czytają je DWA miejsca i dlatego lista NIE może być liczona lokalnie:
//  • HomeRealizacje.astro — kafle karuzeli/polaroidy,
//  • index.astro — <template data-work-detail> + <WorkDetailOverlay>.
// Nakładka detalu musi wyjść POZA main.home: `.home` ma
// `isolation: isolate` (PaperBackdrop), więc .dt-ov z z-index 100
// lądowałby w JEGO kontekście układania i pasek nawigacji (.hdr,
// z-index 50, rodzeństwo main) malowałby się NA modalu.
import { getCollection } from "astro:content";
import {
  viewProject,
  type ViewProject,
  type WorkProject,
} from "../work/work-data";
import { HOME_REALIZACJE_MAX } from "./home-config";

/** Zajawka strony głównej: kafle + ile wpisów zostało poza kapem. */
export async function homeRealizacje(): Promise<{
  shown: ViewProject[];
  more: number;
}> {
  const entries = (await getCollection("realizacje"))
    .map((entry) => entry.data as WorkProject)
    .sort((a, b) => a.order - b.order);
  const shown = entries.slice(0, HOME_REALIZACJE_MAX).map(viewProject);
  return { shown, more: entries.length - shown.length };
}
