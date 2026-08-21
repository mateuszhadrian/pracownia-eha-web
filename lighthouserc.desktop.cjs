// Lighthouse CI — profil DESKTOP (preset lighthouse:desktop).
// Reszta zasad jak w lighthouserc.cjs (tam pełny opis ratchetu).
//
// ⚠️ STAN Etapu 0: progi to LUŹNE wartości tymczasowe — realne budżety
// powstają w Etapie 3 z pomiaru w CI (patrz lighthouserc.cjs).
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["/"],
      numberOfRuns: 3,
      settings: { preset: "desktop" },
    },
    assert: {
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 60000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 2500000 }],
        "resource-summary:font:count": ["warn", { maxNumericValue: 8 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
