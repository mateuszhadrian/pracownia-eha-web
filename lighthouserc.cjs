// Lighthouse CI — profil MOBILE (domyślna emulacja LHCI: Moto G Power,
// CPU 4×, sieć 4G) = nasz proxy „słabszego Androida".
// Profil desktop: lighthouserc.desktop.cjs.
//
// ⚠️ STAN Etapu 0: progi to LUŹNE wartości tymczasowe — realne budżety
// powstają w Etapie 3 z pomiaru szkieletu+home W CI (lhci collect
// --numberOfRuns + mediana), z zapasem na przyrost sekcji Etapu 4;
// od tego momentu ratchet (zacieśnianie tylko decyzją Mateusza,
// osobne commity).
//
// ⚠️ LOKALNY `lhci autorun` z tym configiem WYPADA GORZEJ NIŻ CI i to jest
// normalne: emulacja mobile dokłada stały mnożnik CPU do hosta, więc wynik
// zależy od obciążenia Maca. Czerwony przebieg lokalny NIE jest powodem do
// ruszania progów; bramkuje CI i tylko pomiar z CI jest podstawą ratchetu.
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      // Sam „/": podstrony z mediami (/realizacje/) ładują obrazy z
      // media.pracownia-eha.pl — zewnętrzna sieć w CI = flaky (ta sama
      // zasada co CHECK_REMOTE_MEDIA poza ścieżką PR).
      url: ["/"],
      numberOfRuns: 3, // mediana — tłumi szum runnera
    },
    assert: {
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.75 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 6000 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 60000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 1500000 }],
        "resource-summary:font:count": ["warn", { maxNumericValue: 8 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
