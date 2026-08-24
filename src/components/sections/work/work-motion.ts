// Ruch /realizacje/ (Etap 4.3) — moduł ładowany DYNAMICZNIE wyłącznie
// przy prefers-reduced-motion: no-preference (wzorzec 4.2, bez GSAP).
// Stany startowe uzbraja klasa html.js-motion (inline skrypt przed
// paintem w realizacje.astro) — bez JS / przy reduce strona jest
// w pełni statyczna. Scroll NATYWNY na dokumencie (scroll.md): wejścia
// to IntersectionObserver, parallaxy — jedna pętla rAF na pasywnym
// `scroll`.
//
// Zakres (mobile — desktop eksportu jest statyczny, spójnie z 4.2):
// reveale [data-rev], rysowanie rycin maską [data-ryc] (maska SCHODZI
// po animationend — lekcja D-Q1), parallax rycin [data-plxr] ±15 px
// i parallax kadrów [data-tilepar] ±35 px (zapas 70 px w CSS — D-U1);
// desktop: DRYF tła papieru (PaperBackdrop — ten sam wzorzec i tempo
// co strona główna, stała z home-config).
import { PAPER_BG_SPEED } from "../home/home-config";
import { WORK_DESKTOP_MIN_PX } from "./work-config";

const desktopMQ = matchMedia(`(min-width: ${WORK_DESKTOP_MIN_PX}px)`);
const qa = <T extends HTMLElement = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));

/* ── wejścia jednorazowe: reveale + rysowanie rycin ── */

// Po zakończeniu rysowania atrybut maski SCHODZI z elementu (jak
// w eksporcie) — ryciny są jednocześnie [data-plxr] (transform co
// klatkę), a maska na przesuwanej warstwie to drogi wzorzec przemalowań
// (D-Q1). animationcancel: freeze.css testów wizualnych anuluje bieg —
// bez tej gałęzi rycina zostałaby w połowie zamaskowana na zrzutach.
function drop(el: HTMLElement, attr: string) {
  const done = () => {
    el.removeAttribute(attr);
    el.classList.remove("in");
  };
  el.addEventListener("animationend", done, { once: true });
  el.addEventListener("animationcancel", done, { once: true });
}

const revIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting && e.boundingClientRect.bottom > 0) continue;
      revIO.unobserve(e.target);
      e.target.classList.add("in");
    }
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
);
qa("[data-rev]").forEach((el) => {
  // pierwszy ekran od razu — rootMargin -10% kazałby elementom na
  // starcie czekać z opacity 0 na pierwszy ruch palcem (wzorzec 4.2)
  if (el.getBoundingClientRect().top < window.innerHeight) {
    el.classList.add("in");
  } else {
    revIO.observe(el);
  }
});

// ryciny — próg 30 % widoczności (skrypt eksportu)
const rycIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      rycIO.unobserve(el);
      drop(el, "data-ryc");
      el.classList.add("in");
    }
  },
  { threshold: 0.3 },
);
qa("[data-ryc]").forEach((el) => rycIO.observe(el));

/* ── parallaxy: jedna pętla rAF (ryciny ±15 px, kadry ±35 px) ── */

/** Maksymalne wychylenie rycin [data-plxr] (px) — formuła eksportu
 *  (±10 % × 150 px), ta sama co na stronie głównej. */
const PLXR_MAX_PX = 15;
/** Amplituda kadrów [data-tilepar] (px): ruch ±PAR/2 przy zapasie
 *  PAR w CSS kafla (height +70 px / translate −35 px — D-U1). */
const PAR = 70;

const rycs = qa("[data-plxr]");
const tiles = qa("[data-tilepar]");
// dryf tła (desktop) — PaperBackdrop; tekstura FIXED przesuwana
// transformem modulo okres (kompozytor, bez przemalowań — D-Q1)
const paperTex = document.querySelector<HTMLElement>("[data-paper-tex]");
const paperRatio = paperTex ? Number(paperTex.dataset.ratio) : 0;
let raf = 0;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function paint() {
  raf = 0;
  if (desktopMQ.matches) {
    if (paperTex && paperRatio > 0) {
      const period = window.innerWidth * paperRatio;
      const y = (window.scrollY * PAPER_BG_SPEED) % period;
      paperTex.style.transform = `translateY(${(-y).toFixed(1)}px)`;
    }
    // desktop: parallaxy mobile nie istnieją — zdejmij inline transformy
    // (kadrem rządzi hover-zoom CSS, ryciny są statyczne)
    for (const el of [...rycs, ...tiles]) {
      if (el.style.transform) el.style.transform = "";
    }
    return;
  }
  // powrót na mobile: tekstura absolute jedzie z treścią bez korekty
  if (paperTex) paperTex.style.transform = "";
  const vh = window.innerHeight;
  const vc = vh / 2;
  for (const el of rycs) {
    const r = el.getBoundingClientRect();
    if (!r.height || r.bottom < -120 || r.top > vh + 120) continue;
    const p = clamp((r.top + r.height / 2 - vc) / (vh / 2));
    el.style.transform = `translateY(${(p * PLXR_MAX_PX).toFixed(1)}px)`;
  }
  for (const im of tiles) {
    // pozycja liczona z KADRU (rodzica), nie z przesuwanego elementu —
    // transform nie może zapętlać własnego odczytu
    const host = im.parentElement;
    if (!host) continue;
    const r = host.getBoundingClientRect();
    if (!r.height || r.bottom < 0 || r.top > vh) continue;
    const prog = clamp((r.top + r.height / 2 - vc) / ((vh + r.height) / 2));
    const dy = ((-PAR * (1 + prog)) / 2).toFixed(1);
    im.style.transform = `translate3d(0,${dy}px,0)`;
  }
}

function tick() {
  if (!raf) raf = requestAnimationFrame(paint);
}

if (rycs.length || tiles.length || paperTex) {
  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("resize", tick);
  desktopMQ.addEventListener("change", tick);
  paint();
}

export {};
