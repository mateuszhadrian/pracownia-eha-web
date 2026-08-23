// Lighthouse CI — profil DESKTOP (preset lighthouse:desktop).
// Reszta zasad jak w lighthouserc.cjs (tam pełny opis ratchetu).
//
// BUDŻETY = RATCHET od Etapu 3 (2026-08-23). Pomiar bazowy szkieletu „/"
// na runnerze CI (run 32652597911, mediana z 3): performance 1,00,
// LCP 652 ms, TBT 0 ms, CLS 0,002, script 4,2 KB, total 332 KB, fonty 7.
// Zapas na Etap 4 jak w profilu mobile (w delung desktop zamknął się
// w 1,58 MB total przy LCP 1700 ms).
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["/", "/polityka-prywatnosci/"],
      numberOfRuns: 3,
      settings: { preset: "desktop" },
    },
    assert: {
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 40000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 2000000 }],
        "resource-summary:font:count": ["warn", { maxNumericValue: 8 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
