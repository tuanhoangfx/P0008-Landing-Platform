#!/usr/bin/env node
/**
 * Mirror remote LadiCDN assets into public/products/{slug}/ for offline-safe deploy.
 *
 * Usage:
 *   node scripts/mirror-landing-assets.mjs --slug ldp01
 *   node scripts/mirror-landing-assets.mjs --slug ldp01 --from-html
 *   node scripts/mirror-landing-assets.mjs --slug ldp01 --dry-run
 *
 * Note: skip `jpeg_m_*` TikTok/supplier URLs when mirroring — they contain baked-in Chinese.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const opts = { slug: "ldp01", dryRun: false, fromHtml: false, htmlPath: "" };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--slug" && argv[i + 1]) opts.slug = argv[++i];
    else if (argv[i] === "--dry-run") opts.dryRun = true;
    else if (argv[i] === "--from-html") opts.fromHtml = true;
    else if (argv[i] === "--html" && argv[i + 1]) opts.htmlPath = argv[++i];
  }
  return opts;
}

function collectUrls(obj, out = new Set()) {
  if (typeof obj === "string") {
    if (/^https?:\/\/.*\.(jpg|jpeg|png|webp|gif)/i.test(obj)) out.add(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectUrls(item, out);
    return out;
  }
  if (obj && typeof obj === "object") {
    for (const v of Object.values(obj)) collectUrls(v, out);
  }
  return out;
}

function fileNameFromUrl(url, index) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    if (base && base.includes(".")) return base.replace(/[^a-zA-Z0-9._-]/g, "_");
  } catch {
    /* fallthrough */
  }
  return `asset-${index}.jpg`;
}

async function main() {
  const opts = parseArgs(process.argv);
  const configPath = path.join(toolRoot, "src/config/products/toc-duoi-ngua-han-quoc.ts");
  if (!fs.existsSync(configPath)) {
    console.error("Config not found:", configPath);
    process.exit(1);
  }

  const src = fs.readFileSync(configPath, "utf8");
  let urls = [...collectUrls(src.match(/https?:\/\/[^"'\s)]+\.(?:jpg|jpeg|png|webp|gif)/gi) ?? [])];
  urls = urls.filter((u) => !/\/jpeg_m_/i.test(u));

  if (opts.fromHtml) {
    const htmlPath =
      opts.htmlPath ||
      path.resolve(toolRoot, "../../.cursor/scratch/hanashop-landing.html");
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, "utf8");
      const htmlUrls = [
        ...new Set(
          (html.match(/https:\/\/w\.ladicdn\.com\/[^"'\s)]+/g) || []).filter(
            (u) => /\.(jpg|jpeg|png|gif|webp)/i.test(u) && !/\/jpeg_m_/i.test(u),
          ),
        ),
      ];
      urls = [...new Set([...urls, ...htmlUrls])];
      console.log(`[mirror] +${htmlUrls.length} from HTML → ${urls.length} total`);
    } else {
      console.warn("[mirror] HTML not found:", htmlPath);
    }
  }
  const destDir = path.join(toolRoot, "public", "products", opts.slug);
  console.log(`[mirror] ${urls.length} assets → public/products/${opts.slug}/`);

  if (!opts.dryRun) fs.mkdirSync(destDir, { recursive: true });

  const mapping = {};
  let index = 0;
  for (const url of urls) {
    index += 1;
    const filename = fileNameFromUrl(url, index);
    const dest = path.join(destDir, filename);
    mapping[url] = `/products/${opts.slug}/${filename}`;
    if (opts.dryRun) {
      console.log("DRY", url, "→", mapping[url]);
      continue;
    }
    if (fs.existsSync(dest)) {
      console.log("SKIP", filename);
      continue;
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("FAIL", url, res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log("OK", filename, buf.length);
  }

  const mapFile = path.join(destDir, "asset-map.json");
  if (!opts.dryRun) {
    fs.writeFileSync(mapFile, JSON.stringify(mapping, null, 2));
    const srcMap = path.join(toolRoot, "src/config/ldp01-asset-map.json");
    fs.writeFileSync(srcMap, JSON.stringify(mapping, null, 2));
    console.log("Wrote", mapFile, "and", srcMap);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
