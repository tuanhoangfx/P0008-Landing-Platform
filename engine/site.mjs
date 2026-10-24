/**
 * One site = `sites/<id>/` with site.config.json + content/ + pages/ + public/.
 * This module turns a site folder into a Vite config; every site builds through it, so the
 * engine (render.mjs + client/) is the single renderer for all landing pages.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createContent, expandSections, renderPage } from "./render.mjs";

export const platformRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const devRoot = path.resolve(platformRoot, "../..");
export const sectionsDir = path.join(platformRoot, "sections");
const engineClient = path.join(platformRoot, "engine", "client");

export function siteDir(id) {
  const dir = path.join(platformRoot, "sites", id);
  if (!fs.existsSync(path.join(dir, "site.config.json"))) throw new Error(`[site] no sites/${id}/site.config.json`);
  return dir;
}

export function listSites() {
  const root = path.join(platformRoot, "sites");
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, "site.config.json")))
    .map((d) => d.name);
}

export function loadSite(id) {
  const dir = siteDir(id);
  const config = JSON.parse(fs.readFileSync(path.join(dir, "site.config.json"), "utf8"));
  const base = config.base ?? "/";
  if (!base.startsWith("/") || !base.endsWith("/")) throw new Error(`[site] ${id}: base must start and end with "/"`);
  const templateDir = path.join(platformRoot, "templates", config.template ?? "product-guide", "pages");
  if (!fs.existsSync(templateDir)) throw new Error(`[site] ${id}: unknown template "${config.template}"`);
  // .pages = template pages (one file serves every language) + optional sites/<id>/pages overrides,
  // materialised per language at build time. Vite's root.
  return { id, dir, config, base, templateDir, overrideDir: path.join(dir, "pages"), pagesDir: path.join(dir, ".pages"), outDir: path.join(dir, "dist") };
}

/** Version stamped into <meta name="app-version"> — unique per build so deploy verify can tell builds apart. */
export function versionOf(site) {
  const pkg = site.config.appVersionFrom ? path.join(devRoot, site.config.appVersionFrom) : path.join(platformRoot, "package.json");
  const v = JSON.parse(fs.readFileSync(pkg, "utf8")).version;
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return { appVersion: v, siteVersion: `${v}+site.${stamp}` };
}

/** Latest installer for the download buttons; last good answer cached in content/release.json. */
export async function latestRelease(site) {
  const repo = site.config.releases?.repo;
  const cacheFile = path.join(site.dir, "content/release.json");
  const cached = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : null;
  const fallback = cached ?? { tag: "", url: repo ? `https://github.com/${repo}/releases/latest` : "", size: "", date: "" };
  if (!repo) return fallback;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return fallback;
    const j = await res.json();
    const pattern = new RegExp(site.config.releases.asset ?? "\\.exe$", "i");
    const asset = (j.assets || []).find((a) => pattern.test(a.name));
    if (!asset) return fallback;
    const rel = { tag: j.tag_name || "", url: asset.browser_download_url, size: `${Math.round(asset.size / 1024 / 1024)} MB`, date: (j.published_at || "").slice(0, 10) };
    if (JSON.stringify(rel) !== JSON.stringify(cached)) fs.writeFileSync(cacheFile, JSON.stringify(rel, null, 2) + "\n");
    return rel;
  } catch {
    return fallback;
  }
}

const copyTree = (from, to, skip = () => false) => {
  if (!fs.existsSync(from)) return;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (skip(a)) continue;
    if (e.isDirectory()) copyTree(a, b, skip);
    else {
      fs.mkdirSync(to, { recursive: true });
      const next = fs.readFileSync(a);
      if (!fs.existsSync(b) || !fs.readFileSync(b).equals(next)) fs.writeFileSync(b, next);
    }
  }
};

/** Template pages (+ site overrides) → .pages/ for the first language and .pages/<lang>/ for the rest. */
function materialisePages(site) {
  const langs = site.config.langs ?? ["vi"];
  fs.rmSync(site.pagesDir, { recursive: true, force: true });
  langs.forEach((lang, i) => {
    const to = i === 0 ? site.pagesDir : path.join(site.pagesDir, lang);
    const skip = (p) => i > 0 && path.basename(p) === "404.html";
    copyTree(site.templateDir, to, skip);
    copyTree(site.overrideDir, to, skip);
  });
  // Inline sections now, so section markup goes through chapter-id substitution like page markup.
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html")) fs.writeFileSync(p, expandSections(fs.readFileSync(p, "utf8"), sectionsDir));
    }
  };
  walk(site.pagesDir);
}

/** .pages/<lang?>/guide/_chapter.html → .pages/<lang?>/guide/<id>/index.html. */
function writeChapterPages(site, chapters) {
  for (const prefix of (site.config.langs ?? ["vi"]).map((l, i) => (i === 0 ? "" : `${l}/`))) {
    const tplFile = path.join(site.pagesDir, `${prefix}guide/_chapter.html`);
    if (!fs.existsSync(tplFile)) continue;
    const tpl = fs.readFileSync(tplFile, "utf8");
    for (const c of chapters) {
      const dir = path.join(site.pagesDir, `${prefix}guide`, c.id);
      fs.mkdirSync(dir, { recursive: true });
      const html = tpl.replaceAll("<!--chapter-id-->", c.id);
      const file = path.join(dir, "index.html");
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== html) fs.writeFileSync(file, html);
    }
  }
}

