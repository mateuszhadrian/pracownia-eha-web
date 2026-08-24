// Stała wysokość viewportu strony głównej (D-Q2 — port z delung
// HomeHero/home-scroll; korekta Mateusza po teście na Galaxy S20 FE):
// na części telefonów chowanie paska URL ZMIENIA rozmiar webview
// (Chrome na Samsungu z paskiem systemowym, DuckDuckGo/Firefox/Opera/
// Edge na iOS) — wtedy drga nawet 100svh, a każda sekcja liczona
// z viewportu przeskakuje dokładnie w rytm paska.
//
// Mechanika (lekcja delung — NIE przypinać profilaktycznie): wartość
// wpisana z JS nigdy nie jest bit w bit tym, co policzyła przeglądarka,
// więc dopóki sonda 100svh przy STAŁEJ szerokości się nie rusza, layout
// liczy czysty CSS (Safari, Chrome bez resizu, desktop, testy — zero
// zmian). Dopiero gdy sonda drgnie bez zmiany szerokości, mrozimy
// wartość SPRZED drgnięcia w `--svh` (inline na main.home — wygrywa
// z domyślnym `--svh: 100svh` z CSS). Obrót ekranu (zmiana szerokości)
// zdejmuje przypięcie i wraca do czystego CSS.
let probe: HTMLDivElement | undefined;
let pinned = false;
let baseSvh = 0;

function probeH(): number {
  if (!probe) {
    probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:100svh;" +
      "visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
  }
  return probe.offsetHeight || window.innerHeight;
}

/** Wysokość viewportu dla pętli ruchu (home-motion.ts): przypięta, gdy
 *  pasek URL rusza webview — parallaxy nie szarpią w rytm paska. */
export function vpH(): number {
  return pinned ? baseSvh : probeH();
}

/** Uzbraja sondę i leniwe przypinanie `--svh`. Wołane ZAWSZE (to
 *  stabilność layoutu, nie dekoracja — poza bramką js-motion);
 *  bez JS zostaje czyste `100svh` z CSS. */
export function armViewportPin(): void {
  const host = document.querySelector<HTMLElement>("main.home");
  if (!host) return;
  let lastWidth = window.innerWidth;
  baseSvh = probeH();
  addEventListener(
    "resize",
    () => {
      if (window.innerWidth !== lastWidth) {
        // realna zmiana viewportu (obrót/okno) — od nowa, znów czysty CSS
        lastWidth = window.innerWidth;
        pinned = false;
        host.style.removeProperty("--svh");
        baseSvh = probeH();
        return;
      }
      if (pinned) return;
      if (probeH() === baseSvh) return; // svh stabilne — niczego nie ruszamy
      pinned = true;
      host.style.setProperty("--svh", `${baseSvh}px`);
    },
    { passive: true },
  );
}
