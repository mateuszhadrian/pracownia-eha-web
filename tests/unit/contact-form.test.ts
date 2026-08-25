// Logika formularza kontaktowego (src/lib/contact-form.ts) — walidacja,
// pułapki na boty, escapowanie i treści maili. Etap 5 przepisał ten spec
// pod kontrakt E9 (docs/analiza-kontakt.md §2 pkt 5–7): 4 pola, pole 02 to
// JEDNO „telefon LUB e-mail", lokalizacja jest opcjonalna, a mail #2 idzie
// wyłącznie przy podanym adresie. Zestaw pól deklaruje też opublikowana
// polityka prywatności (sekcja 02) — te dwa dokumenty muszą się zgadzać.
import { describe, expect, it } from "vitest";
import {
  buildConfirmEmail,
  buildNotifyEmail,
  classifyContact,
  escapeHtml,
  isBotTrap,
  CONTACT_FROM_CONFIRM,
  CONTACT_FROM_NOTIFY,
  MESSAGE_MAX,
  NAME_MAX,
  PHONE_MAX,
  PLACE_MAX,
  stripNewlines,
  validateSubmission,
  type ContactData,
  type ContactRaw,
} from "../../src/lib/contact-form";

const validRaw: ContactRaw = {
  name: "Anna",
  contact: "anna@example.com",
  place: "Czernica, gm. Jeżów Sudecki",
  message: "Chciałabym zapytać o remont domu przysłupowego.",
  firma: "",
  elapsed: "12000",
  lang: "pl",
};

const validData: ContactData = {
  name: "Anna",
  email: "anna@example.com",
  phone: "",
  place: "Czernica, gm. Jeżów Sudecki",
  message: "Chciałabym zapytać o remont domu przysłupowego.",
  lang: "pl",
};

describe("kontakt: isBotTrap", () => {
  it("czysty submit (pusty honeypot, elapsed ≥ 4000) NIE jest botem", () => {
    expect(isBotTrap({ firma: "", elapsed: "4000" })).toBe(false);
  });

  it("wypełniony honeypot = bot", () => {
    expect(isBotTrap({ firma: "ACME Sp. z o.o.", elapsed: "12000" })).toBe(
      true,
    );
  });

  it("submit szybszy niż 4 s = bot", () => {
    expect(isBotTrap({ firma: "", elapsed: "3999" })).toBe(true);
  });

  it("brak/niesparsowalny elapsed (POST z pominięciem JS) = bot", () => {
    expect(isBotTrap({ firma: "", elapsed: "" })).toBe(true);
    expect(isBotTrap({ firma: "", elapsed: "abc" })).toBe(true);
  });
});

// ── E9: pole 02 „telefon LUB e-mail" — jedna funkcja dla klienta i serwera
describe("kontakt: classifyContact (pole 02 — telefon LUB e-mail)", () => {
  it("sam e-mail rozpoznany jako e-mail (telefon zostaje pusty)", () => {
    expect(classifyContact("  anna@example.com  ")).toEqual({
      kind: "email",
      email: "anna@example.com",
      phone: "",
    });
    expect(classifyContact("a.b+c@sub.dom.pl").kind).toBe("email");
  });

  it("numer w typowych zapisach rozpoznany jako telefon", () => {
    for (const value of [
      "696513743",
      "696 513 743",
      "+48 696 513 743",
      "+48-696-513-743",
      "(48) 696.513.743",
      "0048696513743",
    ]) {
      const r = classifyContact(value);
      expect(r.kind, value).toBe("phone");
      expect(r.email, value).toBe("");
      expect(r.phone, value).toBe(value.trim());
    }
  });

  it("wpis mieszany daje OBA pola, a e-mail decyduje o rodzaju", () => {
    expect(classifyContact("anna@example.com, 696 513 743")).toEqual({
      kind: "email",
      email: "anna@example.com",
      phone: "696 513 743",
    });
    expect(classifyContact("696 513 743 / anna@example.com").kind).toBe(
      "email",
    );
  });

  it("śmieci, urwane adresy i za krótkie numery odpadają", () => {
    for (const bad of [
      "",
      "   ",
      "abc",
      "abc@x",
      "a@b.c",
      "12345678",
      "zadzwoń do mnie",
    ]) {
      expect(classifyContact(bad).kind, bad).toBe("invalid");
    }
  });

  it("numer dłuższy niż PHONE_MAX zostaje przycięty, nie odrzucony", () => {
    const padded = "696 513 743" + " ".repeat(PHONE_MAX);
    const r = classifyContact(padded);
    expect(r.kind).toBe("phone");
    expect(r.phone.length).toBeLessThanOrEqual(PHONE_MAX);
  });
});

