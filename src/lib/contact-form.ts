// Logika formularza kontaktowego — czysty TS, bez zależności od runtime'u
// Workers. Konsumenci: functions/api/kontakt.ts (Pages Function),
// contact-ui.ts (walidacja kliencka) i testy unit. Etap 5 przepisał moduł
// pod DOCELOWY formularz E9 (docs/analiza-kontakt.md §2 pkt 5–7):
// 4 pola, pole 02 to JEDNO „telefon LUB e-mail" z walidacją alternatywną
// po obu stronach, a auto-potwierdzenie idzie WYŁĄCZNIE gdy podano e-mail.
//
// ⚠️ Zestaw pól jest zadeklarowany w opublikowanej polityce prywatności
// (sekcja 02: „imię i nazwisko, numer telefonu lub adres e-mail,
// lokalizacja inwestycji oraz treść wiadomości") — zmiana pól wymaga
// przeglądu tamtego dokumentu, nie tylko tego pliku.

export const CONTACT_TO = "eha@pracownia-eha.pl";
// Nadawcy MUSZĄ siedzieć na domenie zweryfikowanej w Resendzie
// (`send.pracownia-eha.pl` — Etap 5; apeks `pracownia-eha.pl` zostaje przy
// skrzynce The Camels). Adres spoza zweryfikowanej domeny = odmowa wysyłki
// po stronie Resenda, nie błąd naszego kodu.
export const CONTACT_FROM_NOTIFY =
  "Formularz pracownia-eha.pl <no-reply@send.pracownia-eha.pl>";
export const CONTACT_FROM_CONFIRM =
  "Pracownia EH/A <no-reply@send.pracownia-eha.pl>";

export const MIN_FILL_MS = 4000;
export const NAME_MAX = 100;
const EMAIL_MAX = 254;
export const PHONE_MAX = 40;
/** Lokalizacja inwestycji („Miejscowość, gmina") — pole OPCJONALNE
 *  (decyzja Mateusza, Etap 5): puste nie blokuje zgłoszenia. */
export const PLACE_MAX = 120;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;

/** E-mail — ta sama reguła co dotąd (klient i serwer). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Telefon PO normalizacji (`normalizePhone`): opcjonalny „+" i 9–15 cyfr.
 *  Polski numer ma 9 cyfr, górna granica mieści prefiksy krajowe.
 *  Reguła jest CELOWO permisywna — twardsza dawałaby fałszywe odrzuty
 *  (numer bywa pisany na kilkanaście sposobów). */
export const PHONE_RE = /^\+?\d{9,15}$/;

// PL-only — pole lang zostaje w kontrakcie multipart,
// ale jedyną wartością jest "pl".
type ContactLang = "pl";

/** Surowe pola z multipart/form-data (zawsze stringi, mogą być puste).
 *  `contact` = pole „02 · TELEFON LUB E-MAIL" (E9: jedno pole). */
export interface ContactRaw {
  name: string;
  contact: string;
  /** „03 · LOKALIZACJA INWESTYCJI" — opcjonalne. */
  place: string;
  message: string;
  firma: string;
  elapsed: string;
  lang: string;
}

export interface ContactData {
  name: string;
  /** "" gdy podano wyłącznie telefon. Steruje mailem #2 (auto-potwierdzenie
   *  idzie TYLKO na adres podany przez nadawcę — karta „Resend" w polityce
   *  prywatności mówi to wprost). */
  email: string;
  /** "" gdy podano wyłącznie e-mail. Zapisany tak, jak go wpisano
   *  (przycięty do PHONE_MAX) — normalizacja służy tylko walidacji. */
  phone: string;
  /** "" gdy nie podano. */
  place: string;
  message: string;
  lang: ContactLang;
}

/**
 * Pułapka na boty: honeypot `firma` niepusty LUB `elapsed` < MIN_FILL_MS.
 * Brak/niesparsowalny `elapsed` = POST z pominięciem naszego JS = bot.
 */
