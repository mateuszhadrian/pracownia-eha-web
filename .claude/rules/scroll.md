---
paths:
  - "src/scripts/overlay.ts"
  - "src/layouts/BaseLayout.astro"
  - "tests/helpers/scroll.ts"
---

# Scroll — reguły

**Scroll w serwisie jest NATYWNY, wszędzie i na każdym urządzeniu** —
także scroll dokumentu jako trigger animacji (kontener `position:fixed`
z eksportów designów to artefakt środowiska Claude Design — E11, nie
odtwarzamy go). Żadna biblioteka nie pośredniczy w kółku ani w dotyku;
strażnik e2e „scroll jest natywny" wraca ze specami widoków (Etap 3/4 —
wzorzec w repo szablonu — patrz CLAUDE.md).

## Dlaczego w szablonie Lenis wyszedł z projektu (lekcja D-Q1)

Reguła odziedziczona z poprzedniego wdrożenia wraz z pomiarem — obowiązuje
tu od pierwszego dnia:

- Objaw: na stronie głównej w Safari na macOS scroll klatkował,
  **wyłącznie dopóki widać było pierwszy ekran**.
- Sesja pomiarowa (15 wariantów na fizycznym MacBooku) ustaliła: koszt to
  **duże zdjęcie przycinane maską** w typografii hero. Osobno maska
  i zdjęcie są tanie, razem są drogie do PRZEMALOWANIA — a przemalowanie
  zdarzało się przy każdej zmianie pozycji scrolla, bo Lenis pchał scroll
  JS-em klatka po klatce. Przy scrollu natywnym robi to kompozytor
  i koszt znika.
- Wniosek nadrzędny: koszt nie był w bibliotece, tylko w spotkaniu
  JS-owego scrolla z drogą do przemalowania warstwą. **Wróci
  wygładzacz — wróci klatkowanie.**

## Konsekwencje w kodzie

- `BaseLayout` nie ma propa `smoothScroll` ani atrybutu
  `data-smooth-scroll` — nie ma czego przełączać.
- Markup nie niesie atrybutów `data-lenis-prevent*` (były podpowiedzią dla
  biblioteki). Kontrakt karuzel to **`scroll-snap-stop: always`**
  i on zostaje.
- `overlay.ts` blokuje scroll `body { position: fixed }` + zapamiętana
  pozycja, a odblokowuje natywnym `window.scrollTo`. Ta ścieżka jest
  jedyna — nie ma gałęzi alternatywnej.
- Dekoracje zależne od scrolla (np. postęp navbara przy auto-hide — E11,
  Etap 4.1) wygładzaj WYŁĄCZNIE własną pętlą rAF na samej dekoracji:
  Safari dostarcza zdarzenia `scroll` rzadziej, niż przewija (async
  scrolling). Sceny przypięte czytają prawdziwą pozycję scrolla i muszą
  trzymać się jej co do piksela.
