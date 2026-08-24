// Wspólne klocki testów wizualnych: freeze.css, determinizm zdjęć i start
// sweepa.
import { fileURLToPath } from "node:url";
import { type Page } from "@playwright/test";
import { gotoReady, scrollPageTo, settle } from "./scroll";

/** Arkusz zerujący czasowe animacje CSS — determinizm klatek. */
const FREEZE = fileURLToPath(new URL("./freeze.css", import.meta.url));

/** Po wstrzyknięciu freeze.css strona musi zdążyć przemalować zatrzymane
 *  animacje, zanim zaczniemy mierzyć kotwice i fotografować. */
const FREEZE_REPAINT_MS = 400;

/**
 * Determinizm ZDJĘĆ (PR #17): przy zrzucie elementu wyższego niż viewport
 * Playwright zszywa go z kilku przewinięć, więc obraz `lazy`+`async` bywa
 * rasteryzowany w trakcie dekodowania. Objaw diagnostyczny: różnice
 * WYŁĄCZNIE na krawędziach zdjęć, tekst pikselowo identyczny (czerwone CI
 * przy zielonym przebiegu lokalnym). Eager+sync i doczekanie `decode()`
 * zdejmuje wyścig; dla obrazów już wczytanych to no-op.
 */
export async function settleImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    for (const img of imgs) {
      img.loading = "eager";
      img.decoding = "sync";
    }
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? img.decode().catch(() => undefined)
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }),
      ),
    );
  });
}

/** Wspólny start sweepa: nawigacja + freeze.css + repaint + zdjęcia. */
export async function prepareSweep(page: Page, path = "/"): Promise<void> {
  await gotoReady(page, path);
  await page.addStyleTag({ path: FREEZE });
  await page.waitForTimeout(FREEZE_REPAINT_MS);
  await settleImages(page);
}

/**
 * Przejazd przez całą stronę (odpala IO revealów), powrót na górę.
 * Utwardzony po flake'u webkit-CI (2026-08-24, PR /ekipa-eha/):
 * (1) dół strony dostaje PEŁNE settle — na wolnym WebKit
 * IntersectionObserver nie zdąża policzyć przecięć w pauzie kroku
 * (140 ms) i reveale ostatniej sekcji PRZEPADAŁY po skoku na górę
 * (CTA bez tekstu na zrzucie); (2) po powrocie na górę wymuszamy
 * przemalunek pętli rAF modułów ruchu zdarzeniem scroll — WebKit
 * potrafi nie dostarczyć zdarzenia po programowym skoku i parallaxy
 * zostawały z transformami ze środka przejazdu.
 */
export async function revealSweep(page: Page): Promise<void> {
  const total = await page.evaluate(
    () => document.body.scrollHeight - window.innerHeight,
  );
  const step = await page.evaluate(() => Math.round(window.innerHeight * 0.7));
  for (let y = step; y < total + step; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), Math.min(y, total));
    await page.waitForTimeout(140);
  }
  await settle(page, 400);
  await scrollPageTo(page, 0);
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await settle(page, 400);
}
