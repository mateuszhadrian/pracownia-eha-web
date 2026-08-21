// Składanie tel/mail chrome'u (navbar/sheet/stopka) z fragmentów —
// antyscraping (kontrakt D-CH5 z delung, rozszerzony o DWA numery
// per-osoba): pełne ciągi mogą powstać WYŁĄCZNIE w runtime; statyczny
// HTML pilnuje osobno test w tests/e2e/navigation.spec.ts.
import { describe, expect, it } from "vitest";
import {
  buildEmail,
  buildPhoneDisplay,
  buildPhoneHref,
} from "../../src/lib/contact-details";

describe("contact-details (chrome)", () => {
  it("href telefonów: tel: bez spacji (oba numery)", () => {
    expect(buildPhoneHref("maciek")).toBe("tel:+48696513743");
    expect(buildPhoneHref("lukasz")).toBe("tel:+48533328356");
  });

  it("tekst telefonów: ze spacjami (format z designów)", () => {
    expect(buildPhoneDisplay("maciek")).toBe("+48 696 513 743");
    expect(buildPhoneDisplay("lukasz")).toBe("+48 533 328 356");
  });

  it("e-mail firmowy", () => {
    expect(buildEmail()).toBe("eha@pracownia-eha.pl");
  });
});