/** Every pages/**\/index.html (+ root 404.html) is an entry; `_*.html` are templates. */
export function pageInputs(pagesDir) {
  const input = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "index.html" || (dir === pagesDir && e.name === "404.html")) {
        const key = path.relative(pagesDir, p).replace(/\\/g, "/").replace(/(\/)?index\.html$/, "").replace(/\.html$/, "") || "index";
        input[key.replace(/\//g, "-")] = p;
      }
    }
  };
  walk(pagesDir);
  return input;
}

export function pageFor(site, file, ctx, release, versions) {
  const { config, base } = site;
  const langs = config.langs ?? ["vi"];
  const rel = path.relative(site.pagesDir, file).replace(/\\/g, "/");
  const lang = langs.find((l, i) => i > 0 && rel.startsWith(`${l}/`)) ?? langs[0];
  const pathNoLang = "/" + rel.replace(new RegExp(`^${lang}/`), "").replace(/index\.html$/, "").replace(/\.html$/, "");
  const chapterId = pathNoLang.match(/^\/guide\/([\w-]+)\/$/)?.[1] ?? null;
  const chapter = ctx.chapters.find((c) => c.id === chapterId);
  const route = (lang === langs[0] ? "" : `/${lang}`) + pathNoLang;
  const loc = (key) => chapter?.[`${key}_${lang}`] ?? chapter?.[`${key}_${langs[0]}`] ?? "";
  return {
    file: rel,
    base,
    lang,
    path: pathNoLang,
    chapter: chapterId,
    vars: {
      ...versions,
      lang,
      // link prefix for the page language: "" for the first, "/en" for the others
      l: lang === langs[0] ? "" : `/${lang}`,
      siteUrl: config.origin + base,
      siteId: site.id,
      siteName: config.name,
      siteOrigin: config.origin,
      canonical: config.origin + base.slice(0, -1) + route,
      releaseTag: release.tag,
      releaseUrl: release.url,
      releaseSize: release.size,
      releaseDate: release.date,
      releaseMeta: release.tag && release.size ? `${release.tag} · ${release.size}` : release.tag,
      releasesPage: config.releases?.repo ? `https://github.com/${config.releases.repo}/releases` : "",
      stepCount: String(ctx.steps.length),
      videoHidden: ctx.hasPublic("video/tutorial.mp4") ? "" : "hidden",
      chapterVideoHidden: chapter && ctx.hasPublic(`video/${chapter.id}.mp4`) ? "" : "hidden",
      chapterId: chapter?.id ?? "",
      chapterTitle: loc("title"),
      chapterKicker: loc("kicker"),
      chapterSummary: loc("summary"),
      chapterColor: chapter?.color ?? "#818cf8",
    },
  };
}

/** `adjust(page, filename, ctx)` may rewrite the page context (catalog previews use it). */
export function sitePlugin(site, release, versions, adjust = (page) => page) {
  return {
    name: "landing-platform-pages",
    transformIndexHtml: {
      order: "pre",
      handler(html, { filename }) {
        // Fresh content on every request in dev; once per page in build.
        const ctx = createContent(site.dir);
        return renderPage(html, ctx, adjust(pageFor(site, filename, ctx, release, versions), filename, ctx));
      },
    },
    configureServer(server) {
      const content = path.join(site.dir, "content");
      server.watcher.add([content, path.join(site.dir, "site.config.json")]);
      server.watcher.on("change", (f) => {
        if (f.startsWith(content) || f.endsWith("site.config.json")) server.ws.send({ type: "full-reload" });
      });
    },
  };
}

/** Shared Vite inline config: engine alias, MPA inputs, no inherited PostCSS. */
export function baseViteConfig({ root, base, publicDir, outDir, plugins, mode = "production", port = 3108 }) {
  return {
    configFile: false,
    mode,
    root,
    base,
    publicDir,
    appType: "mpa",
    // Inline PostCSS config: stop Vite walking up into a product's tailwind config.
    css: { postcss: { plugins: [] } },
    resolve: { alias: [{ find: /^\/@engine\//, replacement: `${engineClient.replace(/\\/g, "/")}/` }] },
    server: { host: "127.0.0.1", port, strictPort: true, fs: { allow: [platformRoot] } },
    plugins,
    build: { outDir, emptyOutDir: true, assetsInlineLimit: 2048, rollupOptions: { input: pageInputs(root) } },
    logLevel: "warn",
  };
}

/** Vite inline config for one site (used by build-site.mjs and dev-site.mjs). */
export async function viteConfigFor(id, { mode = "production" } = {}) {
  const site = loadSite(id);
  const ctx = createContent(site.dir);
  materialisePages(site);
  writeChapterPages(site, ctx.chapters);
  const release = await latestRelease(site);
  const versions = versionOf(site);
  return {
    site,
    versions,
    config: baseViteConfig({
      root: site.pagesDir,
      base: site.base,
      publicDir: path.join(site.dir, "public"),
      outDir: path.join(site.outDir, site.base.slice(1, -1)),
      plugins: [sitePlugin(site, release, versions)],
      mode,
      port: site.config.devPort ?? 3108,
    }),
  };
}
