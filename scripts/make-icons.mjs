// Generator zasobów marki (wzorzec D-E11 z szablonu; komplet domknięty
// w Etapie 6).
//
// ETAP 6 — trzy zmiany po obejrzeniu tego, co realnie leżało w public/
// (przebieg skryptu sprzed zmian dawał wyjście BAJT W BAJT identyczne
// z plikami z 19.08, więc „placeholdery" były już finalnym wynikiem —
// problemem był sam kadr, nie nieaktualność):
//   1. KADROWANIE. Znaczek jest PODŁUŻNY (1,42:1), więc wpisany w kwadrat
//      zostawiał 41 % pustej wysokości, i to niesymetrycznie: 81 px u góry
//      wobec 129 px u dołu przy renderze 512 (zmierzone). Teraz przycinamy
//      do bboxu tuszu i centrujemy z jawnym marginesem ICON_PAD.
//   2. CZYTELNOŚĆ MAŁYCH ROZMIARÓW. Monogram jest włosowy: przy 16 px
//      kreski schodzą poniżej piksela i ikona zamienia się w szarą plamę.
//      Do ICON_BOLD_MAX_PX dokładamy obrys (ICON_BOLD_STROKE), czyli ta
//      sama ścieżka renderuje się grubiej. Kontener ICO trzyma osobne
//      obrazki per rozmiar — dokładnie po to jest. Duże ikony
//      (48/180/192/512) zostają WŁOSOWE, bo tam kreska jest tożsamością
//      marki i nie ma czego ratować.
//   3. TŁO og-image = papier strony `--bg` (#f5efe3). Wcześniej #f4f1ea —
//      o 7 poziomów zimniejszy niż papier serwisu.
//
// ŹRÓDŁEM jest teraz src/assets/logo/eha-logo-sign.svg, a public/favicon.svg
// stał się GENERATEM. Wcześniej były to dwa pliki BAJTOWO IDENTYCZNE, ale
// bez żadnego powiązania — i to by się właśnie zemściło: kadrowanie z pkt 1
// dotyczy rastrów, a Chrome/Firefox/Safari wolą `rel=icon type=image/svg+xml`,
// więc SVG zostałby z dawnym, przesuniętym kadrem i ikona wyglądałaby inaczej
// zależnie od przeglądarki. Generat dostaje TEN SAM kadr (przeliczony
// viewBox — ścieżki nietknięte).
//
// Użycie   : node scripts/make-icons.mjs
//
// Wejście  : src/assets/logo/eha-logo-sign.svg (znaczek EH/A)
//            + src/assets/logo/eha-logo.svg (pełne logo na og-image).
// Wyjście  : public/{favicon.svg, favicon.ico, apple-touch-icon.png,
//            icon-192.png, icon-512.png, og-image.png}
//
// Dlaczego skrypt, a nie ciąg ręcznych komend: „dorób ikonę 256" za pół roku
// ma być jednym poleceniem, a nie odtwarzaniem parametrów z pamięci.
// Uwaga: to NIE jest to samo co scripts/optimize-images.mjs (PNG z eksportów
// designów → WebP do src/assets/).
import sharp from "sharp";
import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";

const OUT = "public";
/** Znaczek EH/A — JEDYNE źródło rysunku ikon (odrys potrace, Etap 0.4). */
const MARK_SVG = "src/assets/logo/eha-logo-sign.svg";
/** Favicon SVG: GENERAT z MARK_SVG, przekadrowany (patrz nagłówek). */
const FAVICON_SVG = `${OUT}/favicon.svg`;

// Ikony: sam znaczek na BIAŁYM kwadracie (D-E1). Bez alfy — iOS podkłada
// czerń pod przezroczystość na ekranie startowym, a szara część znaczka
// znika wtedy w tle.
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// og-image: pełne logo (napis niesie nazwę firmy) na tle „papieru"
// z palety strony — token `--bg` w src/styles/global.css (#f5efe3).
const PAPER = { r: 245, g: 239, b: 227, alpha: 1 };
// Logo EH/A jest ~kwadratowe — kadr 1200×630 mieści je wysokością.
const OG = { w: 1200, h: 630, logoW: 520 };

