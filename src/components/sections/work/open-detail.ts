// Otwarcie i mechanika detalu realizacji (część 4.4) — JEDEN overlay
// #work-detail (WorkDetailOverlay.astro), współdzielony przez siatkę
// /realizacje/ i zajawkę strony głównej. Wariant modal↔sheet to czysty
// CSS przy WORK_DESKTOP_MIN_PX (dawny próg 760/sheetMQ znika — D-R3);
// zmiana progu przy otwartym detalu ZAMYKA go (reguła sections.md).
//
// Treść klonowana z <template data-work-detail="slug"> do hosta
// [data-work-host] (dt-body) i czyszczona po zamknięciu (zwalnia
// obrazy/DOM). Galeria: <1024 karuzela snap (licznik ze scrolla toru),
// ≥1024 przełączanie translateX (strzałki/dashes) — a sama galeria
// wędruje między dt-body (mobile, strumień scrolla) a panelem .dt
// (desktop, lewa kolumna): wzorzec placeGal z eksportu, wykonywany przy
// klonowaniu (próg nie zmieni się przy otwartym — patrz wyżej).
//
// Korekty Mateusza po testach 4.4:
//  • tap/klik w kadr galerii (zdjęcie i wideo) otwiera PODGLĄD
//    PEŁNOEKRANOWY ([data-lightbox] w chrome overlaya): mobile swipe
//    (snap) + chevron-wstecz, desktop strzałki/dashes (przejazd toru)
//    + X + Esc; wyjście wraca na kadr oglądany w podglądzie;
//  • wideo odtwarza się na tap w badge DOPIERO w podglądzie;
//  • projnav nie robi crossfade'u — bieżący modal odjeżdża za krawędź
//    ekranu, następny wjeżdża zza przeciwnej.
//
// Sesja linków do realizacji (docs/analiza-linki-realizacji.md) dołożyła
// ADDYTYWNIE warstwę adresu: pasek adresu podąża za detalem
// (`/realizacje/<id>/`), „wstecz" zamyka podgląd pełnoekranowy, potem
// detal; wejście z linku otwiera detal bez animacji; stopka detalu
// udostępnia link. Przepływ otwierania, klonowania i nawigacji nietknięty,
// `overlay.ts` nietknięty — patrz sekcja „historia przeglądarki" niżej.
//
// `window.overlay` typowane w scripts/overlay.ts (declare global).
import { WORK_INDEX_PATH, workDetailPath } from "@/lib/routes";
import {
  VIDEO_LOADING_DELAY_MS,
  VIDEO_LOADING_MIN_MS,
  VIDEO_LOADING_TIMEOUT_MS,
  WORK_DESKTOP_MIN_PX,
  WORK_SHARE_COPIED_MS,
} from "./work-config";

const OVERLAY_ID = "work-detail";
const desktopMQ = matchMedia(`(min-width: ${WORK_DESKTOP_MIN_PX}px)`);
const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
const pad = (n: number) => String(n).padStart(2, "0");

// Kontekst nawigacji projnav (poprzednia/następna realizacja) — lista
// slugów w kolejności bieżącego widoku: /realizacje/ podaje aktualnie
// PRZEFILTROWANY zbiór (aktualizuje przy zmianie filtra), strona główna
// swoje 3 zajawki. Licznik „REALIZACJA NN / NN" czyta z tej listy.
let context: { slug: string; name: string }[] = [];
let current = "";
let shot = 0;

export function setDetailContext(items: { slug: string; name: string }[]) {
  context = items;
}

function overlayEl() {
  return document.getElementById(OVERLAY_ID);
}

function q<T extends HTMLElement>(sel: string): T | null {
  return overlayEl()?.querySelector<T>(sel) ?? null;
}

function pauseVideos() {
  overlayEl()
    ?.querySelectorAll<HTMLVideoElement>("video")
    .forEach((v) => {
      v.pause();
    });
}

/* ── galeria ── */

function paintShot() {
  const track = q<HTMLElement>("[data-track]");
  if (!track) return;
  const n = track.children.length;
  shot = Math.max(0, Math.min(n - 1, shot));

  const count = q<HTMLElement>("[data-shotcount]");
  if (count) count.textContent = `${pad(shot + 1)} / ${pad(n)}`;
  overlayEl()
    ?.querySelectorAll<HTMLElement>("[data-dashes] [data-shot]")
    .forEach((d, i) => d.classList.toggle("on", i === shot));

  if (desktopMQ.matches) {
    track.style.transform = `translateX(${-shot * 100}%)`;
  } else {
    track.style.transform = "";
    const slide = track.children[shot] as HTMLElement | undefined;
    if (slide) {
      track.scrollTo({
        left: slide.offsetLeft - track.offsetLeft,
        behavior: reduceMQ.matches ? "auto" : "smooth",
      });
    }
  }

  const prev = q<HTMLButtonElement>("[data-prevshot]");
  const next = q<HTMLButtonElement>("[data-nextshot]");
  if (prev) prev.disabled = shot === 0;
  if (next) next.disabled = shot === n - 1;
}

