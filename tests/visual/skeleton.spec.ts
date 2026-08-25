// Szkielety Etapu 0 — regres wizualny 8 tras × 6 profili (viewport + pełna
// strona). To są PIERWSZE baseline'y eha (Etap 3): pilnują chrome'u
// (pasek, stopka, „papier", fonty E10) w czasie, gdy widoki dopiero
// powstają. Etap 4 wymienia trasy po jednym PR-ze: wtedy trasa dostaje
// WŁASNY spec (wzorzec delung: index/work-index/contact-index/…), a jej
// wpis tutaj ZNIKA razem z baseline'ami `skeleton-<trasa>-*` w tym samym
// PR. Ostatni wpis = skasowanie pliku.
//
// Determinizm: prepareSweep (freeze.css zeruje czasowe animacje; zdjęcia
// eager+decode). Wideo zawsze pod maską (klatka filmu to loteria —
// testing.md); szkielet wideo nie ma, ale maska jest kontraktem speca
// i zostaje, żeby PR Etapu 4 nie musiał jej „pamiętać".
// NIE emulujemy prefers-reduced-motion (bramka w BaseLayout = martwa
// strona) — playwright.config.ts.
//
// Strażnik: na szkielecie tylko usePreviewGuard. useVisualFixtureGuard
// (zamrożona treść) liczy <template data-work-detail> na /realizacje/,
// których szkielet nie renderuje — wchodzi razem z widokiem w 4.3.
// Do tego czasu fixture pilnuje test kontraktu (visual-fixture.test.ts)
// i `pnpm build:visual` (walidacja Zod w buildzie).
import { expect, test } from "@playwright/test";
import { CONTACT_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

usePreviewGuard();

// Nazwa pliku baseline'u = slug trasy. Trasa `/` wypadła w Etapie 4.2
// (własny spec: tests/visual/index.spec.ts), `/realizacje/` w 4.3
// (tests/visual/work-index.spec.ts), `/ekipa-eha/` w 4.4 cz. 1
// (tests/visual/ekipa.spec.ts), `/kompetencje-i-technologie/` w 4.4
// cz. 2 (tests/visual/kompetencje.spec.ts), `/tradycja-i-ekologia/`
// w 4.5 cz. 1 (tests/visual/tradycja.spec.ts), `/obsluga-budowy/`
// w 4.5 cz. 2 (tests/visual/obsluga.spec.ts), a `/polityka-prywatnosci/`
// w 4.6 (tests/visual/polityka.spec.ts). Została JEDNA trasa:
// `/kontakt/` wypadnie w Etapie 5 — wtedy plik znika razem
// z baseline'ami `skeleton-kontakt-*`.
const ROUTES: { path: string; name: string }[] = [
  { path: CONTACT_PATH, name: "kontakt" },
];

for (const { path, name } of ROUTES) {
  test(`szkielet ${path}: viewport + pełna strona vs baseline`, async ({
    page,
  }) => {
    await prepareSweep(page, path);
    // Mikro-scroll tam i z powrotem: WebKit trzyma warstwę sticky paska
    // w niższej rasteryzacji do pierwszego przemalowania (wzorzec delung
    // index.spec — raz ostre, raz rozmyte logo bez tego kroku).
    await scrollPageTo(page, 10);
    await scrollPageTo(page, 0);
    await settle(page, 300);
    const mask = [page.locator("video"), page.locator(".dt-poster")];
    // Pierwszy ekran: pasek + h1 — to, co widzi użytkownik po wejściu.
    await expect(page).toHaveScreenshot(`skeleton-${name}-top.png`, { mask });
    // Pełna strona: szkielet jest krótki (60vh + stopka), więc jeden zrzut
    // obejmuje też stopkę — regres stopki bez osobnego elementu.
    await expect(page).toHaveScreenshot(`skeleton-${name}-full.png`, {
      fullPage: true,
      mask,
    });
  });
}