// Pełne logo: wektor z repo (odrys z masek eksportów — Etap 0.4).
const LOGO_SOURCES = ["src/assets/logo/eha-logo.svg"];

// Kadrowanie ikon (patrz pkt 1 w nagłówku): margines wokół znaku, liczony
// od krawędzi kwadratu. 6 % = znak zajmuje 88 % szerokości kadru.
const ICON_PAD = 0.06;
// Pogrubienie małych rastrów (pkt 2). Wartość jest w jednostkach
// WEWNĘTRZNYCH svg — grupa ma transform scale(0.1), więc 700 tu to 70
// jednostek viewBoxa 2836, czyli ~2,5 % szerokości znaku.
const ICON_BOLD_MAX_PX = 32;
const ICON_BOLD_STROKE = 700;
// Render pośredni, z którego skalujemy w dół: ~7,9 tys. px na krawędzi.
// Nie podnoś bez potrzeby — sharp ma limit liczby pikseli wejścia.
const RENDER_DENSITY = 200;

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)} kB`;

/** Znaczek przycięty do bboxu tuszu, w dwóch wariantach grubości.
 *  Liczony RAZ — każdy rozmiar ikony skaluje się z tego samego rastra. */
async function trimmedMark(bold) {
  const svg = readFileSync(MARK_SVG, "utf8");
  // Ścieżki potrace są WYPEŁNIENIAMI (stroke="none"); dołożenie obrysu
  // w tym samym kolorze rozszerza kształt równomiernie na obie strony.
  const source = bold
    ? svg.replace(
        /stroke="none"/,
        `stroke="currentColor" stroke-width="${ICON_BOLD_STROKE}" stroke-linejoin="round"`,
      )
    : svg;
  return sharp(Buffer.from(source), { density: RENDER_DENSITY })
    .png()
    .toBuffer()
    .then((buf) => sharp(buf).trim({ threshold: 10 }).toBuffer());
}

const markCache = new Map();
const mark = async (bold) => {
  if (!markCache.has(bold)) markCache.set(bold, await trimmedMark(bold));
  return markCache.get(bold);
};

/** PNG ikony: znaczek wyśrodkowany na BIAŁYM kwadracie, bez alfy. */
async function png(size) {
  const inner = Math.round(size * (1 - 2 * ICON_PAD));
  const scaled = await sharp(await mark(size <= ICON_BOLD_MAX_PX))
    .resize({ width: inner, height: inner, fit: "inside" })
    .png()
    .toBuffer();
  const { width, height } = await sharp(scaled).metadata();
  return sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([
      {
        input: scaled,
        left: Math.round((size - width) / 2),
        top: Math.round((size - height) / 2),
      },
    ])
    .flatten({ background: WHITE })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

/** Kontener ICO z payloadem PNG (obsługiwany przez wszystkie żywe przeglądarki). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // typ: ikona
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach(({ size, data }, i) => {
    const at = i * 16;
    dir[at] = size >= 256 ? 0 : size; // 0 = 256 px
    dir[at + 1] = size >= 256 ? 0 : size;
    dir[at + 2] = 0; // paleta
    dir[at + 3] = 0; // reserved
    dir.writeUInt16LE(1, at + 4); // płaszczyzny
    dir.writeUInt16LE(32, at + 6); // bitów na piksel
    dir.writeUInt32LE(data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}

/** Bbox tuszu w jednostkach viewBoxa — liczony z rastra o znanej skali
 *  (ścieżki potrace to tysiące segmentów; liczenie po nich byłoby
 *  przepisywaniem parsera SVG). Zapas 1 jednostki na antyaliasing. */
async function inkBox() {
  const svg = readFileSync(MARK_SVG, "utf8");
  const [, vb] = svg.match(/viewBox="([^"]+)"/);
  const [vx, vy, vw, vh] = vb.split(/[\s,]+/).map(Number);
  const N = 2048;
  const { data, info } = await sharp(Buffer.from(svg))
    .resize(N, N, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let x0 = N,
    y0 = N,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (data[(y * N + x) * info.channels + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return {
    x: vx + (x0 / N) * vw - 1,
    y: vy + (y0 / N) * vh - 1,
    w: ((x1 - x0 + 1) / N) * vw + 2,
    h: ((y1 - y0 + 1) / N) * vh + 2,
  };
}

/** public/favicon.svg = ten sam rysunek co rastry, w tym samym kadrze.
 *  Zmieniamy WYŁĄCZNIE viewBox — ani jedna ścieżka nie jest ruszana. */
async function favicon() {
  const svg = readFileSync(MARK_SVG, "utf8");
  const box = await inkBox();
  const side = Math.max(box.w, box.h) / (1 - 2 * ICON_PAD);
  const minX = box.x + box.w / 2 - side / 2;
  const minY = box.y + box.h / 2 - side / 2;
  const viewBox = [minX, minY, side, side].map((n) => n.toFixed(1)).join(" ");
  const body = svg
    .slice(svg.indexOf("<svg"))
    .replace(/viewBox="[^"]+"/, `viewBox="${viewBox}"`);
  writeFileSync(
    FAVICON_SVG,
    `<!-- GENERAT: node scripts/make-icons.mjs — nie edytuj ręcznie.\n` +
      `     Znaczek z ${MARK_SVG}: ścieżki 1:1, przekadrowany viewBox. -->\n${body}`,
  );
  console.log(`favicon.svg           viewBox ${viewBox}  ${kb(FAVICON_SVG)}`);
  return box;
}

async function main() {
  if (!existsSync(MARK_SVG)) {
    throw new Error(`brak ${MARK_SVG} — ikony powstają z odrysu znaczka`);
  }
  const box = await favicon();
  console.log(
    `  (bbox tuszu ${box.w.toFixed(0)}×${box.h.toFixed(0)} w viewBoxie — proporcja ${(box.w / box.h).toFixed(2)})`,
  );

  for (const [name, size] of [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ]) {
    writeFileSync(`${OUT}/${name}`, await png(size));
    console.log(`${name.padEnd(21)} ${size}×${size}  ${kb(`${OUT}/${name}`)}`);
  }

  const sizes = [16, 32, 48];
  writeFileSync(
    `${OUT}/favicon.ico`,
    ico(
      await Promise.all(
        sizes.map(async (size) => ({ size, data: await png(size) })),
      ),
    ),
  );
  console.log(
    `favicon.ico           ${sizes.join("+")}  ${kb(`${OUT}/favicon.ico`)}`,
  );

  const logo = LOGO_SOURCES.find((p) => existsSync(p));
  if (!logo) throw new Error(`brak źródła logo (${LOGO_SOURCES.join(", ")})`);
  const logoBuf = await sharp(logo, { density: 300 })
    .resize({ width: OG.logoW, height: OG.h - 80, fit: "inside" })
    .toBuffer();
  const { width: logoRealW, height: logoH } = await sharp(logoBuf).metadata();
  writeFileSync(
    `${OUT}/og-image.png`,
    await sharp({
      create: { width: OG.w, height: OG.h, channels: 3, background: PAPER },
    })
      .composite([
        {
          input: logoBuf,
          left: Math.round((OG.w - logoRealW) / 2),
          top: Math.round((OG.h - logoH) / 2),
        },
      ])
      .png({ compressionLevel: 9, palette: true, colors: 128 })
      .toBuffer(),
  );
  console.log(
    `og-image.png          ${OG.w}×${OG.h}  ${kb(`${OUT}/og-image.png`)}  (logo: ${logo})`,
  );
}

await main();
