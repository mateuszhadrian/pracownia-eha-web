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
import type { ViewProject } from "../work/work-data";
import { workProjects } from "../work/work-list";
import { HOME_REALIZACJE_MAX } from "./home-config";

/** Zajawka strony głównej: kafle + ile wpisów zostało poza kapem. */
export async function homeRealizacje(): Promise<{
  shown: ViewProject[];
  more: number;
}> {
  // pełna lista z work-list.ts (identyfikator = nazwa pliku — ten sam,
  // którego używa adres podstrony realizacji i historia przeglądarki)
  const all = await workProjects();
  const shown = all.slice(0, HOME_REALIZACJE_MAX);
  return { shown, more: all.length - shown.length };
}
