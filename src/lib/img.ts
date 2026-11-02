// Jedyne miejsce, które wie „skąd brać obrazek w danym rozmiarze" — a od
// remontu panelu także „skąd brać miniaturę filmu".
// Etap 5: skalowanie w locie przez Cloudflare Image Transformations —
// jeden oryginał w R2, każdy rozmiar powstaje z adresu URL.
export function imgAt(src: string, width: "full" | "mobile"): string {
  // Lokalnie (dev/preview) endpoint /cdn-cgi/image nie istnieje — pokaż oryginał.
  if (import.meta.env.DEV) return src;
  const w = width === "mobile" ? 320 : 960; // szerokości pod telefon / desktop
  // format=auto → przeglądarka dostaje AVIF/WebP automatycznie.
  // replace: źródło bez wiodącego "/" (stare ścieżki z repo typu /realizacje/…);
  // pełne URL-e https://media.pracownia-eha.pl/… przechodzą bez zmian.
  return `/cdn-cgi/image/width=${w},format=auto/${src.replace(/^\//, "")}`;
}

// Sekunda, z której bierzemy klatkę: ŚRODEK filmu, policzony z opisowego pola
// „Długość wideo" panelu ("0:24" → 12). Klient wpisuje je odręcznie, więc
// przyjmujemy i "m:ss", i same sekundy, a wszystko inne (brak, literówka,
// "ok. pół minuty") spada na 1 s — klatka gorsza, ale zawsze jakaś.
// Krótkie klipy też zostają na 1 s: środek 2-sekundowego filmu to nadal
// pierwsza sekunda, a `time=0s` bywa czarną klatką przejścia.
function frameSecond(duration?: string): number {
  const raw = duration?.trim() ?? "";
  const mmss = /^(\d+):([0-5]\d)$/.exec(raw);
  const seconds = mmss
    ? Number(mmss[1]) * 60 + Number(mmss[2])
    : /^\d+$/.test(raw)
      ? Number(raw)
      : 0;
  return seconds > 2 ? Math.floor(seconds / 2) : 1;
}

// Miniatura filmu = klatka wycięta z pliku w R2 przez Cloudflare Media
// Transformations (`/cdn-cgi/media`, zwraca JPEG-a i cache'uje go na 20 dni).
// Od remontu panelu pozycja galerii z filmem NIE MA własnego zdjęcia, więc to
// jedyne źródło plakatu — stąd ta funkcja mieszka obok imgAt(), a nie w
// komponencie.
// UWAGA: `time` poza długością klipu to po stronie Cloudflare błąd 400 (pusty
// plakat, nic poza tym) — dlatego długość podana przez klienta ma być prawdziwa.
export function videoFrameAt(
  src: string,
  duration?: string,
): string | undefined {
  // Lokalnie (dev) endpoint /cdn-cgi/media nie istnieje — lepiej BRAK postera
  // niż atrybut wskazujący na 404. Nie debuguj miniatur wideo na localhoście.
  if (import.meta.env.DEV) return undefined;
  return `/cdn-cgi/media/mode=frame,time=${frameSecond(duration)}s,width=960/${src.replace(/^\//, "")}`;
}

// Obrazek podglądu linku (og:image) podstrony realizacji — okładka wpisu
// w kadrze 1200×630 (1,91:1, ten sam co og-image.png serwisu: nie przycina
// go Facebook/X/LinkedIn ani WhatsApp). Trzy różnice wobec imgAt():
//  • adres ABSOLUTNY — crawlery komunikatorów nie rozwiązują ścieżek
//    względnych (`site` = Astro.site, czyli domena produkcji także na
//    preview: endpoint /cdn-cgi/image istnieje wyłącznie tam);
//  • `format=jpeg`, a nie `auto` — negocjacja po nagłówku Accept dałaby
//    crawlerowi AVIF/WebP, którego część komunikatorów nie pokaże;
//  • pole „Kadr" (object-position kafla, np. „50% 42%") przechodzi na
//    `gravity=0.5x0.42` — podgląd linku kadruje jak kafel na liście.
//    Inny zapis niż dwie wartości procentowe = środek (domyślne cover).
export function ogImageAt(
  src: string,
  site: URL | string,
  position?: string,
): string {
  // Lokalnie (dev) endpoint nie istnieje — oryginał (pełny URL z R2).
  if (import.meta.env.DEV) return new URL(src, site).href;
  const m = /^\s*(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*$/.exec(position ?? "");
  const frac = (v: string) =>
    String(Math.min(100, Math.max(0, Number(v))) / 100);
  const gravity = m ? `,gravity=${frac(m[1])}x${frac(m[2])}` : "";
  return new URL(
    `/cdn-cgi/image/width=1200,height=630,fit=cover,format=jpeg${gravity}/${src.replace(/^\//, "")}`,
    site,
  ).href;
}
