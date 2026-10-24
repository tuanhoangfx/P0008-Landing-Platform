#!/usr/bin/env node
/**
 * SSOT gate for product landing sites. Fails when:
 *  - a site config/content is incomplete, or a template token has no landing.json text (dry render);
 *  - a site has no hosting entry, or its entry/manifest disagree (domain, productRoot, build, registryKey);
 *  - a `staticSite` hosting entry builds from outside P0008 (a hand-rolled landing).
 * Warns (exit 0) about known migration debt: product-local landing code outside the platform.
 *
 *   node Tool/P0008-Landing-Platform/scripts/audit-sites.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { createContent, expandSections, renderPage, sectionsOf } from "../engine/render.mjs";
import { devRoot, listSites, loadSite, platformRoot, sectionsDir } from "../engine/site.mjs";

const { LENOVO_SPA_PRODUCTS } = await import(new URL(`file:///${path.join(devRoot, "Tool/scripts/lib/lenovo-spa-products.mjs").replace(/\\/g, "/")}`));
const failures = [];
const warnings = [];
const passes = [];
const rel = (p) => path.relative(devRoot, p).replace(/\\/g, "/");

for (const id of listSites()) {
  const site = loadSite(id);
  const c = site.config;
  for (const k of ["id", "name", "product", "registryKey", "template", "origin", "base", "langs"]) if (!c[k]) failures.push(`${id}: site.config.json missing "${k}"`);
  if (c.id !== id) failures.push(`${id}: config id "${c.id}" ≠ folder`);
  for (const f of ["chapters", "steps", "features", "faq", "landing"]) if (!fs.existsSync(path.join(site.dir, `content/${f}.json`))) failures.push(`${id}: content/${f}.json missing`);

  // Dry render every template page in every language: catches missing copy before a build does.
  const ctx = createContent(site.dir);
  const pages = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") && pages.push(path.join(d, e.name))));
  walk(site.templateDir);
  for (const lang of c.langs ?? ["vi"]) {
    for (const file of pages) {
      const name = path.relative(site.templateDir, file).replace(/\\/g, "/");
      if (lang !== c.langs[0] && name === "404.html") continue;
      const chapter = name === "guide/_chapter.html" ? ctx.chapters[0]?.id : null;
      try {
        renderPage(expandSections(fs.readFileSync(file, "utf8"), sectionsDir).replaceAll("<!--chapter-id-->", chapter ?? ""), ctx, {
          file: `${lang}/${name}`, base: site.base, lang, path: "/", chapter, vars: new Proxy({}, { has: () => true, get: () => "" }),
        });
      } catch (e) {
        failures.push(`${id}: ${lang}/${name} — ${e.message}`);
      }
    }
    for (const s of ctx.steps) if (!s[`title_${lang}`]) warnings.push(`${id}: step ${s.id} has no title_${lang}`);
  }
  for (const s of ctx.steps) if (s.shot && !ctx.hasPublic(s.shot)) failures.push(`${id}: step ${s.id} shot ${s.shot} missing in public/`);

  // Hosting entry + product manifest agree with the site.
  const entry = LENOVO_SPA_PRODUCTS[c.registryKey];
  if (!entry) failures.push(`${id}: no "${c.registryKey}" in lenovo-spa-products.mjs`);
  else {
    if (entry.productRoot !== rel(site.dir)) failures.push(`${id}: ${c.registryKey}.productRoot = ${entry.productRoot} (expect ${rel(site.dir)})`);
    if (entry.domain !== new URL(c.origin).host) failures.push(`${id}: ${c.registryKey}.domain ${entry.domain} ≠ origin ${c.origin}`);
    if (!entry.staticSite) failures.push(`${id}: ${c.registryKey} must set staticSite: true`);
    // Mounted site: lives under base of a domain whose root is the product app (one server block).
    if (c.mounted) {
      if (entry.mountPath !== c.base) failures.push(`${id}: mounted site needs ${c.registryKey}.mountPath = "${c.base}" (got ${entry.mountPath ?? "none"})`);
      const owner = Object.entries(LENOVO_SPA_PRODUCTS).find(([k, e]) => k !== c.registryKey && e.domain === entry.domain && !e.mountPath);
      if (!owner) failures.push(`${id}: mounted on ${entry.domain} but no registry entry owns that domain root`);
    } else if (entry.mountPath) failures.push(`${id}: ${c.registryKey} has mountPath but site.config.json is not "mounted": true`);
    if (!(entry.build ?? []).join(" ").includes(`build-site.mjs --site ${id}`)) failures.push(`${id}: ${c.registryKey}.build must run engine/build-site.mjs --site ${id}`);
    const manifestFile = path.join(devRoot, entry.manifestRoot ?? "", "tool.manifest.json");
    const m = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : null;
    if (!m) failures.push(`${id}: ${c.registryKey}.manifestRoot has no tool.manifest.json`);
    else {
      if (m.code !== c.product) failures.push(`${id}: manifest code ${m.code} ≠ product ${c.product}`);
      if (m.site?.registryKey !== c.registryKey) failures.push(`${id}: ${m.code} manifest site.registryKey ≠ ${c.registryKey}`);
      if (m.site?.siteId !== id || m.site?.platform !== "P0008") failures.push(`${id}: ${m.code} manifest site block must say platform "P0008", siteId "${id}"`);
      if (!String(m.urls?.site ?? "").startsWith(c.origin + c.base)) failures.push(`${id}: ${m.code} urls.site should be ${c.origin}${c.base}`);
    }
  }
  passes.push(`${id} (${c.registryKey} → ${c.origin}${c.base})`);
}

// Section library: every section documented, every marker resolvable, unused ones flagged.
const used = new Set();
for (const t of fs.readdirSync(path.join(platformRoot, "templates"))) {
  const dir = path.join(platformRoot, "templates", t, "pages");
  if (!fs.existsSync(dir)) continue;
  if (!fs.existsSync(path.join(platformRoot, "templates", t, "template.json"))) failures.push(`templates/${t}: template.json missing`);
  const walkT = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walkT(p);
    if (!e.name.endsWith(".html")) return;
    for (const n of sectionsOf(fs.readFileSync(p, "utf8"))) {
      used.add(n);
      if (!fs.existsSync(path.join(sectionsDir, n, "section.html"))) failures.push(`templates/${t}/${path.relative(dir, p).split(path.sep).join("/")}: unknown section "${n}"`);
    }
  });
  walkT(dir);
}
for (const n of fs.readdirSync(sectionsDir)) {
  if (!fs.existsSync(path.join(sectionsDir, n, "section.html"))) continue;
  if (!fs.existsSync(path.join(sectionsDir, n, "section.json"))) failures.push(`sections/${n}: section.json missing`);
  if (!used.has(n)) warnings.push(`sections/${n}: not used by any template page`);
}
passes.push(`${used.size} sections used by templates`);

// No landing site may build outside the platform.
const platformRel = "Tool/P0008-Landing-Platform";
for (const [key, entry] of Object.entries(LENOVO_SPA_PRODUCTS)) {
  if (!entry.staticSite || key === "P0008") continue;
  if (!String(entry.productRoot).startsWith(`${platformRel}/sites/`)) failures.push(`${key}: staticSite built from ${entry.productRoot} — landings must live in ${platformRel}/sites/<id>`);
}
// Migration debt: product-local landing code (warn only).
for (const d of fs.readdirSync(path.join(devRoot, "Tool"))) {
  for (const sub of ["site", "src/features/landing"]) {
    const p = path.join(devRoot, "Tool", d, sub);
    if (/^P\d{4}-/.test(d) && d !== "P0008-Landing-Platform" && fs.existsSync(p)) warnings.push(`Tool/${d}/${sub}: product-local landing — migrate to ${platformRel}/sites/<id>`);
  }
}

const report = { ok: failures.length === 0, sites: passes, failures, warnings };
if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else {
  for (const p of passes) console.log(`OK    ${p}`);
  for (const w of warnings) console.log(`WARN  ${w}`);
  for (const f of failures) console.log(`FAIL  ${f}`);
  console.log(`audit-sites: ${report.ok ? "PASS" : "FAIL"}`);
}
process.exit(report.ok ? 0 : 1);