export function isBotTrap(raw: Pick<ContactRaw, "firma" | "elapsed">): boolean {
  if (raw.firma !== "") return true;
  const elapsed = Number(raw.elapsed);
  return !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS;
}

/** Numer do postaci porównywalnej z PHONE_RE: bez spacji, kropek,
 *  myślników (także półpauz), nawiasów i ukośników. */
function normalizePhone(value: string): string {
  return value.replace(/[\s.\-–—()/]/g, "");
}

export type ContactKind = "email" | "phone" | "invalid";

/** Rozbiór pola „telefon LUB e-mail". JEDNO źródło prawdy dla walidacji
 *  klienckiej (contact-ui.ts) i serwerowej (validateSubmission) — inaczej
 *  obie strony mogłyby się rozjechać.
 *
 *  Wpis bywa mieszany („jan@x.pl, 600 000 000"), więc najpierw szukamy
 *  tokenu wyglądającego na adres, a z RESZTY próbujemy złożyć numer.
 *  `kind` mówi, co udało się rozpoznać (`email` ma pierwszeństwo, bo to
 *  ono decyduje o mailu #2). */
export function classifyContact(value: string): {
  kind: ContactKind;
  email: string;
  phone: string;
} {
  const v = value.trim();
  if (v.length === 0) return { kind: "invalid", email: "", phone: "" };

  const tokens = v.split(/[\s,;]+/).filter(Boolean);
  const mailToken = tokens.find(
    (t) => t.length <= EMAIL_MAX && EMAIL_RE.test(t),
  );
  const rest = mailToken ? tokens.filter((t) => t !== mailToken).join(" ") : v;
  const digits = normalizePhone(rest);
  const phone =
    digits.length > 0 && PHONE_RE.test(digits)
      ? rest.trim().slice(0, PHONE_MAX)
      : "";

  if (mailToken) return { kind: "email", email: mailToken, phone };
  if (phone) return { kind: "phone", email: "", phone };
  return { kind: "invalid", email: "", phone: "" };
}

export type ValidationResult =
  | { ok: true; data: ContactData }
  | { ok: false; field: "name" | "contact" | "message" };

