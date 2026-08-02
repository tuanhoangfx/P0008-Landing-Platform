#!/usr/bin/env node
/** Upsert P0008 Vercel env — order API uses TOC CRM plane until LDP Supabase ships. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { upsertProjectEnv } from "../../scripts/lib/vercel-env-upsert.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadSharedEnv() {
  const envPath = path.resolve("E:/Dev/.env.shared");
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = loadSharedEnv();
const token = env.VERCEL_TOKEN;
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../tool.manifest.json"), "utf8"),
);
const projectId = manifest.vercel?.projectId;
const teamSlug = manifest.vercel?.team || "tuanhoangfxs-projects";
const targets = ["production", "preview", "development"];

const userId = process.argv[2] || env.TOC_CRM_USER_ID || "273527e9-0185-4bc0-98f0-7230c43cb703";

const pairs = [
  ["TOC_SUPABASE_URL", env.HUB_SUPABASE_URL || env.TOC_SUPABASE_URL || "https://hub-api.infi.io.vn"],
  ["TOC_SUPABASE_SERVICE_ROLE", env.HUB_SUPABASE_SERVICE_ROLE || env.TOC_SUPABASE_SERVICE_ROLE],
  ["TOC_CRM_USER_ID", userId],
];

if (!token) {
  console.error(JSON.stringify({ ok: false, error: "Missing VERCEL_TOKEN" }));
  process.exit(1);
}
if (!projectId) {
  console.error(JSON.stringify({ ok: false, error: "Missing vercel.projectId — create Vercel project first" }));
  process.exit(1);
}

const results = [];
for (const [key, value] of pairs) {
  if (!value) {
    results.push({ key, ok: false, error: "missing value" });
    continue;
  }
  try {
    const r = await upsertProjectEnv({
      projectId,
      teamSlug,
      token,
      key,
      value,
      targets,
      type: "encrypted",
    });
    results.push({ key, ok: true, action: r.action });
  } catch (e) {
    results.push({ key, ok: false, error: String(e?.message || e) });
  }
}

console.log(JSON.stringify({ ok: results.every((r) => r.ok), results }, null, 2));
