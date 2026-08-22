# Codzienny proces pracy (od Etapu 1A)

> **Status:** AKTUALNE (2026-08-21). Obowiązuje od założenia repo i rulesetu
> `main-protection`. Konwencja jak daily-workflow delung-web, dostosowana do
> stanu eha (do Etapu 3 required check to tylko `quality`).
>
> **Zasada nadrzędna: `main` = produkcja.** Każdy merge do main uruchamia
> automatyczny deploy Cloudflare Pages (`pracownia-eha-web.pages.dev`;
> po Etapie 1B także `pracownia-eha.pl`). Bezpośredni push na main jest
> zablokowany rulesetem — wszystko idzie przez PR.

## Standardowy cykl zmiany

```bash
# 1. Zawsze startuj ze świeżego main
git checkout main && git pull

# 2. Feature branch (konwencja: typ/krotki-opis)
git checkout -b feat/nazwa-zmiany      # albo fix/..., docs/..., chore/...

# 3. Praca (sesja Claude Code zostawia zmiany w working tree — commitujesz TY)

# 4. Testy przed commitem — w sesji Claude: /test (dobiera warstwy do zmian);
#    ręcznie minimum:
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build

# 5. Commit (conventional commits ze scope, po angielsku, temat małą literą)
git add <konkretne-pliki-lub-katalogi>   # NIGDY git add . / git add -A
git commit -m "feat(realizacje): short description"

# 6. Push + PR
git push -u origin feat/nazwa-zmiany
gh pr create --base main --title "feat(realizacje): short description" --body "Co i po co. Testy: ..."

# 7. Czekasz na checki → merge (squash) → sprzątanie
gh pr merge --squash --delete-branch
git checkout main && git pull
```

Po merge'u: Cloudflare Pages deployuje automatycznie (~1–2 min);
workflow `prod-smoke.yml` sam sonduje produkcję. Warto klik-sprawdzić
stronę (+ `/admin` od Etapu 2).

## Konwencja commitów

- **Conventional commits ze scope, po angielsku, temat małą literą**:
  `feat(chrome): add navbar auto-hide`, `fix(work): close overlay on
  breakpoint change`, `docs(cms): describe media flow`,
  `test(e2e): cover pagination`, `chore(deps): bump astro`.
- Scope'y w praktyce: `bootstrap`, `chrome`, `home`, `realizacje`, `work`,
  `ekipa`, `kompetencje`, `tradycja`, `obsluga`, `kontakt`, `polityka`,
  `cms`, `seo`, `ci`, `deps`, `claude`, `project`.
- Pilnuje tego commitlint (husky, hook `commit-msg`) — zły format nie
  przejdzie lokalnie.
- Decyzje ze skutkami (zmiana progów LHCI, nowe baseline'y, zmiana
  schematu CMS) = **osobne commity**, nie doklejki do feature'a.

## Zakazy twarde przy commitach

- **NIGDY `git add .` ani `git add -A`** — od Etapu 2 JSON-y realizacji
  pisze Sveltia (commituje sama przez API), a slug z telefonu klienta może
  wprowadzić nazwę pliku w formie NFD: `git add .` dodałby wtedy obie
  ścieżki i na Linuksie powstałyby duplikaty wpisów (incydent szablonu
  2026-08-06). Dodawaj pliki/katalogi jawnie.
- Claude **nie commituje i nie pushuje** — proponuje treść commita, resztę
  robisz Ty (zasada twarda nr 1 w CLAUDE.md; blokada w settings.json).
- Baseline'y wizualne (`tests/visual/__screenshots__/`, od Etapu 3) tylko
  po obejrzeniu diffu; kolejność NA ZAWSZE: kod → workflow linux
  (`update-visual-baselines.yml`) → commit darwin na końcu.
- `src/content/realizacje/*.json` — nie ruszać ręcznie (panel `/admin`).

## Checki na PR — co jest wymagane, a co świeci na czerwono celowo

| Check        | Status dziś (przed Etapem 3)                    | Required? |
| ------------ | ------------------------------------------------ | --------- |
| `quality`    | musi być ✅ (format → lint → typecheck → unit → build) | **TAK** |
| `e2e`        | ❌ CELOWO: `test:visual` nie ma speców/fixture'a (wchodzą w Etapie 3); same testy e2e przechodzą | nie |
| `lighthouse` | ✅ (progi tymczasowe, luźne — realne budżety w Etapie 3) | nie |
| `prod-smoke` | ❌ CELOWO: czeka na `https://pracownia-eha.pl` (Etap 1B) | n/d (po merge'u) |

**Czerwony `e2e`/`prod-smoke` przed Etapami 3/1B NIE blokuje merge'a
i nie jest powodem do „naprawiania".** W Etapie 3 required checks
rozszerzają się do kompletu `quality`+`e2e`+`lighthouse` (klik w rulesecie)
i od tego momentu wszystko ma być zielone.

## Przypadki specjalne

- **Zapis z panelu Sveltia (od Etapu 2):** konto `pracownia-eha-cms` commituje
  PROSTO na main (User-bypass w rulesecie — jedyny legalny wyjątek).
  Po zapisie klienta: `git checkout main && git pull` przed dalszą pracą.
- **Zmiana schematu CMS:** zawsze trzy miejsca naraz
  (`content.schema.ts` / `config.yml` / komponenty work) w JEDNYM PR;
  reguła `.claude/rules/cms-realizacje.md`.
- **Hotfix produkcji:** ta sama droga (branch → PR → `quality` → merge) —
  ruleset nie ma wyjątków dla ludzi; przy realnym pożarze można w rulesecie
  chwilowo wyłączyć Enforcement (Settings → Rules), ale to decyzja
  świadoma i do natychmiastowego cofnięcia.
- **Awaria GitHub Actions** (webhooki nie tworzą biegów): oba workflowy
  mają `workflow_dispatch` — odpal ręcznie z zakładki Actions
  (lekcja szablonu 2026-08-06).

## Nota o enforcement

Repo jest **publiczne** (świadoma decyzja E12, jak delung): ruleset
`main-protection` jest egzekwowany za darmo. W repo nie ma i nie może być
żadnych sekretów — tokeny/klucze żyją w menedżerze haseł i w zmiennych
Cloudflare Pages/Workers; `config.yml` niesie tylko wartości jawne
(account_id / access_key_id — autoryzuje dopiero Secret, podawany
w panelu).
