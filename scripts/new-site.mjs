#!/usr/bin/env node
/**
 * Scaffold a site on the shared engine (the only supported way to start a product landing).
 *
 *   node Tool/P0008-Landing-Platform/scripts/new-site.mjs --id sync --name "Folder Sync" \
 *     --product P0009 --origin https://sync.infi.io.vn [--base /intro/] [--template product-guide] \
 *     [--mount] [--registry-key P0009-INTRO]
 *
 * --mount: the domain root is already the product's own app (another registry entry). The site is
 * then served only under <base> by an nginx `location` inside that entry's server block
 * (registry `mountPath`); its key defaults to <CODE>-INTRO instead of <CODE>-SITE.
 *
 * Writes sites/<id>/ (site.config.json, starter content/*.json, public/), then prints the
 * registry entry, manifest block and commands to finish hosting. Never overwrites a site.
 */
import fs from "node:fs";
import path from "node:path";
import { devRoot, platformRoot } from "../engine/site.mjs";

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const id = arg("--id");
const name = arg("--name");
const product = String(arg("--product", "")).toUpperCase();
const origin = arg("--origin");
const base = arg("--base", "/intro/");
const template = arg("--template", "product-guide");
const mounted = args.includes("--mount");
if (!id || !/^[a-z][a-z0-9-]*$/.test(id) || !name || !/^P\d{4}$/.test(product) || !/^https:\/\/[a-z0-9.-]+$/.test(origin ?? "")) {
  console.error('usage: new-site.mjs --id <kebab> --name "<Product>" --product P00xx --origin https://<host> [--base /intro/]');
  process.exit(2);
}
const dir = path.join(platformRoot, "sites", id);
if (fs.existsSync(dir)) throw new Error(`sites/${id} already exists`);
if (!fs.existsSync(path.join(platformRoot, "templates", template))) throw new Error(`unknown template ${template}`);

const write = (rel, data) => {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n");
};

const productRoot = fs.readdirSync(path.join(devRoot, "Tool")).find((d) => d.startsWith(`${product}-`));
const registryKey = arg("--registry-key", `${product}-${mounted ? "INTRO" : "SITE"}`);
const hostDir = registryKey.toLowerCase();

write("site.config.json", {
  $schema: "../../engine/site.schema.json",
  id,
  name,
  product,
  registryKey,
  template,
  origin,
  base,
  ...(mounted ? { mounted: true } : {}),
  langs: ["vi", "en"],
  devPort: 3108 + fs.readdirSync(path.join(platformRoot, "sites")).length,
  appVersionFrom: productRoot ? `Tool/${productRoot}/package.json` : undefined,
  releases: { repo: "", asset: "Setup.*\\.exe$" },
  copy: {
    vi: { heroAlt: `${name} — màn hình chính`, footNote: "", downloadNote: "Bộ cài Windows 64-bit" },
    en: { heroAlt: `${name} — main screen`, footNote: "", downloadNote: "Windows 64-bit installer" },
  },
});

// Starter content: one chapter, one step, one feature, one FAQ — enough for every template page.
write("content/chapters.json", [
  { id: "install", order: 0, color: "#a78bfa", title_vi: "Cài đặt", kicker_vi: "Bắt đầu", summary_vi: `Tải và mở ${name}.`, title_en: "Install", kicker_en: "Get started", summary_en: `Download and open ${name}.` },
]);
write("content/steps.json", [
  { id: "install", chapter: "install", order: 0, title_vi: `Cài đặt ${name}`, body_vi: "Mô tả ngắn bước này — người dùng bấm gì, thấy gì.", title_en: `Install ${name}`, body_en: "Describe this step — what the user clicks and sees.", shot: "shots/install.webp" },
]);
write("content/features.json", [{ id: "feature-1", icon: "bolt", title_vi: "Tính năng nổi bật", body_vi: "Một câu mô tả lợi ích.", title_en: "Headline feature", body_en: "One sentence on the benefit." }]);
write("content/faq.json", [{ q: "Câu hỏi thường gặp?", a: "Câu trả lời ngắn.", q_en: "A frequent question?", a_en: "A short answer." }]);
// landing.json copy is the videolab one with the product name swapped — a complete, valid
// starting point; replace every sentence before publishing.
const sample = JSON.parse(fs.readFileSync(path.join(platformRoot, "sites/videolab/content/landing.json"), "utf8"));
const swapped = JSON.parse(JSON.stringify(sample).replaceAll("Video Lab", name));
swapped.heroShot = "install";
swapped.highlights = ["install"];
swapped.pipeline = [{ chapter: "install", color: "#a78bfa" }];
for (const lang of ["vi", "en"]) swapped[lang].pipelineNodes = [{ body: lang === "vi" ? "Mô tả bước." : "Describe the step.", out: "→" }];
write("content/landing.json", swapped);

const icon = productRoot && ["public/favicon.svg", "src/assets/icon.svg"].map((p) => path.join(devRoot, "Tool", productRoot, p)).find(fs.existsSync);
fs.mkdirSync(path.join(dir, "public/shots"), { recursive: true });
fs.copyFileSync(icon ?? path.join(platformRoot, "sites/videolab/public/favicon.svg"), path.join(dir, "public/favicon.svg"));

const host = new URL(origin).host;
console.log(`✓ sites/${id} created from template "${template}"

Next:
1. Fill content/*.json (VI + EN) and add shots to public/shots/ (capture via P0003 — see sites/videolab/capture).
2. Preview:   node Tool/P0008-Landing-Platform/engine/dev-site.mjs --site ${id}
3. Register hosting — add to Tool/scripts/lib/lenovo-spa-products.mjs (single writer file):

  "${registryKey}": {
    code: "${registryKey}",
    companionOf: "${product}",
    dir: "${hostDir}",
    remoteDist: "D:/projects/${hostDir}/dist",
    nginxRoot: "/opt/${hostDir}/dist",
    productRoot: "Tool/P0008-Landing-Platform/sites/${id}",
    manifestRoot: "Tool/${productRoot ?? `${product}-…`}",
    domain: "${host}",${mounted ? `
    mountPath: "${base}", // nginx location inside the server block of the entry owning ${host}` : ""}
    build: ["node", "../../engine/build-site.mjs", "--site", "${id}"],
    preSync: [],
    staticSite: true,
  },

4. In Tool/${productRoot ?? `${product}-…`}/tool.manifest.json add urls.site = "${origin}${base}" and
   "site": { "deployTarget": "lenovo-static", "registryKey": "${registryKey}", "platform": "P0008", "siteId": "${id}", "domain": "${host}" }
5. ${mounted ? `ssh PC@100.88.80.113 "mkdir D:\\projects\\${hostDir}\\dist"   (mounted: tunnel/DNS belong to the ${host} owner already)` : `node Tool/scripts/upsert-lenovo-tunnel-host.mjs --code ${registryKey}`}
   node Tool/scripts/fix-lenovo-nginx-spa-hosts.mjs --dry-run   (diff, then without --dry-run)
   node Tool/scripts/sync-lenovo-origin-compose-volumes.mjs --apply --recreate-nginx
   node Tool/scripts/deploy-lenovo-static.mjs --code ${registryKey}
6. node Tool/P0008-Landing-Platform/scripts/audit-sites.mjs`);
