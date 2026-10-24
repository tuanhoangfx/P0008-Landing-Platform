#!/usr/bin/env node
/**
 * ldp.infi.io.vn — the platform's library: Templates · Sections · Sites.
 *
 *  - Every section is rendered alone by the real engine (sample content from the first site that
 *    uses the template) at /preview/sections/<name>/, so the library always shows the code that ships.
 *  - Which page uses which section, and which tokens/blocks a section needs, are read from the
 *    files themselves — nothing is listed by hand.
 *  - The result is data, not a page: dist/catalog.json feeds the Hub-UI admin app (src/), which
 *    scripts/build-home.mjs then builds into the same dist/ (index.html with app-version meta).
 *
 *   node engine/catalog.mjs          → dist/ (catalog.json, 404.html, preview/…)
 */
import fs from "node:fs";
import path from "node:path";
import { build } from "vite";
import { createContent, esc, sectionsOf } from "./render.mjs";
import { makeShotVariants } from "./shots.mjs";
import { baseViteConfig, latestRelease, listSites, loadSite, pageFor, platformRoot, sectionsDir, sitePlugin, versionOf } from "./site.mjs";

const dist = path.join(platformRoot, "dist");
const work = path.join(platformRoot, ".catalog");
const PREVIEW = "/preview/";
const ORIGIN = "https://ldp.infi.io.vn";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const walkHtml = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
};

/* ---------------------------------------------------------------- inventory (derived) */
const sites = listSites().map(loadSite);
const sections = fs
  .readdirSync(sectionsDir)
  .filter((n) => fs.existsSync(path.join(sectionsDir, n, "section.html")))
  .map((name) => {
    const html = fs.readFileSync(path.join(sectionsDir, name, "section.html"), "utf8");
    const meta = fs.existsSync(path.join(sectionsDir, name, "section.json")) ? read(path.join(sectionsDir, name, "section.json")) : {};
    return {
      name,
      meta,
      html,
      tokens: [...new Set([...html.matchAll(/\{\{c\.([\w.]+)\}\}/g)].map((m) => m[1]))],
      blocks: [...new Set([...html.matchAll(/<!--@([\w-]+?)(?=\s|-->)/g)].map((m) => m[1]).filter((b) => b !== "section"))],
      usedIn: [],
    };
  });
const templates = fs
  .readdirSync(path.join(platformRoot, "templates"))
  .filter((t) => fs.existsSync(path.join(platformRoot, "templates", t, "template.json")))
  .map((id) => {
    const dir = path.join(platformRoot, "templates", id, "pages");
    const pages = walkHtml(dir).map((p) => {
      const rel = path.relative(dir, p).replace(/\\/g, "/");
      const names = sectionsOf(fs.readFileSync(p, "utf8"));
      for (const n of names) sections.find((s) => s.name === n)?.usedIn.push(`${id}/${rel}`);
      return { rel, names };
    });
    return { id, meta: read(path.join(platformRoot, "templates", id, "template.json")), pages, sites: sites.filter((s) => (s.config.template ?? "product-guide") === id) };
  });

/* ---------------------------------------------------------------- section previews */
// Sample = the most complete site on the template (most guide steps), so previews stay stable while a
// newly scaffolded site (alphabetically first, content still placeholder) is being filled in.
const stepCount = (s) => {
  const p = path.join(s.dir, "content", "steps.json");
  return fs.existsSync(p) ? read(p).length : 0;
};
const sample = [...(templates.find((t) => t.sites.length)?.sites ?? [])].sort((a, b) => stepCount(b) - stepCount(a))[0];
if (!sample) throw new Error("[catalog] no site to take sample content from");
const sampleCtx = createContent(sample.dir);
const sampleChapter = sampleCtx.chapters.find((c) => sampleCtx.steps.filter((s) => s.chapter === c.id).length > 1) ?? sampleCtx.chapters[0];

fs.rmSync(work, { recursive: true, force: true });
const pagesDir = path.join(work, "pages");
const publicDir = path.join(work, "public");
const scriptFor = (rel) => (rel.startsWith("guide") ? "guide" : rel.startsWith("download") || rel === "404.html" ? "download" : "landing");
for (const s of sections) {
  const firstUse = s.usedIn[0]?.split("/").slice(1).join("/") ?? "index.html";
  const isChapter = s.name.startsWith("chapter-");
  // chapter sections preview inside the sample chapter's route so chapter vars resolve
  const rel = isChapter ? `guide/${sampleChapter.id}/sections/${s.name}/index.html` : `sections/${s.name}/index.html`;
  const file = path.join(pagesDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `<!doctype html>
<html lang="{{lang}}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${esc(s.meta.title_vi ?? s.name)} — section preview</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <script type="module" src="/@engine/pages/${scriptFor(firstUse)}.js"></script>
  <style>body{min-height:auto} .section,.page-hero,.hero{padding-top:56px!important}</style>
</head>
<body class="page-preview"${isChapter ? ' style="--c:{{chapterColor}}"' : ""}>
<main id="main">
${s.html.replaceAll("<!--chapter-id-->", sampleChapter.id)}
</main>
</body>
</html>
`,
  );
}
// public: everything the sample shows except the multi-MB videos (played from the sample's origin)
const copyTree = (from, to, skip) => {
  if (!fs.existsSync(from)) return;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    if (skip(a)) continue;
    if (e.isDirectory()) copyTree(a, path.join(to, e.name), skip);
    else fs.mkdirSync(to, { recursive: true }), fs.copyFileSync(a, path.join(to, e.name));
  }
};
copyTree(path.join(sample.dir, "public"), publicDir, (p) => p.endsWith(".mp4"));