/** Licznik i kreski-wskaźniki nadążają za ręcznym przewijaniem
 *  karuzeli (mobile). Kreski TAKŻE tu, nie tylko w paintShot (skin 4.3
 *  pokazuje je na mobile — w delung były schowane i scroll ich nie
 *  malował); paintShot nie może być wołany ze scrolla, bo sam
 *  scrolluje tor (walczyłby z palcem). */
function onTrackScroll(e: Event) {
  if (desktopMQ.matches) return;
  const track = e.currentTarget as HTMLElement;
  const first = track.children[0] as HTMLElement | undefined;
  if (!first) return;
  const w = first.offsetWidth + 10; // szerokość kafla + gap toru
  const n = Math.round(track.scrollLeft / w);
  if (n === shot) return;
  shot = Math.max(0, Math.min(track.children.length - 1, n));
  const count = q<HTMLElement>("[data-shotcount]");
  if (count)
    count.textContent = `${pad(shot + 1)} / ${pad(track.children.length)}`;
  overlayEl()
    ?.querySelectorAll<HTMLElement>("[data-dashes] [data-shot]")
    .forEach((d, i) => d.classList.toggle("on", i === shot));
}

/* ── montaż treści projektu w hoście ── */

function mount(slug: string): boolean {
  const tpl = document.querySelector<HTMLTemplateElement>(
    `template[data-work-detail="${slug}"]`,
  );
  const el = overlayEl();
  const host = el?.querySelector<HTMLElement>("[data-work-host]");
  const panel = el?.querySelector<HTMLElement>("[data-overlay-panel]");
  if (!tpl || !el || !host || !panel) return false;

  pauseVideos();
  // sprzątnij ewentualną galerię przeniesioną do panelu (poprzedni projekt)
  panel.querySelector(":scope > .dt-gal, :scope > [data-gal]")?.remove();
  host.replaceChildren(tpl.content.cloneNode(true));

  // placeGal eksportu: desktop przenosi galerię do panelu (lewa kolumna);
  // scoped-klasy Astro wędrują z węzłem, style działają po przeniesieniu.
  const gal = host.querySelector<HTMLElement>("[data-gal]");
  if (gal && desktopMQ.matches) panel.insertBefore(gal, host);

  // licznik REALIZACJA NN / NN z kontekstu widoku
  const idx = context.findIndex((c) => c.slug === slug);
  const pc = host.querySelector<HTMLElement>("[data-projcount]");
  if (pc && idx >= 0 && context.length)
    pc.textContent = `REALIZACJA ${pad(idx + 1)} / ${pad(context.length)}`;

  host
    .querySelector<HTMLElement>("[data-track]")
    ?.addEventListener("scroll", onTrackScroll, { passive: true });

  current = slug;
  shot = 0;
  host.scrollTop = 0;
  paintShot();
  return true;
}

function cleanup() {
  closeLightbox();
  const el = overlayEl();
  if (!el) return;
  pauseVideos();
  el.querySelector<HTMLElement>(
    "[data-overlay-panel] > .dt-gal, [data-overlay-panel] > [data-gal]",
  )?.remove();
  el.querySelector<HTMLElement>("[data-work-host]")?.replaceChildren();
  current = "";
  exiting = false;
  swapSeq += 1; // unieważnij wiszące timeouty przejazdu projnav
  // JEDNO miejsce wyjścia: każda droga zamknięcia (×, Esc, swipe, tło,
  // zmiana progu, „wstecz") kończy się tutaj — i tu wraca adres.
  syncHistoryOnClose();
}

interface OpenOpts {
  /** Bez animacji wjazdu — wejście z linku (podstrona realizacji). */
  instant?: boolean;
  /** Co zrobić z historią przeglądarki:
   *  „push" (domyślnie — klik kafla) dokłada wpis z adresem podstrony,
   *  „entry" — jesteśmy JUŻ na podstronie (wejście z linku), wpis tylko
   *  oznaczamy; „none" — wołający sam ustawił stan (popstate). */
  history?: "push" | "entry" | "none";
}

/** Otwiera detal realizacji. Zwraca `false`, gdy się nie da (brak
 *  szkieletu overlaya albo <template> dla slugu) — konsument z sensownym
 *  `href` (kafle są linkami do podstron) ma po czym poznać, że NIE wolno
 *  robić preventDefault i trzeba puścić nawigację. */
