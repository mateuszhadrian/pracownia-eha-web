# Designy — eksporty Claude Design (referencje)

> Eksporty w `export/` przegląda się WPROST Z DYSKU (otwierają się
> i dają przeklikać). Są referencją **WYGLĄDU I ZACHOWANIA**, nie
> implementacji — ich budowa (dwa drzewa markupu przełączane w JS,
> szablonowanie `{{ }}`, scroll w kontenerze `position:fixed`, mnożniki
> `--k`/`--w`, `cqw`) to artefakty środowiska Claude Design i NIE wchodzi
> do kodu (zasada §3 analizy). Implementacja ma być optymalna w Astro:
> SSR, `@media` przy progu 1024 px, `clamp()`/tokeny.
>
> Katalog `export/assets/` (131 MB PNG/JPG) jest POZA repo (`.gitignore`)
> — żyje na dysku Mateusza i w backupach. Assety to FINALNE źródła
> materiałów (E14): sekcje statyczne przechodzą przez
> `node scripts/optimize-images.mjs <src> <out.webp> [szer] [q]` → WebP
> w `src/assets/` przy budowie widoków (Etap 4); materiały realizacji idą
> przez panel do R2 (Etap 2), nie do repo.

## Mapa plik → route

| Plik eksportu                    | Route                         | Uwagi                                                                    |
| -------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `index.html`                     | `/`                           | hero + 6 zajawek + stopka; najcięższa strona                              |
| `ekipa-eha.html`                 | `/ekipa-eha/`                 | biogramy Łukasz/Maciek, zwijane akapity                                   |
| `kompetencje-i-technologie.html` | `/kompetencje-i-technologie/` | 5 kompetencji + „świadome granice"; zwijane akapity                       |
| `tradycja-i-ekologia.html`       | `/tradycja-i-ekologia/`       | jedyna strona z animowanym diagramem                                      |
| `realizacje.html`                | `/realizacje/`                | siatka (drugi próg 700 px) + detal + paginacja; **brak stopki = niedoróbka eksportu — stopka wchodzi z chrome'u** (E14) |
| `obsluga-budowy.html`            | `/obsluga-budowy/`            | najlżejsza strona                                                         |
| `kontakt.html`                   | `/kontakt/`                   | formularz: **4 pola** (5. pole desktopu = pomyłka eksportu, E9)           |
| `polityka-prywatnosci.html`      | `/polityka-prywatnosci/`      | 9 sekcji + spis treści; pasmo daty puste — data wchodzi przy wdrożeniu    |

Logo NIE leży w `assets/` — siedziało jako base64 (maski CSS
`.eha-logo-full`/`.eha-logo-sign`) w każdym HTML; zwektoryzowane w Etapie
0.4 do `src/assets/logo/eha-logo.svg` (+ `eha-logo-sign.svg` pod ikony).

## Przemianowanie assetów (Etap 0.6, E14)

Nazwy plików NIE niosą informacji („test" w nazwie ≠ placeholder).
Referencje w eksportach HTML zostają PO STAREMU (to tylko podgląd —
po przemianowaniu podgląd może nie doładować części obrazków; źródłem
prawdy nazw jest ta tabela).

### Zmienione nazwy (stare → nowe)

| Stara nazwa                                        | Nowa nazwa                          | Powód                       |
| -------------------------------------------------- | ----------------------------------- | --------------------------- |
| `łukasz-test-portrait.png`                          | `lukasz-portrait.png`               | polskie znaki + człon „test" |
| `maciek-kroi.JPG`                                   | `maciek-kroi.jpg`                   | spójne rozszerzenie          |
| `Maciek-pod-sufitem.jpg`                            | `maciek-pod-sufitem.jpg`            | lowercase                    |
| `Maciek2.jpg`                                       | `maciek2.jpg`                       | lowercase                    |
| `Czernica_elewacja_szachulcowa-3.png`               | `czernica-elewacja-szachulcowa-3.png` | lowercase + myślniki       |
| `haouse-old1.png`                                   | `house-old1.png`                    | literówka                    |
| `cegla-rozbiorkowa-ba699e9a.png`                    | `cegla-rozbiorkowa.png`             | zbędny hash                  |
| `dom-z-bala2-b4f04420.jpg`                          | `dom-z-bala2.jpg`                   | zbędny hash                  |
| `dom-z-bala3-d850da88.jpg`                          | `dom-z-bala3.jpg`                   | zbędny hash                  |
| `dom-z-bala4-203d3930.jpg`                          | `dom-z-bala4.jpg`                   | zbędny hash                  |
| `hero-tradycja-i-ekologia1-6e9f3fdd.png`            | `hero-tradycja-i-ekologia1.png`     | zbędny hash                  |
| `technical-elements-ryc_0002_Background-copy-3.png` | `technical-elements-ryc.png`        | śmieciowy człon warstwy      |
| `dom-ryc_0000_house8.png` … `dom-ryc_0007_house1.png` | `dom-ryc-house8.png` … `dom-ryc-house1.png` | podkreślenia + numer warstwy |

### Scalone duplikaty (bajt w bajt — potwierdzone `cmp`)

| Skasowany plik                     | Zostaje                  |
| ---------------------------------- | ------------------------ |
| `eha-kolek-ryc-81b8a182.png`       | `eha-kolek-ryc.png`      |
| `ekipa-budowlana1-7aa18d17.png`    | `ekipa-budowlana1.png`   |
| `ekologia-techno-ai-d22832e6.png`  | `ekologia-techno-ai.png` |
| `haouse-old1-6e3801de.png`         | `house-old1.png`         |

Stan po porządkach: **64 pliki**, wszystkie lowercase-ASCII.

## paper-background (najwyższy priorytet 0.6)

`paper-background.png` (2,2 MB) był tłem KAŻDEJ strony i panelu.
W repo zastępuje go **`src/assets/paper-tile.webp` (12 KB)** — bezszwowy
kafelek: spokojny wycinek 380×380 z oryginału, kontrast dużych plam
spłaszczony (×0,72), lustrzane 2×2 → 512×512 WebP q58; podpięty w
`global.css` (`body { background: var(--bg) url(...) repeat }`).
Kalibracja per widok (jeśli potrzebna) — Etap 4.
