// SEO/linki: canonical, meta OG/Twitter, sitemap, robots.txt (blokada
// /admin), crawl wewnętrznych linków (< 400). Meta są identyczne między
// profilami — biega tylko na chromium-1920.
import { expect, test } from "@playwright/test";
import {
  CONTACT_PATH,
  EKIPA_PATH,
  HOME_PATH,
  KOMPETENCJE_PATH,
  OBSLUGA_PATH,
  POLICY_PATH,
  TRADYCJA_PATH,
  WORK_INDEX_PATH,
} from "../../src/lib/routes";
import { useChromium1920Only } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

const SITE = "https://pracownia-eha.pl";

// Wszystkie trasy mają własny canonical (mobile 1:1 desktop, bez
// redirectów — §9 analizy), więc sitemapa = komplet 8.
const CANONICAL_ROUTES = [
  HOME_PATH,
  EKIPA_PATH,
  KOMPETENCJE_PATH,
  TRADYCJA_PATH,
  WORK_INDEX_PATH,
  OBSLUGA_PATH,
  CONTACT_PATH,
  POLICY_PATH,
];

useChromium1920Only(
  "meta/sitemap/crawl są niezależne od profilu — jeden projekt wystarczy",
);

test("head /: canonical + OG/Twitter", async ({ page }) => {
  await gotoReady(page, "/");
  const head = page.locator("head");

  // Canonical i og:url są absolutne (domena z astro.config — także na preview).
  await expect(head.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE}/`,
  );
  await expect(head.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${SITE}/`,
  );
  await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${SITE}/og-image.png`,
  );
  await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "pl_PL",
  );
  const ogTitle = await head
    .locator('meta[property="og:title"]')
    .getAttribute("content");
  expect(ogTitle).toBe(await page.title());
  // Kadr og-image i typ karty chodzą w parze: 1200×630 + karta „large".
  await expect(head.locator('meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
  await expect(
    head.locator('meta[property="og:image:height"]'),
  ).toHaveAttribute("content", "630");
  await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

// Ikony marki: do Etapu 6 w public/ leżą PLACEHOLDERY z logo EH/A
// (finalny komplet: make-icons.mjs z favicon.svg — Etap 6). Sprawdzamy,
// że pliki wychodzą z builda niepuste i są tym, za co się podają.
test("ikony marki i manifest odpowiadają 200 i mają właściwy format", async ({
  request,
}) => {
  const MAGIC: Record<string, (b: Buffer) => boolean> = {
    "/favicon.svg": (b) => b.subarray(0, 400).toString("utf8").includes("<svg"),
    "/favicon.ico": (b) => b.readUInt32LE(0) === 0x00010000, // reserved=0, typ=1
    "/apple-touch-icon.png": (b) =>
      b.subarray(1, 4).toString("latin1") === "PNG",
    "/icon-192.png": (b) => b.subarray(1, 4).toString("latin1") === "PNG",
    "/icon-512.png": (b) => b.subarray(1, 4).toString("latin1") === "PNG",
    "/og-image.png": (b) => b.subarray(1, 4).toString("latin1") === "PNG",
  };
  for (const [path, isValid] of Object.entries(MAGIC)) {
    const res = await request.get(path);
    expect(res.status(), `ikona ${path}`).toBe(200);
    const body = await res.body();
    expect(body.length, `ikona ${path} jest pusta`).toBeGreaterThan(100);
    expect(isValid(body), `ikona ${path} ma zły format`).toBe(true);
  }

  const manifest = await request.get("/site.webmanifest");
  expect(manifest.status()).toBe(200);
  const parsed = JSON.parse(await manifest.text());
  expect(parsed.name).toBe("Pracownia EH/A");
  expect(parsed.start_url).toBe("/");
  expect(parsed.icons.length).toBeGreaterThan(0);
  for (const icon of parsed.icons) {
    const res = await request.get(icon.src);
    expect(res.status(), `ikona z manifestu ${icon.src}`).toBe(200);
  }
});

// Dane strukturalne wchodzą w Etapie 6 (JSON-LD: /kontakt/ =
// HomeAndConstructionBusiness bez tel/maila, / = @graph WebSite +
// samodzielna Organization — §9 analizy). Do tego czasu strony nie
// renderują <script type="application/ld+json"> — testy JSON-LD wracają
// razem z danymi (wzorzec asercji w historii delung-web: seo.spec.ts).
test("JSON-LD nie występuje przed Etapem 6 (strażnik stanu szkieletu)", async ({
  request,
}) => {
  for (const path of [HOME_PATH, CONTACT_PATH]) {
    const html = await (await request.get(path)).text();
    expect(html).not.toContain('type="application/ld+json"');
  }
});

test("robots.txt blokuje /admin i wskazuje sitemapę", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain("Disallow: /admin");
  expect(body).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});

test("sitemapa istnieje i zawiera dokładnie trasy z własnym canonicalem", async ({
  request,
}) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.ok()).toBe(true);
  const locs = [...(await index.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  expect(locs.length).toBeGreaterThan(0);

  const urls: string[] = [];
  for (const loc of locs) {
    const res = await request.get(new URL(loc).pathname);
    expect(res.ok(), `sitemapa ${loc}`).toBe(true);
    urls.push(
      ...[...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (m) => m[1],
      ),
    );
  }
  expect(urls.sort()).toEqual(
    CANONICAL_ROUTES.map((p) => `${SITE}${p}`).sort(),
  );
});

test("wszystkie wewnętrzne linki odpowiadają < 400", async ({
  page,
  request,
}) => {
  const hrefs = new Set<string>();
  for (const path of CANONICAL_ROUTES) {
    await gotoReady(page, path);
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")))) {
      if (!href || !href.startsWith("/") || href.startsWith("//")) continue;
      if (href.includes("/cdn-cgi/")) continue; // tylko na produkcji Cloudflare
      hrefs.add(href);
    }
  }
  expect(hrefs.size).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), `link ${href}`).toBeLessThan(400);
  }
});