export function openWorkDetail(
  slug: string,
  name: string,
  opts: OpenOpts = {},
): boolean {
  if (!window.overlay || !mount(slug)) return false;
  const el = overlayEl();
  const mode = opts.history ?? "push";
  // pushState PRZED overlay.open: blokada scrolla (body{position:fixed})
  // zeruje scrollY, a przeglądarka zapisuje pozycję wpisu w chwili
  // przejścia — wpis listy musi dostać prawdziwą pozycję, żeby „wstecz"
  // wróciło dokładnie tam, gdzie użytkownik był.
  if (mode === "push") {
    titleBefore = document.title;
    history.pushState(
      { wd: slug } satisfies DetailState,
      "",
      workDetailPath(slug),
    );
    histMode = "pushed";
  } else if (mode === "entry") {
    titleBefore = el?.dataset.indexTitle ?? document.title;
    history.replaceState({ wd: slug } satisfies DetailState, "", location.href);
    histMode = "entry";
  }
  if (histMode) {
    // wpisy detalu bez automatycznego przywracania scrolla: przy
    // otwartym detalu scrollY = 0 (blokada), a pozycję listy i tak
    // przywraca overlay.ts po zamknięciu
    history.scrollRestoration = "manual";
    setDocTitle(slug);
  }
  if (opts.instant) el?.classList.add("is-instant");
  window.overlay.open(OVERLAY_ID, { label: name, onClose: cleanup });
  if (opts.instant) {
    // dwie klatki: stan otwarty musi zostać namalowany bez przejścia,
    // zanim przejścia wrócą (zamknięcie ma już normalną animację)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => el?.classList.remove("is-instant")),
    );
  }
  return true;
}

/* ── historia przeglądarki (sesja linków do realizacji) ──
   Wpisy detalu niosą stan `{ wd: <id> }` (podgląd pełnoekranowy:
   `{ wd, lb: true }`, ten sam adres). Tryby:
   • „pushed" — detal otwarty kliknięciem: wpis listy/strony głównej jest
     ZA nami, więc zamknięcie cofa historię (go(-1), z podglądem go(-2)),
     a „wstecz" przeglądarki zamyka detal (popstate niżej);
   • „entry"  — wejście z linku: za nami jest cudza strona (albo nic),
     więc zamknięcie PODMIENIA adres na /realizacje/ zamiast cofać.
   Projnav podmienia wpis (replaceState) — „wstecz" nie przechodzi po
   wszystkich obejrzanych realizacjach. */
interface DetailState {
  wd: string;
  lb?: true;
}
let histMode: "" | "pushed" | "entry" = "";
let lbPushed = false; // bieżący wpis historii to wpis podglądu
let closingFromPop = false; // zamknięcie wywołane „wstecz" — nie cofaj drugi raz
let ignorePop = 0; // popstate wywołane przez nas (go/back) — do pominięcia
let afterPop: (() => void) | null = null;
let titleBefore = "";

function setDocTitle(slug: string) {
  const t = document.querySelector<HTMLTemplateElement>(
    `template[data-work-detail="${slug}"]`,
  )?.dataset.docTitle;
  if (t) document.title = t;
}

function nameOf(slug: string): string {
  return (
    context.find((c) => c.slug === slug)?.name ??
    document
      .querySelector<HTMLTemplateElement>(
        `template[data-work-detail="${slug}"]`,
      )
      ?.content.querySelector(".dt-title")
      ?.textContent?.trim() ??
    ""
  );
}

function syncHistoryOnClose() {
  const mode = histMode;
  const lb = lbPushed;
  const fromPop = closingFromPop;
  histMode = "";
  lbPushed = false;
  closingFromPop = false;
  if (!mode) return;
  document.title = titleBefore;
  if (fromPop) return; // przeglądarka już stoi na właściwym wpisie
  if (mode === "pushed") {
    ignorePop += 1;
    history.go(lb ? -2 : -1);
    return;
  }
  const toIndex = () => {
    history.replaceState(null, "", WORK_INDEX_PATH);
    history.scrollRestoration = "auto";
  };
  if (lb) {
    ignorePop += 1;
    afterPop = toIndex;
    history.back();
  } else {
    toIndex();
  }
}

window.addEventListener("popstate", (e) => {
  if (ignorePop > 0) {
    ignorePop -= 1;
    const f = afterPop;
    afterPop = null;
    f?.();
    return;
  }
  if (!overlayEl()) return;
  const st = e.state as DetailState | null;
  if (st?.wd) {
    if (!current) {
      // „dalej" na wpis detalu zamkniętego wcześniej — otwórz ponownie
      if (!document.querySelector(`template[data-work-detail="${st.wd}"]`))
        return;
      titleBefore = document.title;
      histMode = "pushed";
      if (openWorkDetail(st.wd, nameOf(st.wd), { history: "none" }))
        lbPushed = Boolean(st.lb);
      else histMode = "";
      return;
    }
    lbPushed = Boolean(st.lb);
    if (lbOpen && !st.lb) closeLightbox();
    if (st.wd !== current && mount(st.wd)) {
      overlayEl()?.setAttribute("aria-label", nameOf(st.wd));
      setDocTitle(st.wd);
    }
    return;
  }
  // wpis bez detalu („wstecz" przy otwartym detalu) — zamknij
  if (current) {
    closingFromPop = true;
    lbPushed = false;
    window.overlay?.close(OVERLAY_ID);
  }
});

/* ── udostępnianie (stopka detalu) ──
   Telefon (<1024): systemowe menu udostępniania (Web Share API —
   WhatsApp, SMS, Messenger…); desktop albo brak API: kopiowanie adresu
   do schowka + „Link skopiowany" na przycisku. Adres = podstrona
   realizacji na BIEŻĄCEJ domenie (preview wskaże preview). */
