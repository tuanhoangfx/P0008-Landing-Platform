#!/usr/bin/env node
/**
 * ldp.infi.io.vn build (registry key P0008 in Tool/scripts/lib/lenovo-spa-products.mjs).
 *
 *   1. engine/catalog.mjs   → dist/preview/** (each section rendered alone by the engine), dist/catalog.json, dist/404.html
 *   2. prebuild metadata    → public/release-notes.json + public/tool.manifest.json (version chip / deploy probe)
 *   3. Vite build (src/)    → dist/index.html (Hub-UI admin, <meta name="app-version">) + assets, without emptying dist/
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { platformRoot } from "../engine/site.mjs";

const run = (args, label) => {
  const r = spawnSync(process.execPath, args, { cwd: platformRoot, stdio: "inherit", windowsHide: true });
  if (r.status !== 0) {
    console.error(`[build-home] ${label} failed (exit ${r.status ?? "?"})`);
    process.exit(r.status ?? 1);
  }
};

run([path.join(platformRoot, "engine/catalog.mjs")], "catalog");
run([path.join(platformRoot, "../scripts/prebuild-lenovo-metadata.mjs"), "--product-root", platformRoot, "--soft"], "prebuild metadata");
run([path.join(platformRoot, "node_modules/vite/bin/vite.js"), "build"], "admin vite build");
console.log("[build-home] dist/ = admin app + catalog.json + preview/");