describe("kontakt: validateSubmission", () => {
  it("poprawne zgłoszenie przechodzi i jest znormalizowane (trim)", () => {
    const result = validateSubmission({
      ...validRaw,
      name: "  Anna  ",
      contact: " anna@example.com ",
    });
    expect(result).toEqual({ ok: true, data: validData });
  });

  it("sam TELEFON wystarcza — e-mail zostaje pusty (E9)", () => {
    const result = validateSubmission({
      ...validRaw,
      contact: "+48 696 513 743",
    });
    expect(result).toEqual({
      ok: true,
      data: { ...validData, email: "", phone: "+48 696 513 743" },
    });
  });

  it("ani telefon, ani e-mail = odrzucenie na polu contact", () => {
    for (const bad of ["", "   ", "oddzwońcie", "abc@x"]) {
      expect(validateSubmission({ ...validRaw, contact: bad }), bad).toEqual({
        ok: false,
        field: "contact",
      });
    }
  });

  it("puste / za długie imię odpada", () => {
    expect(validateSubmission({ ...validRaw, name: "   " })).toEqual({
      ok: false,
      field: "name",
    });
    expect(
      validateSubmission({ ...validRaw, name: "x".repeat(NAME_MAX + 1) }),
    ).toEqual({ ok: false, field: "name" });
  });

  it("wiadomość poza widełkami 10–5000 znaków odpada", () => {
    expect(validateSubmission({ ...validRaw, message: "za krótko" })).toEqual({
      ok: false,
      field: "message",
    });
    expect(
      validateSubmission({
        ...validRaw,
        message: "x".repeat(MESSAGE_MAX + 1),
      }),
    ).toEqual({ ok: false, field: "message" });
  });

  it("lokalizacja jest OPCJONALNA — pusta nie blokuje zgłoszenia", () => {
    const result = validateSubmission({ ...validRaw, place: "" });
    expect(result.ok && result.data.place).toBe("");
  });

  it("lokalizacja: jedna linia, przycięta do PLACE_MAX, bez odrzucania", () => {
    const multiline = validateSubmission({
      ...validRaw,
      place: " Czernica \r\n Bcc: spam@evil.com ",
    });
    expect(multiline.ok && multiline.data.place).toBe(
      "Czernica Bcc: spam@evil.com",
    );
    const long = validateSubmission({
      ...validRaw,
      place: "x".repeat(PLACE_MAX + 20),
    });
    expect(long.ok).toBe(true);
    expect(long.ok && long.data.place).toHaveLength(PLACE_MAX);
  });

  it("lang jest zawsze normalizowany do pl (PL-only)", () => {
    for (const lang of ["de", "en", ""]) {
      const r = validateSubmission({ ...validRaw, lang });
      expect(r.ok && r.data.lang, lang).toBe("pl");
    }
  });
});

describe("kontakt: escapowanie", () => {
  it("escapeHtml neutralizuje wszystkie znaki specjalne HTML", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;",
    );
  });

  it("stripNewlines skleja wieloliniowy tekst w jedną linię", () => {
    expect(stripNewlines("Anna\r\n Nowak \n")).toBe("Anna Nowak");
  });
});