export function validateSubmission(raw: ContactRaw): ValidationResult {
  const name = raw.name.trim();
  const message = raw.message.trim();

  if (name.length === 0 || name.length > NAME_MAX) {
    return { ok: false, field: "name" };
  }
  // E9: poprawny telefon ALBO poprawny e-mail — bez tego nie mamy jak
  // odpowiedzieć, więc to jedyne twarde pole poza imieniem i opisem.
  const contact = classifyContact(raw.contact);
  if (contact.kind === "invalid") return { ok: false, field: "contact" };
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return { ok: false, field: "message" };
  }

  // Lokalizacja: opcjonalna i NIE odrzucająca zgłoszenia — jedna linia,
  // przycięta do PLACE_MAX (śmieciowy payload nie rozepcha maila).
  const place = stripNewlines(raw.place).slice(0, PLACE_MAX);

  return {
    ok: true,
    data: {
      name,
      email: contact.email,
      phone: contact.phone,
      place,
      message,
      lang: "pl",
    },
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Do Subject: jedna linia (porządek w temacie, nie mechanizm security). */
export function stripNewlines(s: string): string {
  return s.replace(/\s*[\r\n]+\s*/g, " ").trim();
}

function quoteText(message: string): string {
  return message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Mail #1 — powiadomienie do skrzynki eha@. Czytelnie, bez ozdób;
 * najważniejsze to OD KOGO, JAK oddzwonić/odpisać i GDZIE jest inwestycja
 * (dojazd liczy się od Jeleniej Góry). Odpowiedź jednym klikiem załatwia
 * Reply-To ustawiane przez endpoint — ale tylko wtedy, gdy podano e-mail.
 */
export function buildNotifyEmail(
  data: ContactData,
  sentAt: string,
): EmailContent {
  const name = stripNewlines(data.name);
  const place = stripNewlines(data.place);
  const subject = place
    ? `[pracownia-eha.pl] ${place}: zapytanie od ${name}`
    : `[pracownia-eha.pl] zapytanie od ${name}`;

  const text = [
    "Nowa wiadomość z formularza na pracownia-eha.pl",
    "",
    `Od: ${name}`,
    `Telefon: ${data.phone || "—"}`,
    `E-mail: ${data.email || "—"}`,
    `Lokalizacja inwestycji: ${place || "—"}`,
    `Data: ${sentAt}`,
    "",
    "Wiadomość:",
    data.message,
  ].join("\n");

  const html = [
    "<p>Nowa wiadomość z formularza na pracownia-eha.pl</p>",
    `<p><strong>Od:</strong> ${escapeHtml(name)}<br>`,
    `<strong>Telefon:</strong> ${escapeHtml(data.phone || "—")}<br>`,
    `<strong>E-mail:</strong> ${escapeHtml(data.email || "—")}<br>`,
    `<strong>Lokalizacja inwestycji:</strong> ${escapeHtml(place || "—")}<br>`,
    `<strong>Data:</strong> ${escapeHtml(sentAt)}</p>`,
    `<div style="white-space:pre-wrap;border-top:1px solid #ccc;padding-top:12px">${escapeHtml(data.message)}</div>`,
  ].join("\n");

  return { subject, html, text };
}

/**
 * Mail #2 — auto-potwierdzenie do nadawcy. Wysyłany WYŁĄCZNIE, gdy nadawca
 * podał adres e-mail (E9; karta „Resend" w polityce prywatności). Subject
 * jest STAŁY — treść użytkownika nie steruje tematem (§5.5 wzorca); jego
 * wiadomość pojawia się wyłącznie jako oznaczony cytat.
 */
export function buildConfirmEmail(data: ContactData): EmailContent {
  const name = stripNewlines(data.name);

  const subject = "Dziękujemy za wiadomość — Pracownia EH/A";
  const text = [
    `Cześć ${name},`,
    "",
    "dziękujemy za wiadomość wysłaną przez formularz na pracownia-eha.pl —",
    "właśnie do nas dotarła. Odezwiemy się najszybciej, jak to możliwe",
    "(jesteśmy na budowie pn.–pt. 8–16, więc zwykle w 1–2 dni robocze).",
    "",
    "Kopia Twojej wiadomości:",
    quoteText(data.message),
    "",
    "Pozdrawiamy",
    "Pracownia EH/A",
    "https://pracownia-eha.pl",
    "",
    "—",
    "Ta wiadomość została wysłana automatycznie. Jeśli to nie Ty",
    "wypełniłeś(-aś) formularz na pracownia-eha.pl, zignoruj ją — Twój",
    "adres nie zostanie zapisany ani dodany do żadnej listy.",
  ].join("\n");
  const html = [
    `<p>Cześć ${escapeHtml(name)},</p>`,
    "<p>dziękujemy za wiadomość wysłaną przez formularz na pracownia-eha.pl — właśnie do nas dotarła. Odezwiemy się najszybciej, jak to możliwe (jesteśmy na budowie pn.–pt. 8–16, więc zwykle w 1–2 dni robocze).</p>",
    "<p>Kopia Twojej wiadomości:</p>",
    `<blockquote style="white-space:pre-wrap;border-left:3px solid #ccc;margin:0;padding-left:12px">${escapeHtml(data.message)}</blockquote>`,
    '<p>Pozdrawiamy<br>Pracownia EH/A<br><a href="https://pracownia-eha.pl">pracownia-eha.pl</a></p>',
    '<p style="color:#777;font-size:12px">Ta wiadomość została wysłana automatycznie. Jeśli to nie Ty wypełniłeś(-aś) formularz na pracownia-eha.pl, zignoruj ją — Twój adres nie zostanie zapisany ani dodany do żadnej listy.</p>',
  ].join("\n");
  return { subject, html, text };
}
