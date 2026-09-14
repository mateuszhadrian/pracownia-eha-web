# Zadania cykliczne i świadomie odłożone

> **Status:** AKTUALNE (2026-09-14). Dom dla rzeczy, które nie należą do
> żadnego etapu, ale nie wolno o nich zapomnieć: utrzymanie cykliczne
> (odświeżanie zależności infrastrukturalnych) i pozycje odłożone
> świadomą decyzją Mateusza. Instrukcja wykonawcza odsyła tu dwa razy
> („wpisz do optional-todos"), a plik do 2026-09-14 nie istniał.
>
> Konwencja: każda pozycja ma DLACZEGO odłożona i CZYM się objawi, gdy
> przestanie być odkładalna. Pozycję zamkniętą kasuj razem z commitem,
> który ją domyka.

## Utrzymanie cykliczne

| Co                                     | Rytm        | Dlaczego                                                                                                                                                                     |
| -------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker `sveltia-cms-auth-eha`          | co 3–6 mies. | Fork logowania do panelu; upstream łata flow OAuth. Redeploy: `npx wrangler deploy` z **`keep_vars = true`** — bez tego czyści zmienne (`GITHUB_CLIENT_ID/SECRET`, `ALLOWED_DOMAINS`). |
| Sveltia CMS (dziś `0.178.0`, przypięta) | co 3–6 mies. | Bump tylko po przejrzeniu changelogu i sondzie binarium — panel to jedyne narzędzie klienta; awaria = klient nie doda realizacji.                                              |
| Backup R2 → dysk (Część D instrukcji)   | tygodniowo   | `eha-media` jest JEDYNĄ kopią mediów klienta (R2 bez wersjonowania).                                                                                                           |
| Przegląd budżetów LHCI                  | po większych zmianach | Ratchet tylko świadomą decyzją, osobnym commitem (`testing.md`).                                                                                                     |

## Odłożone świadomą decyzją (osobne PR-y „kiedyś")

1. **Kolizja plakietki wideo z przyciskiem `×`** w podglądzie
   pełnoekranowym na desktopie — plakietka nachodzi na `×` o 44 px
   (stan zastany od 4.3, nasilony przez wskaźnik ładowania z sesji przed
   Etapem 6). Lekarstwo: jedna reguła `right: 64px` dla hintu w `.lb-media`.
2. **Cięższy wariant znaku dla faviconu przy dpr 1** — rastry ≤ 32 px
   dostają obrys (`ICON_BOLD_STROKE`), ale SVG nie zna rozmiaru
   docelowego, więc przeglądarka preferująca `favicon.svg` przy dpr 1
   dostaje wersję włosową. Domknięcie = decyzja projektowa (osobny wektor).
3. **Zamrożenie transformów `[data-plx]` w `revealSweep`** przed zrzutem
   fullPage — usuwa źródło flake'a `index-full` zamiast podnosić progi
   (dziś 0.008). Unieważnia baseline'y wszystkich tras z kadrami, więc
   najtaniej wchodzi razem z PR-em, który i tak je przepisuje.
4. **Blok „ZADZWOŃ DO NAS" na `/kontakt/` wciąż monospaced** — ostatni
   z pięciu „bliźniaków tekstowych"; krój ujednolicono tylko w zajawce 06
   na `/` (poprawka klienta dotyczyła tamtego miejsca). Rusza baseline'y
   `kontakt-*`.
5. **Backup poziomu 2 (off-site)** — Actions cron + rclone → Backblaze B2
   albo restic. Wchodzi po tym, jak poziom 1 (kopia lokalna) się ustabilizuje.
6. **Przecinek przed „oraz"** w zdaniu CTA na `/obsluga-budowy/` —
   interpunkcyjny błąd w tekście od klienta, zostawiony dosłownie.
   Do poprawy wyłącznie za jego zgodą.
