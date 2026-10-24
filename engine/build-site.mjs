#!/usr/bin/env node
/**
 * Build one site: vite build → dist/<base>/ → 1600w WebP variants of every 2x shot →
 * dist root extras (redirect to base when base ≠ "/", 404.html, sitemap.xml, robots.txt).
 *
 *   node engine/build-site.mjs --site videolab
 *   (cwd-independent; deploy-lenovo-static runs it from sites/<id> via the registry entry)
 */
import fs from "node:fs";
import path from "node:path";
import { build } from "vite";
import { viteConfigFor } from "./site.mjs";
import { makeShotVariants } from "./shots.mjs";

const args = process.argv.slice(2);
const id = args[args.indexOf("--site") + 1];
if (!id || id.startsWith("--")) throw new Error("usage: build-site.mjs --site <id>");

const { site, config } = await viteConfigFor(id);
const { base, outDir: dist } = site;
const siteDist = path.join(dist, base.slice(1, -1));
const origin = site.config.origin;

// Vite only empties dist/<base>; drop root leftovers from earlier layouts.
fs.rmSync(dist, { recursive: true, force: true });
await build(config);

// Shots are captured at 2x; pages reference a -1600 variant via srcset.
const variants = makeShotVariants(path.join(siteDist, "shots"));
if (variants) console.log(`[site:${id}] ${variants} shot variants (1600w)`);

const version = fs.readFileSync(path.join(siteDist, "index.html"), "utf8").match(/name="app-version" content="([^"]+)"/)?.[1];

if (base !== "/") {
  // Domain root belongs to another app (e.g. an admin) — until it ships, hop to the site.
  // Carries app-version so deploy-lenovo-static can verify this dist like any other.
  fs.writeFileSync(
    path.join(dist, "index.html"),
    `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="app-version" content="${version}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${base}">
<link rel="canonical" href="${origin}${base}">
<title>${site.config.name}</title>
<script>location.replace(${JSON.stringify(base)} + location.hash);</script>
</head><body style="background:#07080f;color:#b4b9cc;font:15px system-ui;display:grid;place-items:center;min-height:100vh;margin:0">
<a href="${base}" style="color:#a78bfa">${site.config.name} →</a>
</body></html>
`,
  );
  // nginx `error_page 404 /404.html` resolves from the dist root. Root-level links shared before
  // a move under base (/guide/…, /download/) hop over instead of dead-ending.
  const legacy = (site.config.legacyRootPaths ?? []).map((p) => p.replace(/^\/|\/$/g, "")).filter(Boolean);
  let notFound = fs.readFileSync(path.join(siteDist, "404.html"), "utf8");
  if (legacy.length) {
    notFound = notFound.replace(
      "</head>",
      `<script>if (/^\\/(${legacy.join("|")})(\\/|$)/.test(location.pathname)) location.replace(${JSON.stringify(base.slice(0, -1))} + location.pathname + location.hash);</script>\n</head>`,
    );
  }
  fs.writeFileSync(path.join(dist, "404.html"), notFound);
}

const pages = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === "index.html") pages.push(`/${path.relative(dist, path.dirname(p)).replace(/\\/g, "/")}/`.replace(/\/+/g, "/"));
  }
};
walk(siteDist);
const urls = pages.sort();
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${origin}${u}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`,
);
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: ${base}\nSitemap: ${origin}/sitemap.xml\n`);
// Mounted site (site.config "mounted": the domain root is the product app and nginx serves only
// <base>): root files never reach visitors, so the sitemap also ships inside base.
if (site.config.mounted) fs.copyFileSync(path.join(dist, "sitemap.xml"), path.join(siteDist, "sitemap.xml"));

console.log(`[site:${id}] built ${urls.length} pages under ${base} · app-version ${version}`);
