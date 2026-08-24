// Ruch stron treściowych Etapu 4.4 (/ekipa-eha/, a w części 2 także
// /kompetencje-i-technologie/) — moduł ładowany DYNAMICZNIE wyłącznie
// przy prefers-reduced-motion: no-preference (wzorzec work-motion 4.3).
// Stany startowe uzbraja klasa html.js-motion (inline skrypt przed
// paintem w stronie) — bez JS / przy reduce strona jest w pełni
// statyczna i kompletna. Scroll NATYWNY na dokumencie (scroll.md):
// wejścia to IntersectionObserver, parallaxy — jedna pętla rAF na
// pasywnym `scroll`.
//
// Zakres = suma wzorców 4.2/4.3 (formuły i stałe 1:1 z home-config):
// mobile — reveale [data-rev] (tempo delung), rysowanie rycin maską
// [data-ryc] (próg 30 %, maska SCHODZI po animationend/animationcancel
// — lekcja D-Q1), parallax rycin [data-plxr] ±15 px i parallax kadrów
// [data-plx] ±9 % kadru (zapas top −9 %/height 118 % w CSS — D-U1);
// desktop — rysowanie rycin [data-rycsb] przy linii 60 % viewportu
// (rootMargin −40 %) oraz DRYF tła papieru (PaperBackdrop, stała
// PAPER_BG_SPEED — ten sam wzorzec i tempo co `/` i /realizacje/).
import { PAPER_BG_SPEED, PLX_AMT, PLXR_MAX_PX } from "./home/home-config";
import { CONTENT_DESKTOP_MIN_PX } from "./content-config";

const desktopMQ = matchMedia(`(min-width: ${CONTENT_DESKTOP_MIN_PX}px)`);
const qa = <T extends HTMLElement = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));

/* ── wejścia jednorazowe: reveale + rysowanie rycin ── */

// Po zakończeniu rysowania atrybut maski SCHODZI z elementu (jak
// w eksporcie) — ryciny bywają jednocześnie [data-plxr] (transform co
// klatkę), a maska na przesuwanej warstwie to drogi wzorzec przemalowań
// (D-Q1). animationcancel: freeze.css testów wizualnych anuluje bieg —
// bez tej gałęzi rycina zostałaby w połowie zamaskowana na zrzutach.
// Wołać PO nadaniu klasy .in: gdy animacja w ogóle nie wystartowała
// (animation-name: none — freeze.css zdążył PRZED .in), nie będzie
// żadnego zdarzenia do złapania, więc stan końcowy domykamy od ręki —
// bez tej gałęzi rycina zostawała w ZAMASKOWANYM stanie startowym
// zależnie od wyścigu ładowania modułu z freeze.css (flake webkit-CI
// na zrzutach ekipa-top, 2026-08-24).
function drop(el: HTMLElement, attr: string) {
  const done = () => {
    el.removeAttribute(attr);
    el.classList.remove("in");
  };
  if (getComputedStyle(el).animationName === "none") {
    done();
    return;
  }
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

// ryciny mobile — próg 30 % widoczności (skrypt eksportu)
const rycIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      rycIO.unobserve(el);
      el.classList.add("in");
      drop(el, "data-ryc");
    }
  },
  { threshold: 0.3 },
);
qa("[data-ryc]").forEach((el) => rycIO.observe(el));

// ryciny desktop — eksport rysował, gdy środek minął linię 60 %
// wysokości viewportu; odwzorowanie: rootMargin przycina dolne 40 %
const drawIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      drawIO.unobserve(el);
      el.classList.add("in");
      drop(el, "data-rycsb");
    }
  },
  { rootMargin: "0px 0px -40% 0px" },
);
qa("[data-rycsb]").forEach((el) => drawIO.observe(el));

/* ── parallaxy + dryf tła: jedna pętla rAF ── */

const rycs = qa("[data-plxr]");
const photos = qa("[data-plx]");
// dryf tła (desktop) — PaperBackdrop; tekstura FIXED przesuwana
// transformem modulo okres (kompozytor, bez przemalowań — D-Q1)
const paperTex = document.querySelector<HTMLElement>("[data-paper-tex]");
const paperRatio = paperTex ? Number(paperTex.dataset.ratio) : 0;
let raf = 0;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function paint() {
  raf = 0;
  if (paperTex && paperRatio > 0) {
    if (desktopMQ.matches) {
      const period = window.innerWidth * paperRatio;
      const y = (window.scrollY * PAPER_BG_SPEED) % period;
      paperTex.style.transform = `translateY(${(-y).toFixed(1)}px)`;
    } else {
      // powrót na mobile: tekstura absolute jedzie z treścią bez korekty
      paperTex.style.transform = "";
    }
  }
  if (desktopMQ.matches) {
    // desktop eksportu jest statyczny — zdejmij inline transformy
    // z elementów mobilnych (mogły zostać po przejściu przez próg)
    for (const el of [...rycs, ...photos]) {
      if (el.style.transform) el.style.transform = "";
    }
    return;
  }
  const vh = window.innerHeight;
  const vc = vh / 2;
  for (const el of rycs) {
    const r = el.getBoundingClientRect();
    if (!r.height || r.bottom < -120 || r.top > vh + 120) continue;
    const p = clamp((r.top + r.height / 2 - vc) / (vh / 2));
    el.style.transform = `translateY(${(p * PLXR_MAX_PX).toFixed(1)}px)`;
  }
  for (const el of photos) {
    // Kadr (rodzic z maską) jest nieruchomy — pozycja liczona z niego,
    // żeby transform elementu nie zapętlał własnego odczytu.
    const frame = el.parentElement;
    if (!frame) continue;
    const f = frame.getBoundingClientRect();
    if (!f.height || f.bottom < -80 || f.top > vh + 80) continue;
    const p = clamp((f.top + f.height / 2 - vc) / ((vh + f.height) / 2));
    el.style.transform = `translateY(${(p * (PLX_AMT / 2) * f.height).toFixed(1)}px)`;
  }
}

function tick() {
  if (!raf) raf = requestAnimationFrame(paint);
}

if (rycs.length || photos.length || paperTex) {
  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("resize", tick);
  desktopMQ.addEventListener("change", tick);
  paint();
}

export {};
