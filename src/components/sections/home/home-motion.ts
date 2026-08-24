// Ruch strony głównej (Etap 4.2, docs/analiza-home.md §2 H6–H8) — moduł
// ładowany DYNAMICZNIE z index.astro wyłącznie przy prefers-reduced-motion:
// no-preference; stany startowe animacji uzbraja klasa html.js-motion
// (inline przed paintem), więc bez tego modułu strona jest w pełni
// statyczna i kompletna.
//
// Scroll jest NATYWNY na dokumencie (E11, scroll.md): triggery wejść to
// IntersectionObserver, a parallaxy dekoracji — jedna własna pętla rAF
// zawieszona na pasywnym `scroll` (Safari dostarcza zdarzenia rzadziej,
// niż przewija — dekoracje wygładza rAF, scrolla nikt nie dotyka).
import {
  HOME_DESKTOP_MIN_PX,
  PAPER_BG_SPEED,
  PLX_AMT,
  PLXR_MAX_PX,
} from "./home-config";
import { vpH } from "./home-viewport";

// ── Wejścia jednorazowe: reveale nagłówków (mobile), „rysowanie" rycin
// maską (mobile [data-ryc] / desktop [data-rycsb]), kołek (05).
// Mobile: próg 30 % widoczności (skrypt eksportu). Po zakończeniu
// rysowania atrybut maski SCHODZI z elementu (jak w eksporcie) — ryciny
// mobile są jednocześnie [data-plxr] (transform co klatkę), a maska na
// przesuwanej warstwie to drogi wzorzec przemalowań z lekcji D-Q1.
function armReveals(): void {
  const drop = (el: HTMLElement, attr: string) => {
    const done = () => {
      el.removeAttribute(attr);
      el.classList.remove("in");
    };
    el.addEventListener("animationend", done, { once: true });
    // freeze.css testów wizualnych anuluje bieg animacji (animation:none)
    // — bez tej gałęzi rycina zostałaby w połowie zamaskowana
    el.addEventListener("animationcancel", done, { once: true });
  };

  // Teksty [data-rev] — parametry delung (korekta Mateusza: łagodniejsze
  // wejścia): trigger tuż nad dolnym pasem viewportu (-10%), a to, co przy
  // skoku kotwicy znalazło się już NAD ekranem, odsłaniamy od razu.
  const rev = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting && en.boundingClientRect.bottom > 0) continue;
        rev.unobserve(en.target);
        en.target.classList.add("in");
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
  );
  document.querySelectorAll<HTMLElement>("[data-rev]").forEach((el) => {
    // Pierwszy ekran odsłaniamy od razu (przejście i tak gra od stanu
    // uzbrojonego) — rootMargin -10% kazałby elementom na starcie czekać
    // z opacity 0 na pierwszy ruch palcem (wzorzec delung).
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("in");
    } else {
      rev.observe(el);
    }
  });

  // Ryciny hero — sekwencja autostartu po wejściu (korekta Mateusza:
  // lewa od razu → prawa górna po 1 s → dolne po 2 s); klasę .in dostają
  // wszystkie naraz, rozłożenie w czasie robi animation-delay w CSS
  // ([data-ryc-auto] w index.astro), więc bez IntersectionObservera.
  document
    .querySelectorAll<HTMLElement>("[data-ryc][data-ryc-auto]")
    .forEach((el) => {
      drop(el, "data-ryc");
      el.classList.add("in");
    });

  // Pozostałe ryciny — próg 30 % widoczności (skrypt eksportu).
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        reveal.unobserve(el);
        if (el.hasAttribute("data-ryc")) drop(el, "data-ryc");
        el.classList.add("in");
      }
    },
    { threshold: 0.3 },
  );
  document
    .querySelectorAll<HTMLElement>("[data-ryc]:not([data-ryc-auto])")
    .forEach((el) => reveal.observe(el));

  // Desktop: eksport rysował rycinę, gdy jej środek minął linię 60 %
  // wysokości viewportu — odwzorowanie: rootMargin przycina dolne 40 %.
  const draw = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        draw.unobserve(el);
        drop(el, "data-rycsb");
        el.classList.add("in");
      }
    },
    { rootMargin: "0px 0px -40% 0px" },
  );
  document
    .querySelectorAll<HTMLElement>("[data-rycsb]")
    .forEach((el) => draw.observe(el));
}

// ── Parallaxy (mobile — [data-plxr]/[data-plx] żyją tylko w markupie
// mobilnym; elementy schowane display:none mają rect 0 i są pomijane).
// Formuły 1:1 ze skryptu eksportu; [data-plx] ma zapas kadru w CSS
// (top −9 % / height 118 % — D-U1: zapas ≥ ruch).
function armParallax(): void {
  const rycs = [...document.querySelectorAll<HTMLElement>("[data-plxr]")];
  const photos = [...document.querySelectorAll<HTMLElement>("[data-plx]")];
  // dryf tła (desktop) — PaperBackdrop; tekstura FIXED przesuwana
  // transformem modulo okres (kompozytor, bez przemalowań — D-Q1)
  const paperTex = document.querySelector<HTMLElement>("[data-paper-tex]");
  const paperRatio = paperTex ? Number(paperTex.dataset.ratio) : 0;
  const desktopMQ = matchMedia(`(min-width:${HOME_DESKTOP_MIN_PX}px)`);
  if (!rycs.length && !photos.length && !paperTex) return;

  let raf = 0;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const paint = () => {
    raf = 0;
    // vpH(): stała wysokość viewportu — innerHeight drga przy chowaniu
    // paska URL i szarpałby parallaxami w jego rytm (D-Q2, home-viewport)
    const vh = vpH();
    const vc = vh / 2;
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
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(paint);
  };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  paint();
}

armReveals();
armParallax();