let copiedTimer = 0;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // starsze przeglądarki / brak uprawnień — klasyczne execCommand
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    overlayEl()?.appendChild(ta);
    ta.select();
    let ok: boolean;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

function markCopied(btn: HTMLElement) {
  const status = btn.parentElement?.querySelector<HTMLElement>(
    "[data-share-status]",
  );
  btn.classList.add("is-copied");
  if (status)
    status.textContent =
      btn.querySelector(".dt-share-ok")?.textContent?.trim() ?? "";
  window.clearTimeout(copiedTimer);
  copiedTimer = window.setTimeout(() => {
    btn.classList.remove("is-copied");
    if (status) status.textContent = "";
  }, WORK_SHARE_COPIED_MS);
}

async function shareDetail(btn: HTMLElement) {
  const path = btn.dataset.sharePath;
  if (!path) return;
  const url = new URL(path, location.origin).href;
  if (!desktopMQ.matches && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: btn.dataset.shareTitle, url });
      return;
    } catch (err) {
      // anulowanie menu przez użytkownika to nie błąd; inne odmowy
      // (np. brak uprawnień) — spadamy do schowka
      if ((err as DOMException)?.name === "AbortError") return;
    }
  }
  if (await copyText(url)) markCopied(btn);
}

/* ── projnav: poprzednia/następna realizacja (desktop, pętla) ── */

let exiting = false; // blokada tylko na czas ZJAZDU (wjazd można przerwać)
let swapSeq = 0; // unieważnia wiszące timeouty po close/kolejnym kroku

