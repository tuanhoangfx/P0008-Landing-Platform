#!/usr/bin/env node
/** Upsert P0014 Vercel env for TOC stack (hub staging plane). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { upsertProjectEnv } from "../../scripts/lib/vercel-env-upsert.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolRoot = path.resolve(__dirname, "..");

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
const projectId = "prj_d1mPhxl2mzRvSAsHWSThZIqKRzfL";
const teamSlug = "tuanhoangfxs-projects";
const targets = ["production", "preview", "development"];

const userId = process.argv[2] || "273527e9-0185-4bc0-98f0-7230c43cb703";
const crmOrigin = process.argv[3] || "https://toc-crm.infi.io.vn";

const pairs = [
  ["TOC_SUPABASE_URL", env.HUB_SUPABASE_URL || "https://hub-api.infi.io.vn"],
  ["TOC_SUPABASE_SERVICE_ROLE", env.HUB_SUPABASE_SERVICE_ROLE],
  ["TOC_CRM_USER_ID", userId],
  ["VITE_TOC_CRM_ORIGIN", crmOrigin],
  ["VITE_TOC_CRM_GATE_PIN", env.VITE_TOC_CRM_GATE_PIN || "toc2026"],
];

if (!token) {
  console.error(JSON.stringify({ ok: false, error: "Missing VERCEL_TOKEN" }));
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
      type: key.startsWith("VITE_") ? "plain" : "encrypted",
    });
    results.push({ key, ok: true, action: r.action });
  } catch (e) {
    results.push({ key, ok: false, error: String(e?.message || e) });
  }
}

console.log(JSON.stringify({ ok: results.every((r) => r.ok), results }, null, 2));
