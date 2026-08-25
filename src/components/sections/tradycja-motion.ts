// Ruch WŁASNY widoku /tradycja-i-ekologia/ (Etap 4.5 cz. 1,
// docs/analiza-tradycja.md §2.8) — jedyna nowość mechaniki względem
// wspólnego content-motion.ts: ANIMOWANY DIAGRAM warstw ([data-diag] —
// kaskadę dzieci .dg-lay/.dg-arw/.dg-arwh robi CSS po klasie `.in` na
// kontenerze, jak `diagRef` eksportu) oraz efekt kolka ([data-kolek]).
// Moduł ładowany DYNAMICZNIE za bramką js-motion (obok content-motion);
// bez JS / przy reduce diagram i kolek są statyczne i KOMPLETNE.
//
// Stany startowe to CSS TRANSITIONS (nie keyframes): wszystkie animacje
// eksportu są dwustanowe, a freeze.css testów wizualnych
// (`transition: none`) sadza wtedy stany końcowe natychmiast po `.in` —
// bez księgowości animationend/drop() (lekcja webkit-CI 4.4).
// Parametry IO = revIO content-motion (rootMargin −10 %, threshold .01,
// elementy nad viewportem od razu) — świadome odstępstwo od
// eksportowego progu 30 % widoczności: kolek siedzi w ZWINIĘTYM pudle
// CollapsibleText (widoczne ~31 % — próg .3 byłby na granicy = flake),
// a threshold .01 odpala deterministycznie także elementy przycięte
// przez pudło; wizualnie różnica niezauważalna. Animacja jest
// mobile-only (uzbrojenie w CSS pod @media <1024) — na desktopie `.in`
// nic nie zmienia (kopia diagramu desktop nie ma atrybutu).

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting && e.boundingClientRect.bottom > 0) continue;
      io.unobserve(e.target);
      e.target.classList.add("in");
    }
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
);

document
  .querySelectorAll<HTMLElement>("[data-diag], [data-kolek]")
  .forEach((el) => {
    // pierwszy ekran od razu (wzorzec content-motion — wejście z kotwicy
    // nie może zostawić elementu z opacity 0 do pierwszego scrolla)
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("in");
    } else {
      io.observe(el);
    }
  });

export {};
