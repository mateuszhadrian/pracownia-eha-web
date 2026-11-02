// JEDNO źródło listy realizacji dla wszystkich tras: `/realizacje/`,
// podstron `/realizacje/<id>/` i zajawki 02 na `/` (która bierze z niej
// pierwsze N). Kolejność wg `order` z CMS; identyfikatorem jest nazwa
// pliku wpisu (entryToProject — uzasadnienie w work-data.ts).
// Pusta kolekcja = stan dopuszczalny (pusta lista).
import { getCollection } from "astro:content";
import { entryToProject, viewProject, type ViewProject } from "./work-data";

export async function workProjects(): Promise<ViewProject[]> {
  return (await getCollection("realizacje"))
    .map(entryToProject)
    .sort((a, b) => a.order - b.order)
    .map(viewProject);
}