const site = { ...sample, id: "_catalog", base: PREVIEW, pagesDir, outDir: dist, config: { ...sample.config, origin: ORIGIN, base: PREVIEW, langs: [sample.config.langs?.[0] ?? "vi"] } };
const release = await latestRelease(sample);
const versions = versionOf({ config: {} });
// /preview/guide/<chapter>/sections/x/ → treat as the chapter page for chapter vars
const adjust = (page, filename, ctx) => {
  const m = path.relative(pagesDir, filename).replace(/\\/g, "/").match(/^guide\/([\w-]+)\/sections\//);
  if (!m) return page;
  const chapterPage = pageFor(site, path.join(pagesDir, `guide/${m[1]}/index.html`), ctx, release, versions);
  return { ...chapterPage, file: page.file };
};
fs.rmSync(dist, { recursive: true, force: true });
await build(baseViteConfig({ root: pagesDir, base: PREVIEW, publicDir, outDir: path.join(dist, PREVIEW.slice(1, -1)), plugins: [sitePlugin(site, release, versions, adjust)] }));
makeShotVariants(path.join(dist, PREVIEW.slice(1, -1), "shots"));
// previews play the sample's real tutorial video instead of shipping it twice
for (const f of walkHtml(path.join(dist, PREVIEW.slice(1, -1)))) {
  const html = fs.readFileSync(f, "utf8").replaceAll(`"${PREVIEW}video/`, `"${sample.config.origin}${sample.base}video/`);
  fs.writeFileSync(f, html);
}
const previewUrl = (s) => (s.name.startsWith("chapter-") ? `${PREVIEW}guide/${sampleChapter.id}/sections/${s.name}/` : `${PREVIEW}sections/${s.name}/`);

/* ---------------------------------------------------------------- catalog.json (admin app data) */
// The ldp.infi.io.vn admin (src/, Hub-UI shell) reads this file; nothing in it is listed by hand.
const pkg = read(path.join(platformRoot, "package.json"));
const readOpt = (p, fallback) => (fs.existsSync(p) ? read(p) : fallback);
const count = (v) => (Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0);
const rel = (p) => path.relative(platformRoot, p).replace(/\\/g, "/");

const siteRows = sites.map((s) => {
  const content = path.join(s.dir, "content");
  const landing = readOpt(path.join(content, "landing.json"), {});
  const url = s.config.origin + s.base;
  const langs = s.config.langs ?? ["vi"];
  return {
    id: s.id,
    name: s.config.name,
    product: s.config.product ?? null,
    registryKey: s.config.registryKey ?? null,
    template: s.config.template ?? "product-guide",
    origin: s.config.origin,
    base: s.base,
    url,
    domain: new URL(url).host + s.base,
    langs,
    langUrls: langs.map((l, i) => ({ lang: l, url: i === 0 ? url : `${url}${l}/` })),
    steps: count(readOpt(path.join(content, "steps.json"), [])),
    chapters: count(readOpt(path.join(content, "chapters.json"), [])),
    features: count(readOpt(path.join(content, "features.json"), [])),
    faq: count(readOpt(path.join(content, "faq.json"), [])),
    lead: landing.en?.hero?.lead ?? landing.vi?.hero?.lead ?? "",
    ogImage: `${url}og.png`,
    devPort: s.config.devPort ?? null,
    releasesRepo: s.config.releases?.repo || null,
    configPath: rel(path.join(s.dir, "site.config.json")),
  };
});

const sectionRows = sections.map((s) => ({
  name: s.name,
  title: s.meta.title_en ?? s.meta.title_vi ?? s.name,
  description: s.meta.description_en ?? s.meta.description_vi ?? "",
  group: s.meta.group ?? "Other",
  chapter: s.name.startsWith("chapter-"),
  usedIn: s.usedIn,
  blocks: s.blocks,
  tokens: s.tokens,
  tokenRoots: [...new Set(s.tokens.map((t) => t.split(".")[0]))],
  previewUrl: previewUrl(s),
  sourcePath: `sections/${s.name}/section.html`,
}));

const templateRows = templates.map((t) => ({
  id: t.id,
  title: t.meta.title_en ?? t.meta.title_vi ?? t.id,
  description: t.meta.description_en ?? t.meta.description_vi ?? "",
  origin: t.meta.origin ?? null,
  pages: t.pages.map((p) => ({ rel: p.rel, sections: p.names })),
  sectionCount: new Set(t.pages.flatMap((p) => p.names)).size,
  sites: t.sites.map((s) => s.id),
  sourcePath: `templates/${t.id}/`,
}));

const catalog = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  platformVersion: pkg.version,
  origin: ORIGIN,
  previewBase: PREVIEW,
  sample: { siteId: sample.id, siteName: sample.config.name, chapter: sampleChapter.id },
  counts: { templates: templateRows.length, sections: sectionRows.length, sites: siteRows.length },
  templates: templateRows,
  sections: sectionRows,
  sites: siteRows,
};
fs.writeFileSync(path.join(dist, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);

// nginx staticSite answers unknown paths with a real 404 — keep it tiny, Hub-dark, no app bundle.
fs.writeFileSync(
  path.join(dist, "404.html"),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>404 — Landing Platform</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>html,body{margin:0;height:100%;background:#0b1020;color:#e8ecff;font:14px/1.6 Inter,system-ui,sans-serif}
main{display:grid;place-items:center;height:100%;text-align:center}a{color:#7dd3fc}</style></head>
<body><main><div><h1 style="margin:0;font-size:28px">404</h1><p>Page not found. <a href="/">Landing Platform</a></p></div></main></body></html>
`,
);
fs.rmSync(work, { recursive: true, force: true });
console.log(`[catalog] ${templateRows.length} template(s) · ${sectionRows.length} sections · ${siteRows.length} site(s) → dist/preview + dist/catalog.json`);
