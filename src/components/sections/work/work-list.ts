// JEDNO źródło listy realizacji dla wszystkich tras: `/realizacje/`,
// podstron `/realizacje/<id>/` i zajawki 02 na `/` (która bierze z niej
// pierwsze N). Kolejność wg `order` z CMS; identyfikatorem jest nazwa
// pliku wpisu (entryToProject — uzasadnienie w work-data.ts).
// Pusta kolekcja = stan dopuszczalny (pusta lista).
// Powiązania „Inne realizacje z inwestycji" rozwiązujemy TUTAJ, względem
// PEŁNEJ listy — zajawka na `/` bierze z niej pierwsze N, a jej detale
// mogą linkować do realizacji spoza tej trójki.
import { getCollection } from "astro:content";
import {
  entryToProject,
  resolveRelated,
  viewProject,
  type ViewProject,
} from "./work-data";

// Każda trasa woła workProjects() osobno — bez tego to samo martwe
// odwołanie ostrzegałoby w logu buildu kilkanaście razy.
const warned = new Set<string>();
const warnOnce = (msg: string) => {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[realizacje] ${msg}`);
};

export async function workProjects(): Promise<ViewProject[]> {
  const all = (await getCollection("realizacje"))
    .map(entryToProject)
    .sort((a, b) => a.order - b.order);
  const related = resolveRelated(all, warnOnce);
  return all.map((p) => viewProject(p, related.get(p.slug)));
}