function stepProject(dir: 1 | -1) {
  if (exiting || !current || context.length < 2) return;
  const idx = context.findIndex((c) => c.slug === current);
  if (idx < 0) return;
  const nextItem = context[(idx + dir + context.length) % context.length];
  const el = overlayEl();
  const panel = el?.querySelector<HTMLElement>("[data-overlay-panel]");
  if (!el || !panel) return;

  const swap = () => {
    if (!mount(nextItem.slug)) return;
    el.setAttribute("aria-label", nextItem.name);
    // adres podąża za realizacją, ale bez dokładania wpisu historii
    if (histMode) {
      history.replaceState(
        { wd: nextItem.slug } satisfies DetailState,
        "",
        workDetailPath(nextItem.slug),
      );
      setDocTitle(nextItem.slug);
    }
  };
  if (reduceMQ.matches) {
    swap();
    return;
  }

  // Przejazd (korekta Mateusza): przy „następna" cały modal odjeżdża za
  // LEWĄ krawędź ekranu, nowy wjeżdża zza PRAWEJ (przy „poprzednia"
  // lustrzanie). 100vw ponad wyśrodkowanie gwarantuje pełne zejście
  // z ekranu (panel ma maks. 92vw szerokości).
  exiting = true;
  const seq = ++swapSeq;
  const MS = 420;
  panel.style.transition = `transform ${MS}ms cubic-bezier(0.45, 0, 0.55, 1)`;
  panel.style.transform = `translate(calc(-50% - ${dir * 100}vw), -50%) scale(1)`;
  window.setTimeout(() => {
    if (seq !== swapSeq) return; // przerwane (close) — nie montuj po fakcie
    swap();
    panel.style.transition = "none";
    panel.style.transform = `translate(calc(-50% + ${dir * 100}vw), -50%) scale(1)`;
    void panel.offsetWidth;
    panel.style.transition = `transform ${MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    panel.style.transform = ""; // wraca do transformu klasy is-open (środek)
    // wjazd można przerwać kolejnym krokiem — zwolnij blokadę od razu
    exiting = false;
    window.setTimeout(() => {
      if (seq !== swapSeq || exiting) return; // nowy krok w toku
      panel.style.transition = "";
    }, MS + 40);
  }, MS);
}

/* ── podgląd pełnoekranowy galerii (korekta Mateusza po testach 4.4) ── */

let lbOpen = false;
let lbIndex = 0;
let lbSwallowClick = false; // tap kończący gest swipe-down ≠ kliknięcie

function lbTrackEl() {
  return q<HTMLElement>("[data-lb-track]");
}

function lbEl() {
  return q<HTMLElement>("[data-lightbox]");
}

/* Wyraźny swipe-down zamyka podgląd (mobile — korekta Mateusza).
   Pion jest wolny (tor przewija tylko poziomo, touch-action: pan-x);
   podgląd podąża za palcem i wraca, gdy gest nie przekroczy progu. */
const LB_CLOSE_PX = 100;
let lbDrag: {
  startX: number;
  startY: number;
  dy: number;
  axis: "" | "v" | "h";
} | null = null;

function onLbPointerMove(e: PointerEvent) {
  const lb = lbEl();
  if (!lbDrag || !lb) return;
  const dx = e.clientX - lbDrag.startX;
  const dy = e.clientY - lbDrag.startY;
  if (!lbDrag.axis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    lbDrag.axis = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
  }
  if (lbDrag.axis !== "v") return;
  lbDrag.dy = Math.max(0, dy);
  lb.style.transform = `translateY(${lbDrag.dy}px)`;
}

function onLbPointerEnd(e: PointerEvent) {
  if (!lbDrag) return;
  const { dy, axis } = lbDrag;
  lbDrag = null;
  window.removeEventListener("pointermove", onLbPointerMove);
  window.removeEventListener("pointerup", onLbPointerEnd);
  window.removeEventListener("pointercancel", onLbPointerEnd);
  const lb = lbEl();
  if (lb) lb.style.transform = "";
  if (axis === "v" && dy > LB_CLOSE_PX && e.type !== "pointercancel") {
    lbSwallowClick = true;
    closeLightboxByUser();
  }
}

function pauseLbVideos() {
  q<HTMLElement>("[data-lightbox]")
    ?.querySelectorAll<HTMLVideoElement>("video")
    .forEach((v) => {
      v.pause();
    });
}

/** Liczniki/dashes/przyciski podglądu — bez ruszania toru. */
function paintLbIndicators(n: number) {
  const el = overlayEl();
  if (!el) return;
  el.querySelectorAll<HTMLElement>("[data-lb-count]").forEach((c) => {
    c.textContent = `${pad(lbIndex + 1)} / ${pad(n)}`;
  });
  el.querySelectorAll<HTMLElement>("[data-lb-dashes] button").forEach((d, i) =>
    d.classList.toggle("on", i === lbIndex),
  );
  const prev = el.querySelector<HTMLButtonElement>("[data-lb-prev]");
  const next = el.querySelector<HTMLButtonElement>("[data-lb-next]");
  if (prev) prev.disabled = lbIndex === 0;
  if (next) next.disabled = lbIndex === n - 1;
}

function paintLb(instant = false) {
  const track = lbTrackEl();
  if (!track) return;
  const n = track.children.length;
  lbIndex = Math.max(0, Math.min(n - 1, lbIndex));
  paintLbIndicators(n);

  if (desktopMQ.matches) {
    // przejazd toru: bieżący kadr odjeżdża w lewo, następny wjeżdża
    // z prawej (i lustrzanie) — transition z bloku is:global
    if (instant) track.style.transition = "none";
    track.style.transform = `translateX(${-lbIndex * 100}%)`;
    if (instant) {
      void track.offsetWidth;
      track.style.transition = "";
    }
  } else {
    track.style.transform = "";
    const slide = track.children[lbIndex] as HTMLElement | undefined;
    if (slide) {
      track.scrollTo({
        left: slide.offsetLeft - track.offsetLeft,
        behavior: instant || reduceMQ.matches ? "auto" : "smooth",
      });
    }
  }
}

/** Licznik podglądu nadąża za swipe (mobile). */
function onLbScroll(e: Event) {
  if (desktopMQ.matches) return;
  const track = e.currentTarget as HTMLElement;
  const w = track.clientWidth || 1;
  const n = Math.round(track.scrollLeft / w);
  if (n === lbIndex) return;
  lbIndex = Math.max(0, Math.min(track.children.length - 1, n));
  pauseLbVideos();
  paintLbIndicators(track.children.length);
}

/* ── stan odtwarzania kadru w podglądzie (sesja poprawek wizualnych) ──
   Do tej sesji slajd dostawał klasę `is-playing` na zdarzeniu `play`,
   które leci NATYCHMIAST po wywołaniu play() — a obraz rusza dopiero na
   `playing`. Pomiar na pliku z R2 (throttling CDP): 0,65 s bez
   ograniczeń, 2,0 s na Fast 3G, 7,5 s na Slow 3G; do tego `waiting`
   w trakcie odtwarzania (3× na Fast 3G). Przez ten czas podpowiedź już
   zniknęła, a kadr stał nieruchomo — użytkownik brał film za zdjęcie
   (zgłoszenie Mateusza).
   Teraz slajd ma TRZY stany: spoczynek (podpowiedź „…, aby obejrzeć"),
   `is-loading` (plakietka „Poczekaj, ładuję wideo" + animowane kropki)
   i `is-playing` (bez znaków). Zmiana jest ADDYTYWNA — przepływ
   otwierania, klonowania i nawigacji nietknięty. */

/** Stan wskaźnika per kadr: timer zapłonu, bezpiecznik, timer dogaszania
 *  i chwila, w której plakietka realnie się pojawiła (`since`). */
const loadTimers = new WeakMap<
  HTMLElement,
  { show?: number; give?: number; hide?: number; since?: number }
>();

function clearLoadTimers(slide: HTMLElement) {
  const t = loadTimers.get(slide);
  if (!t) return;
  if (t.show !== undefined) window.clearTimeout(t.show);
  if (t.give !== undefined) window.clearTimeout(t.give);
  if (t.hide !== undefined) window.clearTimeout(t.hide);
  loadTimers.delete(slide);
}

/** Wskaźnik zapala się DOPIERO po VIDEO_LOADING_DELAY_MS — na szybkim
 *  łączu (0,65 s do `playing`) mignąłby na ~0,4 s i to wyglądałoby
 *  gorzej niż jego brak. Bezpiecznik gasi go po VIDEO_LOADING_TIMEOUT_MS
 *  i przywraca podpowiedź: iOS w Low Power Mode potrafi odrzucić
 *  odtwarzanie po cichu, bez `error`. */
function armLoading(slide: HTMLElement) {
  // ponowne uzbrojenie w trakcie już zapalonego wskaźnika (np. `waiting`
  // zaraz po `play`) nie może kasować licznika widoczności
  const trwa = slide.classList.contains("is-loading");
  const since = trwa ? loadTimers.get(slide)?.since : undefined;
  clearLoadTimers(slide);
  const t: { show?: number; give?: number; hide?: number; since?: number } = {
    since,
  };
  t.show = window.setTimeout(() => {
    // slajd mógł w międzyczasie zniknąć (zamknięty podgląd)
    if (!slide.isConnected) return;
    // Stany są ROZŁĄCZNE: `.is-playing` chowa całą plakietkę, więc przy
    // zacięciu w trakcie filmu (`waiting`) trzeba ją najpierw zdjąć —
    // inaczej wskaźnik byłby niewidoczny dokładnie wtedy, gdy jest
    // najbardziej potrzebny. Jeśli `playing` zdąży przed tym timerem,
    // settleSlide i tak go skasuje i wskaźnik się nie zapali.
    slide.classList.remove("is-playing");
    slide.classList.add("is-loading");
    const cur = loadTimers.get(slide);
    if (cur && cur.since === undefined) cur.since = Date.now();
  }, VIDEO_LOADING_DELAY_MS);
  t.give = window.setTimeout(() => {
    slide.classList.remove("is-loading");
    slide.classList.remove("is-playing");
    clearLoadTimers(slide);
  }, VIDEO_LOADING_TIMEOUT_MS);
  loadTimers.set(slide, t);
}

function settleSlide(slide: HTMLElement, playing: boolean) {
  const since = loadTimers.get(slide)?.since;
  const widoczny =
    slide.classList.contains("is-loading") && since !== undefined;
  const zostalo = widoczny ? VIDEO_LOADING_MIN_MS - (Date.now() - since) : 0;
  clearLoadTimers(slide);
  if (zostalo > 0) {
    // plakietka dopala minimalny czas widoczności — film w tym momencie
    // już gra, więc zwlekamy WYŁĄCZNIE z jej zgaszeniem
    const t: { hide?: number } = {};
    t.hide = window.setTimeout(() => {
      slide.classList.remove("is-loading");
      slide.classList.toggle("is-playing", playing);
      loadTimers.delete(slide);
    }, zostalo);
    loadTimers.set(slide, t);
    return;
  }
  slide.classList.remove("is-loading");
  slide.classList.toggle("is-playing", playing);
}

/** Start filmu z obsługą odrzuconego play() (iOS Low Power Mode,
 *  polityki autoplay) — inaczej wskaźnik zawisłby do bezpiecznika. */
function startVideo(video: HTMLVideoElement, slide: HTMLElement | null) {
  if (slide) armLoading(slide);
  void video.play().catch(() => {
    if (slide) settleSlide(slide, false);
  });
}

function openLightbox(startIdx: number, autoplay = false) {
  const el = overlayEl();
  const lb = el?.querySelector<HTMLElement>("[data-lightbox]");
  const lbTrack = lbTrackEl();
  const gTrack = q<HTMLElement>("[data-track]");
  if (!el || !lb || !lbTrack || !gTrack) return;

  pauseVideos();
  // slajdy = klony kadrów galerii (img/video + ikonka kamery + czas);
  // scoped-klasy WorkDetail wędrują z klonami, layout robi blok is:global
  lbTrack.replaceChildren(
    ...Array.from(gTrack.children).map((slideEl) => {
      const s = document.createElement("div");
      s.className = "lb-slide";
      const m = document.createElement("div");
      m.className = "lb-media";
      Array.from(slideEl.children).forEach((child) => {
        m.appendChild(child.cloneNode(true));
      });
      s.appendChild(m);
      // Znaki kadru żyją ze stanem odtwarzania. `play` NIE zapala już
      // `is-playing` (leci przed pierwszym bajtem — patrz komentarz przy
      // armLoading); od tego jest `playing`. `waiting`/`stalled` łapią
      // zacięcie W TRAKCIE filmu, `pause`/`error`/`abort` wracają do
      // podpowiedzi.
      const v = m.querySelector<HTMLVideoElement>("video");
      v?.addEventListener("play", () => armLoading(s));
      v?.addEventListener("waiting", () => armLoading(s));
      v?.addEventListener("stalled", () => armLoading(s));
      v?.addEventListener("playing", () => settleSlide(s, true));
      v?.addEventListener("pause", () => settleSlide(s, false));
      v?.addEventListener("error", () => settleSlide(s, false));
      v?.addEventListener("abort", () => settleSlide(s, false));
      return s;
    }),
  );
  const dashes = el.querySelector<HTMLElement>("[data-lb-dashes]");
  dashes?.replaceChildren(
    ...Array.from(gTrack.children).map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.lbShot = String(i);
      b.setAttribute("aria-label", `Zdjęcie ${i + 1}`);
      return b;
    }),
  );

  lb.hidden = false;
  lbOpen = true;
  lbIndex = startIdx;
  paintLb(true);
  // kolejność z korekty Mateusza: najpierw startuje film, potem widać
  // pełny ekran już GRAJĄCEGO klipu (wciąż w geście usera — autoplay OK)
  if (autoplay) {
    const slide = lbTrack.children[lbIndex] as HTMLElement | undefined;
    const video = slide?.querySelector<HTMLVideoElement>("video");
    if (slide && video) startVideo(video, slide);
  }
  // fokus na kontener, nie na chevron/X — iOS rysuje pierścień na
  // programowo fokusowanych przyciskach (korekta Mateusza)
  lb.focus({ preventScroll: true });
  // wpis historii podglądu (ten sam adres) — „wstecz" zamyka najpierw
  // podgląd, dopiero potem detal
  if (histMode && !lbPushed) {
    history.pushState(
      { wd: current, lb: true } satisfies DetailState,
      "",
      location.href,
    );
    history.scrollRestoration = "manual";
    lbPushed = true;
  }
}

/** Zamknięcie podglądu przez UŻYTKOWNIKA (×, chevron, swipe, Esc) —
 *  zdejmuje też wpis historii podglądu. Zamknięcie z cleanup()/popstate
 *  idzie gołym closeLightbox (historię załatwia wołający). */
function closeLightboxByUser() {
  if (!lbOpen) return;
  closeLightbox();
  if (lbPushed) {
    lbPushed = false;
    ignorePop += 1;
    history.back();
  }
}

function closeLightbox() {
  const el = overlayEl();
  const lb = el?.querySelector<HTMLElement>("[data-lightbox]");
  if (!el || !lb || lb.hidden) return;
  pauseLbVideos();
  // zgaś ewentualny wskaźnik ładowania i jego timery — slajdy zaraz
  // znikną, a wiszący setTimeout nie ma już czego malować
  lbTrackEl()
    ?.querySelectorAll<HTMLElement>(".lb-slide")
    .forEach((slide) => {
      settleSlide(slide, false);
    });
  // wyjście wraca na kadr oglądany w podglądzie (korekta Mateusza)
  shot = lbIndex;
  lb.style.transform = "";
  lb.hidden = true;
  lbOpen = false;
  lbTrackEl()?.replaceChildren();
  el.querySelector<HTMLElement>("[data-lb-dashes]")?.replaceChildren();
  paintShot();
  el.querySelector<HTMLElement>("[data-overlay-panel]")?.focus({
    preventScroll: true,
  });
}

/* ── zdarzenia treści (delegacja na dokumencie — treść jest klonowana;
   wszystkie cele leżą WEWNĄTRZ panelu, więc overlay.ts ich nie zamyka) ── */

document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  const el = overlayEl();
  if (!el || el.hidden || !el.contains(t)) return;

  // tap zakończony gestem swipe-down podglądu — nie jest kliknięciem
  if (lbSwallowClick) {
    lbSwallowClick = false;
    return;
  }

  // Stopka detalu: udostępnij link do tej realizacji.
  const shareBtn = t.closest<HTMLElement>("[data-share]");
  if (shareBtn) {
    void shareDetail(shareBtn);
    return;
  }

  // W podglądzie pełnoekranowym: tap/klik w kadr WIDEO przełącza
  // play↔pauza (korekta Mateusza — bez własnego znaku play; stan
  // sygnalizuje ikonka kamery przez zdarzenia play/pause).
  if (t.closest("[data-lightbox]")) {
    const slide = t.closest<HTMLElement>(".lb-slide");
    const video = slide?.querySelector<HTMLVideoElement>("video");
    if (video) {
      if (video.paused) startVideo(video, slide);
      else video.pause();
    }
    return;
  }

  // Tap/klik w kadr galerii → podgląd pełnoekranowy od tego kadru;
  // kadr wideo od razu STARTUJE film (pełny ekran pokazuje grający klip).
  const slideEl = t.closest<HTMLElement>("[data-slide]");
  if (slideEl) {
    const gTrack = q<HTMLElement>("[data-track]");
    const idx = gTrack
      ? Array.prototype.indexOf.call(gTrack.children, slideEl)
      : -1;
    if (idx >= 0) openLightbox(idx, Boolean(slideEl.querySelector("video")));
    return;
  }

  if (t.closest("[data-prevshot]")) {
    shot -= 1;
    paintShot();
    return;
  }
  if (t.closest("[data-nextshot]")) {
    shot += 1;
    paintShot();
    return;
  }
  const dash = t.closest<HTMLElement>("[data-shot]");
  if (dash) {
    shot = Number(dash.dataset.shot) || 0;
    paintShot();
  }
});

/* ── projnav: przyciski to statyczny chrome POZA panelem — listenery
   elementowe (odpalają PRZED dokumentowymi), stopPropagation gwarantuje,
   że delegacja overlay.ts nie uzna kliknięcia za „klik w tło" ── */

/** Gest „przeciągnij w dół, by zamknąć” z overlay.ts jest mechaniką
 *  SZUFLADY: uzbraja go `data-overlay-kind="sheet"` i przy `moved`
 *  nadpisuje panelowi transform inline'owym `translateY(dy)`. Na mobile
 *  składa się to z klasowym `translateY(0/101%)`, ale desktopowy modal
 *  jest WYŚRODKOWANY przez `translate(-50%, -50%)` — inline transform
 *  kasuje wyśrodkowanie i panel odskakuje o pół swojego rozmiaru
 *  (zmierzone: 1260×774 px skacze z 90,63 na 720,455, strzałka kadru
 *  z 732,763 na 1362,1161 — poza ekran 1440×900). Po puszczeniu myszy
 *  finishDrag przywraca panel, więc jedynym śladem jest ZGUBIONY KLIK.
 *  Wystarczy 9 px dryfu w dół między wciśnięciem a puszczeniem — czyli
 *  zwykły niedokładny klik gładzikiem (potwierdzone w chromium, webkit
 *  i firefox).
 *  overlay.ts jest generyczny i nie zna progu, więc atrybut trzyma
 *  zgodny z REALNYM wariantem ten moduł — właściciel dualizmu
 *  modal ↔ sheet. SSR zostaje przy „sheet”: bez JS nakładki nie ma. */
function syncOverlayKind() {
  overlayEl()?.setAttribute(
    "data-overlay-kind",
    desktopMQ.matches ? "modal" : "sheet",
  );
}

function bindChrome() {
  const el = overlayEl();
  if (!el) return;
  syncOverlayKind();
  el.querySelector("[data-prevproj]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    stepProject(-1);
  });
  el.querySelector("[data-nextproj]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    stepProject(1);
  });

  // chrome podglądu pełnoekranowego (statyczny — listenery elementowe)
  el.querySelectorAll("[data-lb-close]").forEach((b) =>
    b.addEventListener("click", () => closeLightboxByUser()),
  );
  el.querySelector("[data-lb-prev]")?.addEventListener("click", () => {
    lbIndex -= 1;
    pauseLbVideos();
    paintLb();
  });
  el.querySelector("[data-lb-next]")?.addEventListener("click", () => {
    lbIndex += 1;
    pauseLbVideos();
    paintLb();
  });
  el.querySelector<HTMLElement>("[data-lb-dashes]")?.addEventListener(
    "click",
    (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-lb-shot]",
      );
      if (!b) return;
      lbIndex = Number(b.dataset.lbShot) || 0;
      pauseLbVideos();
      paintLb();
    },
  );
  el.querySelector<HTMLElement>("[data-lb-track]")?.addEventListener(
    "scroll",
    onLbScroll,
    { passive: true },
  );

  // swipe-down zamykający podgląd (mobile)
  el.querySelector<HTMLElement>("[data-lightbox]")?.addEventListener(
    "pointerdown",
    (e) => {
      if (desktopMQ.matches || !lbOpen || lbDrag) return;
      if ((e.target as HTMLElement).closest("[data-lb-close]")) return;
      lbDrag = { startX: e.clientX, startY: e.clientY, dy: 0, axis: "" };
      window.addEventListener("pointermove", onLbPointerMove, {
        passive: true,
      });
      window.addEventListener("pointerup", onLbPointerEnd);
      window.addEventListener("pointercancel", onLbPointerEnd);
    },
  );
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindChrome, { once: true });
} else {
  bindChrome();
}

// Klawiatura ←/→ (E7b — adaptacja eha, jedyna zmiana mechanizmu):
// w podglądzie pełnoekranowym przełącza kadry podglądu, poza nim —
// kadry galerii detalu na DESKTOPIE (mobile karuzelą rządzi dotyk).
// Bez zapętlenia (mechanika delung: krańce jak `disabled` przyciski);
// Esc-hierarchia bez zmian (capture niżej).
document.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  const el = overlayEl();
  if (!el || el.hidden) return;
  const dir = e.key === "ArrowRight" ? 1 : -1;
  if (lbOpen) {
    const n = lbTrackEl()?.children.length ?? 0;
    const next = lbIndex + dir;
    if (next < 0 || next >= n) return;
    e.preventDefault();
    lbIndex = next;
    pauseLbVideos();
    paintLb();
    return;
  }
  if (!desktopMQ.matches) return;
  const n = q<HTMLElement>("[data-track]")?.children.length ?? 0;
  const next = shot + dir;
  if (next < 0 || next >= n) return;
  e.preventDefault();
  shot = next;
  paintShot();
});

// Esc w podglądzie pełnoekranowym zamyka TYLKO podgląd (capture — musi
// ubiec bąbelkowy keydown overlay.ts, który zamknąłby cały detal).
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Escape" || !lbOpen) return;
    e.preventDefault();
    e.stopPropagation();
    closeLightboxByUser();
  },
  true,
);

// Zmiana progu (modal ↔ sheet CSS) przy otwartym detalu: zamknij — layout
// i miejsce galerii w DOM są per-próg (reguła sections.md).
desktopMQ.addEventListener("change", () => {
  syncOverlayKind();
  if (current) window.overlay?.close(OVERLAY_ID);
});
