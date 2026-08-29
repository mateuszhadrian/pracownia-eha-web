---
paths:
  - "scripts/**/*.mjs"
---

# Skrypty dev-only (optymalizacja / zasoby marki) — reguły

- `optimize-images.mjs`: PNG/JPG z eksportów designów
  (`docs/design/export/assets` — POZA repo, w .gitignore; tabela nazw
  w `docs/design/README.md`) → WebP w docelowych rozmiarach do
  `src/assets/` (`node scripts/optimize-images.mjs <src> <out.webp>
[szer] [q]`). Osobne warianty desktop/mobile tam, gdzie mobile wymaga
  odciążenia (decyzja per widok w Etapie 4). Obrazy REALIZACJI nie idą
  do repo — od początku R2 + `imgAt()` (Etap 2).
- `lhci-median.mjs`: helper agregacji przebiegów LHCI — nie ruszać bez
  zmiany konfiguracji lighthouserc.
- `make-icons.mjs`: komplet zasobów marki jednym poleceniem
  (`node scripts/make-icons.mjs`). **ŹRÓDŁO = `src/assets/logo/eha-logo-sign.svg`**
  (znaczek) + `src/assets/logo/eha-logo.svg` (pełne logo na og-image).
  WYJŚCIE = `public/{favicon.svg, favicon.ico (16+32+48),
apple-touch-icon, icon-192/512, og-image.png}`.
  **`public/favicon.svg` jest GENERATEM od Etapu 6** (wcześniej był
  bajtową kopią znaczka i osobnym wejściem — dwa pliki bez powiązania).
  Skrypt przelicza mu sam `viewBox`, ścieżek nie rusza; dzięki temu SVG
  i rastry mają JEDEN kadr. To nie jest kosmetyka: Chrome/Firefox/Safari
  wolą `rel=icon type=image/svg+xml`, więc rozjazd byłby widoczny jako
  „inna ikona zależnie od przeglądarki". Nie edytuj go ręcznie —
  pilnuje tego asercja w `tests/e2e/seo.spec.ts` (znacznik `GENERAT:`).
  Ikony są BEZ alfy (iOS podkłada czerń). Kadr: przycięcie do bboxu
  tuszu + wyśrodkowanie z marginesem `ICON_PAD` (znaczek jest PODŁUŻNY
  1,42:1, więc wpisany w kwadrat zostawiał 41 % pustej wysokości,
  niesymetrycznie). Rastry **≤ `ICON_BOLD_MAX_PX` (32) dostają obrys**
  `ICON_BOLD_STROKE` — włosowy monogram przy 16 px schodzi poniżej
  piksela i zamienia się w szarą plamę; kontener ICO trzyma osobne
  obrazki per rozmiar. Ikony ≥ 48 px zostają włosowe.
  ⚠️ Pogrubienie NIE dotyczy `favicon.svg` (SVG nie zna rozmiaru
  docelowego) — na ekranach dpr 1 przeglądarka preferująca SVG dostanie
  wersję włosową. Przy dpr 2 rysuje się w 32 px i jest czytelna.
- `migrate-realizacje-gallery.mjs`: wzorzec migracji JSON-ów kolekcji
  (świadomy wyjątek od zasady twardej nr 2 — wyłącznie za wyraźną zgodą
  Mateusza; idempotentny, `--dry`). Zostaje jako szablon na wypadek
  migracji schematu w Etapie 2.
