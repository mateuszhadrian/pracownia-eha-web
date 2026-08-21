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
  (`node scripts/make-icons.mjs`) — `favicon.ico` (16+32+48),
  `apple-touch-icon`, `icon-192/512` renderowane Z WEKTORA
  `public/favicon.svg` (znaczek EH/A) oraz `og-image.png` (pełne logo na
  tle „papieru", 1200×630). Ikony są BEZ alfy (iOS podkłada czerń).
  Nie podmieniaj tych plików ręcznie — po zmianie `favicon.svg` przepuść
  skrypt. STAN Etapu 0: wyjścia to placeholdery; finalny odrys znaczka
  (weryfikacja pixel-diffem, próg ≤ 2% — wzorzec szablonu) i kalibracja
  marginesów = Etap 6.
- `migrate-realizacje-gallery.mjs`: wzorzec migracji JSON-ów kolekcji
  (świadomy wyjątek od zasady twardej nr 2 — wyłącznie za wyraźną zgodą
  Mateusza; idempotentny, `--dry`). Zostaje jako szablon na wypadek
  migracji schematu w Etapie 2.
