// Lighthouse CI — profil MOBILE (domyślna emulacja LHCI: Moto G Power,
// CPU 4×, sieć 4G) = nasz proxy „słabszego Androida".
// Profil desktop: lighthouserc.desktop.cjs.
//
// BUDŻETY = RATCHET od Etapu 3 (2026-08-23). Pomiar bazowy szkieletu „/"
// na runnerze CI (run 32652597911, mediana z 3): performance 0,95,
// LCP 2862 ms (element: logo SVG w pasku; render delay po fontach),
// TBT 0 ms, CLS 0, script 4,2 KB, total 332 KB, fonty 7 (280 KB —
// Garamond 2 + Plex Sans 2 + Plex Mono 3 pliki). Progi ustawione Z ZAPASEM
// na przyrost sekcji Etapu 4 (hero + 6 zajawek z obrazami, navbar
// auto-hide, overlay/lightbox realizacji — w delung ten sam mechanizm
// zamknął się w 20 KB JS i 860 KB total mobile, ale LCP hero na 4G
// wymagał progu 5200 ms przy perf 0,80 — stąd LCP 5000 / perf 0,80, a nie
// „dobre" 2500/0,90 z Web Vitals: szkielet BEZ obrazu ma już ~2,9 s przez
// fonty). Zacieśnianie WYŁĄCZNIE
// decyzją Mateusza, osobnym commitem, po ponownym pomiarze w CI
// (lhci collect --numberOfRuns=5 + scripts/lhci-median.mjs).
//
// ⚠️ LOKALNY `lhci autorun` z tym configiem WYPADA GORZEJ NIŻ CI i to jest
// normalne: emulacja mobile dokłada stały mnożnik CPU do hosta, więc wynik
// zależy od obciążenia Maca. Czerwony przebieg lokalny NIE jest powodem do
// ruszania progów; bramkuje CI i tylko pomiar z CI jest podstawą ratchetu.
//
// ── STAN NA ETAP 6 (2026-08-29) — sam OPIS, progi NIETKNIĘTE ──────────
// Liczby z nagłówka wyżej pochodzą ze SZKIELETU Etapu 3 i są nieaktualne
// (dziś nie ma 7 plików fontów po 280 KB, tylko 12 po 211 KB).
//
// WARIANCJA RUNNERA — najważniejsza liczba przy każdej rozmowie
// o zacieśnianiu. Dwa przebiegi CI na DOKŁADNIE TYCH SAMYCH bajtach
// (identyczne resource-summary co do bajta) dały na „/":
//   run 33071049182 (PR #20, zielony): FCP 1144 ms, LCP 4153 ms, perf 0,86
//   run 33073106228 (main po merge, CZERWONY): FCP 2308, LCP 5447, perf 0,77
// Czyli LCP potrafi skoczyć o +1300 ms bez ŻADNEJ zmiany w kodzie.
// Każdy próg bliżej niż ~1,3 s od mediany będzie migotał — dlatego
// LCP 5000 zostaje, mimo że mediana jest dziś dużo niżej.
//
// AUDYT FONTÓW (Etap 6) ściął transfer „/" o 247 KB: subsety `latin-ext`
// 274 576 → 27 412 B (16 polskich glifów zamiast ~800 znaków zakresu).
// Zmierzone ciała odpowiedzi na „/": fonty 457 780 → 210 616 B,
// CSS 106 390 → 98 723 B, razem 1 364 096 → 1 110 071 B.
// Liczba PLIKÓW fontów się nie zmieniła (12) — subsetowanie tnie bajty,
// nie żądania. Warn `font.count <= 8` świeci więc od Etapu 4.2 i nigdy
// nie zgaśnie bez usunięcia kroju albo wagi (czyli zmiany designu).
// KANDYDAT na osobny commit po zielonym CI tej gałęzi: warn count 8 → 12
// oraz NOWY error `resource-summary:font:size` ≤ 230 000 (ratchet od
// zmierzonych 210 616 B, ~9 % zapasu) — bo pilnować chcemy bajtów,
// a nie liczby requestów.
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      // „/" + jedna trasa tekstowa. /polityka-prywatnosci/ nigdy nie
      // dostanie mediów z R2 (same sekcje tekstu), więc jest bezpiecznym
      // drugim punktem pomiaru kosztu samego chrome'u. Podstrony
      // z mediami (/realizacje/) ładują obrazy z media.pracownia-eha.pl —
      // zewnętrzna sieć w CI = flaky (ta sama zasada co CHECK_REMOTE_MEDIA
      // poza ścieżką PR), dlatego ich tu nie ma.
      url: ["/", "/polityka-prywatnosci/"],
      numberOfRuns: 3, // mediana — tłumi szum runnera
    },
    assert: {
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.8 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 5000 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 40000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 1200000 }],
        "resource-summary:font:count": ["warn", { maxNumericValue: 8 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
