// Logika formularza kontaktowego — czysty TS, bez zależności od runtime'u
// Workers. Konsumenci: functions/api/kontakt.ts (Pages Function) i testy
// unit. STAN Etapu 0: zaadresowane na eha (CONTACT_TO/nadawcy/temat);
// docelowe POLA formularza (E9: 4 pola, „telefon LUB e-mail",
// auto-potwierdzenie tylko przy e-mailu) wchodzą w Etapie 5 wg
// docs/design/kontakt.html.

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
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;

// Ta sama reguła co walidacja kliencka (referencja kontakt.js).
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Temat zgłoszenia. Formularz eha (E9, Etap 5) nie ma pola tematu —
// `temat` przychodzi pusty i mail pokazuje „—". Lista zostaje jako kontrakt
// serwera (tolerancja obcych POST-ów i punkt zaczepienia, gdyby temat
// wrócił jako <select>).
export const TOPICS = [
  "Remont domu",
  "Obsługa budowy",
  "Konsultacja",
  "Inny temat",
] as const;

// PL-only — pole lang zostaje w kontrakcie multipart,
// ale jedyną wartością jest "pl".
type ContactLang = "pl";

/** Surowe pola z multipart/form-data (zawsze stringi, mogą być puste). */
export interface ContactRaw {
  name: string;
  email: string;
  /** Opcjonalny — może być pusty. Docelowo (E9, Etap 5): JEDNO pole
   *  „telefon LUB e-mail" z walidacją alternatywną po obu stronach. */
  phone: string;
  temat: string;
  message: string;
  firma: string;
  elapsed: string;
  lang: string;
}

export interface ContactData {
  name: string;
  email: string;
  /** "" gdy nie podano. Numery bywają pisane na kilkanaście sposobów —
   *  twarda regexpa robiłaby tylko fałszywe odrzuty, więc pole jest
   *  przycinane, nie walidowane. */
  phone: string;
  /** "" gdy nie wybrano albo wartość spoza TOPICS. */
  temat: string;
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

export type ValidationResult =
  | { ok: true; data: ContactData }
  | { ok: false; field: "name" | "email" | "message" };

export function validateSubmission(raw: ContactRaw): ValidationResult {
  const name = raw.name.trim();
  const email = raw.email.trim();
  const message = raw.message.trim();

  if (name.length === 0 || name.length > NAME_MAX) {
    return { ok: false, field: "name" };
  }
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return { ok: false, field: "email" };
  }
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return { ok: false, field: "message" };
  }

  const tematRaw = raw.temat.trim();
  const temat = (TOPICS as readonly string[]).includes(tematRaw)
    ? tematRaw
    : "";

  // Telefon: opcjonalny i NIE odrzucający zgłoszenia — jedna linia,
  // przycięta do PHONE_MAX (śmieciowy payload nie rozepcha maila).
  const phone = stripNewlines(raw.phone).slice(0, PHONE_MAX);

  return { ok: true, data: { name, email, phone, temat, message, lang: "pl" } };
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
 * Mail #1 — powiadomienie do skrzynki kontakt@. Czytelnie, bez ozdób;
 * najważniejsze to OD KOGO i NA JAKI ADRES odpisać (samą odpowiedź
 * załatwia Reply-To ustawiane przez endpoint).
 */
export function buildNotifyEmail(
  data: ContactData,
  sentAt: string,
): EmailContent {
  const name = stripNewlines(data.name);
  const subject = data.temat
    ? `[pracownia-eha.pl] ${data.temat}: wiadomość od ${name}`
    : `[pracownia-eha.pl] wiadomość od ${name}`;

  const text = [
    "Nowa wiadomość z formularza na pracownia-eha.pl",
    "",
    `Od: ${name}`,
    `E-mail (odpowiedz na ten adres): ${data.email}`,
    `Telefon: ${data.phone || "—"}`,
    `Temat: ${data.temat || "—"}`,
    `Data: ${sentAt}`,
    "",
    "Wiadomość:",
    data.message,
  ].join("\n");

  const html = [
    "<p>Nowa wiadomość z formularza na pracownia-eha.pl</p>",
    `<p><strong>Od:</strong> ${escapeHtml(name)}<br>`,
    `<strong>E-mail (odpowiedz na ten adres):</strong> ${escapeHtml(data.email)}<br>`,
    `<strong>Telefon:</strong> ${escapeHtml(data.phone || "—")}<br>`,
    `<strong>Temat:</strong> ${escapeHtml(data.temat || "—")}<br>`,
    `<strong>Data:</strong> ${escapeHtml(sentAt)}</p>`,
    `<div style="white-space:pre-wrap;border-top:1px solid #ccc;padding-top:12px">${escapeHtml(data.message)}</div>`,
  ].join("\n");

  return { subject, html, text };
}

/**
 * Mail #2 — auto-potwierdzenie do nadawcy. Subject jest STAŁY (treść
 * użytkownika nie steruje tematem — §5.5 wzorca); jego wiadomość pojawia
 * się wyłącznie jako oznaczony cytat.
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
    `Kopia Twojej wiadomości${data.temat ? ` (temat: ${data.temat})` : ""}:`,
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
    `<p>Kopia Twojej wiadomości${data.temat ? ` (temat: ${escapeHtml(data.temat)})` : ""}:</p>`,
    `<blockquote style="white-space:pre-wrap;border-left:3px solid #ccc;margin:0;padding-left:12px">${escapeHtml(data.message)}</blockquote>`,
    '<p>Pozdrawiamy<br>Pracownia EH/A<br><a href="https://pracownia-eha.pl">pracownia-eha.pl</a></p>',
    '<p style="color:#777;font-size:12px">Ta wiadomość została wysłana automatycznie. Jeśli to nie Ty wypełniłeś(-aś) formularz na pracownia-eha.pl, zignoruj ją — Twój adres nie zostanie zapisany ani dodany do żadnej listy.</p>',
  ].join("\n");
  return { subject, html, text };
}
