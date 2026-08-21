# Indeks dokumentacji — status plików

> Konwencja jak w delung-web/hadrianm-web: każdy plik `.md` bezpośrednio
> w `docs/` ma tu wpis ze statusem. **Dodajesz nowy plik do `docs/`?
> Dopisz go tutaj.** Zmieniasz decyzję opisaną w którymś dokumencie?
> Zaktualizuj jego status/adnotacje i ten indeks.
>
> Podkatalog `design/` = referencje designów (eksporty HTML z Claude
> Design) — poza indeksem, patrz `design/README.md`.

## ✅ Aktualne — źródła prawdy

| Plik                                    | Czego dotyczy                                                                                                                                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pracownia-eha-web-entrance-analysis.md` | **Analiza wejściowa** projektu pracownia-eha.pl: decyzje podjęte (E1–E14), architektura docelowa, różnice względem delung-web (w tym integracja z domeną i pocztą w The Camels), schemat CMS, routing/SEO, ryzyka                        |
| `pracownia-eha-web-creation-process.md`  | **Instrukcja wykonawcza** budowy strony: Część A (checklista), Część B (Etapy 0–7 krok po kroku, z wymienną sekcją 1B The Camels), Część C (flow mediów klienta), Część D (backupy)                                                     |
| `daily-workflow.md`                      | **Codzienny proces pracy** (od Etapu 1A): feature branch → `/test` → PR → `quality` → merge → auto-deploy; konwencja commitów, zakazy (`git add .`, baseline'y), tabela checków z celowo czerwonymi `e2e`/`prod-smoke` do Etapów 3/1B     |