describe("kontakt: mail #1 (powiadomienie do eha@)", () => {
  it("subject niesie lokalizację i imię; bez lokalizacji — samo imię", () => {
    const withPlace = buildNotifyEmail(validData, "11 lip 2026, 12:00");
    expect(withPlace.subject).toBe(
      "[pracownia-eha.pl] Czernica, gm. Jeżów Sudecki: zapytanie od Anna",
    );
    const noPlace = buildNotifyEmail(
      { ...validData, place: "" },
      "11 lip 2026, 12:00",
    );
    expect(noPlace.subject).toBe("[pracownia-eha.pl] zapytanie od Anna");
  });

  it("subject jest zawsze jedną linią, nawet gdy imię zawiera newline", () => {
    const mail = buildNotifyEmail(
      { ...validData, name: "Anna\nBcc: spam@evil.com" },
      "x",
    );
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it("treść niesie oba kanały kontaktu, a brakujący pokazuje myślnik", () => {
    const mailOnly = buildNotifyEmail(validData, "1 sie 2026, 12:00");
    expect(mailOnly.text).toContain("E-mail: anna@example.com");
    expect(mailOnly.text).toContain("Telefon: —");

    const phoneOnly = buildNotifyEmail(
      { ...validData, email: "", phone: "+48 696 513 743" },
      "1 sie 2026, 12:00",
    );
    expect(phoneOnly.text).toContain("Telefon: +48 696 513 743");
    expect(phoneOnly.text).toContain("E-mail: —");
    expect(phoneOnly.html).toContain("+48 696 513 743");
  });

  it("treść niesie lokalizację inwestycji (albo myślnik)", () => {
    expect(buildNotifyEmail(validData, "x").text).toContain(
      "Lokalizacja inwestycji: Czernica, gm. Jeżów Sudecki",
    );
    expect(buildNotifyEmail({ ...validData, place: "" }, "x").text).toContain(
      "Lokalizacja inwestycji: —",
    );
  });

  it("treść zawiera wiadomość; HTML jest escapowany", () => {
    const mail = buildNotifyEmail(
      { ...validData, message: "Oferta <b>specjalna</b> & co dalej?" },
      "11 lip 2026, 12:00",
    );
    expect(mail.text).toContain("Oferta <b>specjalna</b> & co dalej?");
    expect(mail.html).toContain("Oferta &lt;b&gt;specjalna&lt;/b&gt; &amp;");
    expect(mail.html).not.toContain("<b>specjalna</b>");
  });
});

describe("kontakt: nadawcy (domena zweryfikowana w Resendzie)", () => {
  // Etap 5: Resend weryfikuje SUBDOMENĘ send.pracownia-eha.pl (apeks zostaje przy
  // skrzynce The Camels). Adres nadawcy spoza tej domeny = odmowa wysyłki.
  it("oba maile wychodzą z @send.pracownia-eha.pl", () => {
    for (const from of [CONTACT_FROM_NOTIFY, CONTACT_FROM_CONFIRM]) {
      expect(from).toContain("@send.pracownia-eha.pl>");
    }
  });
});

describe("kontakt: mail #2 (auto-potwierdzenie)", () => {
  // O TYM, CZY mail #2 w ogóle wychodzi, decyduje endpoint (pusty
  // data.email = brak wysyłki — karta „Resend" w polityce prywatności).
  // Tu pilnujemy samej treści.
  it("subject jest STAŁY — treść użytkownika nie steruje tematem", () => {
    const pl = buildConfirmEmail({
      ...validData,
      name: "PILNE!!!",
      message: "Wygrałeś milion — kliknij tutaj żeby odebrać nagrodę!",
    });
    expect(pl.subject).toBe("Dziękujemy za wiadomość — Pracownia EH/A");
  });

  it("zawiera kopię wiadomości (cytowaną w text, escapowaną w html)", () => {
    const mail = buildConfirmEmail({
      ...validData,
      message: "linia 1\nlinia 2 <i>kursywą</i>",
    });
    expect(mail.text).toContain("> linia 1\n> linia 2 <i>kursywą</i>");
    expect(mail.html).toContain("linia 2 &lt;i&gt;kursywą&lt;/i&gt;");
    expect(mail.html).not.toContain("<i>kursywą</i>");
  });

  it("potwierdzenie ma komplet elementów (podziękowanie, kopia, stopka anti-abuse)", () => {
    const pl = buildConfirmEmail(validData);
    expect(pl.text).toContain("Cześć Anna");
    expect(pl.text).toContain("dni robocze");
    expect(pl.text).toContain("Kopia Twojej wiadomości:");
    expect(pl.text).toContain("zignoruj ją");
  });
});
